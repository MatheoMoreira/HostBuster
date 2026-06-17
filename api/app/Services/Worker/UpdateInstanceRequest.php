<?php

namespace App\Services\Worker;

final class UpdateInstanceRequest
{
    public function __construct(
        public readonly ?int $cpu = null,
        public readonly ?int $ram = null,
        public readonly ?int $storage = null,
    ) {}

    public function toArray(): array
    {
        return array_filter([
            'cpu' => $this->cpu,
            'ram' => $this->ram,
            'storage' => $this->storage,
        ], fn ($v) => $v !== null);
    }
}
