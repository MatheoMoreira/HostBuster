<?php

namespace App\Services\Worker;

final class InstanceState
{
    public const PROVISIONING = 'provisioning';
    public const RUNNING = 'running';
    public const STOPPED = 'stopped';
    public const ERROR = 'error';
    public const DELETED = 'deleted';

    public function __construct(
        public readonly int $instanceId,
        public readonly string $status,
        public readonly ?string $url = null,
        public readonly ?string $ipv6 = null,
        public readonly ?string $error = null,
    ) {}
}
