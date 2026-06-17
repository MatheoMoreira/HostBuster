<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkerCallbackController extends Controller
{
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

        DB::table('instances')->where('id', $data['instance_id'])->update($updates);

        $userId = DB::table('instances')->where('id', $data['instance_id'])->value('user_id');
        if ($userId) {
            DB::table('notifications')->insert([
                'user_id' => $userId,
                'type' => $data['status'] === 'error' ? 'error' : 'info',
                'message' => $this->message($data),
                'sent_at' => now(),
            ]);
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

    private function message(array $data): string
    {
        return match ($data['status']) {
            'running' => sprintf('Instance #%d en ligne%s', $data['instance_id'], $data['url'] ? " : {$data['url']}" : ''),
            'error' => sprintf('Échec instance #%d%s', $data['instance_id'], $data['error'] ? " : {$data['error']}" : ''),
            'deleted' => sprintf('Instance #%d supprimée', $data['instance_id']),
            default => sprintf('Instance #%d : %s', $data['instance_id'], $data['status']),
        };
    }
}
