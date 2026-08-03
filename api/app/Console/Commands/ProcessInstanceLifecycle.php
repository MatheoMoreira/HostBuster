<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\InstanceNotifier;
use App\Services\Worker\WorkerClient;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProcessInstanceLifecycle extends Command
{
    protected $signature = 'instances:lifecycle';

    protected $description = 'Gère l\'abonnement des instances : expiration → arrêt + grâce, rappels, suppression.';

    public function handle(WorkerClient $worker, InstanceNotifier $notifier): int
    {
        $now = now();
        $expired = 0;
        $reminded = 0;
        $deleted = 0;

        // 1. Abonnements arrivés à échéance et pas encore en grâce → arrêt + grâce 30j.
        $toExpire = DB::table('instances')
            ->where('status', '!=', 'deleted')
            ->whereNull('scheduled_deletion_at')
            ->whereNotNull('paid_until')
            ->where('paid_until', '<', $now)
            ->get();

        foreach ($toExpire as $inst) {
            if ($inst->status === 'running') {
                try {
                    $worker->stopInstance($inst->id);
                } catch (\Throwable $e) {
                    $this->warn("stop {$inst->id}: {$e->getMessage()}");
                }
            }

            $deletionAt = Carbon::parse($inst->paid_until)->addDays(30);
            DB::table('instances')->where('id', $inst->id)->update([
                'status' => 'stopped',
                'scheduled_deletion_at' => $deletionAt,
                'last_reminder' => 'expired',
            ]);

            if ($user = User::find($inst->user_id)) {
                $notifier->expired(DB::table('instances')->find($inst->id), $user, $deletionAt->format('d/m/Y'));
            }
            $expired++;
        }

        // 2a. Instances dont l'échéance de grâce est dépassée → suppression définitive.
        // Comparaison faite en SQL (pas d'ambiguïté de timezone).
        $toDelete = DB::table('instances')
            ->where('status', '!=', 'deleted')
            ->whereNotNull('scheduled_deletion_at')
            ->where('scheduled_deletion_at', '<=', $now)
            ->get();

        foreach ($toDelete as $inst) {
            try {
                $worker->deleteInstance($inst->id);
            } catch (\Throwable $e) {
                $this->warn("delete {$inst->id}: {$e->getMessage()}");
            }
            DB::table('instances')->where('id', $inst->id)->update([
                'status' => 'deleted',
                'deleted_at' => $now,
                'deleted_by' => null, // suppression automatique par le système
            ]);
            if ($user = User::find($inst->user_id)) {
                $notifier->autoDeleted($inst, $user);
            }
            $deleted++;
        }

        // 2b. Instances encore en grâce → rappels J-7 puis J-1.
        $toRemind = DB::table('instances')
            ->where('status', '!=', 'deleted')
            ->whereNotNull('scheduled_deletion_at')
            ->where('scheduled_deletion_at', '>', $now)
            ->get();

        foreach ($toRemind as $inst) {
            $deletionAt = Carbon::parse($inst->scheduled_deletion_at);
            $secondsLeft = $deletionAt->getTimestamp() - $now->getTimestamp();
            $daysLeft = max(1, (int) ceil($secondsLeft / 86400));
            $date = $deletionAt->format('d/m/Y');
            $user = User::find($inst->user_id);

            if ($daysLeft <= 1 && $inst->last_reminder !== '1d') {
                if ($user) {
                    $notifier->reminder($inst, $user, $daysLeft, $date);
                }
                DB::table('instances')->where('id', $inst->id)->update(['last_reminder' => '1d']);
                $reminded++;
            } elseif ($daysLeft <= 7 && ! in_array($inst->last_reminder, ['7d', '1d'], true)) {
                if ($user) {
                    $notifier->reminder($inst, $user, $daysLeft, $date);
                }
                DB::table('instances')->where('id', $inst->id)->update(['last_reminder' => '7d']);
                $reminded++;
            }
        }

        $this->info("Cycle de vie : {$expired} expirée(s), {$reminded} rappel(s), {$deleted} supprimée(s).");

        return self::SUCCESS;
    }
}
