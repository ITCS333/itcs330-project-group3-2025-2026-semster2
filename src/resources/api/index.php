<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// Use your existing DB connection path
require_once '../../common/db.php';
$db = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'];
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$resource_id = $_GET['resource_id'] ?? null;
$comment_id = $_GET['comment_id'] ?? null;

try {
    if ($method === 'GET') {
        if ($action === 'comments') {
            getCommentsByResourceId($db, $resource_id);
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
            deleteComment($db, $comment_id);
        } else {
            deleteResource($db, $id);
        }
    } else {
        sendResponse(['success' => false, 'message' => 'Method Not Allowed'], 405);
    }
} catch (PDOException $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'Database Error'], 500);
} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'Server Error'], 500);
}

// --- RESOURCE FUNCTIONS ---

function getAllResources($db) {
    $search = $_GET['search'] ?? null;
    $sort = $_GET['sort'] ?? 'created_at';
    $order = strtolower($_GET['order'] ?? 'desc');

    // Validate Sort/Order
    if (!in_array($sort, ['title', 'created_at'])) $sort = 'created_at';
    if (!in_array($order, ['asc', 'desc'])) $order = 'desc';

    $sql = "SELECT id, title, description, link, created_at FROM resources";
    if ($search) {
        $sql .= " WHERE title LIKE :search OR description LIKE :search";
    }
    $sql .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);
    if ($search) {
        $stmt->bindValue(':search', '%' . $search . '%');
    }
    $stmt->execute();
    sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getResourceById($db, $resourceId) {
    if (!is_numeric($resourceId)) sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);

    $stmt = $db->prepare("SELECT id, title, description, link, created_at FROM resources WHERE id = ?");
    $stmt->execute([$resourceId]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($res) sendResponse(['success' => true, 'data' => $res]);
    else sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
}

function createResource($db, $data) {
    if (empty($data['title']) || empty($data['link'])) {
        sendResponse(['success' => false, 'message' => 'Title and Link are required.'], 400);
    }
    if (!validateUrl($data['link'])) {
        sendResponse(['success' => false, 'message' => 'Invalid URL.'], 400);
    }

    $title = sanitizeInput($data['title']);
    $desc = sanitizeInput($data['description'] ?? '');
    $link = trim($data['link']);

    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?, ?, ?)");
    if ($stmt->execute([$title, $desc, $link])) {
        sendResponse(['success' => true, 'message' => 'Created', 'id' => $db->lastInsertId()], 201);
    } else {
        sendResponse(['success' => false, 'message' => 'Failed'], 500);
    }
}

function updateResource($db, $data) {
    if (empty($data['id'])) sendResponse(['success' => false, 'message' => 'ID missing'], 400);
    
    // Check if exists
    $check = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $check->execute([$data['id']]);
    if (!$check->fetch()) sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);

    $title = sanitizeInput($data['title']);
    $desc = sanitizeInput($data['description']);
    $link = trim($data['link']);

    $stmt = $db->prepare("UPDATE resources SET title = ?, description = ?, link = ? WHERE id = ?");
    $stmt->execute([$title, $desc, $link, $data['id']]);
    sendResponse(['success' => true, 'message' => 'Resource updated successfully.']);
}

function deleteResource($db, $resourceId) {
    if (!is_numeric($resourceId)) sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);
    
    $stmt = $db->prepare("DELETE FROM resources WHERE id = ?");
    $stmt->execute([$resourceId]);
    if ($stmt->rowCount() > 0) sendResponse(['success' => true, 'message' => 'Resource deleted successfully.']);
    else sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
}

// --- COMMENT FUNCTIONS ---

function getCommentsByResourceId($db, $resourceId) {
    if (!is_numeric($resourceId)) sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);
    $stmt = $db->prepare("SELECT id, resource_id, author, text, created_at FROM comments_resource WHERE resource_id = ? ORDER BY created_at ASC");
    $stmt->execute([$resourceId]);
    sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment($db, $data) {
    if (empty($data['resource_id']) || empty($data['author']) || empty($data['text'])) {
        sendResponse(['success' => false, 'message' => 'Missing fields'], 400);
    }

    $author = sanitizeInput($data['author']);
    $text = sanitizeInput($data['text']);

    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    $stmt->execute([$data['resource_id'], $author, $text]);
    sendResponse(['success' => true, 'message' => 'Comment added', 'id' => $db->lastInsertId()], 201);
}

function deleteComment($db, $commentId) {
    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id = ?");
    $stmt->execute([$commentId]);
    if ($stmt->rowCount() > 0) sendResponse(['success' => true, 'message' => 'Comment deleted successfully.']);
    else sendResponse(['success' => false, 'message' => 'Comment not found.'], 404);
}

// --- HELPERS ---
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}
function validateUrl($url) { return filter_var($url, FILTER_VALIDATE_URL); }
function sanitizeInput($data) { return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8'); }
?>