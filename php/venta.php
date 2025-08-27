<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include the database connection file.
// Assumes 'conexion.php' exists and provides a working MySQLi connection in the $conn variable.
include 'conexion.php';

// Check for connection errors
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

// Process the request based on the HTTP method
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Verificar si la columna estado existe
        $check_column = $conn->query("SHOW COLUMNS FROM venta LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            // Solo mostrar ventas activas (estado = true)
            $resultado = $conn->query("SELECT * FROM venta WHERE estado = true ORDER BY id_venta ASC");
        } else {
            // Si no existe la columna estado, mostrar todas
            $resultado = $conn->query("SELECT * FROM venta ORDER BY id_venta ASC");
        }
        if (!$resultado) {
            echo json_encode(["error" => "Error en consulta: " . $conn->error]);
            break;
        }
        $ventas = [];
        while ($row = $resultado->fetch_assoc()) {
            $ventas[] = $row;
        }
        echo json_encode($ventas);
        break;

    case 'POST':
        // Handle a new sale creation
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        // Validate required fields
        if (!$data || empty($data['id_cliente']) || empty($data['fecha'])) {
            echo json_encode(["success" => false, "error" => "Datos incompletos"]);
            break;
        }
        
        $id_cliente = intval($data['id_cliente']);
        $fecha = $conn->real_escape_string($data['fecha']);
        
        // Verificar si la columna estado existe
        $check_column = $conn->query("SHOW COLUMNS FROM venta LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;
            $sql = "INSERT INTO venta (id_cliente, fecha, estado) VALUES ($id_cliente, '$fecha', $estado)";
        } else {
            $sql = "INSERT INTO venta (id_cliente, fecha) VALUES ($id_cliente, '$fecha')";
        }
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "id" => $conn->insert_id]);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'PUT':
        // Handle an existing sale update
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        // Validate required fields
        if (!$data || empty($data['id_venta']) || empty($data['id_cliente']) || empty($data['fecha'])) {
            echo json_encode(["success" => false, "error" => "Datos incompletos para actualización"]);
            break;
        }
        
        $id = intval($data['id_venta']);
        $id_cliente = intval($data['id_cliente']);
        $fecha = $conn->real_escape_string($data['fecha']);
        
        // Verificar si la columna estado existe
        $check_column = $conn->query("SHOW COLUMNS FROM venta LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;
            $sql = "UPDATE venta SET id_cliente=$id_cliente, fecha='$fecha', estado=$estado WHERE id_venta=$id";
        } else {
            $sql = "UPDATE venta SET id_cliente=$id_cliente, fecha='$fecha' WHERE id_venta=$id";
        }
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'DELETE':
        // Handle a sale deletion
        // Check for ID in both URL query parameter and request body
        $id = isset($_GET['id_venta']) ? intval($_GET['id_venta']) : 0;
        
        if ($id == 0) {
            $input = file_get_contents("php://input");
            if ($input) {
                $data = json_decode($input, true);
                $id = isset($data['id_venta']) ? intval($data['id_venta']) : 0;
            }
        }
        
        if ($id <= 0) {
            echo json_encode(["success" => false, "error" => "ID de venta no válido"]);
            break;
        }
        
        // Verificar si la columna estado existe para hacer eliminación lógica
        $check_column = $conn->query("SHOW COLUMNS FROM venta LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            // Eliminación lógica: cambiar estado a false
            $sql = "UPDATE venta SET estado = false WHERE id_venta=$id";
        } else {
            // Eliminación física si no existe la columna estado
            $sql = "DELETE FROM venta WHERE id_venta=$id";
        }
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => "Venta no encontrada"]);
            }
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    default:
        // Respond with an error for unsupported methods
        echo json_encode(["error" => "Método no soportado"]);
        break;
}

$conn->close();
?>