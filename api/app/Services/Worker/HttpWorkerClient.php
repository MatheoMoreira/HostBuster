<?php

namespace App\Services\Worker;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class HttpWorkerClient implements WorkerClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
        private readonly int $timeoutSeconds = 10,
    ) {}

    public function createInstance(CreateInstanceRequest $request): InstanceState
    {
        $response = $this->http()->post('/v1/instances', $request->toArray());

        $this->ensureOk($response, [202, 200]);

        return new InstanceState(
            instanceId: $request->instanceId,
            status: $response->json('status', InstanceState::PROVISIONING),
        );
    }

    public function getInstance(int $instanceId): InstanceState
    {
        $response = $this->http()->get("/v1/instances/{$instanceId}");
        $this->ensureOk($response);

        return new InstanceState(
            instanceId: $instanceId,
            status: $response->json('status'),
            url: $response->json('url'),
            ipv6: $response->json('ipv6'),
        );
    }

    public function updateInstance(int $instanceId, UpdateInstanceRequest $request): InstanceState
    {
        $response = $this->http()->patch("/v1/instances/{$instanceId}", $request->toArray());
        $this->ensureOk($response, [202, 200]);

        return new InstanceState($instanceId, $response->json('status'));
    }

    public function startInstance(int $instanceId): InstanceState
    {
        $response = $this->http()->post("/v1/instances/{$instanceId}/start");
        $this->ensureOk($response, [202, 200]);

        return new InstanceState($instanceId, $response->json('status', InstanceState::RUNNING));
    }

    public function stopInstance(int $instanceId): InstanceState
    {
        $response = $this->http()->post("/v1/instances/{$instanceId}/stop");
        $this->ensureOk($response, [202, 200]);

        return new InstanceState($instanceId, $response->json('status', InstanceState::STOPPED));
    }

    public function deleteInstance(int $instanceId): InstanceState
    {
        $response = $this->http()->delete("/v1/instances/{$instanceId}");
        $this->ensureOk($response, [202, 204]);

        return new InstanceState($instanceId, InstanceState::DELETED);
    }

    public function getMetrics(int $instanceId): array
    {
        $response = $this->http()->get("/v1/instances/{$instanceId}/metrics");
        $this->ensureOk($response);
        return $response->json() ?? [];
    }

    public function listBackups(int $instanceId): array
    {
        $response = $this->http()->get("/v1/instances/{$instanceId}/backups");
        $this->ensureOk($response);
        return $response->json('backups', []);
    }

    public function createBackup(int $instanceId): array
    {
        // tar peut être long : timeout étendu.
        $response = $this->http(300)->post("/v1/instances/{$instanceId}/backups");
        $this->ensureOk($response, [200, 201]);
        return $response->json() ?? [];
    }

    public function restoreBackup(int $instanceId, string $name): void
    {
        $response = $this->http(300)->post("/v1/instances/{$instanceId}/backups/" . rawurlencode($name) . "/restore");
        $this->ensureOk($response, [200, 202]);
    }

    public function deleteBackup(int $instanceId, string $name): void
    {
        $response = $this->http()->delete("/v1/instances/{$instanceId}/backups/" . rawurlencode($name));
        $this->ensureOk($response, [204, 200]);
    }

    private function http(?int $timeout = null)
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken($this->token)
            ->acceptJson()
            ->timeout($timeout ?? $this->timeoutSeconds);
    }

    private function ensureOk($response, array $allowed = [200]): void
    {
        if (! in_array($response->status(), $allowed, true)) {
            throw new RuntimeException(sprintf(
                'Worker API returned %d: %s',
                $response->status(),
                $response->body(),
            ));
        }
    }
}
