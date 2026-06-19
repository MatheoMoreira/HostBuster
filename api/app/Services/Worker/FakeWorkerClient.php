<?php

namespace App\Services\Worker;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FakeWorkerClient implements WorkerClient
{
    public function __construct(private readonly int $provisioningDelaySeconds = 5) {}

    public function createInstance(CreateInstanceRequest $request): InstanceState
    {
        Log::info('[FakeWorker] createInstance', $request->toArray());

        dispatch(function () use ($request) {
            sleep($this->provisioningDelaySeconds);

            DB::table('instances')->where('id', $request->instanceId)->update([
                'status' => 'running',
                'ipv4_address' => '127.0.0.1',
                'ipv6_address' => '::1',
            ]);

            DB::table('notifications')->insert([
                'user_id' => DB::table('instances')->where('id', $request->instanceId)->value('user_id'),
                'type' => 'info',
                'message' => sprintf(
                    'Instance "%s" déployée avec succès (https://%s.pt.filiere.info)',
                    $request->hostname,
                    Str::slug($request->hostname),
                ),
                'sent_at' => now(),
            ]);
        })->afterResponse();

        return new InstanceState(
            instanceId: $request->instanceId,
            status: InstanceState::PROVISIONING,
        );
    }

    public function getInstance(int $instanceId): InstanceState
    {
        $row = DB::table('instances')->find($instanceId);

        return new InstanceState(
            instanceId: $instanceId,
            status: $row->status ?? InstanceState::ERROR,
            url: $row ? sprintf('https://%s.pt.filiere.info', Str::slug($row->instance_name)) : null,
            ipv6: $row->ipv6_address ?? null,
        );
    }

    public function updateInstance(int $instanceId, UpdateInstanceRequest $request): InstanceState
    {
        Log::info('[FakeWorker] updateInstance', ['id' => $instanceId] + $request->toArray());

        $updates = array_filter([
            'cpu_allocated' => $request->cpu,
            'ram_allocated' => $request->ram,
            'storage_allocated' => $request->storage,
        ], fn ($v) => $v !== null);

        if ($updates !== []) {
            DB::table('instances')->where('id', $instanceId)->update($updates);
        }

        return $this->getInstance($instanceId);
    }

    public function startInstance(int $instanceId): InstanceState
    {
        Log::info('[FakeWorker] startInstance', ['id' => $instanceId]);
        DB::table('instances')->where('id', $instanceId)->update(['status' => 'running']);

        return new InstanceState($instanceId, InstanceState::RUNNING);
    }

    public function stopInstance(int $instanceId): InstanceState
    {
        Log::info('[FakeWorker] stopInstance', ['id' => $instanceId]);
        DB::table('instances')->where('id', $instanceId)->update(['status' => 'stopped']);

        return new InstanceState($instanceId, InstanceState::STOPPED);
    }

    public function deleteInstance(int $instanceId): InstanceState
    {
        Log::info('[FakeWorker] deleteInstance', ['id' => $instanceId]);

        DB::table('instances')->where('id', $instanceId)->update(['status' => 'deleted']);

        return new InstanceState($instanceId, InstanceState::DELETED);
    }

    public function listBackups(int $instanceId): array
    {
        return [];
    }

    public function createBackup(int $instanceId): array
    {
        return [
            'name' => 'backup-' . now()->format('Ymd-His') . '.tar.gz',
            'size_bytes' => mt_rand(1_000_000, 50_000_000),
            'created_at' => now()->timestamp,
        ];
    }

    public function restoreBackup(int $instanceId, string $name): void
    {
        Log::info('[FakeWorker] restoreBackup', ['id' => $instanceId, 'name' => $name]);
    }

    public function deleteBackup(int $instanceId, string $name): void
    {
        Log::info('[FakeWorker] deleteBackup', ['id' => $instanceId, 'name' => $name]);
    }

    public function getMetrics(int $instanceId): array
    {
        return [
            'available'      => true,
            'running'        => true,
            'cpu_pct'        => mt_rand(2000, 4000) / 100,
            'mem_used_mb'    => mt_rand(200, 600),
            'mem_limit_mb'   => 1024,
            'mem_pct'        => mt_rand(2000, 6000) / 100,
            'started_at'     => now()->subMinutes(mt_rand(5, 1440))->toIso8601String(),
            'uptime_seconds' => mt_rand(300, 86400),
        ];
    }
}
