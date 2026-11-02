<?php
/**
 * Zamra Tech — contact / quote form handler
 * Receives POSTs from every form on the site and emails them to the sales inbox.
 * Edit the three settings below, then upload this folder as /zt-forms/.
 */

$TO_EMAIL   = 'sales@zamratech.com';          // where leads are delivered
$FROM_EMAIL = 'no-reply@zamratech.com';       // must be an address on your own domain
$SUBJECT    = 'New website enquiry — Zamra Tech';

// ------------------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond($ok, $error = null, $code = 200) {
    http_response_code($code);
    echo json_encode($error ? ['ok' => $ok, 'error' => $error] : ['ok' => $ok]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(false, 'Method not allowed', 405);

// Honeypot: bots fill the hidden "website" field
if (!empty($_POST['website'])) respond(true);

// Basic same-site check
$host = $_SERVER['HTTP_HOST'] ?? '';
$ref  = $_SERVER['HTTP_REFERER'] ?? '';
if ($ref && $host && parse_url($ref, PHP_URL_HOST) !== $host) respond(false, 'Invalid origin', 403);

// Simple rate limit: 5 submissions per IP per 10 minutes
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rlFile = sys_get_temp_dir() . '/zt_rl_' . md5($ip);
$now = time();
$hits = [];
if (is_file($rlFile)) {
    $hits = array_filter(explode(',', (string)@file_get_contents($rlFile)), function ($t) use ($now) { return $t && $now - (int)$t < 600; });
}
if (count($hits) >= 5) respond(false, 'Too many requests. Please try again shortly.', 429);
$hits[] = $now;
@file_put_contents($rlFile, implode(',', $hits));

function field($k, $max = 500) {
    $v = trim((string)($_POST[$k] ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}

$name     = field('name', 120);
$email    = field('email', 160);
$phone    = field('phone', 60);
$interest = field('interest', 80);
$budget   = field('budget', 80);
$start    = field('start', 80);
$message  = field('message', 5000);
$page     = field('page', 300);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please fill in your name, a valid email and a message.', 422);
}

$body = "New enquiry from the Zamra Tech website\n"
      . "----------------------------------------\n"
      . "Name:        $name\n"
      . "Email:       $email\n"
      . "Phone:       $phone\n"
      . "Interested:  $interest\n"
      . "Budget:      $budget\n"
      . "Start:       $start\n"
      . "Page:        $page\n"
      . "IP:          $ip\n"
      . "Time:        " . gmdate('Y-m-d H:i') . " UTC\n\n"
      . "Message:\n$message\n";

$safeName = preg_replace('/[^\p{L}\p{N} .\'-]/u', '', $name);
$headers  = [
    'From: Zamra Tech Website <' . $FROM_EMAIL . '>',
    'Reply-To: ' . $safeName . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$subject = '=?UTF-8?B?' . base64_encode($SUBJECT . ' — ' . $interest) . '?=';
$sent = @mail($TO_EMAIL, $subject, $body, implode("\r\n", $headers), '-f' . $FROM_EMAIL);

// Keep a backup copy of every lead (outside the web root if possible)
$log = __DIR__ . '/leads.log';
@file_put_contents($log, json_encode([
    'time' => gmdate('c'), 'name' => $name, 'email' => $email, 'phone' => $phone, 'interest' => $interest,
    'budget' => $budget, 'start' => $start, 'page' => $page, 'message' => $message, 'mailed' => $sent,
]) . "\n", FILE_APPEND | LOCK_EX);

respond((bool)$sent, $sent ? null : 'Mail server error', $sent ? 200 : 500);
