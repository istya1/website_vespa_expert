<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Firebase credentials
    |--------------------------------------------------------------------------
    |
    | Path to the service account JSON file or the JSON content as array.
    |
    */

    'credentials' => env('FIREBASE_CREDENTIALS'),

    /*
    |--------------------------------------------------------------------------
    | Default Firebase project
    |--------------------------------------------------------------------------
    |
    | The default Firebase project to use when a project is not explicitly
    | specified.
    |
    */

    'default' => 'app',

    /*
    |--------------------------------------------------------------------------
    | Firebase projects
    |--------------------------------------------------------------------------
    |
    | Configure multiple Firebase projects if needed.
    |
    */

    'projects' => [
        'app' => [
            'credentials' => env('FIREBASE_CREDENTIALS'),
            // Tambah ini kalau butuh database URL (opsional untuk FCM)
            // 'database_url' => env('FIREBASE_DATABASE_URL'),
        ],
    ],

];