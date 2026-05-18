<?php
/**
 * Authentication Handler for Login Form
 */

// Start session
session_start();

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Get POST data
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

// Check email and password exist
if (empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

$email    = trim($data['email']);
$password = $data['password'];

// Server-side validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters.']);
    exit;
}

// Database connection
require_once '../../common/db.php';
$db = getDBConnection();

try {

    // Prepare SQL query
    $stmt = $db->prepare('SELECT id, name, email, password, is_admin FROM users WHERE email = ?');

    // Execute with email
    $stmt->execute([$email]);

    // Fetch user
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify user exists and password matches
    if ($user && password_verify($password, $user['password'])) {

        // Store in session
        $_SESSION['user_id']    = $user['id'];
        $_SESSION['user_name']  = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['is_admin']   = $user['is_admin'];
        $_SESSION['logged_in']  = true;

        // Success response (no password)
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user'    => [
                'id'       => $user['id'],
                'name'     => $user['name'],
                'email'    => $user['email'],
                'is_admin' => $user['is_admin'],
            ]
        ]);
        exit;

    } else {

        // Failed login
        echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
        exit;

    }

} catch (PDOException $e) {
    error_log($e->getMessage());
    echo json_encode(['success' => false, 'message' => 'A server error occurred. Please try again.']);
    exit;
}
?>