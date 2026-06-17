<?php

namespace App\Services\Worker;

final class CreateInstanceRequest
{
    public function __construct(
        public readonly int $instanceId,
        public readonly string $appType,
        public readonly string $hostname,
        public readonly int $cpu,
        public readonly int $ram,
        public readonly int $storage,
        public readonly string $callbackUrl,
    ) {}

    public function toArray(): array
    {
        return [
            'instance_id' => $this->instanceId,
            'app_type' => $this->appType,
            'hostname' => $this->hostname,
            'cpu' => $this->cpu,
            'ram' => $this->ram,
            'storage' => $this->storage,
            'callback_url' => $this->callbackUrl,
        ];
    }
}
