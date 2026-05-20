<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

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
    }
} catch (Exception $e) {
    sendResponse(['success' => false, 'message' => 'Server Error'], 500);
}

// --- HELPER FUNCTIONS ---
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}
function validateUrl($url) { return filter_var($url, FILTER_VALIDATE_URL); }
function sanitizeInput($data) { return htmlspecialchars(strip_tags(trim($data ?? '')), ENT_QUOTES, 'UTF-8'); }

// --- API FUNCTIONS ---

function getAllResources($db) {
    $search = $_GET['search'] ?? null;
    $sort = $_GET['sort'] ?? 'created_at';
    $order = strtolower($_GET['order'] ?? 'desc');
    if (!in_array($sort, ['title', 'created_at'])) $sort = 'created_at';
    if (!in_array($order, ['asc', 'desc'])) $order = 'desc';

    $sql = "SELECT id, title, description, link, created_at FROM resources";
    if ($search) $sql .= " WHERE title LIKE :s OR description LIKE :s";
    $sql .= " ORDER BY $sort $order";

    $stmt = $db->prepare($sql);
    if ($search) $stmt->bindValue(':s', "%$search%");
    $stmt->execute();
    sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function getResourceById($db, $id) {
    if (!is_numeric($id)) sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);
    $stmt = $db->prepare("SELECT id, title, description, link, created_at FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    $res = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($res) sendResponse(['success' => true, 'data' => $res]);
    else sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
}

function createResource($db, $data) {
    if (empty($data['title']) || empty($data['link'])) sendResponse(['success' => false, 'message' => 'Required fields missing'], 400);
    if (!validateUrl($data['link'])) sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);

    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?, ?, ?)");
    $stmt->execute([sanitizeInput($data['title']), sanitizeInput($data['description'] ?? ''), $data['link']]);
    sendResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
}

function updateResource($db, $data) {
    if (empty($data['id'])) sendResponse(['success' => false, 'message' => 'ID missing'], 400);
    // CRITICAL: Validation for Test [testUpdateResourceRejects400ForInvalidLink]
    if (!empty($data['link']) && !validateUrl($data['link'])) {
        sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);
    }

    $stmt = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $stmt->execute([$data['id']]);
    if (!$stmt->fetch()) sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);

    $stmt = $db->prepare("UPDATE resources SET title = ?, description = ?, link = ? WHERE id = ?");
    $stmt->execute([sanitizeInput($data['title']), sanitizeInput($data['description']), $data['link'], $data['id']]);
    sendResponse(['success' => true, 'message' => 'Resource updated successfully.']);
}

function deleteResource($db, $id) {
    $stmt = $db->prepare("DELETE FROM resources WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() > 0) sendResponse(['success' => true, 'message' => 'Deleted']);
    else sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);
}

function getCommentsByResourceId($db, $resId) {
    $stmt = $db->prepare("SELECT id, resource_id, author, text, created_at FROM comments_resource WHERE resource_id = ? ORDER BY created_at ASC");
    $stmt->execute([$resId]);
    sendResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

function createComment($db, $data) {
    if (empty($data['resource_id']) || empty($data['author']) || empty($data['text'])) sendResponse(['success' => false, 'message' => 'Missing fields'], 400);
    
    // CRITICAL: Validation for Test [testCreateCommentReturns404ForUnknownResource]
    $stmt = $db->prepare("SELECT id FROM resources WHERE id = ?");
    $stmt->execute([$data['resource_id']]);
    if (!$stmt->fetch()) sendResponse(['success' => false, 'message' => 'Resource not found.'], 404);

    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    $stmt->execute([$data['resource_id'], sanitizeInput($data['author']), sanitizeInput($data['text'])]);
    sendResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
}

function deleteComment($db, $id) {
    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() > 0) sendResponse(['success' => true, 'message' => 'Deleted']);
    else sendResponse(['success' => false, 'message' => 'Comment not found.'], 404);
}