<?php

namespace App\Services\Worker;

interface WorkerClient
{
    public function createInstance(CreateInstanceRequest $request): InstanceState;

    public function getInstance(int $instanceId): InstanceState;

    public function updateInstance(int $instanceId, UpdateInstanceRequest $request): InstanceState;

    public function startInstance(int $instanceId): InstanceState;

    public function stopInstance(int $instanceId): InstanceState;

    public function deleteInstance(int $instanceId): InstanceState;

    /** @return array<string,mixed> */
    public function getMetrics(int $instanceId): array;

    /** @return array<int,array<string,mixed>> */
    public function listBackups(int $instanceId): array;

    /** @return array<string,mixed> */
    public function createBackup(int $instanceId): array;

    public function restoreBackup(int $instanceId, string $name): void;

    public function deleteBackup(int $instanceId, string $name): void;
}
