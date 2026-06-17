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
}
