<?php
declare(strict_types=1);

use OrderSystem\App;
use OrderSystem\Database;
use OrderSystem\Http\Request;
use OrderSystem\Http\Response;

// Errors go to the log only, the output could reveal paths and configuration
ini_set('display_errors', '0');
ini_set('log_errors', '1');

require __DIR__ . '/../src/bootstrap.php';

$config = require __DIR__ . '/../config.php';
date_default_timezone_set($config['timezone'] ?? 'Europe/Berlin');

try {
    $pdo = new PDO($config['db']['dsn'], $config['db']['user'], $config['db']['password']);
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    Response::error(500, 'Database connection failed')->send();
    exit;
}

(new App(new Database($pdo), imprint: $config['imprint'] ?? []))->handle(Request::fromGlobals())->send();
