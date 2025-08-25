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
        $resultado = $conn->query("SELECT * FROM marca ORDER BY id_marca ASC");
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

        // Verificar que no exista una marca con el mismo nombre
        $check_nombre = $conn->query("SELECT id_marca FROM marca WHERE nombre_marca = '$nombre_marca'");
        if ($check_nombre->num_rows > 0) {
            echo json_encode(["success" => false, "error" => "Ya existe una marca con este nombre"]);
            break;
        }

        $sql = "INSERT INTO marca (nombre_marca) VALUES ('$nombre_marca')";
        
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

        // Verificar que no exista otra marca con el mismo nombre
        $check_nombre = $conn->query("SELECT id_marca FROM marca WHERE nombre_marca = '$nombre_marca' AND id_marca != $id");
        if ($check_nombre->num_rows > 0) {
            echo json_encode(["success" => false, "error" => "Ya existe otra marca con este nombre"]);
            break;
        }

        $sql = "UPDATE marca SET nombre_marca='$nombre_marca' WHERE id_marca=$id";
        
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
        // Intentar obtener ID desde URL primero
        $id = isset($_GET['id_marca']) ? intval($_GET['id_marca']) : 0;
        
        // Si no hay ID en URL, intentar desde body
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
        
        $sql = "DELETE FROM marca WHERE id_marca=$id";
        
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