<?php
/* ============================================================
   ambu.php  –  Backend for Ambulance Web App
   ============================================================ */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

/* ---------- ⿡  DATABASE CONNECTION ----------------------- */
$host = "localhost";
$user = "root";     // Default XAMPP user
$pass = "";         // leave blank
$db   = "ambulance_app";   // make sure this DB exists in phpMyAdmin

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

/* ---------- ⿢  DETERMINE ACTION -------------------------- */
$action = $_GET['action'] ?? $_POST['action'] ?? '';

/* ---------- ⿣  CREATE BOOKING ----------------------------- */
if ($action === 'create') {
    $data = json_decode(file_get_contents("php://input"), true);

    $phone       = $conn->real_escape_string($data['phone'] ?? '');
    $pickup      = $conn->real_escape_string($data['pickup'] ?? '');
    $destination = $conn->real_escape_string($data['destination'] ?? '');

    if ($phone === '' || $pickup === '') {
        echo json_encode(["success" => false, "error" => "Missing required fields"]);
        exit;
    }

    $sql = "INSERT INTO bookings (phone, pickup, destination, status, created_at)
            VALUES ('$phone', '$pickup', '$destination', 'pending', NOW())";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "booking_id" => $conn->insert_id]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
}

/* ---------- ⿤  GET BOOKING HISTORY ----------------------- */
elseif ($action === 'history') {
    $phone = $conn->real_escape_string($_GET['phone'] ?? '');
    if ($phone === '') {
        echo json_encode(["success" => false, "error" => "Phone number required"]);
        exit;
    }

    $res  = $conn->query("SELECT * FROM bookings WHERE phone='$phone' ORDER BY id DESC");
    $rows = [];
    while ($row = $res->fetch_assoc()) {
        $rows[] = $row;
    }

    echo json_encode(["success" => true, "history" => $rows]);
}

/* ---------- ⿥  GET CURRENT BOOKING STATUS ---------------- */
elseif ($action === 'status') {
    $phone = $conn->real_escape_string($_GET['phone'] ?? '');
    if ($phone === '') {
        echo json_encode(["success" => false, "error" => "Phone number required"]);
        exit;
    }

    $res = $conn->query("SELECT * FROM bookings WHERE phone='$phone' ORDER BY id DESC LIMIT 1");
    if ($res && $res->num_rows > 0) {
        $booking = $res->fetch_assoc();
        echo json_encode(["success" => true, "booking" => $booking]);
    } else {
        echo json_encode(["success" => true, "booking" => null]);
    }
}

/* ---------- ⿦  DEFAULT RESPONSE --------------------------- */
else {
    echo json_encode(["success" => false, "error" => "Invalid or missing action parameter"]);
}

/* ---------- ⿧  CLOSE CONNECTION --------------------------- */
$conn->close();
?>
