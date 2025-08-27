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
        // Solo mostrar marcas activas (estado = true)
        $resultado = $conn->query("SELECT * FROM marca WHERE estado = true ORDER BY id_marca ASC");
        if (!$resultado) {
            echo json_encode(["error" => "Error en consulta: " . $conn->error]);
            break;
        }
        $marcas = [];
        while ($row = $resultado->fetch_assoc()) {
            $marcas[] = $row;
        }
        echo json_encode($marcas);
        break;

    case 'POST':
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || empty($data['nombre_marca'])) {
            echo json_encode(["success" => false, "error" => "El nombre de la marca es obligatorio"]);
            break;
        }
        
        $nombre_marca = $conn->real_escape_string(trim($data['nombre_marca']));
        $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;

        // Verificar que no exista una marca con el mismo nombre (solo entre las activas)
        $check_nombre = $conn->query("SELECT id_marca FROM marca WHERE nombre_marca = '$nombre_marca' AND estado = true");
        if ($check_nombre->num_rows > 0) {
            echo json_encode(["success" => false, "error" => "Ya existe una marca con este nombre"]);
            break;
        }

        $sql = "INSERT INTO marca (nombre_marca, estado) VALUES ('$nombre_marca', $estado)";
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "id" => $conn->insert_id]);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'PUT':
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || empty($data['id_marca']) || empty($data['nombre_marca'])) {
            echo json_encode(["success" => false, "error" => "Datos incompletos para actualización"]);
            break;
        }
        
        $id = intval($data['id_marca']);
        $nombre_marca = $conn->real_escape_string(trim($data['nombre_marca']));
        $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;

        // Verificar que no exista otra marca con el mismo nombre (solo entre las activas)
        $check_nombre = $conn->query("SELECT id_marca FROM marca WHERE nombre_marca = '$nombre_marca' AND id_marca != $id AND estado = true");
        if ($check_nombre->num_rows > 0) {
            echo json_encode(["success" => false, "error" => "Ya existe otra marca con este nombre"]);
            break;
        }

        $sql = "UPDATE marca SET nombre_marca='$nombre_marca', estado=$estado WHERE id_marca=$id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => "No se realizaron cambios o la marca no existe"]);
            }
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id_marca']) ? intval($_GET['id_marca']) : 0;
        
        if ($id == 0) {
            $input = file_get_contents("php://input");
            if ($input) {
                $data = json_decode($input, true);
                $id = isset($data['id_marca']) ? intval($data['id_marca']) : 0;
            }
        }
        
        if ($id <= 0) {
            echo json_encode(["success" => false, "error" => "ID de marca no válido"]);
            break;
        }
        
        // Verificar si hay productos asociados a esta marca
        $check_productos = $conn->query("SELECT COUNT(*) as total FROM productos WHERE id_marca = $id");
        $row = $check_productos->fetch_assoc();
        if ($row['total'] > 0) {
            echo json_encode(["success" => false, "error" => "No se puede eliminar la marca porque tiene productos asociados"]);
            break;
        }
        
        // Eliminación lógica: cambiar estado a false
        $sql = "UPDATE marca SET estado = false WHERE id_marca=$id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => "Marca no encontrada"]);
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