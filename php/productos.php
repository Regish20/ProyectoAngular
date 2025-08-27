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
        // Solo mostrar productos activos (estado = true)
        $sql = "SELECT p.*, m.nombre_marca FROM productos p 
                LEFT JOIN marca m ON p.id_marca = m.id_marca 
                WHERE p.estado = true 
                ORDER BY p.id_producto ASC";
        
        $resultado = $conn->query($sql);
        if (!$resultado) {
            echo json_encode(["error" => "Error en consulta: " . $conn->error]);
            break;
        }
        $productos = [];
        while ($row = $resultado->fetch_assoc()) {
            $productos[] = $row;
        }
        echo json_encode($productos);
        break;

    case 'POST':
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || empty($data['nombre']) || !isset($data['precio']) || !isset($data['stock'])) {
            echo json_encode(["success" => false, "error" => "Datos incompletos. Nombre, precio y stock son obligatorios."]);
            break;
        }
        
        $nombre = $conn->real_escape_string(trim($data['nombre']));
        $precio = floatval($data['precio']);
        $stock = intval($data['stock']);
        $descripcion = isset($data['descripcion']) ? $conn->real_escape_string(trim($data['descripcion'])) : '';
        $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;

        // Verificar si existe la columna id_marca y si se proporcionó
        $columns = "nombre, precio, stock, estado";
        $values = "'$nombre', $precio, $stock, $estado";
        
        if (isset($data['id_marca']) && !empty($data['id_marca'])) {
            $id_marca = intval($data['id_marca']);
            $columns .= ", id_marca";
            $values .= ", $id_marca";
        }
        
        if (!empty($descripcion)) {
            $columns .= ", descripcion";
            $values .= ", '$descripcion'";
        }

        $sql = "INSERT INTO productos ($columns) VALUES ($values)";
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "id" => $conn->insert_id]);
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'PUT':
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (!$data || empty($data['id_producto']) || empty($data['nombre']) || !isset($data['precio']) || !isset($data['stock'])) {
            echo json_encode(["success" => false, "error" => "Datos incompletos para actualización"]);
            break;
        }
        
        $id = intval($data['id_producto']);
        $nombre = $conn->real_escape_string(trim($data['nombre']));
        $precio = floatval($data['precio']);
        $stock = intval($data['stock']);
        $descripcion = isset($data['descripcion']) ? $conn->real_escape_string(trim($data['descripcion'])) : '';
        $estado = isset($data['estado']) ? ($data['estado'] === 'true' || $data['estado'] === true ? 1 : 0) : 1;

        $sql = "UPDATE productos SET nombre='$nombre', precio=$precio, stock=$stock, estado=$estado";
        
        if (isset($data['id_marca']) && !empty($data['id_marca'])) {
            $id_marca = intval($data['id_marca']);
            $sql .= ", id_marca=$id_marca";
        }
        
        if (!empty($descripcion)) {
            $sql .= ", descripcion='$descripcion'";
        }
        
        $sql .= " WHERE id_producto=$id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => "No se realizaron cambios o el producto no existe"]);
            }
        } else {
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
        break;

    case 'DELETE':
        // Intentar obtener ID desde URL primero
        $id = isset($_GET['id_producto']) ? intval($_GET['id_producto']) : 0;
        
        // Si no hay ID en URL, intentar desde body
        if ($id == 0) {
            $input = file_get_contents("php://input");
            if ($input) {
                $data = json_decode($input, true);
                $id = isset($data['id_producto']) ? intval($data['id_producto']) : 0;
            }
        }
        
        if ($id <= 0) {
            echo json_encode(["success" => false, "error" => "ID de producto no válido"]);
            break;
        }
        
        // Eliminación lógica: cambiar estado a false
        $sql = "UPDATE productos SET estado = false WHERE id_producto=$id";
        
        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "error" => "Producto no encontrado"]);
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