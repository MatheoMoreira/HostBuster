<?php

return [
    'driver' => env('WORKER_DRIVER', 'fake'),

    'http' => [
        'base_url' => env('WORKER_BASE_URL', 'http://lion.local'),
        'token' => env('WORKER_API_TOKEN', ''),
        'timeout' => (int) env('WORKER_TIMEOUT', 10),
    ],

    'callback_token' => env('WORKER_CALLBACK_TOKEN', ''),

    // URL que le worker appelle en retour. Par défaut on la déduit d'APP_URL
    // (domaine public), mais on peut forcer une URL privée (réseau interne)
    // plus fiable que le passage par le proxy TLS public.
    'callback_url' => env('WORKER_CALLBACK_URL', ''),

    'fake' => [
        'delay_seconds' => (int) env('WORKER_FAKE_DELAY', 5),
    ],
];
