<?php

return [
    'driver' => env('WORKER_DRIVER', 'fake'),

    'http' => [
        'base_url' => env('WORKER_BASE_URL', 'http://lion.local'),
        'token' => env('WORKER_API_TOKEN', ''),
        'timeout' => (int) env('WORKER_TIMEOUT', 10),
    ],

    'callback_token' => env('WORKER_CALLBACK_TOKEN', ''),

    'fake' => [
        'delay_seconds' => (int) env('WORKER_FAKE_DELAY', 5),
    ],
];
