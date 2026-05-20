<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../../common/db.php';
$db = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);
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

function getAllResources($db) {
    $search = $_GET['search'] ?? null;
    $sql = "SELECT * FROM resources";
    if ($search) { $sql .= " WHERE title LIKE :s OR description LIKE :s"; }
    $sql .= " ORDER BY created_at DESC";
    $stmt = $db->prepare($sql);
    if ($search) { $stmt->bindValue(':s', "%$search%"); }
    $stmt->execute();
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
    $stmt->execute([$data['title'], $data['description'], $data['link']]);
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

function getCommentsByResourceId($db, $resourceId) {
    $stmt = $db->prepare("SELECT * FROM comments_resource WHERE resource_id = ? ORDER BY created_at ASC");
    $stmt->execute([$resourceId]);
    sendResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function createComment($db, $data) {
    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    $stmt->execute([$data['resource_id'], $data['author'], $data['text']]);
    sendResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
}

function deleteComment($db, $commentId) {
    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id = ?");
    $stmt->execute([$commentId]);
    sendResponse(['success' => true, 'message' => 'Deleted']);
}

function sendResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}