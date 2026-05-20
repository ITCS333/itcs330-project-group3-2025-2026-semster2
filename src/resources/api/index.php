<?php
// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Use the exact path to the instructor's db file
require_once __DIR__ . '/../../common/db.php';

// Get the database connection
try {
    $db = getDBConnection();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$res_id = $_GET['resource_id'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);

// Routing logic
try {
    if ($method === 'GET') {
        if ($action === 'comments' && $res_id) {
            getCommentsByResourceId($db, $res_id);
        } elseif ($id) {
            getResourceById($db, $id);
        } else {
            getAllResources($db);
        }
    } elseif ($method === 'POST') {
        if ($action === 'comment') {
            createComment($db, $data);
        } else {
            createResource($db, $data);
        }
    } elseif ($method === 'PUT') {
        updateResource($db, $data);
    } elseif ($method === 'DELETE') {
        if ($action === 'delete_comment') {
            deleteComment($db, $_GET['comment_id'] ?? null);
        } else {
            deleteResource($db, $id);
        }
    }
} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => $e->getMessage()], 500);
}

// Functions
function getAllResources($db) {
    $stmt = $db->query("SELECT * FROM resources ORDER BY created_at DESC");
    sendResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function getResourceById($db, $id) {
    $stmt = $db->prepare("SELECT * FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    $res = $stmt->fetch();
    if ($res) sendResponse(['success' => true, 'data' => $res]);
    else sendResponse(['success' => false, 'message' => 'Not found'], 404);
}

function createResource($db, $data) {
    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?, ?, ?)");
    $stmt->execute([$data['title'] ?? '', $data['description'] ?? '', $data['link'] ?? '']);
    sendResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
}

function updateResource($db, $data) {
    $stmt = $db->prepare("UPDATE resources SET title = ?, description = ?, link = ? WHERE id = ?");
    $stmt->execute([$data['title'], $data['description'], $data['link'], $data['id']]);
    sendResponse(['success' => true, 'message' => 'Updated']);
}

function deleteResource($db, $id) {
    $stmt = $db->prepare("DELETE FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(['success' => true, 'message' => 'Deleted']);
}

function getCommentsByResourceId($db, $id) {
    $stmt = $db->prepare("SELECT * FROM comments_resource WHERE resource_id = ? ORDER BY created_at ASC");
    $stmt->execute([$id]);
    sendResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function createComment($db, $data) {
    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    $stmt->execute([$data['resource_id'], $data['author'], $data['text']]);
    sendResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
}

function deleteComment($db, $id) {
    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(['success' => true, 'message' => 'Deleted']);
}

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}