<?php

namespace App\Http\Controllers;

use App\Services\InstanceNotifier;
use App\Services\Worker\CreateInstanceRequest;
use App\Services\Worker\UpdateInstanceRequest;
use App\Services\Worker\WorkerClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class InstanceController extends Controller
{
    public function __construct(
        private readonly WorkerClient $worker,
        private readonly InstanceNotifier $notifier,
    ) {}

    public function index(Request $request)
    {
        return DB::table('instances')
            ->leftJoin('applications', 'applications.id', '=', 'instances.app_id')
            ->where('instances.user_id', $request->user()->id)
            ->orderByDesc('instances.created_at')
            ->select('instances.*', 'applications.name as app_name')
            ->get();
    }

    public function store(Request $request)
    {
        if ($request->user()->email_verified_at === null) {
            return response()->json([
                'message' => 'Veuillez vérifier votre adresse email avant de déployer une instance.',
                'code' => 'email_unverified',
            ], 403);
        }

        $data = $request->validate([
            'app_id' => ['required', 'integer', 'exists:applications,id'],
            'plan_name' => ['required', 'string', 'max:50'],
            'price' => ['required', 'integer', 'min:1'],
            'hostname' => ['required', 'string', 'max:100'],
            'cpu' => ['required', 'integer', 'min:1'],
            'ram' => ['required', 'integer', 'min:128'],
            'storage' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();

        if ((int) $user->credits < $data['price']) {
            return response()->json([
                'message' => 'Crédits insuffisants.',
                'required' => $data['price'],
                'available' => (int) $user->credits,
            ], 422);
        }

        $instance = DB::transaction(function () use ($user, $data) {
            $user->credits = (float) $user->credits - $data['price'];
            $user->save();

            $instanceId = DB::table('instances')->insertGetId([
                'user_id' => $user->id,
                'app_id' => $data['app_id'],
                'instance_name' => $data['hostname'],
                'cpu_allocated' => $data['cpu'],
                'ram_allocated' => $data['ram'],
                'storage_allocated' => $data['storage'],
                'status' => 'deploying',
                // Abonnement : 1er mois payé maintenant, prix mémorisé pour le renouvellement.
                'paid_until' => now()->addDays(30),
                'monthly_price' => $data['price'],
                'created_at' => now(),
            ]);

            DB::table('orders')->insert([
                'user_id' => $user->id,
                'instance_id' => $instanceId,
                'amount' => $data['price'],
                'type' => 'purchase',
                'status' => 'completed',
                'created_at' => now(),
            ]);

            return DB::table('instances')->find($instanceId);
        });

        $appType = $this->resolveAppType((int) $data['app_id']);

        $this->worker->createInstance(new CreateInstanceRequest(
            instanceId: (int) $instance->id,
            appType: $appType,
            hostname: $data['hostname'],
            cpu: (int) $data['cpu'],
            ram: (int) $data['ram'],
            storage: (int) $data['storage'],
            callbackUrl: config('worker.callback_url') ?: URL::to('/api/worker/callback'),
        ));

        // Pas d'email à la création : un seul mail à l'arrivée en ligne (callback).
        DB::table('notifications')->insert([
            'user_id' => $user->id,
            'type' => 'info',
            'message' => "Déploiement de « {$instance->instance_name} » lancé.",
            'sent_at' => now(),
        ]);

        return response()->json([
            'instance' => $instance,
            'credits' => (int) $user->fresh()->credits,
        ], 201);
    }

    public function show(Request $request, int $id)
    {
        $query = DB::table('instances')
            ->leftJoin('applications', 'applications.id', '=', 'instances.app_id')
            ->where('instances.id', $id)
            ->select('instances.*', 'applications.name as app_name');

        if ($request->user()->role !== 'admin') {
            $query->where('instances.user_id', $request->user()->id);
        }

        $instance = $query->first();
        abort_if(! $instance, 404);

        return response()->json($instance);
    }

    public function metrics(Request $request, int $id)
    {
        $query = DB::table('instances')->where('id', $id);
        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }
        $instance = $query->first();

        abort_if(! $instance, 404);

        if ($instance->status !== 'running') {
            return response()->json([
                'available' => false,
                'reason' => 'not_running',
                'status' => $instance->status,
            ]);
        }

        try {
            return response()->json($this->worker->getMetrics($id));
        } catch (\Throwable $e) {
            return response()->json(['available' => false, 'reason' => 'worker_unreachable'], 200);
        }
    }

    public function backupsIndex(Request $request, int $id)
    {
        $this->ensureOwner($request, $id);
        try {
            return response()->json(['backups' => $this->worker->listBackups($id)]);
        } catch (\Throwable $e) {
            return response()->json(['backups' => []]);
        }
    }

    public function backupCreate(Request $request, int $id)
    {
        $this->ensureOwner($request, $id);
        try {
            return response()->json($this->worker->createBackup($id), 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Échec de la sauvegarde.'], 422);
        }
    }

    public function backupRestore(Request $request, int $id, string $name)
    {
        $this->ensureOwner($request, $id);
        abort_unless($this->isValidBackupName($name), 422, 'Nom de sauvegarde invalide.');
        try {
            $this->worker->restoreBackup($id, $name);
            DB::table('instances')->where('id', $id)->update(['status' => 'running']);
            return response()->json(['status' => 'running']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Échec de la restauration.'], 422);
        }
    }

    public function backupDelete(Request $request, int $id, string $name)
    {
        $this->ensureOwner($request, $id);
        abort_unless($this->isValidBackupName($name), 422, 'Nom de sauvegarde invalide.');
        $this->worker->deleteBackup($id, $name);
        return response()->noContent();
    }

    private function isValidBackupName(string $name): bool
    {
        return (bool) preg_match('/^backup-\d{8}-\d{6}\.tar\.gz$/', $name);
    }

    public function update(Request $request, int $id)
    {
        $instance = DB::table('instances')
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        abort_if(! $instance, 404);

        $data = $request->validate([
            'cpu' => ['nullable', 'integer', 'min:1'],
            'ram' => ['nullable', 'integer', 'min:128'],
            'storage' => ['nullable', 'integer', 'min:1'],
        ]);

        $state = $this->worker->updateInstance($id, new UpdateInstanceRequest(
            cpu: $data['cpu'] ?? null,
            ram: $data['ram'] ?? null,
            storage: $data['storage'] ?? null,
        ));

        return response()->json([
            'instance' => DB::table('instances')->find($id),
            'status' => $state->status,
        ]);
    }

    public function start(Request $request, int $id)
    {
        $this->ensureOwner($request, $id);
        $state = $this->worker->startInstance($id);

        // L'API est propriétaire de sa BDD : on persiste le nouvel état.
        DB::table('instances')->where('id', $id)->update(['status' => 'running']);

        return response()->json(['status' => $state->status]);
    }

    public function stop(Request $request, int $id)
    {
        $this->ensureOwner($request, $id);
        $state = $this->worker->stopInstance($id);

        DB::table('instances')->where('id', $id)->update(['status' => 'stopped']);

        return response()->json(['status' => $state->status]);
    }

    /**
     * Renouvellement de l'abonnement : débite le prix mensuel, prolonge de 30
     * jours, annule la suppression programmée et redémarre si en grâce.
     */
    public function renew(Request $request, int $id)
    {
        $user = $request->user();
        $instance = DB::table('instances')
            ->where('id', $id)->where('user_id', $user->id)->first();

        abort_if(! $instance, 404);
        abort_if($instance->status === 'deleted', 422, 'Instance supprimée.');

        $price = (int) ($instance->monthly_price ?? 0);
        if ((int) $user->credits < $price) {
            return response()->json([
                'message' => 'Crédits insuffisants pour le renouvellement.',
                'required' => $price,
                'available' => (int) $user->credits,
            ], 422);
        }

        $wasInGrace = $instance->scheduled_deletion_at !== null;

        DB::transaction(function () use ($user, $instance, $price) {
            $user->credits = (float) $user->credits - $price;
            $user->save();

            DB::table('orders')->insert([
                'user_id' => $user->id,
                'instance_id' => $instance->id,
                'amount' => $price,
                'type' => 'renewal',
                'status' => 'completed',
                'created_at' => now(),
            ]);

            // Prolonge à partir de la fin de période en cours (ou de maintenant si déjà dépassée).
            $base = \Illuminate\Support\Carbon::parse($instance->paid_until);
            if ($base->isPast()) {
                $base = now();
            }

            DB::table('instances')->where('id', $instance->id)->update([
                'paid_until' => $base->copy()->addDays(30),
                'scheduled_deletion_at' => null,
                'last_reminder' => null,
            ]);
        });

        // Si l'instance était bloquée (période de grâce), on la redémarre.
        if ($wasInGrace && $instance->status === 'stopped') {
            $this->worker->startInstance($id);
            DB::table('instances')->where('id', $id)->update(['status' => 'running']);
        }

        return response()->json([
            'instance' => DB::table('instances')->find($id),
            'credits' => (int) $user->fresh()->credits,
        ]);
    }

    private function ensureOwner(Request $request, int $id): void
    {
        $query = DB::table('instances')->where('id', $id);
        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }
        abort_if(! $query->exists(), 404);
    }

    public function destroy(Request $request, int $id)
    {
        $query = DB::table('instances')->where('id', $id);
        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }
        $instance = $query->first();

        abort_if(! $instance, 404);

        $this->worker->deleteInstance($id);
        DB::table('instances')->where('id', $id)->update(['status' => 'deleted']);

        // Notifie le propriétaire de l'instance (même quand un admin la supprime).
        $owner = \App\Models\User::find($instance->user_id);
        $this->notifier->deleted($instance, $owner);

        return response()->noContent();
    }

    private function resolveAppType(int $appId): string
    {
        $name = (string) DB::table('applications')->where('id', $appId)->value('name');

        return match (true) {
            str_contains(strtolower($name), 'wordpress') => 'wordpress',
            str_contains(strtolower($name), 'minecraft') => 'minecraft',
            str_contains(strtolower($name), 'odoo') => 'odoo',
            str_contains(strtolower($name), 'glpi') => 'glpi',
            default => 'unknown',
        };
    }
}
