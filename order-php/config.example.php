<?php
// Copy to config.php and fill in the database credentials from the all-inkl KAS.
return [
    'db' => [
        'dsn' => 'mysql:host=localhost;dbname=pizza;charset=utf8mb4',
        'user' => 'pizza',
        'password' => '',
    ],
    // Time zone used to convert the stored unix timestamps, the Java version used the server time zone
    'timezone' => 'Europe/Berlin',
    // Provider shown in the imprint, also named as the person responsible for the content
    'imprint' => [
        'name' => 'Max Mustermann',
        'address' => ['Musterstraße 1', '12345 Musterstadt', 'Deutschland'],
        'email' => 'max@example.com',
        'phone' => '+49 123 456789',
    ],
];
