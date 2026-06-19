<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\InstanceNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkerCallbackController extends Controller
{
    public function __construct(private readonly InstanceNotifier $notifier) {}

    public function __invoke(Request $request)
    {
        $expected = (string) config('worker.callback_token');
        $provided = (string) $request->bearerToken();

        if ($expected === '' || ! hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'instance_id' => ['required', 'integer'],
            'status' => ['required', 'string', 'in:provisioning,running,stopped,error,deleted'],
            'url' => ['nullable', 'string'],
            'ipv6' => ['nullable', 'string'],
            'error' => ['nullable', 'string'],
            'occurred_at' => ['nullable', 'string'],
        ]);

        $updates = ['status' => $this->mapStatus($data['status'])];
        if (! empty($data['ipv6'])) {
            $updates['ipv6_address'] = $data['ipv6'];
        }
        if (! empty($data['url'])) {
            $updates['domain'] = $data['url'];
        }

        DB::table('instances')->where('id', $data['instance_id'])->update($updates);

        $instance = DB::table('instances')->find($data['instance_id']);
        $user = $instance ? User::find($instance->user_id) : null;

        if ($instance && $user) {
            // Notifications email + in-app selon le statut renvoyé par le worker.
            match ($data['status']) {
                'running' => $this->notifier->running($instance, $user, $data['url'] ?? null),
                'error' => $this->notifier->failed($instance, $user, $data['error'] ?? null),
                'deleted' => $this->notifier->deleted($instance, $user),
                default => null, // provisioning/stopped : pas d'email
            };
        }

        return response()->noContent();
    }

    private function mapStatus(string $workerStatus): string
    {
        return match ($workerStatus) {
            'provisioning' => 'deploying',
            'running' => 'running',
            'stopped' => 'stopped',
            'error' => 'error',
            'deleted' => 'deleted',
        };
    }
}
