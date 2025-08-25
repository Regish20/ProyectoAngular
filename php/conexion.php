<?php
$host = "localhost";
$usuario = "root";
$contrasena = "karatekid123**"; 
$base_datos = "tienda_movil"; 

$conn = new mysqli($host, $usuario, $contrasena, $base_datos);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

?>