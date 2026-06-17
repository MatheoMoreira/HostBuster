<?php

namespace App\Providers;

use App\Services\Worker\FakeWorkerClient;
use App\Services\Worker\HttpWorkerClient;
use App\Services\Worker\WorkerClient;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WorkerClient::class, function ($app) {
            $config = $app['config']['worker'];

            return match ($config['driver']) {
                'http' => new HttpWorkerClient(
                    baseUrl: $config['http']['base_url'],
                    token: $config['http']['token'],
                    timeoutSeconds: $config['http']['timeout'],
                ),
                default => new FakeWorkerClient(
                    provisioningDelaySeconds: $config['fake']['delay_seconds'],
                ),
            };
        });
    }

    public function boot(): void
    {
        //
    }
}
