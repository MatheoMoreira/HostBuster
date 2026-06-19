<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Cycle de vie des abonnements d'instances (expiration, rappels, suppression).
Schedule::command('instances:lifecycle')->dailyAt('09:00');
