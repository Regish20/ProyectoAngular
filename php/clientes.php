<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'conexion.php';

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Verificar si la columna estado existe
        $check_column = $conn->query("SHOW COLUMNS FROM clientes LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            // Solo mostrar clientes activos (estado = true)
            $resultado = $conn->query("SELECT * FROM clientes WHERE estado = true ORDER BY id_cliente ASC");
        } else {
            // Si no existe la columna estado, mostrar todos
            $resultado = $conn->query("SELECT * FROM clientes ORDER BY id_cliente ASC");
        }
        if (!$resultado) {
            echo json_encode(["error" => "Error en consulta: " . $conn->error]);
            break;
        }
        $clientes = [];
        while ($row = $resultado->fetch_assoc()) {
            $clientes[] = $row;
        }
        echo json_encode($clientes);
        break;

    case 'POST':
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || empty($data['nombre']) || empty($data['correo']) || empty($data['telefono'])) {
            echo json_encode(["success" => false, "error" => "Datos incompletos"]);
            break;
        }
        
        $nombre = $conn->real_escape_string(trim($data['nombre']));
        $correo = $conn->real_escape_string(trim($data['correo']));
        $telefono = $conn->real_escape_string(trim($data['telefono']));
        
        // Verificar si la columna estado existe
        $check_column = $conn->query("SHOW COLUMNS FROM clientes LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;
            $sql = "INSERT INTO clientes (nombre, correo, telefono, estado) VALUES ('$nombre', '$correo', '$telefono', $estado)";
        } else {
            $sql = "INSERT INTO clientes (nombre, correo, telefono) VALUES ('$nombre', '$correo', '$telefono')";
        }
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "id" => $conn->insert_id]);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'PUT':
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || empty($data['id_cliente']) || empty($data['nombre']) || empty($data['correo']) || empty($data['telefono'])) {
            echo json_encode(["success" => false, "error" => "Datos incompletos para actualización"]);
            break;
        }
        
        $id = intval($data['id_cliente']);
        $nombre = $conn->real_escape_string(trim($data['nombre']));
        $correo = $conn->real_escape_string(trim($data['correo']));
        $telefono = $conn->real_escape_string(trim($data['telefono']));
        
        // Verificar si la columna estado existe
        $check_column = $conn->query("SHOW COLUMNS FROM clientes LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;
            $sql = "UPDATE clientes SET nombre='$nombre', correo='$correo', telefono='$telefono', estado=$estado WHERE id_cliente=$id";
        } else {
            $sql = "UPDATE clientes SET nombre='$nombre', correo='$correo', telefono='$telefono' WHERE id_cliente=$id";
        }
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'DELETE':
        // Intentar obtener ID desde URL primero
        $id = isset($_GET['id_cliente']) ? intval($_GET['id_cliente']) : 0;
        
        // Si no hay ID en URL, intentar desde body
        if ($id == 0) {
            $input = file_get_contents("php://input");
            if ($input) {
                $data = json_decode($input, true);
                $id = isset($data['id_cliente']) ? intval($data['id_cliente']) : 0;
            }
        }
        
        if ($id <= 0) {
            echo json_encode(["success" => false, "error" => "ID de cliente no válido"]);
            break;
        }
        
        // Verificar si la columna estado existe para hacer eliminación lógica
        $check_column = $conn->query("SHOW COLUMNS FROM clientes LIKE 'estado'");
        if ($check_column->num_rows > 0) {
            // Eliminación lógica: cambiar estado a false
            $sql = "UPDATE clientes SET estado = false WHERE id_cliente=$id";
        } else {
            // Eliminación física si no existe la columna estado
            $sql = "DELETE FROM clientes WHERE id_cliente=$id";
        }
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => "Cliente no encontrado"]);
            }
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    default:
        echo json_encode(["error" => "Método no soportado"]);
        break;
}

$conn->close();
?>