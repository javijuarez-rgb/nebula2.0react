<?php
// ==========================================
// 1. CONFIGURACIÓN Y SESIÓN
// ==========================================
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.gc_maxlifetime', 3600); 
    session_start();
}

// Cierre de sesión por inactividad (solo en peticiones normales, no en AJAX)
if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > 3600)) {
    session_unset();
    session_destroy();
    header("Location: dashboard-GES.php");
    exit;
}
if (!isset($_GET['ajax_action'])) {
    $_SESSION['LAST_ACTIVITY'] = time();
}

require_once 'GES/db.php'; 

// --- Funciones de Seguridad y Utilidad ---
function h($texto) {
    return htmlspecialchars($texto ?? '', ENT_QUOTES, 'UTF-8');
}

function linkify($texto) {
    if (empty($texto)) return '';
    $textoSeguro = h($texto);
    $regex = '/(https?:\/\/[^\s<]+|www\.[^\s<]+)/i';
    return preg_replace_callback($regex, function($matches) {
        $url = $matches[1];
        $href = strpos($url, 'http') === 0 ? $url : 'http://' . $url;
        return '<a href="' . $href . '" target="_blank" class="text-info fw-bold text-decoration-underline" style="word-break: break-all;">' . $url . '</a>';
    }, $textoSeguro);
}

// ==========================================
// 2. API INTERNA AJAX
// ==========================================
if (isset($_GET['ajax_action'])) {
    
    // BLOQUEO DE SEGURIDAD: Si no estás logueado, a la calle
    if (!isset($_SESSION['admin_logged'])) {
        http_response_code(403);
        exit(json_encode(['status' => 'error', 'msg' => 'No tienes acceso.']));
    }

    // Si no es la exportación a Excel, devolvemos JSON por defecto
    if ($_GET['ajax_action'] !== 'exportar_excel_tareas') {
        header('Content-Type: application/json');
    }
    
    // --- CHAT EN VIVO Y PRIVADOS ---
    if ($_GET['ajax_action'] === 'get_chat') {
        try { $pdo->exec("ALTER TABLE chat_mensajes ADD COLUMN receptor_id INT NULL AFTER usuario_id"); } catch(Exception $e) {}
        
        $yo = $_SESSION['admin_id'] ?? null;
        $receptor = $_GET['receptor'] ?? 'global';
        
        if ($receptor === 'global') {
            $stmt = $pdo->query("SELECT c.id, c.usuario_id, c.mensaje, c.fecha, u.nombre, u.rol FROM chat_mensajes c JOIN usuarios u ON c.usuario_id = u.id WHERE c.receptor_id IS NULL ORDER BY c.fecha ASC LIMIT 100");
        } else {
            $stmt = $pdo->prepare("SELECT c.id, c.usuario_id, c.mensaje, c.fecha, u.nombre, u.rol FROM chat_mensajes c JOIN usuarios u ON c.usuario_id = u.id WHERE (c.usuario_id = ? AND c.receptor_id = ?) OR (c.usuario_id = ? AND c.receptor_id = ?) ORDER BY c.fecha ASC LIMIT 100");
            $stmt->execute([$yo, $receptor, $receptor, $yo]);
        }
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }
    
    // --- ENVÍO DE CHAT MODIFICADO PARA SOPORTAR AUDIOS ---
    if ($_GET['ajax_action'] === 'send_chat') {
        $yo = $_SESSION['admin_id'] ?? null;
        $receptor = $_POST['receptor'] ?? 'global';
        $rec_id = ($receptor === 'global') ? null : $receptor;
        $msg = '';

        if (isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK) {
            $directorioFisico = 'uploads/chat_audios/';
            if (!file_exists($directorioFisico)) {
                @mkdir($directorioFisico, 0755, true); // Permisos seguros
            }
            
            $ext = strtolower(pathinfo($_FILES['audio']['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, ['webm', 'mp4', 'm4a', 'ogg', 'wav'])) {
                $ext = 'webm'; 
            }
            
            $nombreArchivo = 'audio_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
            $rutaDestino = $directorioFisico . $nombreArchivo;
            
            if (move_uploaded_file($_FILES['audio']['tmp_name'], $rutaDestino)) {
                $msg = '[AUDIO]' . $rutaDestino; 
            }
        } else {
            $msg = trim($_POST['mensaje'] ?? '');
        }
        
        if(!empty($msg) && $yo) {
            $pdo->prepare("INSERT INTO chat_mensajes (usuario_id, receptor_id, mensaje) VALUES (?, ?, ?)")->execute([$yo, $rec_id, $msg]);
        }
        echo json_encode(['status'=>'ok']);
        exit;
    }

    // --- ELIMINAR MENSAJE Y AUDIO FÍSICO SEGURO ---
    if ($_GET['ajax_action'] === 'delete_chat') {
        $msg_id = $_POST['id'] ?? 0;
        $yo = $_SESSION['admin_id'] ?? null;
        
        if ($msg_id && $yo) {
            $stmt = $pdo->prepare("SELECT mensaje, usuario_id FROM chat_mensajes WHERE id = ?");
            $stmt->execute([$msg_id]);
            $msg = $stmt->fetch();
            
            if ($msg && (int)$msg['usuario_id'] === (int)$yo) {
                if (strpos($msg['mensaje'], '[AUDIO]') === 0) {
                    $rutaArchivo = str_replace('[AUDIO]', '', $msg['mensaje']);
                    // BLOQUEO: Solo borramos si el archivo está en la carpeta correcta
                    if (strpos($rutaArchivo, 'uploads/chat_audios/') === 0 && file_exists($rutaArchivo)) {
                        unlink($rutaArchivo);
                    }
                }
                $pdo->prepare("DELETE FROM chat_mensajes WHERE id = ?")->execute([$msg_id]);
                echo json_encode(['status' => 'ok']);
                exit;
            }
        }
        echo json_encode(['status' => 'error']);
        exit;
    }

    if ($_GET['ajax_action'] === 'chat_last_id') {
        $yo = $_SESSION['admin_id'] ?? null;
        $receptor = $_GET['receptor'] ?? 'global';
        if ($receptor === 'global') {
            $stmt = $pdo->query("SELECT c.id, c.mensaje, u.nombre as autor FROM chat_mensajes c JOIN usuarios u ON c.usuario_id = u.id WHERE c.receptor_id IS NULL ORDER BY c.id DESC LIMIT 1");
        } else {
            $stmt = $pdo->prepare("SELECT c.id, c.mensaje, u.nombre as autor FROM chat_mensajes c JOIN usuarios u ON c.usuario_id = u.id WHERE (c.usuario_id = ? AND c.receptor_id = ?) OR (c.usuario_id = ? AND c.receptor_id = ?) ORDER BY c.id DESC LIMIT 1");
            $stmt->execute([$yo, $receptor, $receptor, $yo]);
        }
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['last_id' => $row ? (int)$row['id'] : 0, 'mensaje' => $row['mensaje'] ?? '', 'autor' => $row['autor'] ?? '']);
        exit;
    }

    if ($_GET['ajax_action'] === 'check_aprobaciones') {
        $count = $pdo->query("SELECT COUNT(*) FROM tareas WHERE estado = 'espera_aprobacion'")->fetchColumn();
        echo json_encode(['count' => (int)$count]);
        exit;
    }
    
        if ($_GET['ajax_action'] === 'get_aprobaciones_json') {
        $stmt = $pdo->query("SELECT t.id, t.titulo, c.nombre as cliente FROM tareas t JOIN clientes c ON t.cliente_id = c.id WHERE t.estado = 'espera_aprobacion'");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    
    if ($_GET['ajax_action'] === 'get_aprobaciones_html') {
        $pendientes = $pdo->query("SELECT t.*, c.nombre as cliente, (SELECT GROUP_CONCAT(u.nombre SEPARATOR ', ') FROM tarea_empleado te JOIN usuarios u ON te.usuario_id = u.id WHERE te.tarea_id = t.id) as empleados FROM tareas t JOIN clientes c ON t.cliente_id = c.id WHERE t.estado = 'espera_aprobacion'")->fetchAll(); 
        if(empty($pendientes)){
            echo '<div class="col-12"><div class="alert alert-success" style="background:var(--success-pastel); color:#11111b; border:none;">¡Todo al día!</div></div>';
        } else {
            foreach($pendientes as $p){
                $cliente = h($p['cliente']);
                $titulo = h($p['titulo'] ?? 'Sin título');
                $emps = h($p['empleados']);
                $msg = linkify($p['mensaje_empleado']);
                if (empty(trim($p['mensaje_empleado'] ?? ''))) {
                $msg = "<span class='text-muted' style='font-style: italic; font-size: 0.9em;'>Sin nota adjunta.</span>";
                }

                $id = $p['id'];
                
                $imgPruebaHtml = "";
                if (preg_match('/(https?:\/\/[^\s]+uploads\/pruebas\/[^\s]+)/i', $p['mensaje_empleado'] ?? '', $matches)) {
                    $imgPruebaHtml = "<div class='mt-2'><a href='{$matches[1]}' target='_blank' class='btn btn-sm btn-outline-info'><i class='bi bi-image'></i> Ver Foto de Prueba</a></div>";
                }

                echo "<div class='col-md-6 mb-3'>
                        <div class='card border-warning shadow-sm' style='border-color:var(--warning-pastel)!important'>
                            <div class='card-header d-flex justify-content-between' style='background:rgba(249, 226, 175, 0.1); color:var(--warning-pastel)'>
                                <strong>$cliente</strong><span>Esperando</span>
                            </div>
                            <div class='card-body'>
                                <h6 class='card-title'>$titulo</h6>
                                <p class='small text-muted mb-2'>Responsables: <strong>$emps</strong></p>
                                <div class='p-2 rounded mb-3' style='background:#313244'>
                                    <small class='fw-bold' style='color:var(--primary-pastel)'>Nota:</small><br>$msg
                                    $imgPruebaHtml
                                </div>
                                <div class='d-flex gap-2'>
                                    <form method='POST' class='w-50'>
                                        <input type='hidden' name='id_tarea' value='$id'>
                                        <button type='submit' name='aprobar_tarea' class='btn btn-success w-100'>Aprobar</button>
                                    </form>
                                    <button class='btn btn-danger w-50' type='button' data-bs-toggle='collapse' data-bs-target='#rechazo-$id'>Rechazar</button>
                                </div>
                                <div class='collapse mt-2' id='rechazo-$id'>
                                    <form method='POST' class='card card-body p-2'>
                                        <input type='hidden' name='id_tarea' value='$id'>
                                        <label class='small fw-bold mb-1'>Motivo:</label>
                                        <textarea name='motivo_rechazo' class='form-control form-control-sm mb-2' required></textarea>
                                        <button type='submit' name='rechazar_tarea' class='btn btn-secondary btn-sm w-100'>Confirmar</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>";
            }
        }
        exit;
    }
    
    if ($_GET['ajax_action'] === 'check_mis_tareas') {
        $yo = $_SESSION['admin_id'] ?? null;
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM tareas t JOIN tarea_empleado te ON t.id = te.tarea_id WHERE te.usuario_id = ? AND t.estado IN ('pendiente', 'proceso', 'espera_aprobacion', 'rechazada', 'aprobada')");
        $stmt->execute([$yo]);
        echo json_encode(['count' => (int)$stmt->fetchColumn()]);
        exit;
    }

    if ($_GET['ajax_action'] === 'verificar_pin') {
        $yo = $_SESSION['admin_id'] ?? 0;
        $stmt = $pdo->prepare("SELECT pin_generado FROM usuarios WHERE id = ?");
        $stmt->execute([$yo]);
        $miPin = $stmt->fetchColumn();
        
        if (isset($_POST['pin']) && $_POST['pin'] === $miPin) { 
            // Magia: Solo sacamos las contraseñas si el PIN coincide
            $clientesCreds = $pdo->query("SELECT id, credenciales FROM clientes WHERE credenciales IS NOT NULL AND credenciales != ''")->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'ok', 'data' => $clientesCreds]); 
        } else { 
            echo json_encode(['status' => 'error']); 
        }
        exit;
    }
    if ($_GET['ajax_action'] === 'save_gastos_libres') { 
        $datos = json_decode($_POST['data'], true); $mes = $_POST['mes']; $tipo = $_POST['tipo']; 
        if (is_array($datos)) {
            foreach($datos as $d) {
                $id = !empty($d['id']) ? $d['id'] : null; $concepto = $d['concepto']; $precio = ($d['precio'] === '') ? 0 : $d['precio']; $tiene_iva = (isset($d['tiene_iva']) && $d['tiene_iva'] == true) ? 1 : 0;
                if ($id && empty($concepto) && $precio == 0) { $pdo->prepare("DELETE FROM finanzas_gastos_libres WHERE id = ?")->execute([$id]); continue; }
                if (!$id && empty($concepto) && $precio == 0) continue;
                if ($id) { $pdo->prepare("UPDATE finanzas_gastos_libres SET concepto=?, precio=?, tiene_iva=? WHERE id=?")->execute([$concepto, $precio, $tiene_iva, $id]); } 
                else { $pdo->prepare("INSERT INTO finanzas_gastos_libres (mes, tipo, concepto, precio, tiene_iva) VALUES (?, ?, ?, ?, ?)")->execute([$mes, $tipo, $concepto, $precio, $tiene_iva]); }
            }
            echo json_encode(['status'=>'ok']);
        } else { echo json_encode(['status'=>'error']); }
        exit;
    }

    if ($_GET['ajax_action'] === 'batch_save_clientes') {
        $datos = json_decode($_POST['data'], true);
        if (is_array($datos)) {
            foreach($datos as $d) {
                $allowed = ['budget_v1_id', 'budget_v1_precio', 'budget_v2_id', 'budget_v2_precio', 'real_v1_id', 'real_v1_precio', 'real_v2_id', 'real_v2_precio'];
                if(in_array($d['col'], $allowed)) { $val = ($d['val'] === '') ? null : $d['val']; $pdo->prepare("UPDATE clientes SET {$d['col']} = ? WHERE id = ?")->execute([$val, $d['cid']]); }
            }
            echo json_encode(['status'=>'ok']);
        }
        exit;
    }

    if ($_GET['ajax_action'] === 'get_logs') { 
        $stmt = $pdo->prepare("SELECT * FROM tarea_logs WHERE tarea_id = ? ORDER BY fecha DESC"); $stmt->execute([$_GET['id']]); echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC)); exit;
    }
    
    if ($_GET['ajax_action'] === 'get_marca_data') { 
        $cid = $_GET['id']; 
        $cliente = $pdo->prepare("SELECT * FROM clientes WHERE id = ?"); $cliente->execute([$cid]); 
        $stmtObj = $pdo->prepare("SELECT * FROM objetivos WHERE cliente_id = ? ORDER BY fecha_orden DESC"); $stmtObj->execute([$cid]); 
        echo json_encode(['cliente' => $cliente->fetch(PDO::FETCH_ASSOC), 'objetivos' => $stmtObj->fetchAll(PDO::FETCH_ASSOC)]); exit;
    }
    
    // --- OBTENER MENSAJES NUEVOS PARA NOTIFICACIONES (ADMIN) ---
    if ($_GET['ajax_action'] === 'get_new_chats') {
        $yo = $_SESSION['admin_id'] ?? null;
        $last_id = (int)($_GET['last_id'] ?? 0);
        
        $stmt = $pdo->prepare("SELECT c.id, c.mensaje, c.receptor_id, u.nombre 
                               FROM chat_mensajes c 
                               JOIN usuarios u ON c.usuario_id = u.id 
                               WHERE c.id > ? 
                               AND (c.receptor_id IS NULL OR c.receptor_id = ? OR c.usuario_id = ?) 
                               ORDER BY c.id ASC");
        $stmt->execute([$last_id, $yo, $yo]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    // --- OBTENER EL ÚLTIMO ID GLOBAL (ADMIN) ---
    if ($_GET['ajax_action'] === 'chat_last_id_global') {
        $yo = $_SESSION['admin_id'] ?? null;
        $stmt = $pdo->prepare("SELECT MAX(id) FROM chat_mensajes WHERE receptor_id IS NULL OR receptor_id = ? OR usuario_id = ?");
        $stmt->execute([$yo, $yo]);
        echo json_encode(['last_id' => (int)$stmt->fetchColumn()]);
        exit;
    }

    if ($_GET['ajax_action'] === 'get_avg_time') { 
        while (ob_get_level()) ob_end_clean();
        header('Content-Type: application/json');
            try {
            $cid = (int)$_GET['cliente_id']; $mes = $_GET['mes']; 
            if (!$cid || !$mes) { echo json_encode(['texto' => 'Faltan datos', 'segundos' => 0]); exit; }
            $stmt = $pdo->prepare("SELECT fecha_creacion, fecha_aceptada, fecha_completada FROM tareas WHERE cliente_id = ? AND estado = 'terminada' AND fecha_completada LIKE ?"); 
            $stmt->execute([$cid, "$mes%"]); $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $totalSegundos = 0; $cantidadValida = 0; 
            foreach ($tareas as $t) { 
                if (empty($t['fecha_completada'])) continue; 
                $fecha_inicio = !empty($t['fecha_aceptada']) ? $t['fecha_aceptada'] : $t['fecha_creacion'];
                if (empty($fecha_inicio)) continue;
                $inicio = strtotime($fecha_inicio); $fin = strtotime($t['fecha_completada']); 
                if ($inicio && $fin && $inicio > 0 && $fin > 0 && $fin >= $inicio) { $totalSegundos += ($fin - $inicio); $cantidadValida++; }
            } 
            if ($cantidadValida === 0) { echo json_encode(['texto' => 'Sin datos', 'segundos' => 0]); } else { 
                $mediaSegundos = (int) round($totalSegundos / $cantidadValida); $dias = floor($mediaSegundos / 86400); $horas = floor(($mediaSegundos % 86400) / 3600); $min = floor(($mediaSegundos % 3600) / 60); 
                $texto = "Media: " . ($dias > 0 ? "{$dias}d " : "") . ($horas > 0 ? "{$horas}h " : "") . "{$min}m"; 
                echo json_encode(['texto' => $texto . " (Base: $cantidadValida)", 'segundos' => $mediaSegundos]); 
            } 
        } catch (Exception $e) { echo json_encode(['texto' => 'Error DB', 'segundos' => 0]); }

        exit;
    }
    
    if ($_GET['ajax_action'] === 'buscar_global') {
        $q = $_GET['q'] ?? '';
        $resultados = [];
        if(strlen($q) >= 2) {
            $q = "%$q%";
            $stmt = $pdo->prepare("SELECT id, nombre FROM clientes WHERE nombre LIKE ? LIMIT 5");
            $stmt->execute([$q]);
            foreach($stmt->fetchAll() as $r) $resultados[] = ['tipo' => 'Cliente', 'nombre' => $r['nombre']];
            $stmt = $pdo->prepare("SELECT id, titulo FROM tareas WHERE titulo LIKE ? LIMIT 5");
            $stmt->execute([$q]);
            foreach($stmt->fetchAll() as $r) $resultados[] = ['tipo' => 'Tarea', 'nombre' => $r['titulo']];
        }
        echo json_encode($resultados);
        exit;
    }
    
    // --- EXPORTADOR DE TAREAS A EXCEL AVANZADO ---
    if ($_GET['ajax_action'] === 'exportar_excel_tareas') {
        $clienteId = $_POST['export_cliente'] ?? 'all';
        $rango = $_POST['export_rango'] ?? 'all';
        
        $sql = "SELECT t.titulo, t.descripcion, t.estado, t.prioridad, t.fecha_limite, t.fecha_completada, 
                       c.nombre as cliente_nombre, 
                       (SELECT GROUP_CONCAT(u.nombre SEPARATOR ', ') FROM tarea_empleado te JOIN usuarios u ON te.usuario_id = u.id WHERE te.tarea_id = t.id) as empleados 
                FROM tareas t 
                LEFT JOIN clientes c ON t.cliente_id = c.id 
                WHERE 1=1";
        $params = [];

        if ($clienteId !== 'all') { $sql .= " AND t.cliente_id = ?"; $params[] = $clienteId; }
        if ($rango === 'week') { $sql .= " AND t.fecha_limite >= DATE_SUB(NOW(), INTERVAL 1 WEEK)"; } 
        elseif ($rango === 'month') { $sql .= " AND t.fecha_limite >= DATE_SUB(NOW(), INTERVAL 1 MONTH)"; } 
        elseif ($rango === 'year') { $sql .= " AND t.fecha_limite >= DATE_SUB(NOW(), INTERVAL 1 YEAR)"; }

        $sql .= " ORDER BY t.fecha_limite DESC";
        $stmt = $pdo->prepare($sql); $stmt->execute($params);
        $tareasExport = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (ob_get_length()) ob_clean();

        $filename = "Reporte_Tareas_" . date('Y-m-d') . ".xls";
        header("Content-Type: application/vnd.ms-excel; charset=utf-8");
        header("Content-Disposition: attachment; filename=\"$filename\"");
        header("Pragma: no-cache"); header("Expires: 0");

        echo "\xEF\xBB\xBF"; 
        echo "<table border='1'><tr>";
        echo "<th style='background-color:#89b4fa; color:black;'>Cliente</th><th style='background-color:#89b4fa; color:black;'>Titulo de la Tarea</th><th style='background-color:#89b4fa; color:black;'>Descripcion</th><th style='background-color:#89b4fa; color:black;'>Estado</th><th style='background-color:#89b4fa; color:black;'>Prioridad</th><th style='background-color:#89b4fa; color:black;'>Responsables</th><th style='background-color:#89b4fa; color:black;'>Fecha Limite</th><th style='background-color:#89b4fa; color:black;'>Fecha Completada</th></tr>";

        foreach ($tareasExport as $row) {
            echo "<tr><td>" . h($row['cliente_nombre']) . "</td><td>" . h($row['titulo']) . "</td><td>" . h($row['descripcion']) . "</td><td>" . h($row['estado']) . "</td><td>" . h($row['prioridad']) . "</td><td>" . h($row['empleados']) . "</td><td>" . h($row['fecha_limite']) . "</td><td>" . h($row['fecha_completada']) . "</td></tr>";
        }
        echo "</table>"; exit;
    }
    
    exit; 
}

// --- MENSAJES FLASH ---
$success = $_SESSION['flash_success'] ?? null; $error = $_SESSION['flash_error'] ?? null; 
unset($_SESSION['flash_success'], $_SESSION['flash_error']);

// ==========================================
// 3. LÓGICA BACKEND (CRUD)
// ==========================================
if (isset($_POST['login_admin'])) { 
    $user = $_POST['user']; $pass = $_POST['pass']; 
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ? AND (rol = 'superadmin' OR rol = 'admin')"); 
    $stmt->execute([$user]); 
    $u = $stmt->fetch(); 
    
    // SEGURIDAD: Hash de contraseñas
    if ($u && (password_verify($pass, $u['password']) || $pass === $u['password'])) { 
        if ($pass === $u['password']) {
            $hash = password_hash($pass, PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE usuarios SET password = ? WHERE id = ?")->execute([$hash, $u['id']]);
        }
        $_SESSION['admin_logged'] = true; $_SESSION['admin_id'] = $u['id']; $_SESSION['rol'] = $u['rol']; header("Location: dashboard-GES.php"); exit; 
    } else { $error = "Datos incorrectos."; } 
}

if (isset($_GET['logout'])) { session_destroy(); header("Location: dashboard-GES.php"); exit; }

if (isset($_POST['crear_usuario']) && isset($_SESSION['admin_logged'])) { 
    $usuario = $_POST['usuario']; $check = $pdo->prepare("SELECT id FROM usuarios WHERE usuario = ?"); $check->execute([$usuario]); 
    if ($check->rowCount() > 0) { $_SESSION['flash_error'] = "Usuario ya existe."; } else { 
        $nombre = $_POST['nombre']; $esAdmin = isset($_POST['es_admin_check']); if ($esAdmin && $_SESSION['rol'] !== 'superadmin') $esAdmin = false; 
        $rol = $esAdmin ? 'admin' : 'empleado'; $pin = substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 6); 
        
        try { 
            // SEGURIDAD: Guardamos la clave hasheada
            $pinHash = password_hash($pin, PASSWORD_DEFAULT);
            $pdo->prepare("INSERT INTO usuarios (nombre, usuario, password, pin_generado, rol) VALUES (?, ?, ?, ?, ?)")->execute([$nombre, $usuario, $pinHash, $pin, $rol]); 
            $_SESSION['flash_success'] = "Usuario creado. PIN: " . $pin; 
        } catch (PDOException $e) { $_SESSION['flash_error'] = "Error DB."; } 
    } header("Location: dashboard-GES.php"); exit; 
}

if (isset($_POST['editar_info_empleado'])) { $pdo->prepare("UPDATE usuarios SET nombre=?, usuario=? WHERE id=?")->execute([$_POST['edit_nombre'], $_POST['edit_usuario'], $_POST['id_empleado']]); $_SESSION['flash_success'] = "Actualizado."; header("Location: dashboard-GES.php"); exit; }

if (isset($_POST['regenerar_pin'])) { 
    $nuevoPin = substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 6); 
    $pinHash = password_hash($nuevoPin, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE usuarios SET password=?, pin_generado=? WHERE id=?")->execute([$pinHash, $nuevoPin, $_POST['id_empleado_pin']]); 
    $_SESSION['flash_success'] = "Nuevo PIN: " . $nuevoPin; header("Location: dashboard-GES.php"); exit; 
}

if (isset($_GET['borrar_emp'])) { 
    if($_GET['borrar_emp'] == $_SESSION['admin_id']) { $_SESSION['flash_error'] = "No puedes borrarte a ti mismo."; } else { 
        $id = $_GET['borrar_emp']; 
        
        $stmtTarget = $pdo->prepare("SELECT rol FROM usuarios WHERE id=?");
        $stmtTarget->execute([$id]);
        $target = $stmtTarget->fetch();
        
        if ($_SESSION['rol'] !== 'superadmin' && ($target['rol'] === 'superadmin' || $target['rol'] === 'admin')) { $_SESSION['flash_error'] = "Sin permisos."; } else { 
            $pdo->prepare("DELETE FROM tarea_empleado WHERE usuario_id = ?")->execute([$id]); $pdo->prepare("DELETE FROM usuarios WHERE id = ?")->execute([$id]); $_SESSION['flash_success'] = "Eliminado."; 
        } 
    } header("Location: dashboard-GES.php"); exit; 
}

if (isset($_POST['crear_cliente'])) { 
    $potencial = isset($_POST['es_potencial']) ? 1 : 0; $activo = isset($_POST['es_activo']) ? 1 : 0; $iva = isset($_POST['tiene_iva']) ? 1 : 0; $irpf = isset($_POST['tiene_irpf']) ? 1 : 0; 
    $ib = $_POST['ing_budget'] ?? 0; $ir = $_POST['ing_real'] ?? 0; $cb = $_POST['cost_budget'] ?? 0; $cr = $_POST['cost_real'] ?? 0; 
    $fechaBaja = ($activo == 0) ? date('Y-m-d H:i:s') : null; $creds = isset($_POST['social']) ? json_encode($_POST['social']) : null; 
    $sql = "INSERT INTO clientes (nombre, telefono, direccion, descripcion, credenciales, es_potencial, es_activo, fecha_baja, ingreso_budget, ingreso_real, coste_budget, coste_real, tiene_iva, tiene_irpf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"; 
    $pdo->prepare($sql)->execute([$_POST['nombre_cliente'], $_POST['telefono'], $_POST['ubicacion'], $_POST['descripcion'], $creds, $potencial, $activo, $fechaBaja, $ib, $ir, $cb, $cr, $iva, $irpf]); 
    $_SESSION['flash_success'] = "Cliente añadido."; header("Location: dashboard-GES.php"); exit; 
}

if (isset($_POST['editar_cliente_full'])) { 
    $potencial = isset($_POST['edit_es_potencial']) ? 1 : 0; $activo = isset($_POST['edit_es_activo']) ? 1 : 0; $iva = isset($_POST['edit_tiene_iva']) ? 1 : 0; $irpf = isset($_POST['edit_tiene_irpf']) ? 1 : 0; 
    $ib = $_POST['edit_ing_budget'] ?? 0; $ir = $_POST['edit_ing_real'] ?? 0; $cb = $_POST['edit_cost_budget'] ?? 0; $cr = $_POST['edit_cost_real'] ?? 0; 
    $id = $_POST['id_cliente']; 
    
    $stmtOld = $pdo->prepare("SELECT es_activo, fecha_baja FROM clientes WHERE id=?");
    $stmtOld->execute([$id]);
    $old = $stmtOld->fetch();
    
    $fechaBaja = $old['fecha_baja']; if($old['es_activo'] == 1 && $activo == 0) $fechaBaja = date('Y-m-d H:i:s'); if($activo == 1) $fechaBaja = null; 
    $creds = isset($_POST['social']) ? json_encode($_POST['social']) : null; 
    $sql = "UPDATE clientes SET nombre=?, telefono=?, direccion=?, descripcion=?, credenciales=?, es_potencial=?, es_activo=?, fecha_baja=?, ingreso_budget=?, ingreso_real=?, coste_budget=?, coste_real=?, tiene_iva=?, tiene_irpf=? WHERE id=?"; 
    $pdo->prepare($sql)->execute([$_POST['edit_cli_nombre'], $_POST['edit_cli_telefono'], $_POST['edit_cli_direccion'], $_POST['edit_cli_desc'], $creds, $potencial, $activo, $fechaBaja, $ib, $ir, $cb, $cr, $iva, $irpf, $id]); 
    $_SESSION['flash_success'] = "Actualizado."; header("Location: dashboard-GES.php"); exit; 
}

if (isset($_GET['borrar_cli'])) { 
    if($_SESSION['rol'] !== 'superadmin' && $_SESSION['rol'] !== 'admin') { header("Location: dashboard-GES.php"); exit; } 
    $id = $_GET['borrar_cli']; 
    $pdo->prepare("DELETE FROM objetivos WHERE cliente_id = ?")->execute([$id]); 
    $ids = $pdo->prepare("SELECT id FROM tareas WHERE cliente_id = ?"); $ids->execute([$id]); 
    $tIds = $ids->fetchAll(PDO::FETCH_COLUMN); 
    if (!empty($tIds)) { $inQuery = implode(',', array_fill(0, count($tIds), '?')); $pdo->prepare("DELETE FROM tarea_empleado WHERE tarea_id IN ($inQuery)")->execute($tIds); } 
    $pdo->prepare("DELETE FROM tareas WHERE cliente_id = ?")->execute([$id]); 
    $pdo->prepare("DELETE FROM clientes WHERE id = ?")->execute([$id]); 
    $_SESSION['flash_success'] = "Eliminado."; header("Location: dashboard-GES.php"); exit; 
}

if (isset($_POST['crear_item_catalogo'])) { if($_SESSION['rol'] !== 'superadmin') { header("Location: dashboard-GES.php"); exit; } $pdo->prepare("INSERT INTO finanzas_servicios_catalogo (nombre, precio_defecto, tipo) VALUES (?, ?, ?)")->execute([$_POST['cat_nombre'], $_POST['cat_precio'], $_POST['cat_tipo']]); $_SESSION['flash_success'] = "Añadido al catálogo."; header("Location: dashboard-GES.php"); exit; }
if (isset($_GET['borrar_catalogo'])) { if($_SESSION['rol'] !== 'superadmin') { header("Location: dashboard-GES.php"); exit; } $pdo->prepare("DELETE FROM finanzas_servicios_catalogo WHERE id = ?")->execute([$_GET['borrar_catalogo']]); $_SESSION['flash_success'] = "Eliminado del catálogo."; header("Location: dashboard-GES.php"); exit; }

if (isset($_POST['guardar_marca'])) { 
    $cliente_id = $_POST['marca_cliente_id'] ?? '';
    
    if (empty($cliente_id)) {
        $_SESSION['flash_error'] = "⚠️ Ojo: No has seleccionado ningún cliente.";
        header("Location: dashboard-GES.php"); 
        exit;
    }

    $logos = json_encode(array_values(array_filter($_POST['logos'] ?? []))); 
    $colores = json_encode(array_values(array_filter($_POST['colores'] ?? []))); 
    $tipografias = json_encode(array_values(array_filter($_POST['tipografias'] ?? [])));

    try {
        // PARCHE MÁGICO: Crea la columna "tipografias" de forma silenciosa si no existe
        try { $pdo->exec("ALTER TABLE clientes ADD COLUMN tipografias TEXT NULL"); } catch(Exception $e) {}
        
        $pdo->prepare("UPDATE clientes SET logos=?, colores=?, tipografias=? WHERE id=?")->execute([$logos, $colores, $tipografias, $cliente_id]); 
        
        if (!empty($_POST['obj_titulo'])) { 
            $pdo->prepare("INSERT INTO objetivos (cliente_id, tipo, titulo, descripcion, fecha_orden) VALUES (?, ?, ?, ?, ?)")->execute([$cliente_id, $_POST['obj_tipo'], $_POST['obj_titulo'], $_POST['obj_desc'], $_POST['obj_fecha']]); 
        } 
        
        $_SESSION['flash_success'] = "Estrategia guardada."; 
    } catch (PDOException $e) {
        $_SESSION['flash_error'] = "Error DB: " . $e->getMessage();
    }
    
    header("Location: dashboard-GES.php"); 
    exit; 
}

if (isset($_GET['borrar_objetivo'])) { $pdo->prepare("DELETE FROM objetivos WHERE id = ?")->execute([$_GET['borrar_objetivo']]); $_SESSION['flash_success'] = "Objetivo borrado."; header("Location: dashboard-GES.php"); exit; }

if (isset($_POST['crear_nota_admin'])) { $pdo->prepare("INSERT INTO notas_globales (usuario_id, contenido) VALUES (?, ?)")->execute([$_SESSION['admin_id'], $_POST['nota_texto']]); $_SESSION['flash_success'] = "Nota publicada."; header("Location: dashboard-GES.php"); exit; }
if (isset($_POST['borrar_nota_btn'])) { $pdo->prepare("DELETE FROM notas_globales WHERE id = ?")->execute([$_POST['nota_id']]); $_SESSION['flash_success'] = "Nota eliminada."; header("Location: dashboard-GES.php"); exit; }

if (isset($_POST['crear_tarea'])) { 
    $fecha = $_POST['tarea_fecha']; $hora = $_POST['tarea_hora']; $fecha_completa = empty($hora) ? $fecha . ' 23:59:59' : $fecha . ' ' . $hora . ':00'; 
    $es_rec = isset($_POST['tarea_recurrente']) ? 1 : 0; $dias_rec = ($es_rec && !empty($_POST['dias_rec'])) ? implode(',', $_POST['dias_rec']) : null; 
    $titulo = trim($_POST['tarea_titulo']);
    if (!empty($_POST['tarea_tipo_contenido'])) { $tipo = $_POST['tarea_tipo_contenido']; if ($tipo === 'story') $titulo = '📱 ' . $titulo; elseif ($tipo === 'reel') $titulo = '🎬 ' . $titulo; elseif ($tipo === 'publicacion') $titulo = '🖼️ ' . $titulo; }
    $pdo->prepare("INSERT INTO tareas (cliente_id, titulo, descripcion, prioridad, estado, fecha_limite, es_recurrente, dias_recurrencia) VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?)")->execute([$_POST['tarea_cliente_id'], $titulo, $_POST['tarea_desc'], $_POST['tarea_prioridad'], $fecha_completa, $es_rec, $dias_rec]); 
    $tid = $pdo->lastInsertId(); $pdo->prepare("INSERT INTO tarea_logs (tarea_id, accion) VALUES (?, '✨ Creada')")->execute([$tid]); 
    if (isset($_POST['asignados'])) { $s = $pdo->prepare("INSERT INTO tarea_empleado (tarea_id, usuario_id) VALUES (?, ?)"); foreach ($_POST['asignados'] as $eid) $s->execute([$tid, $eid]); } 
    $_SESSION['flash_success'] = "Tarea creada."; header("Location: dashboard-GES.php"); exit; 
}

// ---> ¡AQUÍ ESTÁ EL CAMBIO DE EDITAR TAREA! <---
if (isset($_POST['editar_tarea'])) { 
    $id = $_POST['edit_tarea_id']; $fecha = $_POST['edit_tarea_fecha']; $hora = $_POST['edit_tarea_hora']; $fecha_completa = empty($hora) ? $fecha . ' 23:59:59' : $fecha . ' ' . $hora . ':00'; 
    $estado = $_POST['edit_tarea_estado']; // Recogemos el estado
    
    $pdo->prepare("UPDATE tareas SET titulo=?, descripcion=?, prioridad=?, fecha_limite=?, estado=? WHERE id=?")->execute([$_POST['edit_tarea_titulo'], $_POST['edit_tarea_desc'], $_POST['edit_tarea_prioridad'], $fecha_completa, $estado, $id]); 
    
    if (isset($_POST['edit_asignados'])) { 
        $pdo->prepare("DELETE FROM tarea_empleado WHERE tarea_id = ?")->execute([$id]); 
        $s = $pdo->prepare("INSERT INTO tarea_empleado (tarea_id, usuario_id) VALUES (?, ?)"); 
        foreach ($_POST['edit_asignados'] as $eid) $s->execute([$id, $eid]); 
    }
    
    $pdo->prepare("INSERT INTO tarea_logs (tarea_id, accion) VALUES (?, '✏️ Editada (Info/Estado) por un administrador')")->execute([$id]); $_SESSION['flash_success'] = "Tarea actualizada."; header("Location: dashboard-GES.php"); exit; 
}

if (isset($_POST['aprobar_tarea'])) { 
    $pdo->prepare("UPDATE tareas SET estado='aprobada', mensaje_jefe='✅ ¡Visto bueno del Jefe! Ya puedes marcarla como Terminada.' WHERE id=?")->execute([$_POST['id_tarea']]); 
    $pdo->prepare("INSERT INTO tarea_logs (tarea_id, accion) VALUES (?, '✅ Aprobada por Jefatura (Lista para cierre)')")->execute([$_POST['id_tarea']]); 
    $_SESSION['flash_success'] = "Aprobada y notificada al empleado para su cierre final."; 
    header("Location: dashboard-GES.php"); 
    exit; 
}



if (isset($_POST['rechazar_tarea'])) { $pdo->prepare("UPDATE tareas SET estado='rechazada', mensaje_jefe=? WHERE id=?")->execute([$_POST['motivo_rechazo'], $_POST['id_tarea']]); $pdo->prepare("INSERT INTO tarea_logs (tarea_id, accion) VALUES (?, ?)")->execute([$_POST['id_tarea'], "❌ Rechazada: " . $_POST['motivo_rechazo']]); $_SESSION['flash_success'] = "Rechazada."; header("Location: dashboard-GES.php"); exit; }

// SEGURIDAD: Solo Jefes pueden borrar tareas
if (isset($_GET['borrar_tarea'])) { 
    if($_SESSION['rol'] !== 'superadmin' && $_SESSION['rol'] !== 'admin') { 
        $_SESSION['flash_error'] = "No tienes permisos para borrar tareas."; 
        header("Location: dashboard-GES.php"); 
        exit; 
    }
    $id = $_GET['borrar_tarea']; 
    $pdo->prepare("DELETE FROM tarea_logs WHERE tarea_id = ?")->execute([$id]); 
    $pdo->prepare("DELETE FROM tarea_empleado WHERE tarea_id = ?")->execute([$id]); 
    $pdo->prepare("DELETE FROM tareas WHERE id = ?")->execute([$id]); 
    $_SESSION['flash_success'] = "Tarea eliminada."; 
    header("Location: dashboard-GES.php"); 
    exit; 
}

if (isset($_POST['update_mi_tarea'])) {
    $tid = $_POST['mi_tarea_id']; 
    
    // BLOQUEO DE SEGURIDAD: ¿De verdad esta tarea es tuya?
    $check = $pdo->prepare("SELECT 1 FROM tarea_empleado WHERE tarea_id = ? AND usuario_id = ?");
    $check->execute([$tid, $_SESSION['admin_id']]);
    if (!$check->fetch()) { 
        $_SESSION['flash_error'] = "Esa tarea no te pertenece.";
        header("Location: dashboard-GES.php"); 
        exit; 
    }

    $nest = $_POST['mi_tarea_estado']; $msg = $_POST['mi_tarea_msg'] ?? null;
    $old = $pdo->prepare("SELECT estado FROM tareas WHERE id = ?"); $old->execute([$tid]); $ant = $old->fetchColumn();
    if ($ant != $nest) { $m = "Estado cambiado: $ant ➝ $nest"; if($nest == 'espera_aprobacion') $m = "✋ Solicitada aprobación" . ($msg ? ": $msg" : ""); $pdo->prepare("INSERT INTO tarea_logs (tarea_id, accion) VALUES (?, ?)")->execute([$tid, $m]); }
    $sql = "UPDATE tareas SET estado = ?"; $p = [$nest];
    if ($nest === 'terminada') $sql .= ", fecha_completada = NOW()"; elseif ($ant === 'terminada' && $nest !== 'terminada') $sql .= ", fecha_completada = NULL";
    if ($nest === 'espera_aprobacion') { $sql .= ", mensaje_empleado = ?"; $p[] = $msg; }
    $p[] = $tid; $pdo->prepare($sql . " WHERE id = ?")->execute($p);
    
    // Reseteo de tareas recurrentes
    if ($nest === 'terminada') {
        $t_info = $pdo->prepare("SELECT * FROM tareas WHERE id = ?"); $t_info->execute([$tid]); $tar = $t_info->fetch();
        if ($tar && $tar['es_recurrente'] == 1 && !empty($tar['dias_recurrencia'])) {
            $dias_array = explode(',', $tar['dias_recurrencia']); $fecha_clon = new DateTime(); $encontrado = false;
            for ($i = 1; $i <= 7; $i++) { $fecha_clon->modify('+1 day'); if (in_array($fecha_clon->format('N'), $dias_array)) { $encontrado = true; break; } }
            if ($encontrado) {
                $hora_orig = (new DateTime($tar['fecha_limite']))->format('H:i:s'); $nueva_fecha = $fecha_clon->format('Y-m-d') . ' ' . $hora_orig;
                $stmtClon = $pdo->prepare("INSERT INTO tareas (cliente_id, titulo, descripcion, prioridad, estado, fecha_limite, es_recurrente, dias_recurrencia) VALUES (?, ?, ?, ?, 'pendiente', ?, ?, ?)");
                $stmtClon->execute([$tar['cliente_id'], $tar['titulo'], $tar['descripcion'], $tar['prioridad'], $nueva_fecha, 1, $tar['dias_recurrencia']]); $new_tid = $pdo->lastInsertId();
                $emps = $pdo->prepare("SELECT usuario_id FROM tarea_empleado WHERE tarea_id = ?"); $emps->execute([$tid]); $stmtAsig = $pdo->prepare("INSERT INTO tarea_empleado (tarea_id, usuario_id) VALUES (?, ?)");
                foreach($emps->fetchAll() as $emp) $stmtAsig->execute([$new_tid, $emp['usuario_id']]);
                $pdo->prepare("INSERT INTO tarea_logs (tarea_id, accion) VALUES (?, '✨ Creada automáticamente (Reseteo recurrente)')")->execute([$new_tid]);
            }
        }
    }
    $_SESSION['flash_success'] = "Estado de tu tarea actualizado."; header("Location: dashboard-GES.php"); exit;
}
// ==========================================
// 4. OPTIMIZACIÓN GLOBALES Y STATS
// ==========================================
$clientesGlobal = []; $usuariosGlobal = []; $catalogoServicios = [];
if (isset($_SESSION['admin_logged'])) {
    $clientesGlobal = $pdo->query("SELECT id, nombre, credenciales FROM clientes ORDER BY nombre ASC")->fetchAll(PDO::FETCH_ASSOC);
    $usuariosGlobal = $pdo->query("SELECT id, nombre FROM usuarios ORDER BY nombre ASC")->fetchAll(PDO::FETCH_ASSOC);
    $mesFacturacion = $_GET['mes_facturacion'] ?? date('Y-m'); 
    $countAprobaciones = $pdo->query("SELECT COUNT(*) FROM tareas WHERE estado = 'espera_aprobacion'")->fetchColumn();
    $totalTareas = $pdo->query("SELECT COUNT(*) FROM tareas")->fetchColumn();
    
    $statsRaw = $pdo->query("SELECT c.id, c.nombre, t.estado, COUNT(*) as cantidad FROM tareas t JOIN clientes c ON t.cliente_id = c.id GROUP BY c.id, t.estado ORDER BY c.nombre ASC")->fetchAll(PDO::FETCH_ASSOC);
    $statsClientes = []; 
    foreach($statsRaw as $row) { 
        if(!isset($statsClientes[$row['id']])) { $statsClientes[$row['id']] = ['nombre' => $row['nombre'], 'datos' => [], 'aprobadas' => 0, 'rechazadas' => 0]; }
        $statsClientes[$row['id']]['datos'][$row['estado']] = $row['cantidad']; 
    }
    $statsLogs = $pdo->query("SELECT t.cliente_id, SUM(CASE WHEN l.accion LIKE '%✅ Aprobada%' THEN 1 ELSE 0 END) as aprobadas, SUM(CASE WHEN l.accion LIKE '%❌ Rechazada%' THEN 1 ELSE 0 END) as rechazadas FROM tarea_logs l JOIN tareas t ON l.tarea_id = t.id GROUP BY t.cliente_id")->fetchAll(PDO::FETCH_ASSOC);
    foreach($statsLogs as $row) {
        if(isset($statsClientes[$row['cliente_id']])) {
            $statsClientes[$row['cliente_id']]['aprobadas'] = (int)$row['aprobadas'];
            $statsClientes[$row['cliente_id']]['rechazadas'] = (int)$row['rechazadas'];
        }
    }
    
    $resCal = $pdo->query("SELECT t.id, t.titulo, t.fecha_limite, t.prioridad, c.nombre as cliente, c.id as cliente_id FROM tareas t JOIN clientes c ON t.cliente_id = c.id WHERE t.fecha_limite IS NOT NULL AND t.estado != 'terminada'")->fetchAll();
    $cols = ['urgente'=>'#f38ba8', 'alta'=>'#fab387', 'media'=>'#f9e2af', 'baja'=>'#a6e3a1']; $eventosJefe = []; 
    foreach($resCal as $ev) { $eventosJefe[] = ['title' => h($ev['cliente']) . ' - ' . h($ev['titulo'] ?: 'Sin título'), 'start' => $ev['fecha_limite'], 'color' => $cols[$ev['prioridad']] ?? '#bac2de', 'textColor'=>'#11111b', 'extendedProps' => ['cliente_id' => $ev['cliente_id']]]; }
    $jsonEventos = json_encode($eventosJefe);
    if($_SESSION['rol'] === 'superadmin') { $catalogoServicios = $pdo->query("SELECT * FROM finanzas_servicios_catalogo ORDER BY nombre ASC")->fetchAll(PDO::FETCH_ASSOC); }
}

function renderSocialInputs($prefix) {
    $p = ['ig'=>['Instagram',1], 'fb'=>['Facebook',1], 'email'=>['Correo',1], 'yt'=>['YouTube',1], 'wp'=>['WordPress',1], 'tiktok'=>['TikTok',1], 'smart'=>['SmartLinks',0], 'reserva'=>['Reservas',0], 'linkedin'=>['LinkedIn',1], 'dish'=>['Dish',1], 'x'=>['X (Twitter)',1], 'trip'=>['TripAdvisor',1], 'avo'=>['Avocaty',1], 'cover'=>['Cover Manager',1], 'milan'=>['Mil Anuncios',1]];
    echo '<div class="social-box">';
    foreach($p as $k => $d) { echo "<div class='mb-2 pb-2 border-bottom border-secondary'><div class='form-check'><input class='form-check-input social-check' type='checkbox' data-target='{$prefix}_{$k}' id='check_{$prefix}_{$k}'><label class='form-check-label small text-light' for='check_{$prefix}_{$k}'>{$d[0]}</label></div><div id='{$prefix}_{$k}' class='d-none social-fields ms-3 mt-1'><input type='text' name='social[$k][user]' class='form-control form-control-sm mb-1 input-dark' placeholder='Usuario/Link'>"; if($d[1]) echo "<input type='text' name='social[$k][pass]' class='form-control form-control-sm input-dark' placeholder='Contraseña'>"; echo "</div></div>"; }
    echo '</div>';
}

function renderTablaIngresos($pdo, $modo, $clientes, $catalogo) {
    $catIngresos = array_filter($catalogo, function($c) { return $c['tipo'] === 'ingreso'; });
    echo "<div class='table-responsive'><table class='table table-sm table-hover align-middle mb-0' id='table_ingreso_$modo'>";
    echo "<thead><tr><th>Cliente</th><th>Base (€)</th><th>Extra 1</th><th>Extra 2</th><th>IVA/IRPF</th><th>Total C/IVA</th></tr></thead><tbody>";
    
    $granTotal = 0;
    foreach ($clientes as $c) {
        $stmt = $pdo->prepare("SELECT * FROM clientes WHERE id = ?"); $stmt->execute([$c['id']]); $cli = $stmt->fetch(PDO::FETCH_ASSOC);
        if(!$cli) continue;

        $base = (float)($modo === 'budget' ? $cli['ingreso_budget'] : $cli['ingreso_real']);
        $v1_id = $cli["{$modo}_v1_id"] ?? ''; $v1_p = $cli["{$modo}_v1_precio"] ?? '';
        $v2_id = $cli["{$modo}_v2_id"] ?? ''; $v2_p = $cli["{$modo}_v2_precio"] ?? '';
        $v1_val = (float)$v1_p; $v2_val = (float)$v2_p;
        
        $totalBase = $base + $v1_val + $v2_val;
        $iva = $cli['tiene_iva'] ? $totalBase * 0.21 : 0;
        $irpf = $cli['tiene_irpf'] ? $totalBase * 0.15 : 0;
        $totalConIva = $totalBase - $iva; 
        $granTotal += $totalConIva;

        $dataIva = $cli['tiene_iva'] ? '1' : '0';
        $dataIrpf = $cli['tiene_irpf'] ? '1' : '0';

        echo "<tr id='row_{$modo}_{$cli['id']}' data-iva='$dataIva' data-irpf='$dataIrpf'>";
        echo "<td><strong style='color:var(--primary-pastel)'>" . h($cli['nombre']) . "</strong></td>";
        echo "<td>" . number_format($base, 2) . "€</td>";
        
        echo "<td><div class='input-group input-group-sm' style='min-width:200px;'><select class='form-select input-save border-secondary' data-cid='{$cli['id']}' data-col='{$modo}_v1_id' onchange=\"calculoVisualIngresos({$cli['id']}, 'pref_{$modo}')\"><option value=''>-- Catálogo --</option>";
        foreach($catIngresos as $cat) { $sel = ($v1_id == $cat['id']) ? 'selected' : ''; echo "<option value='{$cat['id']}' data-precio='{$cat['precio_defecto']}' $sel>" . h($cat['nombre']) . "</option>"; }
        echo "</select><input type='number' step='0.01' class='form-control input-save text-end border-secondary' data-cid='{$cli['id']}' data-col='{$modo}_v1_precio' value='{$v1_p}' onchange=\"calculoVisualIngresos({$cli['id']}, 'pref_{$modo}')\"></div></td>";

        echo "<td><div class='input-group input-group-sm' style='min-width:200px;'><select class='form-select input-save border-secondary' data-cid='{$cli['id']}' data-col='{$modo}_v2_id' onchange=\"calculoVisualIngresos({$cli['id']}, 'pref_{$modo}')\"><option value=''>-- Catálogo --</option>";
        foreach($catIngresos as $cat) { $sel = ($v2_id == $cat['id']) ? 'selected' : ''; echo "<option value='{$cat['id']}' data-precio='{$cat['precio_defecto']}' $sel>" . h($cat['nombre']) . "</option>"; }
        echo "</select><input type='number' step='0.01' class='form-control input-save text-end border-secondary' data-cid='{$cli['id']}' data-col='{$modo}_v2_precio' value='{$v2_p}' onchange=\"calculoVisualIngresos({$cli['id']}, 'pref_{$modo}')\"></div></td>";

        echo "<td><span class='badge " . ($cli['tiene_iva'] ? 'bg-success' : 'bg-secondary') . "'>IVA</span> <span class='badge " . ($cli['tiene_irpf'] ? 'bg-warning text-dark' : 'bg-secondary') . "'>IRPF <span id='col_irpf_{$modo}_{$cli['id']}'>" . ($irpf>0 ? "-".number_format($irpf,2)."€" : "-") . "</span></span></td>";
        echo "<td class='fw-bold' id='col_total_iva_{$modo}_{$cli['id']}'>" . number_format($totalConIva, 2) . "€</td>";
        echo "</tr>";
    }
    echo "</tbody><tfoot style='background:rgba(255,255,255,0.05)'><tr><th colspan='5' class='text-end'>TOTAL " . strtoupper($modo) . ":</th><th class='text-success fs-5' id='footer_total_ingreso_$modo'>" . number_format($granTotal, 2) . "€</th></tr></tfoot></table></div>";
    echo "<div class='text-end mt-3'><button class='btn btn-success fw-bold' onclick=\"guardarTablaIngresos('$modo')\">💾 Guardar Tabla</button></div>";
}

function renderFilaCosteHTML($g, $catalogo, $modo) {
    $catCostes = array_filter($catalogo, function($c) { return $c['tipo'] === 'coste'; });
    $id = $g['id'] ?? ''; $concepto = $g['concepto'] ?? ''; $precio = $g['precio'] ?? '';
    $tiene_iva = !empty($g['tiene_iva']) ? 'checked' : '';
    $iva_val = !empty($g['tiene_iva']) ? '-' . number_format((float)$precio * 0.21, 2) . '€' : '-';

    $html = "<tr class='fila-gasto-libre'><input type='hidden' class='gasto-id' value='$id'>";
    $html .= "<td><div class='input-group input-group-sm'><input type='text' class='form-control gasto-concepto border-secondary' value='" . h($concepto) . "' placeholder='Concepto'><select class='form-select border-secondary' style='max-width:130px;' onchange='rellenarConcepto(this)'><option value=''>Catálogo</option>";
    foreach($catCostes as $cat) { $html .= "<option value='" . h($cat['nombre']) . "' data-precio='{$cat['precio_defecto']}'>" . h($cat['nombre']) . "</option>"; }
    $html .= "</select></div></td>";
    $html .= "<td><input type='number' step='0.01' class='form-control form-control-sm gasto-precio text-end border-secondary' value='$precio' onchange=\"recalcularTotalCostes('$modo')\"></td>";
    $html .= "<td><div class='form-check d-flex justify-content-center'><input class='form-check-input gasto-check-iva border-secondary' type='checkbox' $tiene_iva onchange=\"recalcularTotalCostes('$modo')\"></div></td>";
    $html .= "<td><input type='text' class='form-control form-control-sm gasto-iva-valor text-muted text-end border-secondary' readonly value='$iva_val' style='background:transparent'></td>";
    $html .= "<td><button class='btn btn-sm btn-outline-danger border-0' onclick='this.closest(\"tr\").remove(); recalcularTotalCostes(\"$modo\")'>🗑️</button></td></tr>";
    return $html;
}

function renderTablaCostesLibres($pdo, $modo, $mes, $catalogo) {
    $stmt = $pdo->prepare("SELECT * FROM finanzas_gastos_libres WHERE mes = ? AND tipo = ?"); $stmt->execute([$mes, $modo]); $gastos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<div class='table-responsive'><table class='table table-sm table-hover align-middle mb-0' id='table_coste_$modo'>";
    echo "<thead><tr><th>Concepto del Gasto</th><th style='width:120px;'>Precio (€)</th><th style='width:80px;' class='text-center'>+ IVA</th><th style='width:100px;'>Valor IVA</th><th style='width:40px;'></th></tr></thead><tbody>";
    
    $total = 0;
    foreach($gastos as $g) {
        echo renderFilaCosteHTML($g, $catalogo, $modo);
        $p = (float)$g['precio'];
        $total += $p - ($g['tiene_iva'] ? $p * 0.21 : 0);
    }
    if(empty($gastos)) echo renderFilaCosteHTML([], $catalogo, $modo);

    echo "</tbody><tfoot style='background:rgba(255,255,255,0.05)'><tr><th colspan='4' class='text-end'>TOTAL C/IVA:</th><th colspan='2' class='text-danger fs-5' id='footer_total_coste_$modo'>" . number_format($total, 2) . "€</th></tr></tfoot></table></div>";
    echo "<div class='d-flex justify-content-between mt-3 px-2 pb-2'><button class='btn btn-sm btn-outline-primary fw-bold' onclick=\"agregarFilaCoste('$modo')\">➕ Añadir Fila</button><button class='btn btn-danger fw-bold' onclick=\"guardarTablaCostes('$modo', '$mes')\">💾 Guardar Gastos</button></div>";
}
?>
<?php 
// --- LOGIN ---
if (!isset($_SESSION['admin_logged'])) { ?>
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login</title><style>
body { margin: 0; padding: 0; background-color: #11111b; color: #cdd6f4; font-family: sans-serif; } 
/* Fondo responsivo */
.login-container { 
    min-height: 100vh; display: flex; align-items: center; justify-content: center; 
    background-color: #11111b;
    background-image: url('3.png?v=<?php echo time(); ?>'); 
    background-size: cover; background-position: center; background-repeat: no-repeat;
}
@media (min-width: 768px) {
    .login-container {
        background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('fondo-pc.png?v=<?php echo time(); ?>'); 
    }
}
.card { background-color: #1e1e2e; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); width: 320px; border: 1px solid #313244; } 
input { width: 100%; padding: 10px; margin-bottom: 10px; background: #313244; border: 1px solid #45475a; color: white; border-radius: 6px; box-sizing: border-box; } 
button { width: 100%; padding: 10px; background: #89b4fa; border: none; border-radius: 6px; color: #11111b; font-weight: bold; cursor: pointer; } 
button:hover { background: #b4befe; } 
.error { color: #f38ba8; font-size: 0.9em; text-align: center; margin-bottom: 10px; }
        /* ========================================= */
        /* CSS NUEVO: NOTIFICACIONES CHAT VISUALES   */
        /* ========================================= */
        @keyframes pulse-chat {
            0% { box-shadow: 0 0 0 0 rgba(243, 139, 168, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(243, 139, 168, 0); }
            100% { box-shadow: 0 0 0 0 rgba(243, 139, 168, 0); }
        }
        .chat-pulsing {
            animation: pulse-chat 1.5s infinite;
            border-radius: 8px;
            color: var(--danger-pastel) !important;
            font-weight: bold !important;
        }
        .toast-container { z-index: 9999; }
        .chat-toast { background-color: #1e1e2e; border: 1px solid #45475a; color: #cdd6f4; }
        .chat-toast-header { background-color: #181825; border-bottom: 1px solid #45475a; color: var(--primary-pastel); }

</style></head><body>
<div class="login-container">
    <div class="card">
        <h2 style="text-align:center; margin-top:0; color: #89b4fa;">NEBULA LOGIN</h2>
        <?php if(isset($error)) echo "<div class='error'>".h($error)."</div>"; ?>
        <form method="POST">
            <input type="text" name="user" placeholder="Usuario" required>
            <input type="password" name="pass" placeholder="Contraseña" required>
            <button type="submit" name="login_admin">Entrar</button>
        </form>
    </div>
</div>
</body></html>
<?php exit; } ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nebula Dashboard</title>
    
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#11111b">
    <link rel="apple-touch-icon" href="1.png">

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src='https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js'></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <style>
        ::placeholder, :-ms-input-placeholder, ::-ms-input-placeholder { color: #ffffff !important; opacity: 0.95 !important; font-weight: 600; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
        :root { --bg-dark: #11111b; --bg-card: #1e1e2e; --bg-input: #313244; --text-main: #cdd6f4; --text-muted: #a6adc8; --border-color: #45475a; --primary-pastel: #89b4fa; --success-pastel: #a6e3a1; --warning-pastel: #f9e2af; --danger-pastel: #f38ba8; --secondary-pastel: #bac2de; }
        body { background-color: var(--bg-dark) !important; color: var(--text-main); font-family: 'Segoe UI', system-ui, sans-serif; }
        .card, .modal-content { background-color: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); box-shadow: none; }
        .bg-light { background-color: var(--bg-card) !important; color: var(--text-main) !important; }
        .bg-white { background-color: #181825 !important; color: var(--text-main); }
        .text-dark { color: var(--text-main) !important; } .text-muted { color: var(--text-muted) !important; }
        .table { color: var(--text-main); border-color: var(--border-color); }
        .table thead th { background-color: #181825; color: var(--primary-pastel); border-bottom: 2px solid var(--border-color); font-size: 0.85em; }
        .table-striped tbody tr:nth-of-type(odd) { background-color: rgba(255,255,255,0.02); }
        .table td, .table th { border-color: var(--border-color); vertical-align: middle; white-space: nowrap; }
        .form-control, .form-select { background-color: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-main); }
        .form-control:focus, .form-select:focus { background-color: var(--bg-input); border-color: var(--primary-pastel); color: white; box-shadow: none; }
        .navbar { background-color: #181825 !important; border-bottom: 1px solid var(--border-color); }
        .nav-tabs .nav-link { color: var(--text-muted); border: none; border-bottom: 2px solid transparent; }
        .nav-tabs .nav-link.active { background-color: transparent; color: var(--primary-pastel); border-bottom: 2px solid var(--primary-pastel); font-weight: bold; }
        .nav-tabs { border-bottom: 1px solid var(--border-color); }
        .btn-primary { background-color: var(--primary-pastel); border: none; color: #11111b; font-weight: 600; }
        .btn-success { background-color: var(--success-pastel); border: none; color: #11111b; }
        .btn-danger { background-color: var(--danger-pastel); border: none; color: #11111b; }
        .btn-secondary { background-color: var(--secondary-pastel); border:none; color: #11111b; }
        .badge.bg-warning { background-color: var(--warning-pastel) !important; color: #11111b !important; }
        .badge.bg-success { background-color: var(--success-pastel) !important; color: #11111b !important; }
        .badge.bg-info { background-color: var(--primary-pastel) !important; color: #11111b !important; }
        .badge.bg-secondary { background-color: var(--border-color) !important; color: var(--text-main) !important; }
        .social-box { max-height: 200px; overflow-y: auto; background-color: #181825; border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; }
        .check-container { background: #313244; border: 1px solid #45475a; border-radius: 8px; padding: 10px; margin-bottom: 15px; }
        
        .fc-daygrid-day-frame { overflow: hidden !important; }
        .fc-daygrid-event-harness { max-width: 100% !important; overflow: hidden !important; }
        .fc-event { max-width: 100% !important; overflow: hidden !important; white-space: nowrap !important; }
        .fc-event-main { display: block !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; width: 100%; padding: 2px 4px; }
        .fc-event-title { display: inline !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
        .fc-event-time { display: inline-block !important; overflow: visible !important; margin-right: 4px !important; font-weight: 900 !important; }
        .fc-daygrid-block-event { border: none !important; margin-bottom: 2px !important; }

        .calendar-light-wrapper { background-color: #ffffff !important; border-radius: 8px; border: 1px solid #dee2e6; color: #212529 !important; }
        #calendarAdmin { --fc-page-bg-color: #ffffff; --fc-neutral-bg-color: #f8f9fa; --fc-neutral-text-color: #212529; --fc-border-color: #dee2e6; --fc-today-bg-color: rgba(137, 180, 250, 0.15); font-family: 'Segoe UI', sans-serif; }
        #calendarAdmin .fc-toolbar-title { color: #212529 !important; font-weight: bold; font-size: 1.2rem; }
        #calendarAdmin .fc-button-primary { background-color: var(--primary-pastel) !important; color: #11111b !important; border: none; font-weight: bold; }
        #calendarAdmin .fc-button-primary:hover { background-color: #b4befe !important; }
        #calendarAdmin .fc-button-active { background-color: var(--success-pastel) !important; color: #11111b !important; }
        #calendarAdmin .fc-col-header-cell-cushion { color: #495057 !important; font-weight: bold; text-decoration: none; }
        #calendarAdmin .fc-daygrid-day-number { color: #495057 !important; text-decoration: none; font-weight: bold; }
        #calendarAdmin .fc-event-main { font-weight: bold; color: #11111b !important; }
        #calendarAdmin .fc-list-day-cushion { background-color: #f8f9fa !important; color: #212529 !important; font-weight: bold; }
        #calendarAdmin .fc-list-event-title { color: #212529 !important; }
        #calendarAdmin .fc-list-event-time { color: #6c757d !important; }
        
        .task-card { border-left: 4px solid var(--primary-pastel); transition: transform 0.1s; }
        .task-card:active { transform: scale(0.98); }

        .chat-burbuja { padding: 10px 15px; border-radius: 12px; margin-bottom: 10px; width: fit-content; max-width: 85%; word-wrap: break-word; }
        .chat-empleado { background-color: rgba(137, 180, 250, 0.1); border-left: 4px solid var(--primary-pastel); } 
        .chat-admin { background-color: rgba(249, 226, 175, 0.1); border-left: 4px solid var(--warning-pastel); } 
        .chat-superadmin { background-color: rgba(243, 139, 168, 0.1); border-left: 4px solid var(--danger-pastel); } 
        .chat-fecha { font-size: 0.65em; color: var(--text-muted); float: right; margin-left: 15px; margin-top: 5px; }
        .mention-item:hover { background-color: var(--bg-input); color: var(--primary-pastel); }

        /* BLOQUEO DE SELECCIÓN EN EL BOTÓN GRABAR PARA APPLE (ADMIN) */
        #btnGrabarAudio {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            touch-action: none;
        }
        
        /* MATA-BOOTSTRAP: Forzar placeholders claritos sí o sí */
        .form-control::placeholder,
        .form-select::placeholder,
        input::placeholder, 
        textarea::placeholder,
        ::-webkit-input-placeholder {
            color: #e6e9ef !important; /* Un gris casi blanco súper legible */
            opacity: 1 !important;
            font-weight: 500 !important;
        }
    </style>
</head>
<body>
<nav class="navbar px-3 d-flex justify-content-between">
    <span class="navbar-brand mb-0 h1 fw-bold" style="color: var(--primary-pastel);">Nebula Panel <span class="text-muted fw-light"></span> 
        <?php if($_SESSION['rol'] === 'superadmin') echo '<span class="badge bg-warning ms-2" style="font-size:0.7em">Propietario</span>'; else echo '<span class="badge bg-secondary ms-2" style="font-size:0.7em">ADMIN</span>'; ?>
    </span>
    <div>
        <button class="btn btn-sm btn-outline-info me-2 fw-bold" data-bs-toggle="modal" data-bs-target="#modalBuscadorGlobal">🔍 Buscar (Ctrl+K)</button>
        <button id="btnInstallApp" class="btn btn-sm btn-outline-success me-2 fw-bold">⬇️ Instalar App</button>
        
        <div class="dropdown d-inline-block me-2">
            <button class="btn btn-sm btn-outline-light fw-bold dropdown-toggle" type="button" id="btnMensajesPendientes" data-bs-toggle="dropdown" aria-expanded="false">
                💬 Pendientes <span id="badgeChatGlobal" class="badge bg-danger d-none">0</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow" aria-labelledby="btnMensajesPendientes" id="listaMensajesDropdown" style="width: 300px; max-height: 400px; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--border-color);">
                <li><span class="dropdown-item text-muted small text-center">No hay mensajes nuevos</span></li>
            </ul>
        </div>
        
        <button id="btnNotif" class="btn btn-sm btn-outline-warning me-2 fw-bold" onclick="pedirPermisoNotificaciones()">🔔 Activar Notificaciones</button>
            <a href="?logout" class="btn btn-sm btn-outline-danger">Salir</a>
    </div>
</nav>

<div class="container-fluid mt-4 px-4">
    <?php if($success): ?>
        <div class='alert alert-success alert-dismissible fade show' style="background:var(--success-pastel); color:#11111b; border:none;">
            <?= h($success) ?><button type='button' class='btn-close' data-bs-dismiss='alert'></button>
        </div>
    <?php endif; ?>
    <?php if($error): ?>
        <div class='alert alert-danger alert-dismissible fade show' style="background:var(--danger-pastel); color:#11111b; border:none;">
            <?= h($error) ?><button type='button' class='btn-close' data-bs-dismiss='alert'></button>
        </div>
    <?php endif; ?>
    
    <?php $badgeAprob = ($countAprobaciones > 0) ? "<span class='badge bg-danger ms-1'>$countAprobaciones</span>" : ""; ?>
    
    <ul class="nav nav-tabs mb-4" id="adminTab" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#empleados">👥 Equipo</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#chat_vivo">💬 Chat <span id="chatBadgeAdmin" class="badge bg-danger rounded-circle d-none ms-1" style="font-size:0.6em; padding:4px 6px;">NUEVO</span></button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#calendario">📅 Calendario</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#clientes">🏢 Clientes</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#marca">🎨 Estrategia</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tareas">📋 Tareas</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#mis_tareas">📌 Mis Asignaciones <span id="badgeMisTareas" class="badge bg-danger rounded-circle d-none ms-1" style="font-size:0.6em; padding:4px 6px;">0</span></button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#aprobaciones" style="color:var(--warning-pastel)">⚠️ Aprobaciones <?= $badgeAprob ?></button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabNotasAdmin">📝 Notas</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#seguridad" style="color:var(--danger-pastel)">🔐 Credenciales</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#apps" style="color:var(--primary-pastel)">🚀 Apps</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#stats">📊 Stats</button></li>
        <?php if($_SESSION['rol'] === 'superadmin'): ?>
            <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#facturacion" style="color:var(--success-pastel); font-weight:bold;">💸 Facturación</button></li>
        <?php endif; ?>
    </ul>
    
    <div class="tab-content" style="min-height: 500px;">
        <div class="tab-pane fade show active" id="empleados">
            <div class="row">
                <div class="col-md-3">
                    <div class="card p-3 mb-3">
                        <h6 class="fw-bold mb-3" style="color:var(--primary-pastel)">Nuevo Usuario</h6>
                        <form method="POST">
                            <input type="text" name="nombre" class="form-control mb-2" placeholder="Nombre Real" required>
                            <input type="text" name="usuario" class="form-control mb-3" placeholder="Usuario Login" required>
                            <?php if($_SESSION['rol'] === 'superadmin'): ?>
                            <div class="form-check form-switch mb-3 p-2 border rounded" style="border-color:var(--border-color)!important">
                                <input class="form-check-input ms-0 me-2" type="checkbox" name="es_admin_check" id="esAdminSwitch">
                                <label class="form-check-label fw-bold small" for="esAdminSwitch">¿Es Administrador?</label>
                            </div>
                            <?php endif; ?>
                            <button type="submit" name="crear_usuario" class="btn btn-primary w-100">Crear</button>
                        </form>
                    </div>
                </div>
                <div class="col-md-9">
                    <div class="table-responsive card p-0">
                        <table class="table table-hover mb-0 align-middle">
                            <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Clave/PIN</th><th>Acciones</th></tr></thead>
                            <tbody>
                            <?php 
                            if($_SESSION['rol'] === 'superadmin') { 
                                $sql = "SELECT * FROM usuarios WHERE rol != 'superadmin' ORDER BY rol ASC, nombre ASC"; 
                            } else { 
                                $sql = "SELECT * FROM usuarios WHERE rol = 'empleado' ORDER BY nombre ASC"; 
                            } 
                            $stmt = $pdo->query($sql); 
                            while ($row = $stmt->fetch()) { 
                                $rolBadge = $row['rol'] === 'admin' ? '<span class="badge bg-secondary text-dark">ADMIN</span>' : '<span class="badge bg-info">EMPLEADO</span>'; 
                                echo "<tr>
                                        <td>".h($row['nombre'])."</td>
                                        <td>".h($row['usuario'])."</td>
                                        <td>$rolBadge</td>
                                        <td><span class='badge bg-warning'>".h($row['pin_generado'])."</span></td>
                                        <td>
                                            <button class='btn btn-sm btn-secondary me-1' onclick=\"abrirModalEditarEmp({$row['id']}, '".h($row['nombre'])."', '".h($row['usuario'])."')\">✏️</button> 
                                            <a href='?borrar_emp={$row['id']}' class='btn btn-sm btn-outline-danger' onclick=\"return confirm('¿Borrar?');\">🗑️</a>
                                        </td>
                                      </tr>"; 
                            } 
                            ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-pane fade" id="chat_vivo">
            <h4 class="mb-3 border-bottom border-secondary pb-2" style="color:var(--primary-pastel)">Chat del Equipo</h4>
            <div class="card p-3 d-flex flex-column" style="height: 65vh; border: 1px solid var(--border-color);">
                <div id="chatCaja" class="flex-grow-1 overflow-auto mb-3 p-3 rounded" style="background-color: #181825; border: 1px solid #313244;">
                    <div class="text-center text-muted mt-5"><div class="spinner-border spinner-border-sm"></div> Cargando chat...</div>
                </div>
                <form id="formChat" class="d-flex gap-2" onsubmit="enviarMensajeChat(event)">
                    <select id="chatReceptorAdmin" class="form-select border-secondary" style="width: 140px; background-color: var(--bg-input); color: white;" onchange="cambiarSalaChat()">
                        <option value="global">🌍 Global</option>
                        <?php foreach($usuariosGlobal as $u): if($u['id'] != $_SESSION['admin_id']): ?>
                            <option value="<?= $u['id'] ?>">👤 <?= h($u['nombre']) ?></option>
                        <?php endif; endforeach; ?>
                    </select>
                    <div class="position-relative flex-grow-1">
                        <div id="mentionBox" class="d-none position-absolute w-100 border border-secondary rounded shadow-lg" style="bottom: 110%; left: 0; max-height: 150px; overflow-y: auto; z-index: 1000; background-color: #1e1e2e;"></div>
                        <input type="text" id="inputChat" class="form-control w-100" placeholder="Escribe o etiqueta con @..." autocomplete="off">
                    </div>
                    <button type="button" id="btnGrabarAudio" class="btn btn-danger fw-bold px-3" title="Mantén pulsado para grabar">🎤</button>
                    <button type="submit" class="btn btn-primary fw-bold px-4">Enviar</button>
                </form>
            </div>
        </div>
        
        <div class="tab-pane fade" id="calendario">
            <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2" style="min-width: 250px;">
                    <label class="text-muted fw-bold small">🔍 Filtrar:</label>
                    <select id="calendarClientFilter" class="form-select border-secondary">
                        <option value="all">Todos los clientes</option>
                        <?php foreach($clientesGlobal as $c) echo "<option value='".h($c['id'])."'>".h($c['nombre'])."</option>"; ?>
                    </select>
                </div>
                <button class="btn btn-primary fw-bold" data-bs-toggle="modal" data-bs-target="#modalCrearTareaCal">➕ Crear Tarea</button>
            </div>
            <div class="card p-3 calendar-light-wrapper">
                <div id='calendarAdmin'></div>
            </div>
        </div>
        
        <div class="tab-pane fade" id="clientes">
            <div class="row">
                <div class="col-md-4">
                    <div class="card p-3 mb-3">
                        <h6 class="mb-3" style="color:var(--primary-pastel)">Nuevo Cliente</h6>
                        <form method="POST">
                            <input type="text" name="nombre_cliente" class="form-control mb-2" placeholder="Nombre" required>
                            <input type="text" name="telefono" class="form-control mb-2" placeholder="Teléfono" required>
                            <input type="text" name="ubicacion" class="form-control mb-2" placeholder="Ubicación" required>
                            <textarea name="descripcion" class="form-control mb-2" placeholder="Descripción" rows="2"></textarea>
                            <div class="check-container">
                                <div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" name="es_activo" id="checkActivo" checked><label class="form-check-label fw-bold text-success" for="checkActivo">En Activo</label></div>
                                <div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="es_potencial" id="checkPotencial"><label class="form-check-label fw-bold text-warning" for="checkPotencial">Es Potencial</label></div>
                                <hr class="border-secondary my-2">
                                <div class="form-check form-switch mb-1"><input class="form-check-input" type="checkbox" name="tiene_iva" id="checkIva" checked><label class="form-check-label small" for="checkIva">Aplica IVA (21%)</label></div>
                                <div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="tiene_irpf" id="checkIrpf" checked><label class="form-check-label small" for="checkIrpf">Aplica Retención (15%)</label></div>
                            </div>
                            <div class="row g-2 mb-3">
                                <div class="col-6"><label class="small text-muted">Ingreso Budget</label><input type="number" step="0.01" name="ing_budget" id="new_cli_ib" class="form-control form-control-sm"></div>
                                <div class="col-6"><label class="small text-muted">Ingreso Real</label><input type="number" step="0.01" name="ing_real" id="new_cli_ir" class="form-control form-control-sm"></div>
                                <div class="col-6"><label class="small text-muted">Coste Budget</label><input type="number" step="0.01" name="cost_budget" id="new_cli_cb" class="form-control form-control-sm"></div>
                                <div class="col-6"><label class="small text-muted">Coste Real</label><input type="number" step="0.01" name="cost_real" id="new_cli_cr" class="form-control form-control-sm"></div>
                            </div>
                            <h6 class="small mt-3 fw-bold text-muted">Redes</h6>
                            <?php renderSocialInputs('new'); ?>
                            <button type="submit" name="crear_cliente" class="btn btn-success w-100 mt-3">Guardar</button>
                        </form>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="mb-3"><input type="text" id="buscadorClientes" class="form-control" placeholder="🔍 Buscar cliente..."></div>
                    <div class="table-responsive card p-0">
                        <table class="table table-hover mb-0 align-middle" id="tablaClientes">
                            <thead><tr><th>Nombre</th><th>Estado</th><th>Info</th><th>Acciones</th></tr></thead>
                            <tbody>
                                <?php 
                                $cliStmt = $pdo->query("SELECT * FROM clientes ORDER BY id DESC"); 
                                while($c = $cliStmt->fetch()): 
                                    $status = $c['es_activo'] ? '<span class="badge bg-success">ACTIVO</span>' : '<span class="badge bg-secondary">INACTIVO</span>'; 
                                    if($c['es_potencial']) $status .= ' <span class="badge bg-warning text-dark">POTENCIAL</span>'; 
                                    
                                    // BLOQUEO SEGURIDAD: Quitamos credenciales para el F12
                                    $clienteSeguro = $c; 
                                    unset($clienteSeguro['credenciales']);
                                ?>
                                <tr>
                                    <td><strong><?= h($c['nombre']) ?></strong></td>
                                    <td><?= $status ?></td>
                                    <td><small class="text-muted"><?= h($c['telefono']) ?><br><?= h($c['direccion']) ?></small></td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary me-1" 
                                            onclick='abrirModalEditarCliente(<?= htmlspecialchars(json_encode($clienteSeguro), ENT_QUOTES, "UTF-8") ?>)'>
                                            ✏️
                                        </button>
                                        <?php if($_SESSION['rol'] === 'superadmin' || $_SESSION['rol'] === 'admin'): ?>
                                            <a href="?borrar_cli=<?= $c['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('¿Seguro?');">🗑️</a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-pane fade" id="marca">
            <div class="row">
                <div class="col-md-3">
                    <h5 class="mb-3" style="color:var(--primary-pastel)">Cliente</h5>
                    <div class="list-group" id="listaClientesMarca">
                        <?php foreach($clientesGlobal as $cli): ?>
                            <a href="#" class="list-group-item list-group-item-action" onclick="cargarMarca(<?= $cli['id'] ?>, this)"><?= h($cli['nombre']) ?></a>
                        <?php endforeach; ?>
                    </div>
                </div>
                <div class="col-md-9 d-none" id="panelMarca">
                    <form method="POST" id="formMarca">
                        <input type="hidden" name="marca_cliente_id" id="marca_cliente_id">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card p-3 mb-3">
                                    <h6 class="fw-bold text-muted">Identidad Visual</h6>
                                    <label class="small fw-bold text-muted">Logos (URLs)</label>
                                    <div id="containerLogos">
                                        <input type="text" name="logos[]" class="form-control form-control-sm mb-1" placeholder="URL Logo Principal">
                                        <input type="text" name="logos[]" class="form-control form-control-sm mb-1" placeholder="URL Logo Secundario">
                                        <input type="text" name="logos[]" class="form-control form-control-sm mb-1" placeholder="URL Logo Alternativo">
                                    </div>
                                    <label class="small fw-bold mt-2 text-muted">Colores Corporativos</label>
                                    <div id="containerColores">
                                        <?php for($i=0; $i<4; $i++): ?>
                                        <div class="d-flex gap-2 mb-1 align-items-center">
                                            <input type="color" class="form-control form-control-color" value="#000000" onchange="this.nextElementSibling.value=this.value">
                                            <input type="text" name="colores[]" class="form-control form-control-sm" placeholder="#000000">
                                        </div>
                                        <?php endfor; ?>
                                    </div>
                                    <label class="small fw-bold mt-2 text-muted">Tipografías</label>
                                    <div id="containerFuentes">
                                        <input type="text" name="tipografias[]" class="form-control form-control-sm mb-1" placeholder="Ej: Montserrat (Títulos)">
                                        <input type="text" name="tipografias[]" class="form-control form-control-sm mb-1" placeholder="Ej: Open Sans (Cuerpo)">
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card p-3 mb-3">
                                    <h6 class="fw-bold" style="color:var(--primary-pastel)">➕ Nueva Estrategia</h6>
                                    <select name="obj_tipo" class="form-select form-select-sm mb-2"><option value="mensual">📅 Objetivo Mensual</option><option value="evento">🎉 Evento Especial</option></select>
                                    <input type="text" name="obj_titulo" class="form-control form-control-sm mb-2" placeholder="Título">
                                    <input type="date" name="obj_fecha" class="form-control form-control-sm mb-2" value="<?= date('Y-m-d') ?>">
                                    <textarea name="obj_desc" class="form-control form-control-sm mb-2" rows="4" placeholder="Detalles de la estrategia..."></textarea>
                                </div>
                            </div>
                        </div>
                        <h6 class="border-bottom pb-2 border-secondary text-muted">Historial de Estrategia</h6>
                        <div id="listaObjetivos" class="table-responsive card p-0 mb-3"><table class="table table-sm table-hover mb-0"><thead><tr><th>Fecha</th><th>Tipo</th><th>Título</th><th></th></tr></thead><tbody id="tbodyObjetivos"></tbody></table></div>
                        <div class="d-grid"><button type="submit" name="guardar_marca" class="btn btn-success">Guardar Estrategia de Marca</button></div>
                    </form>
                </div>
            </div>
        </div>

        <div class="tab-pane fade" id="tareas">
            <div class="row">
                <div class="col-md-4">
                    <div class="card p-3 mb-3">
                        <h5 class="mb-3" style="color:var(--primary-pastel)">Crear Tarea</h5>
                        <form method="POST">
                            <div class="mb-2">
                                <select name="tarea_cliente_id" class="form-select" required>
                                    <option value="">-- Cliente --</option>
                                    <?php foreach($clientesGlobal as $c) echo "<option value='".h($c['id'])."'>".h($c['nombre'])."</option>"; ?>
                                </select>
                            </div>
                            <div class="mb-2">
                                <label class="small text-muted mb-1 fw-bold">Tipo de contenido</label>
                                <div class="d-flex gap-2 flex-wrap border border-secondary rounded p-2" style="background: var(--bg-input);">
                                    <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="" id="tc_nada" checked><label class="form-check-label small" for="tc_nada">Ninguno</label></div>
                                    <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="story" id="tc_story"><label class="form-check-label small" for="tc_story">📱 Story</label></div>
                                    <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="reel" id="tc_reel"><label class="form-check-label small" for="tc_reel">🎬 Reel</label></div>
                                    <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="publicacion" id="tc_publi"><label class="form-check-label small" for="tc_publi">🖼️ Publi</label></div>
                                </div>
                            </div>
                            <div class="mb-2"><input type="text" name="tarea_titulo" class="form-control" required placeholder="Título breve de la tarea"></div>
                            <div class="mb-2"><textarea name="tarea_desc" class="form-control" rows="2" required placeholder="Descripción completa"></textarea></div>
                            <div class="row">
                                <div class="col-6 mb-2">
                                    <select name="tarea_prioridad" class="form-select">
                                        <option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                                    </select>
                                </div>
                                <div class="col-6 mb-2"><input type="date" name="tarea_fecha" class="form-control" required></div>
                            </div>
                            <div class="mb-2"><input type="time" name="tarea_hora" class="form-control"></div>
                            <div class="mb-2 p-2 border rounded border-secondary">
                                <div class="form-check form-switch mb-2">
                                    <input class="form-check-input" type="checkbox" name="tarea_recurrente" id="checkRecurrente" onchange="document.getElementById('diasRecurrencia').classList.toggle('d-none', !this.checked)">
                                    <label class="form-check-label small text-muted fw-bold" for="checkRecurrente">¿Es recurrente?</label>
                                </div>
                                <div id="diasRecurrencia" class="d-none">
                                    <label class="small text-muted mb-1">Días de reseteo:</label>
                                    <div class="d-flex flex-wrap gap-2">
                                        <label class="small"><input type="checkbox" name="dias_rec[]" value="1"> L</label><label class="small"><input type="checkbox" name="dias_rec[]" value="2"> M</label>
                                        <label class="small"><input type="checkbox" name="dias_rec[]" value="3"> X</label><label class="small"><input type="checkbox" name="dias_rec[]" value="4"> J</label>
                                        <label class="small"><input type="checkbox" name="dias_rec[]" value="5"> V</label><label class="small"><input type="checkbox" name="dias_rec[]" value="6"> S</label>
                                        <label class="small"><input type="checkbox" name="dias_rec[]" value="7"> D</label>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <select name="asignados[]" class="form-select select-multiple" multiple required size="3">
                                    <?php foreach($usuariosGlobal as $e) echo "<option value='".h($e['id'])."'>".h($e['nombre'])."</option>"; ?>
                                </select>
                            </div>
                            <button type="submit" name="crear_tarea" class="btn btn-primary w-100">Crear Tarea</button>
                        </form>
                    </div>
                </div>
                
                <div class="col-md-8">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="mb-0">Listado</h5>
                        <button class="btn btn-sm btn-success fw-bold" data-bs-toggle="modal" data-bs-target="#modalExportarTareas">⬇️ Exportar Excel</button>
                    </div>
                    <div class="mb-2"><input type="text" id="buscadorTareas" class="form-control" placeholder="🔍 Buscar por texto..."></div>
                    <div class="card p-2 mb-3">
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                            <div class="btn-group btn-group-sm">
                            <button type="button" class="btn btn-secondary active filtro-estado-btn" onclick="filtrarTareasAvanzado('all', this)">Todos</button>
                            <button type="button" class="btn btn-secondary filtro-estado-btn" onclick="filtrarTareasAvanzado('pendiente', this)">Pendientes</button>
                            <button type="button" class="btn btn-secondary filtro-estado-btn" onclick="filtrarTareasAvanzado('proceso', this)">Proceso</button>
                            <button type="button" class="btn btn-secondary filtro-estado-btn" onclick="filtrarTareasAvanzado('espera_aprobacion', this)">Aprobación</button>
                            <button type="button" class="btn btn-secondary filtro-estado-btn" onclick="filtrarTareasAvanzado('terminada', this)">Hechas</button>
                            <button type="button" class="btn btn-secondary filtro-estado-btn" onclick="filtrarTareasAvanzado('rechazada', this)">Rechazadas</button>
                            </div>

                        </div>
                        <div class="d-flex gap-2">
                            <select id="filtroClienteTabla" class="form-select form-select-sm border-secondary" style="background: var(--bg-input);" onchange="ejecutarFiltroDom()">
                                <option value="all">🏢 Todos los Clientes</option>
                                <?php foreach($clientesGlobal as $c) echo "<option value='".h($c['nombre'])."'>".h($c['nombre'])."</option>"; ?>
                            </select>
                            <select id="filtroEquipoTabla" class="form-select form-select-sm border-secondary" style="background: var(--bg-input);" onchange="ejecutarFiltroDom()">
                                <option value="all">👥 Todo el Equipo</option>
                                <?php foreach($usuariosGlobal as $u) echo "<option value='".h($u['nombre'])."'>".h($u['nombre'])."</option>"; ?>
                            </select>
                        </div>
                    </div>
                    
                    <div class="table-responsive card p-0">
                        <table class="table table-hover mb-0 align-middle" id="tablaTareasAdmin">
                            <thead><tr><th>Cliente</th><th>Tarea</th><th>Estado</th><th>Límite</th><th>Equipo</th></tr></thead>
                            <tbody>
                                <?php 
                                $sql = "SELECT t.*, c.nombre as cliente, (SELECT GROUP_CONCAT(u.nombre SEPARATOR ', ') FROM tarea_empleado te JOIN usuarios u ON te.usuario_id = u.id WHERE te.tarea_id = t.id) as empleados, (SELECT GROUP_CONCAT(u.id SEPARATOR ',') FROM tarea_empleado te JOIN usuarios u ON te.usuario_id = u.id WHERE te.tarea_id = t.id) as empleados_ids FROM tareas t LEFT JOIN clientes c ON t.cliente_id = c.id ORDER BY t.fecha_limite ASC"; 
                                foreach($pdo->query($sql) as $t): 
                                    $esVencida = ($t['fecha_limite'] < date('Y-m-d H:i:s') && $t['estado'] != 'terminada' && $t['estado'] != 'rechazada' && $t['estado'] != 'espera_aprobacion'); 
                                    $colPrio = match($t['prioridad']) { 'urgente'=>'#f38ba8', 'alta'=>'#fab387', 'media'=>'#f9e2af', 'baja'=>'#a6e3a1' }; 
                                    $bg = match($t['estado']) { 'pendiente'=>'bg-warning', 'proceso'=>'bg-info', 'espera_aprobacion'=>'bg-primary', 'terminada'=>'bg-success', 'rechazada'=>'bg-danger', 'aprobada'=>'bg-success', default=>'bg-secondary' }; 
                                    $descSegura = h(str_replace(["\r", "\n"], ['\n', ''], addslashes($t['descripcion']))); 
                                    $titSeguro = h($t['titulo'] ?? 'Sin título'); 
                                ?>
                                <tr data-estado="<?= $t['estado'] ?>" data-cliente="<?= h($t['cliente'] ?? '') ?>" data-equipo="<?= h($t['empleados'] ?? '') ?>" <?= ($t['estado'] === 'terminada' || $t['estado'] === 'rechazada') ? 'style="display:none;"' : '' ?>>
                                    <td><span style="color:var(--primary-pastel)"><?= h($t['cliente']) ?></span></td>
                                    <td>
                                        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:<?=$colPrio?>;margin-right:5px;"></span> 
                                        <span style="cursor:pointer;" class="text-decoration-underline" onclick="alert('📝 DESCRIPCIÓN:\n\n<?= $descSegura ?>')"><strong><?= $titSeguro ?></strong></span> 
                                        <button class="btn btn-sm btn-outline-primary border-0 p-0 ms-2" 
                                         onclick='abrirModalEditarTarea(<?= htmlspecialchars(json_encode($t), ENT_QUOTES, "UTF-8") ?>)'>
                                        ✏️
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary border-0 p-0 ms-2" onclick="verLogs(<?= $t['id'] ?>)">📜</button> 
                                        <a href="?borrar_tarea=<?= $t['id'] ?>" class="btn btn-sm btn-outline-danger border-0 p-0 ms-1" onclick="return confirm('¿Borrar?');">🗑️</a> 
                                        <?php if($esVencida) echo ' <span class="badge bg-danger">VENCIDA</span>'; ?>
                                    </td>
                                    <td><span class="badge <?= $bg ?>"><?= $t['estado'] ?></span></td>
                                    <td><small class="text-muted"><?= date("d/m H:i", strtotime($t['fecha_limite'])) ?></small></td>
                                    <td><small class="text-muted"><?= h($t['empleados']) ?: '-' ?></small></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="tab-pane fade" id="mis_tareas">
            <h4 class="mb-4 border-bottom border-secondary pb-2" style="color:var(--primary-pastel)">Mis Tareas Asignadas</h4>
            <div class="row">
                <?php 
                $misTareasStmt = $pdo->prepare("SELECT t.*, c.nombre as cliente_nombre FROM tareas t JOIN tarea_empleado te ON t.id = te.tarea_id LEFT JOIN clientes c ON t.cliente_id = c.id WHERE te.usuario_id = ? AND t.estado IN ('pendiente', 'proceso', 'espera_aprobacion', 'rechazada', 'aprobada') ORDER BY t.fecha_limite ASC");
                $misTareasStmt->execute([$_SESSION['admin_id']]);
                $misTareas = $misTareasStmt->fetchAll();
                
                if(empty($misTareas)): ?>
                    <div class="col-12"><div class="alert bg-secondary text-light border-0 text-center">🎉 No tienes tareas pendientes.</div></div>
                <?php else: foreach($misTareas as $mt): 
                    $prioColor = match($mt['prioridad']) { 'urgente'=>'var(--danger-pastel)', 'alta'=>'#fab387', 'media'=>'var(--warning-pastel)', 'baja'=>'var(--success-pastel)' };
                    $estadoTxt = match($mt['estado']) { 'pendiente'=>'🟡 Pendiente', 'proceso'=>'🔵 En Proceso', 'espera_aprobacion'=>'✋ Esperando Aprob.', 'rechazada'=>'❌ Rechazada', 'aprobada'=>'🟢 Aprobada' };
                ?>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100 task-card" style="border-left: 4px solid <?= $prioColor ?>;">
                            <div class="card-body py-2">
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="badge bg-secondary text-light" style="font-size:0.7rem"><?= $estadoTxt ?></span>
                                    <small class="text-muted">📅 <?= date('d/m H:i', strtotime($mt['fecha_limite'])) ?></small>
                                </div>
                                <h6 class="card-title mb-1 fw-bold" style="color:var(--text-main)"><?= h($mt['cliente_nombre'] ?? 'Uso Interno') ?></h6>
                                <p class="card-text small text-primary mb-2 fw-bold text-truncate" title="<?= h($mt['titulo'] ?? 'Sin título') ?>"><?= h($mt['titulo'] ?? 'Sin título') ?></p>
                                
                                <?php if($mt['estado'] === 'rechazada' && !empty($mt['mensaje_jefe'])): ?>
                                    <div class="alert alert-danger p-1 small mb-2 text-center border-0"><strong>Motivo Rechazo:</strong> <?= linkify($mt['mensaje_jefe']) ?></div>
                                <?php endif; ?>

                                <button class="btn btn-sm btn-outline-light w-100 py-1" type="button" data-bs-toggle="collapse" data-bs-target="#accMiTarea<?= $mt['id'] ?>">Cambiar Estado ⬇️</button>
                                
                                <div class="collapse mt-2" id="accMiTarea<?= $mt['id'] ?>">
                                    <form method="POST" class="p-2 rounded border border-secondary" style="background:var(--bg-input)">
                                        <input type="hidden" name="mi_tarea_id" value="<?= $mt['id'] ?>">
                                        <select name="mi_tarea_estado" class="form-select form-select-sm mb-2" onchange="document.getElementById('msgDiv<?= $mt['id'] ?>').classList.toggle('d-none', this.value !== 'espera_aprobacion')">
                                            <option value="pendiente" <?= $mt['estado']=='pendiente'?'selected':'' ?>>🟡 Pendiente</option>
                                            <option value="proceso" <?= $mt['estado']=='proceso'?'selected':'' ?>>🔵 En Proceso</option>
                                            <option value="espera_aprobacion" <?= $mt['estado']=='espera_aprobacion'?'selected':'' ?>>✋ Solicitar Aprobación</option>
                                            <option value="aprobada" <?= $mt['estado']=='aprobada'?'selected':'' ?> hidden>🟢 Aprobada (Lista para cerrar)</option>
                                            <option value="terminada">✅ Terminada</option>
                                        </select>
                                        <div id="msgDiv<?= $mt['id'] ?>" class="<?= $mt['estado']=='espera_aprobacion'?'':'d-none' ?> mb-2">
                                            <textarea name="mi_tarea_msg" class="form-control form-control-sm" rows="2" placeholder="Nota de aprobación (opcional)..."><?= h($mt['mensaje_empleado']??'') ?></textarea>
                                        </div>
                                        <button type="submit" name="update_mi_tarea" class="btn btn-success btn-sm w-100">Guardar</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; endif; ?>
            </div>
        </div>

        <div class="tab-pane fade" id="aprobaciones">
            <div class="row" id="contenedorAprobaciones">
                <?php 
                $pendientes = $pdo->query("SELECT t.*, c.nombre as cliente, (SELECT GROUP_CONCAT(u.nombre SEPARATOR ', ') FROM tarea_empleado te JOIN usuarios u ON te.usuario_id = u.id WHERE te.tarea_id = t.id) as empleados FROM tareas t JOIN clientes c ON t.cliente_id = c.id WHERE t.estado = 'espera_aprobacion'")->fetchAll(); 
                if(empty($pendientes)): ?>
                    <div class="col-12"><div class="alert alert-success" style="background:var(--success-pastel); color:#11111b; border:none;">¡Todo al día!</div></div>
                <?php else: foreach($pendientes as $p): ?>
                    <div class="col-md-6 mb-3">
                        <div class="card border-warning shadow-sm" style="border-color:var(--warning-pastel)!important">
                            <div class="card-header d-flex justify-content-between" style="background:rgba(249, 226, 175, 0.1); color:var(--warning-pastel)">
                                <strong><?= h($p['cliente']) ?></strong><span>Esperando</span>
                            </div>
                            <div class="card-body">
                                <h6 class="card-title"><?= h($p['titulo'] ?? 'Sin título') ?></h6>
                                <p class="small text-muted mb-2">Responsables: <strong><?= h($p['empleados']) ?></strong></p>
                                <div class="p-2 rounded mb-3" style="background:#313244">
                                    <small class="fw-bold" style="color:var(--primary-pastel)">Nota:</small><br><?= linkify($p['mensaje_empleado']) ?>
                                    
                        <?php 
                            if (preg_match('/(https?:\/\/[^\s]+uploads\/pruebas\/[^\s]+)/i', $p['mensaje_empleado'] ?? '', $matches)) {
                            echo "<div class='mt-2'><a href='{$matches[1]}' target='_blank' class='btn btn-sm btn-outline-info'><i class='bi bi-image'></i> Ver Foto de Prueba</a></div>";
                        }
                            ?>

                                </div>
                                <div class="d-flex gap-2">
                                    <form method="POST" class="w-50">
                                        <input type="hidden" name="id_tarea" value="<?= $p['id'] ?>">
                                        <button type="submit" name="aprobar_tarea" class="btn btn-success w-100">Aprobar</button>
                                    </form>
                                    <button class="btn btn-danger w-50" type="button" data-bs-toggle="collapse" data-bs-target="#rechazo-<?= $p['id'] ?>">Rechazar</button>
                                </div>
                                <div class="collapse mt-2" id="rechazo-<?= $p['id'] ?>">
                                    <form method="POST" class="card card-body p-2">
                                        <input type="hidden" name="id_tarea" value="<?= $p['id'] ?>">
                                        <label class="small fw-bold mb-1">Motivo:</label>
                                        <textarea name="motivo_rechazo" class="form-control form-control-sm mb-2" required></textarea>
                                        <button type="submit" name="rechazar_tarea" class="btn btn-secondary btn-sm w-100">Confirmar</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endforeach; endif; ?>
            </div>
        </div>
        
        <div class="tab-pane fade" id="tabNotasAdmin">
            <h4 class="mb-3" style="color:var(--primary-pastel)">Notas Globales</h4>
            <div class="card p-3 mb-4">
                <form method="POST">
                    <textarea name="nota_texto" class="form-control mb-2" placeholder="Añadir una nota o aviso para todo el equipo..." rows="2" required></textarea>
                    <div class="d-flex justify-content-end"><button type="submit" name="crear_nota_admin" class="btn btn-primary">Publicar Nota</button></div>
                </form>
            </div>
            <div class="row">
                <?php 
                try {
                    $notas = $pdo->query("SELECT n.*, u.nombre as autor FROM notas_globales n JOIN usuarios u ON n.usuario_id = u.id ORDER BY n.fecha_creacion DESC")->fetchAll();
                    if(empty($notas)) echo '<div class="col-12"><p class="text-muted text-center">No hay notas publicadas.</p></div>';
                    foreach($notas as $n): ?>
                        <div class="col-md-4 mb-3">
                            <div class="card h-100 border-secondary">
                                <div class="card-header d-flex justify-content-between align-items-center py-1 bg-dark border-secondary">
                                    <small class="text-primary fw-bold"><?= h($n['autor']) ?></small>
                                    <form method="POST" class="m-0 p-0" onsubmit="return confirm('¿Seguro que deseas borrar esta nota?');">
                                        <input type="hidden" name="nota_id" value="<?= $n['id'] ?>">
                                        <button type="submit" name="borrar_nota_btn" class="btn btn-link text-danger p-0 m-0 text-decoration-none fs-5" style="line-height: 1;">&times;</button>
                                    </form>
                                </div>
                                <div class="card-body py-2 small text-light">
                                    <?= linkify($n['contenido']) ?>
                                    <div class="text-end mt-2"><small class="text-muted" style="font-size:0.8em"><?= date('d/m/Y H:i', strtotime($n['fecha_creacion'])) ?></small></div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; 
                } catch (Exception $e) { echo '<div class="col-12"><div class="alert alert-warning">Por favor, asegúrate de crear la tabla <strong>notas_globales</strong> en tu base de datos SQL.</div></div>'; }
                ?>
            </div>
        </div>

        <div class="tab-pane fade" id="seguridad">
            <div id="pantallaBloqueo" class="d-flex justify-content-center align-items-center" style="height: 400px;">
                <div class="card p-4 text-center" style="width: 300px;">
                    <h4>🔐 Restringido</h4><p class="small text-muted">PIN Requerido</p>
                    <input type="password" id="inputPinSeguridad" class="form-control mb-3 text-center fs-5" placeholder="****">
                    <button onclick="verificarPin()" class="btn btn-danger w-100">Desbloquear</button>
                    <div id="errorPin" class="text-danger mt-2 small d-none">Error</div>
                </div>
            </div>
            <div id="contenidoSeguro" class="d-none">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 style="color:var(--danger-pastel)">Credenciales</h4>
                    <button onclick="bloquearDeNuevo()" class="btn btn-outline-secondary btn-sm">🔒 Bloquear</button>
                </div>
                <div class="input-group mb-3"><span class="input-group-text">🔎</span><input type="text" id="buscadorCredenciales" class="form-control" placeholder="Buscar cliente..."></div>
                
                <div class="accordion" id="accordionCredenciales">
                    <?php foreach($clientesGlobal as $cli): ?>
                    <div class="accordion-item item-credencial">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse<?= $cli['id'] ?>">
                                <?= h($cli['nombre']) ?>
                                <span class="badge bg-secondary ms-2" id="badge-cred-<?= $cli['id'] ?>">Protegido 🔒</span>
                            </button>
                        </h2>
                        <div id="collapse<?= $cli['id'] ?>" class="accordion-collapse collapse" data-bs-parent="#accordionCredenciales">
                            <div class="accordion-body" id="body-cred-<?= $cli['id'] ?>">
                                <p class="text-muted text-center mb-0">Introduce el PIN arriba para desencriptar los datos.</p>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

            </div>
        </div>
        
        <div class="tab-pane fade" id="apps">
            <h4 class="mb-4 text-center">Herramientas y Links Rápidos</h4>
            <div class="row g-3">
                <div class="col-6 col-md-3"><a href="https://www.instagram.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #E1306C !important; border-color:var(--border-color)!important"><strong class="text-light">Instagram</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://www.canva.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #00C4CC !important; border-color:var(--border-color)!important"><strong class="text-light">Canva</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://metricool.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #FF5A5F !important; border-color:var(--border-color)!important"><strong class="text-light">Metricool</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://drive.google.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #1FA463 !important; border-color:var(--border-color)!important"><strong class="text-light">Google Drive</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://chatgpt.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #10A37F !important; border-color:var(--border-color)!important"><strong class="text-light">ChatGPT</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://www.capcut.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #FFFFFF !important; border-color:var(--border-color)!important"><strong class="text-light">CapCut</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://www.textstudio.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #FF0000 !important; border-color:var(--border-color)!important"><strong class="text-light">TextStudio</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://www.renderforest.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #5A32FA !important; border-color:var(--border-color)!important"><strong class="text-light">Renderforest</strong></a></div>
                <div class="col-6 col-md-3"><a href="https://hpanel.hostinger.com" target="_blank" class="card text-decoration-none h-100 border text-center p-3" style="border-left: 4px solid #673DE6 !important; border-color:var(--border-color)!important"><strong class="text-light">Hostinger</strong></a></div>
            </div>
        </div>

        <div class="tab-pane fade" id="stats">
            <h4 class="mb-4">Total Tareas: <strong style="color:var(--primary-pastel)"><?= $totalTareas ?></strong></h4>
            
            <div class="row">
                <?php if(empty($statsClientes)): ?><p class="text-muted">Sin datos.</p><?php else: foreach($statsClientes as $cid => $datos): 
                    $aprob = $datos['aprobadas'] ?? 0;
                    $rechaz = $datos['rechazadas'] ?? 0;
                    $totalRev = $aprob + $rechaz;
                    $pctAprob = $totalRev > 0 ? round(($aprob / $totalRev) * 100) : 0;
                    $pctRechaz = $totalRev > 0 ? round(($rechaz / $totalRev) * 100) : 0;
                ?>
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-header fw-bold border-bottom border-secondary" style="background-color:rgba(137, 180, 250, 0.1); color:var(--primary-pastel)"><?= h($datos['nombre']) ?></div>
                        <div class="card-body p-3 d-flex flex-column">
                            <ul class="list-group list-group-flush small mb-3 border-bottom border-secondary pb-2">
                                <li class="list-group-item d-flex justify-content-between">Pendientes <span class="badge bg-warning text-dark"><?= $datos['datos']['pendiente']??0 ?></span></li>
                                <li class="list-group-item d-flex justify-content-between">Proceso <span class="badge bg-info text-dark"><?= $datos['datos']['proceso']??0 ?></span></li>
                                <li class="list-group-item d-flex justify-content-between">Hechas <span class="badge bg-success"><?= $datos['datos']['terminada']??0 ?></span></li>
                            </ul>
                            
                            <div class="mb-3 px-1">
                                <label class="small fw-bold text-muted mb-1 d-block text-center">Tasa de Aprobación</label>
                                <div class="d-flex justify-content-between text-center fw-bold small mb-1" style="font-size: 0.75rem;">
                                    <span style="color:var(--success-pastel)">✅ <?= $aprob ?> (<?= $pctAprob ?>%)</span>
                                    <span style="color:var(--danger-pastel)">❌ <?= $rechaz ?> (<?= $pctRechaz ?>%)</span>
                                </div>
                                <div class="progress" style="height: 6px; background-color: var(--bg-dark);">
                                    <div class="progress-bar" style="width: <?= $pctAprob ?>%; background-color: var(--success-pastel);"></div>
                                    <div class="progress-bar" style="width: <?= $pctRechaz ?>%; background-color: var(--danger-pastel);"></div>
                                </div>
                            </div>

                            <div class="p-2 rounded mt-auto" style="background:var(--bg-input)">
                                <label class="small fw-bold text-muted">⏱️ Tiempo Medio (Hechas)</label>
                                <input type="month" class="form-control form-control-sm mt-1 mb-2 stats-month-input" data-cid="<?= $cid ?>" value="<?= date('Y-m') ?>" onchange="calcularTiempo(this, <?= $cid ?>)">

                                <div class="small text-center fw-bold text-light" id="avg-result-<?= $cid ?>">--</div>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endforeach; endif; ?>
            </div>
        </div>

        <?php if($_SESSION['rol'] === 'superadmin'): ?>
        <div class="tab-pane fade" id="facturacion">
            <div class="d-flex justify-content-between align-items-center mb-4"><h4 class="mb-0 text-success">Control Financiero</h4><form method="GET" class="d-flex align-items-center"><button type="button" class="btn btn-primary btn-sm me-3" onclick="new bootstrap.Modal(document.getElementById('modalCatalogo')).show()">📚 Catálogo</button><label class="me-2 text-muted">Mes:</label><input type="month" name="mes_facturacion" class="form-control form-control-sm" value="<?= $mesFacturacion ?>" onchange="this.form.submit()"><button type="button" class="btn btn-sm btn-secondary ms-2" onclick="window.location.href='dashboard-GES.php'">Hoy</button></form></div>
            <ul class="nav nav-tabs mb-3" id="factTabs">
                <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#factGeneral">General</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#factIngBudget">Budget Ingresos</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#factIngReal">Ingresos Reales</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#factCostBudget">Budget Costes</button></li>
                <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#factCostReal">Costes Reales</button></li>
            </ul>

            <div class="tab-content border border-top-0 p-3 bg-card rounded-bottom">
                <div class="tab-pane fade show active" id="factGeneral">
                    <div class="card p-3 border-success">
                        <h5 class="fw-bold text-success mb-3 text-center">📈 Curva de Rentabilidad Financiera</h5>
                        <canvas id="rentabilidadChart" height="80"></canvas>
                    </div>
                </div>

                <div class="tab-pane fade" id="factIngBudget"><div class="card p-0 border-warning"><div class="card-header bg-warning text-dark fw-bold text-center">BUDGET (Presupuesto)</div><div class="p-2"><?php renderTablaIngresos($pdo, 'budget', $clientesGlobal, $catalogoServicios); ?></div></div></div>
                <div class="tab-pane fade" id="factIngReal"><div class="card p-0 border-success"><div class="card-header bg-success text-dark fw-bold text-center">REAL</div><div class="p-2"><?php renderTablaIngresos($pdo, 'real', $clientesGlobal, $catalogoServicios); ?></div></div></div>
                <div class="tab-pane fade" id="factCostBudget"><div class="card p-0 border-warning"><div class="card-header bg-warning text-dark fw-bold text-center">BUDGET (Presupuesto)</div><div class="p-2"><?php renderTablaCostesLibres($pdo, 'budget', $mesFacturacion, $catalogoServicios); ?></div></div></div>
                <div class="tab-pane fade" id="factCostReal"><div class="card p-0 border-danger"><div class="card-header bg-danger text-dark fw-bold text-center">REAL</div><div class="p-2"><?php renderTablaCostesLibres($pdo, 'real', $mesFacturacion, $catalogoServicios); ?></div></div></div>
            </div>
        </div>
        <?php endif; ?>
    </div> 
</div>
<div class="modal fade" id="modalExportarTareas" tabindex="-1">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header border-secondary">
                <h5 class="modal-title text-success">Exportar a Excel</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form action="?ajax_action=exportar_excel_tareas" method="POST">
                    <div class="mb-3">
                        <label class="small text-muted fw-bold mb-1">1. Selecciona el Cliente</label>
                        <select name="export_cliente" class="form-select border-secondary">
                            <option value="all">🏢 Todos los Clientes</option>
                            <?php foreach($clientesGlobal as $c) echo "<option value='".h($c['id'])."'>".h($c['nombre'])."</option>"; ?>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="small text-muted fw-bold mb-1">2. Rango de Tiempo</label>
                        <select name="export_rango" class="form-select border-secondary">
                            <option value="all">📅 Histórico Completo</option>
                            <option value="week">📅 Última Semana</option>
                            <option value="month">📅 Último Mes</option>
                            <option value="year">📅 Último Año</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-success w-100 fw-bold" onclick="setTimeout(()=> { bootstrap.Modal.getInstance(document.getElementById('modalExportarTareas')).hide(); }, 1500);">⬇️ Descargar Archivo .XLS</button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="modalCrearTareaCal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header border-secondary"><h5 class="modal-title" style="color:var(--primary-pastel)">Nueva Tarea (Calendario)</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
                <form method="POST">
                    <div class="mb-2"><select name="tarea_cliente_id" class="form-select" required><option value="">-- Cliente --</option><?php foreach($clientesGlobal as $c) echo "<option value='".h($c['id'])."'>".h($c['nombre'])."</option>"; ?></select></div>
                    <div class="mb-2">
                        <label class="small text-muted mb-1 fw-bold">Tipo de contenido</label>
                        <div class="d-flex gap-2 flex-wrap border border-secondary rounded p-2" style="background: var(--bg-input);">
                            <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="" id="tc_nada_cal" checked><label class="form-check-label small" for="tc_nada_cal">Ninguno</label></div>
                            <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="story" id="tc_story_cal"><label class="form-check-label small" for="tc_story_cal">📱 Story</label></div>
                            <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="reel" id="tc_reel_cal"><label class="form-check-label small" for="tc_reel_cal">🎬 Reel</label></div>
                            <div class="form-check"><input class="form-check-input" type="radio" name="tarea_tipo_contenido" value="publicacion" id="tc_publi_cal"><label class="form-check-label small" for="tc_publi_cal">🖼️ Publi</label></div>
                        </div>
                    </div>
                    <div class="mb-2"><input type="text" name="tarea_titulo" class="form-control" required placeholder="Título breve de la tarea"></div>
                    <div class="mb-2"><textarea name="tarea_desc" class="form-control" rows="2" required placeholder="Descripción completa"></textarea></div>
                    <div class="row"><div class="col-6 mb-2"><select name="tarea_prioridad" class="form-select"><option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></div><div class="col-6 mb-2"><input type="date" name="tarea_fecha" class="form-control" required></div></div>
                    <div class="mb-2"><input type="time" name="tarea_hora" class="form-control"></div>
                    <div class="mb-2 p-2 border rounded border-secondary"><div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" name="tarea_recurrente" id="checkRecurrenteCal" onchange="document.getElementById('diasRecurrenciaCal').classList.toggle('d-none', !this.checked)"><label class="form-check-label small text-muted fw-bold" for="checkRecurrenteCal">¿Es recurrente?</label></div><div id="diasRecurrenciaCal" class="d-none"><label class="small text-muted mb-1">Días de reseteo:</label><div class="d-flex flex-wrap gap-2"><label class="small"><input type="checkbox" name="dias_rec[]" value="1"> L</label><label class="small"><input type="checkbox" name="dias_rec[]" value="2"> M</label><label class="small"><input type="checkbox" name="dias_rec[]" value="3"> X</label><label class="small"><input type="checkbox" name="dias_rec[]" value="4"> J</label><label class="small"><input type="checkbox" name="dias_rec[]" value="5"> V</label><label class="small"><input type="checkbox" name="dias_rec[]" value="6"> S</label><label class="small"><input type="checkbox" name="dias_rec[]" value="7"> D</label></div></div></div>
                    <div class="mb-3"><select name="asignados[]" class="form-select select-multiple" multiple required size="3"><?php foreach($usuariosGlobal as $e) echo "<option value='".h($e['id'])."'>".h($e['nombre'])."</option>"; ?></select></div>
                    <button type="submit" name="crear_tarea" class="btn btn-primary w-100">Crear Tarea</button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="modalEditarTarea" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header border-secondary">
                <h5 class="modal-title">Editar Tarea</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form method="POST">
                    <input type="hidden" name="edit_tarea_id" id="mod_tar_id">
                    <div class="mb-2">
                        <label class="small text-muted">Título</label>
                        <input type="text" name="edit_tarea_titulo" id="mod_tar_titulo" class="form-control" required>
                    </div>
                    <div class="mb-2">
                        <label class="small text-muted">Descripción</label>
                        <textarea name="edit_tarea_desc" id="mod_tar_desc" class="form-control" rows="3" required></textarea>
                    </div>
                    <div class="row">
                        <div class="col-6 mb-2">
                            <label class="small text-muted">Prioridad</label>
                            <select name="edit_tarea_prioridad" id="mod_tar_prio" class="form-select">
                                <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                            </select>
                        </div>
                        <div class="col-6 mb-2">
                            <label class="small text-muted">Fecha Límite</label>
                            <input type="date" name="edit_tarea_fecha" id="mod_tar_fecha" class="form-control" required>
                        </div>
                    </div>
                    
                    <div class="mb-2">
                        <label class="small text-muted">Estado de la tarea</label>
                        <select name="edit_tarea_estado" id="mod_tar_estado" class="form-select border-secondary" style="background: var(--bg-input);">
                            <option value="pendiente">🟡 Pendiente</option>
                            <option value="proceso">🔵 En Proceso</option>
                            <option value="espera_aprobacion">✋ Espera Aprobación</option>
                            <option value="aprobada">🟢 Aprobada</option>
                            <option value="terminada">✅ Terminada</option>
                            <option value="rechazada">❌ Rechazada</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="small text-muted">Hora Límite</label>
                        <input type="time" name="edit_tarea_hora" id="mod_tar_hora" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="small text-muted">Asignar a:</label>
                        <select name="edit_asignados[]" id="mod_tar_asignados" class="form-select select-multiple" multiple required size="3">
                            <?php foreach($usuariosGlobal as $e) echo "<option value='".h($e['id'])."'>".h($e['nombre'])."</option>"; ?>
                        </select>
                    </div>
                    <button type="submit" name="editar_tarea" class="btn btn-primary w-100">Guardar Cambios</button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="modalLogs" tabindex="-1"><div class="modal-dialog modal-dialog-scrollable"><div class="modal-content"><div class="modal-header border-secondary"><h5 class="modal-title">Historial</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body" id="cuerpoLogs"></div></div></div></div>
<div class="modal fade" id="modalEditarEmp" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header border-secondary"><h5 class="modal-title">Editar</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><form method="POST"><input type="hidden" name="id_empleado" id="mod_emp_id"><div class="mb-2"><label>Nombre</label><input type="text" name="edit_nombre" id="mod_emp_nom" class="form-control" required></div><div class="mb-3"><label>Usuario</label><input type="text" name="edit_usuario" id="mod_emp_user" class="form-control" required></div><button type="submit" name="editar_info_empleado" class="btn btn-primary w-100">Guardar</button></form><hr style="border-color:var(--border-color)"><form method="POST"><input type="hidden" name="id_empleado_pin" id="mod_emp_id_pin"><button type="submit" name="regenerar_pin" class="btn btn-secondary w-100">🔄 Nuevo PIN</button></form></div></div></div></div>
<div class="modal fade" id="modalEditarCli" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header border-secondary"><h5 class="modal-title">Editar Cliente</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><form method="POST"><div class="row"><div class="col-md-6"><input type="hidden" name="id_cliente" id="mod_cli_id"><div class="mb-2"><label>Nombre</label><input type="text" name="edit_cli_nombre" id="mod_cli_nom" class="form-control" required></div><div class="mb-2"><label>Teléfono</label><input type="text" name="edit_cli_telefono" id="mod_cli_tel" class="form-control" required></div><div class="mb-2"><label>Ubicación</label><input type="text" name="edit_cli_direccion" id="mod_cli_dir" class="form-control" required></div><div class="mb-3"><label>Descripción</label><textarea name="edit_cli_desc" id="mod_cli_desc" class="form-control" rows="3"></textarea></div><div class="check-container mb-3"><div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" name="edit_es_activo" id="mod_cli_activo"><label class="form-check-label fw-bold text-success" for="mod_cli_activo">En Activo</label></div><div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="edit_es_potencial" id="mod_cli_potencial"><label class="form-check-label fw-bold text-warning" for="mod_cli_potencial">Es Potencial</label></div><hr class="border-secondary my-2"><div class="form-check form-switch mb-1"><input class="form-check-input" type="checkbox" name="edit_tiene_iva" id="mod_cli_iva"><label class="form-check-label small" for="mod_cli_iva">Aplica IVA (21%)</label></div><div class="form-check form-switch"><input class="form-check-input" type="checkbox" name="edit_tiene_irpf" id="mod_cli_irpf"><label class="form-check-label small" for="mod_cli_irpf">Aplica Retención (15%)</label></div></div><div class="row g-2 mb-3"><div class="col-6"><label class="small text-muted">Ingreso Budget</label><input type="number" step="0.01" name="edit_ing_budget" id="mod_cli_ib" class="form-control form-control-sm"></div><div class="col-6"><label class="small text-muted">Ingreso Real</label><input type="number" step="0.01" name="edit_ing_real" id="mod_cli_ir" class="form-control form-control-sm"></div><div class="col-6"><label class="small text-muted">Coste Budget</label><input type="number" step="0.01" name="edit_cost_budget" id="mod_cli_cb" class="form-control form-control-sm"></div><div class="col-6"><label class="small text-muted">Coste Real</label><input type="number" step="0.01" name="edit_cost_real" id="mod_cli_cr" class="form-control form-control-sm"></div></div></div><div class="col-md-6"><h6 class="fw-bold text-muted">Credenciales</h6><?php renderSocialInputs('edit'); ?></div></div><button type="submit" name="editar_cliente_full" class="btn btn-primary w-100 mt-3">Guardar Cambios</button></form></div></div></div></div>
<div class="modal fade" id="modalCatalogo" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header border-secondary"><h5 class="modal-title">Catálogo de Servicios</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div><div class="modal-body"><form method="POST" class="mb-3 p-2 border border-secondary rounded"><h6 class="small fw-bold">Nuevo Elemento</h6><div class="input-group mb-2"><input type="text" name="cat_nombre" class="form-control form-control-sm" placeholder="Nombre (ej: Hosting)" required><input type="number" step="0.01" name="cat_precio" class="form-control form-control-sm" placeholder="Precio Defecto"></div><div class="mb-2"><select name="cat_tipo" class="form-select form-select-sm"><option value="ingreso">Ingreso</option><option value="coste">Coste</option></select></div><button type="submit" name="crear_item_catalogo" class="btn btn-sm btn-primary w-100">Añadir al Catálogo</button></form><hr><ul class="list-group"><?php foreach($catalogoServicios as $cs): ?><li class="list-group-item d-flex justify-content-between align-items-center small"><span><?= h($cs['nombre']) ?> (<?= h($cs['tipo']) ?>) - <?= h($cs['precio_defecto']) ?>€</span><a href="?borrar_catalogo=<?= $cs['id'] ?>" class="text-danger">×</a></li><?php endforeach; ?></ul></div></div></div></div>

<div class="modal fade" id="modalBuscadorGlobal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content" style="background: rgba(30,30,46,0.95); backdrop-filter: blur(10px); border: 1px solid var(--primary-pastel);">
            <div class="modal-body p-0">
                <input type="text" id="inputBuscadorGlobal" class="form-control form-control-lg border-0 text-light" style="background: transparent; font-size: 1.5rem; padding: 20px; box-shadow: none;" placeholder="Busca clientes o tareas... (Ctrl + K)">
                <div id="resultadosBuscadorGlobal" class="list-group list-group-flush border-top border-secondary" style="max-height: 400px; overflow-y: auto;"></div>
            </div>
        </div>
    </div>
</div>
<div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div id="chatToastWrapper"></div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
// ==========================================
// 1. UTILIDADES BÁSICAS Y OPTIMIZACIÓN
// ==========================================
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Variables Globales PHP a JS
const miUsuarioId = <?= $_SESSION['admin_id'] ?? 0 ?>;
const usuariosParaMencion = <?= json_encode($usuariosGlobal ?? []); ?>;

// ==========================================
// 2. CHAT EN VIVO, PRIVADOS, AUDIOS Y BORRADO
// ==========================================
let isChatTabActive = false;
let lastChatId = parseInt(localStorage.getItem('lastChatId_Admin')) || 0;

document.getElementById('inputChat')?.addEventListener('input', function(e) {
    const val = this.value;
    const cursorPos = this.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const mentionBox = document.getElementById('mentionBox');
    
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (match) {
        const query = match[1].toLowerCase();
        const filtered = usuariosParaMencion.filter(u => u.nombre.toLowerCase().replace(/\s+/g, '').includes(query) || u.nombre.toLowerCase().includes(query));

        if (filtered.length > 0) {
            let html = '';
            filtered.forEach(u => {
                let nomMencion = u.nombre.replace(/\s+/g, ''); 
                html += `<div class="p-2 border-bottom border-secondary mention-item" style="cursor:pointer; font-size:0.9em;" onclick="insertarMencion('${nomMencion}')">👤 ${u.nombre}</div>`;
            });
            mentionBox.innerHTML = html;
            mentionBox.classList.remove('d-none');
        } else {
            mentionBox.classList.add('d-none');
        }
    } else {
        mentionBox.classList.add('d-none');
    }
});

window.insertarMencion = function(nombreMencion) {
    const input = document.getElementById('inputChat');
    const val = input.value;
    const cursorPos = input.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const textAfterCursor = val.substring(cursorPos);

    const newTextBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_]*)$/, '@' + nombreMencion + ' ');
    input.value = newTextBefore + textAfterCursor;
    
    document.getElementById('mentionBox').classList.add('d-none');
    input.focus(); 
}

function cargarChat(autoScroll = false) {
    const receptor = document.getElementById('chatReceptorAdmin').value;
    fetch('?ajax_action=get_chat&receptor=' + receptor).then(r => r.json()).then(msgs => {
        const caja = document.getElementById('chatCaja');
        if(!caja) return;
        let html = msgs.length === 0 ? '<div class="text-center text-muted mt-5">No hay mensajes aún. ¡Rompe el hielo! 🧊</div>' : '';
        
        msgs.forEach(m => {
            let claseColor = m.rol === 'admin' ? 'chat-admin' : (m.rol === 'superadmin' ? 'chat-superadmin' : 'chat-empleado'); 
            let colorNombre = m.rol === 'admin' ? 'var(--warning-pastel)' : (m.rol === 'superadmin' ? 'var(--danger-pastel)' : 'var(--primary-pastel)');
            let d = new Date(m.fecha);
            let hora = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
            
            let contenidoFinal = '';

            // ¿Es un audio?
            if (m.mensaje && m.mensaje.startsWith('[AUDIO]')) {
                let rutaAudio = m.mensaje.replace('[AUDIO]', '');
                let rutaReal = rutaAudio.startsWith('http') ? rutaAudio : rutaAudio; 
                contenidoFinal = `<audio controls src="${rutaReal}" style="height: 35px; outline: none;"></audio>`;
            } else {
                // SEGURIDAD: Prevenir inyecciones XSS
                let msgText = m.mensaje;
                msgText = msgText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                
                const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
                msgText = msgText.replace(urlRegex, url => { let href = url.startsWith('http') ? url : 'http://' + url; return `<a href="${href}" target="_blank" class="text-info text-decoration-underline" style="word-break: break-all;">${url}</a>`; });
                contenidoFinal = msgText.replace(/@([a-zA-Z0-9_]+)/g, '<strong class="text-warning">@$1</strong>');
            }

            // Botón de borrar SOLO si el mensaje es nuestro
            let btnBorrar = '';
            if (parseInt(m.usuario_id) === parseInt(miUsuarioId)) {
                btnBorrar = `<button onclick="borrarMensajeChat(${m.id})" class="btn btn-sm btn-link text-danger p-0 ms-2 text-decoration-none" title="Borrar mensaje">🗑️</button>`;
            }

            html += `<div class="chat-burbuja ${claseColor}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div style="color:${colorNombre}; font-weight:bold; font-size:0.75em; margin-bottom:3px; text-transform:uppercase;">${m.nombre} <span class="text-muted" style="font-size:0.8em">(${m.rol})</span></div>
                            ${btnBorrar}
                        </div>
                        <div style="color:var(--text-main); font-size:0.9em;">${contenidoFinal} <span class="chat-fecha">${hora}</span></div>
                     </div>`;
        });
        
        const isAtBottom = caja.scrollHeight - caja.scrollTop <= caja.clientHeight + 50;
        caja.innerHTML = html;
        if (autoScroll || isAtBottom) caja.scrollTop = caja.scrollHeight;
    });
}

window.enviarMensajeChat = function(e) {
    if(e) e.preventDefault();
    const inp = document.getElementById('inputChat'); 
    const txt = inp.value.trim(); 
    if(!txt) return; 
    
    const receptor = document.getElementById('chatReceptorAdmin').value;
    const fd = new FormData(); fd.append('mensaje', txt); fd.append('receptor', receptor);
    inp.value = ''; 
    fetch('?ajax_action=send_chat', { method: 'POST', body: fd }).then(() => { 
        cargarChat(true); 
        if(typeof checkAdminChatNotifications === 'function') checkAdminChatNotifications(); 
    });
}

window.borrarMensajeChat = function(id) {
    if(!confirm('¿Seguro que quieres borrar este mensaje? Desaparecerá para todos.')) return;
    
    const fd = new FormData();
    fd.append('id', id);
    
    fetch('?ajax_action=delete_chat', { method: 'POST', body: fd })
    .then(r => r.json())
    .then(res => {
        if(res.status === 'ok') {
            cargarChat(false); 
        } else {
            alert('Error al borrar el mensaje o no tienes permisos.');
        }
    });
}

// --- SISTEMA DE GRABACIÓN DE AUDIO ---
let mediaRecorder;
let audioChunks = [];
let isRecordingRequested = false;
let recordStartTime = 0;
const btnGrabar = document.getElementById('btnGrabarAudio');

if (btnGrabar) {
    btnGrabar.addEventListener('contextmenu', e => e.preventDefault());

    btnGrabar.addEventListener('pointerdown', (e) => { 
        e.preventDefault(); 
        btnGrabar.setPointerCapture(e.pointerId);
        iniciarGrabacion(); 
    });
    
    btnGrabar.addEventListener('pointerup', (e) => { 
        e.preventDefault(); 
        btnGrabar.releasePointerCapture(e.pointerId);
        detenerGrabacion(false); 
    });
    
    btnGrabar.addEventListener('pointercancel', (e) => { 
        e.preventDefault(); 
        detenerGrabacion(true); 
    });
}

function iniciarGrabacion() {
    isRecordingRequested = true;
    
    btnGrabar.classList.remove('btn-danger');
    btnGrabar.classList.add('btn-warning');
    btnGrabar.innerHTML = '🎙️...';

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        if (!isRecordingRequested) {
            stream.getTracks().forEach(track => track.stop());
            restaurarBotonGrabar();
            return;
        }

        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        }

        mediaRecorder = new MediaRecorder(stream, options);
        audioChunks = [];
        recordStartTime = Date.now();

        mediaRecorder.addEventListener("dataavailable", event => {
            if(event.data.size > 0) audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
            let mimeType = mediaRecorder.mimeType || 'audio/webm';
            let extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            let duracionReal = Date.now() - recordStartTime;
            
            if (duracionReal < 1000 || isRecordingRequested === 'cancelado') {
                console.log("Audio descartado (muy corto o cancelado).");
            } else {
                const receptor = document.getElementById('chatReceptorAdmin').value;
                const fd = new FormData();
                fd.append('audio', audioBlob, `nota_de_voz.${extension}`);
                fd.append('receptor', receptor);
                
                fetch('?ajax_action=send_chat', { method: 'POST', body: fd })
                .then(() => { 
                    cargarChat(true); 
                    if(typeof checkAdminChatNotifications === 'function') checkAdminChatNotifications(); 
                });
            }
            
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            restaurarBotonGrabar();
        });

        mediaRecorder.start();
    }).catch(error => {
        alert("Permiso de micrófono denegado o no compatible.");
        restaurarBotonGrabar();
        isRecordingRequested = false;
    });
}

function detenerGrabacion(fueCancelado = false) {
    if (fueCancelado) {
        isRecordingRequested = 'cancelado';
    } else {
        isRecordingRequested = false;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    } else {
        restaurarBotonGrabar(); 
    }
}

function restaurarBotonGrabar() {
    btnGrabar.classList.remove('btn-warning');
    btnGrabar.classList.add('btn-danger');
    btnGrabar.innerHTML = '🎤';
}

// =========================================================
// NOTIFICACIONES VISUALES CHAT Y DESPLEGABLE (CORREGIDO)
// =========================================================
let lastChatIdAdmin = parseInt(localStorage.getItem('lastChatId_Admin')) || 0;
// Comprobamos si la pestaña de chat es la activa al cargar la página
let isChatTabActiveAdmin = (localStorage.getItem('activeDashboardTab') === '#chat_vivo'); 
let unreadChatCountAdmin = 0;
let unreadPerRoomAdmin = {}; 
// Ahora es un array de objetos para poder borrarlos limpiamente por sala
window.mensajesSinLeer = []; 

function mostrarToastChat(titulo, cuerpo) {
    const wrapper = document.getElementById('chatToastWrapper');
    if(!wrapper) return;
    const toastId = 'toast' + Date.now() + Math.floor(Math.random() * 100);
    const html = `
        <div id="${toastId}" class="toast chat-toast shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="6000">
            <div class="toast-header chat-toast-header">
                <strong class="me-auto fw-bold">💬 ${titulo}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body small text-light" style="background:#313244;">
                ${cuerpo}
            </div>
        </div>
    `;
    wrapper.insertAdjacentHTML('beforeend', html);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

function actualizarOpcionesSelectAdmin() {
    const select = document.getElementById('chatReceptorAdmin');
    if(!select) return;
    Array.from(select.options).forEach(opt => {
        let val = opt.value;
        let baseText = opt.text.split(' (🔴')[0]; 
        if (unreadPerRoomAdmin[val] && unreadPerRoomAdmin[val] > 0) {
            opt.text = `${baseText} (🔴 ${unreadPerRoomAdmin[val]})`;
        } else {
            opt.text = baseText;
        }
    });
}

function actualizarDesplegablePendientes() {
    const lista = document.getElementById('listaMensajesDropdown');
    const badge = document.getElementById('badgeChatGlobal');
    
    if(!lista) return;

    if (window.mensajesSinLeer.length === 0) {
        lista.innerHTML = '<li><span class="dropdown-item text-muted small text-center">No hay mensajes nuevos</span></li>';
        if(badge) badge.classList.add('d-none');
    } else {
        // Unimos el HTML de los objetos guardados
        let htmlConcat = window.mensajesSinLeer.map(m => m.html).reverse().join('');
        lista.innerHTML = htmlConcat;
        if(badge) {
            badge.textContent = unreadChatCountAdmin;
            badge.classList.remove('d-none');
        }
    }
}

window.irAlChat = function(roomKey) {
    const tabChat = new bootstrap.Tab(document.querySelector('button[data-bs-target="#chat_vivo"]'));
    tabChat.show();
    document.getElementById('chatReceptorAdmin').value = roomKey;
    cambiarSalaChat();
}

window.cambiarSalaChat = function() {
    let currentRoom = document.getElementById('chatReceptorAdmin').value;
    
    // 1. Limpiamos los contadores de la sala actual
    if(unreadPerRoomAdmin[currentRoom]) {
        unreadChatCountAdmin -= unreadPerRoomAdmin[currentRoom];
        if(unreadChatCountAdmin < 0) unreadChatCountAdmin = 0;
        unreadPerRoomAdmin[currentRoom] = 0;
    }
    
    // 2. Filtramos el array para borrar de arriba SOLO los de esta sala
    window.mensajesSinLeer = window.mensajesSinLeer.filter(msg => msg.room !== currentRoom);
    
    actualizarDesplegablePendientes();
    actualizarOpcionesSelectAdmin();
    actualizarLatidoYBadge();

    // 3. Cargamos la vista del chat
    cargarChat(true);
    
    // NOTA CLAVE: Ya NO hacemos la consulta fetch a chat_last_id aquí, 
    // porque eso machacaba el lastChatIdAdmin global y generaba el bug de duplicados.
}

function actualizarLatidoYBadge() {
    const badge = document.getElementById('chatBadgeAdmin');
    const tabBtn = document.querySelector('button[data-bs-target="#chat_vivo"]');
    
    if(unreadChatCountAdmin <= 0) {
        if(badge) { badge.classList.add('d-none'); badge.textContent = '0'; }
        if(tabBtn) tabBtn.classList.remove('chat-pulsing');
    } else {
        if(badge) {
            badge.classList.remove('d-none');
            badge.textContent = unreadChatCountAdmin;
        }
        if(tabBtn && !isChatTabActiveAdmin) tabBtn.classList.add('chat-pulsing');
    }
}

document.querySelector('button[data-bs-target="#chat_vivo"]')?.addEventListener('shown.bs.tab', () => {
    isChatTabActiveAdmin = true;
    cambiarSalaChat(); // Marca como leído si entras a una sala con notificaciones pendientes
});

document.querySelector('button[data-bs-target="#chat_vivo"]')?.addEventListener('hidden.bs.tab', () => {
    isChatTabActiveAdmin = false;
});

// Sincronización inicial estricta del ID Global
fetch(`dashboard-GES.php?ajax_action=chat_last_id_global`).then(r=>r.json()).then(d => {
    let serverMax = parseInt(d.last_id) || 0;
    let localMax = parseInt(localStorage.getItem('lastChatId_Admin')) || 0;
    // Siempre nos quedamos con el mayor para evitar retrocesos y notificaciones fantasma
    lastChatIdAdmin = Math.max(serverMax, localMax);
    localStorage.setItem('lastChatId_Admin', lastChatIdAdmin);
});

window.checkAdminChatNotifications = function() {
    fetch(`dashboard-GES.php?ajax_action=get_new_chats&last_id=` + lastChatIdAdmin)
    .then(r => r.json())
    .then(msgs => {
        if (msgs.length > 0) {
            let maxId = lastChatIdAdmin;
            let currentRoom = document.getElementById('chatReceptorAdmin') ? document.getElementById('chatReceptorAdmin').value : 'global';
            let isAnyNew = false;

            msgs.forEach(m => {
                if (parseInt(m.id) > maxId) maxId = parseInt(m.id);
                
                if (parseInt(m.usuario_id) !== parseInt(miUsuarioId)) {
                    let isGlobal = (m.receptor_id === null);
                    let roomKey = isGlobal ? 'global' : m.usuario_id.toString();
                    
                    if (isChatTabActiveAdmin && currentRoom === roomKey) {
                        // Si estás en la pestaña y en esa sala, simplemente renderizamos el mensaje nuevo
                        if (typeof cargarChat === 'function') cargarChat(false);
                    } else {
                        // ¡Mensaje para otra sala o no estás en la pestaña de chat!
                        isAnyNew = true;
                        unreadChatCountAdmin++;
                        unreadPerRoomAdmin[roomKey] = (unreadPerRoomAdmin[roomKey] || 0) + 1;
                        
                        let salaTxt = isGlobal ? 'Global' : 'Privado';
                        let tituloToast = `${m.nombre} (${salaTxt})`;
                        let txtBase = m.mensaje && m.mensaje.startsWith('[AUDIO]') ? "🎤 Ha enviado un mensaje de voz" : m.mensaje;
                        let txtSeguro = txtBase.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // XSS basico

                        // Guardamos como objeto para poder borrarlo fácil luego
                        window.mensajesSinLeer.push({
                            room: roomKey,
                            html: `
                            <li><a class="dropdown-item border-bottom border-secondary" href="#" onclick="irAlChat('${roomKey}')">
                                <div class="fw-bold" style="color:var(--primary-pastel)">${m.nombre} <span class="badge bg-secondary" style="font-size:0.6em">${salaTxt}</span></div>
                                <div class="small text-truncate text-light">${txtSeguro}</div>
                            </a></li>
                            `
                        });

                        mostrarToastChat(tituloToast, txtSeguro);
                        try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+Array(100).join('A')).play(); } catch(e){}
                    }
                }
            });

            // Actualizamos el tracker general
            lastChatIdAdmin = maxId;
            localStorage.setItem('lastChatId_Admin', lastChatIdAdmin);
            
            if (isAnyNew) {
                actualizarLatidoYBadge();
                actualizarOpcionesSelectAdmin();
                actualizarDesplegablePendientes();
            }
        }
    }).catch(()=>{});
}

setInterval(window.checkAdminChatNotifications, 3000);


// ==========================================
// 3. FILTROS AVANZADOS DE TAREAS
// ==========================================
window.estadoFiltroActual = 'all';

window.filtrarTareasAvanzado = function(estado, btn) {
    document.querySelectorAll('.filtro-estado-btn').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
    });
    
    if(btn) {
        btn.classList.remove('btn-secondary');
        btn.classList.add('active', 'btn-primary');
    }
    
    window.estadoFiltroActual = estado;
    window.ejecutarFiltroDom();
};

window.ejecutarFiltroDom = function() {
    let buscador = document.getElementById('buscadorTareas');
    let textoBuscar = buscador ? buscador.value.toLowerCase() : '';
    
    let filtroCli = document.getElementById('filtroClienteTabla');
    let clienteFiltro = filtroCli ? filtroCli.value : 'all';
    
    let filtroEq = document.getElementById('filtroEquipoTabla');
    let equipoFiltro = filtroEq ? filtroEq.value : 'all';

    let filas = document.querySelectorAll("#tablaTareasAdmin tbody tr");
    
    filas.forEach(row => {
        let estadoRow = row.getAttribute('data-estado') || '';
        let clienteRow = row.getAttribute('data-cliente') || '';
        let equipoRow = row.getAttribute('data-equipo') || '';
        let textoRow = row.textContent.toLowerCase();

        let pasaEstado = false;
        if (window.estadoFiltroActual === 'all') {
            pasaEstado = (estadoRow !== 'terminada' && estadoRow !== 'rechazada');
        } else {
            // Si el jefe filtra por 'proceso', mostramos también las 'aprobadas' para que no desaparezcan
            pasaEstado = (estadoRow === window.estadoFiltroActual) || (window.estadoFiltroActual === 'proceso' && estadoRow === 'aprobada');
        }



        let pasaCliente = (clienteFiltro === 'all' || clienteRow === clienteFiltro);
        let pasaEquipo = (equipoFiltro === 'all' || equipoRow.includes(equipoFiltro));
        let pasaTexto = (textoBuscar === '' || textoRow.includes(textoBuscar));

        if (pasaEstado && pasaCliente && pasaEquipo && pasaTexto) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

document.addEventListener('DOMContentLoaded', function() {
    let buscador = document.getElementById('buscadorTareas');
    if (buscador) {
        buscador.addEventListener('input', window.ejecutarFiltroDom);
    }
});

// ==========================================
// 4. FUNCIONES DE MODALES Y SEGURIDAD PIN
// ==========================================
function verificarPin() { 
    const pinVal = document.getElementById('inputPinSeguridad').value;
    const fd = new FormData(); fd.append('pin', pinVal);
    fetch('?ajax_action=verificar_pin', { method: 'POST', body: fd }).then(r => r.json()).then(data => {
        if(data.status === 'ok') {
            document.getElementById('pantallaBloqueo').classList.add('d-none'); 
            document.getElementById('contenidoSeguro').classList.remove('d-none'); 
            document.getElementById('errorPin').classList.add('d-none'); 
            
            // Inyectamos las claves blindadas
            if(data.data) {
                data.data.forEach(cli => {
                    const body = document.getElementById('body-cred-' + cli.id);
                    const badge = document.getElementById('badge-cred-' + cli.id);
                    if(!body) return;
                    
                    try {
                        const creds = cli.credenciales ? JSON.parse(cli.credenciales) : {};
                        let html = '<div class="row">';
                        let tiene = false;
                        for (const [key, val] of Object.entries(creds)) {
                            if(val.user || val.pass) {
                                tiene = true;
                                html += `<div class="col-md-4 mb-3"><div class="card h-100 border p-2"><div class="fw-bold small" style="color:var(--primary-pastel)">${key.toUpperCase()}</div><div class="small">`;
                                if(val.user) html += `<div class="mb-1">U: <span class="user-select-all">${val.user}</span></div>`;
                                if(val.pass) html += `<div>P: <code class="text-danger user-select-all">${val.pass}</code></div>`;
                                html += `</div></div></div>`;
                            }
                        }
                        html += '</div>';
                        
                        if(tiene) {
                            body.innerHTML = html;
                            if(badge) { badge.className = 'badge bg-success ms-2'; badge.textContent = 'Datos 🔓'; }
                        } else {
                            body.innerHTML = '<p class="text-muted text-center mb-0">Cliente sin redes registradas.</p>';
                            if(badge) { badge.className = 'badge bg-secondary ms-2'; badge.textContent = 'Vacío'; }
                        }
                    } catch(e) {}
                });
            }
        } else { document.getElementById('errorPin').classList.remove('d-none'); }
    }).catch(() => document.getElementById('errorPin').classList.remove('d-none'));
}

function bloquearDeNuevo() { 
    document.getElementById('pantallaBloqueo').classList.remove('d-none'); 
    document.getElementById('contenidoSeguro').classList.add('d-none'); 
    document.getElementById('inputPinSeguridad').value = ''; 
    document.querySelectorAll('.accordion-body[id^="body-cred-"]').forEach(b => b.innerHTML = '<p class="text-muted text-center mb-0">Introduce el PIN arriba para desencriptar los datos.</p>');
    document.querySelectorAll('.accordion-button .badge').forEach(b => { b.className = 'badge bg-secondary ms-2'; b.textContent = 'Protegido 🔒'; });
}

function abrirModalEditarEmp(id, n, u){ 
    document.getElementById('mod_emp_id').value = id; document.getElementById('mod_emp_id_pin').value = id; document.getElementById('mod_emp_nom').value = n; document.getElementById('mod_emp_user').value = u; 
    new bootstrap.Modal(document.getElementById('modalEditarEmp')).show(); 
}

function abrirModalEditarCliente(c){ 
    document.getElementById('mod_cli_id').value = c.id; document.getElementById('mod_cli_nom').value = c.nombre; document.getElementById('mod_cli_tel').value = c.telefono; document.getElementById('mod_cli_dir').value = c.direccion; 
    document.getElementById('mod_cli_desc').value = c.descripcion; document.getElementById('mod_cli_activo').checked = (c.es_activo == 1); document.getElementById('mod_cli_potencial').checked = (c.es_potencial == 1); 
    document.getElementById('mod_cli_iva').checked = (c.tiene_iva == 1); document.getElementById('mod_cli_irpf').checked = (c.tiene_irpf == 1); 
    document.getElementById('mod_cli_ib').value = c.ingreso_budget; document.getElementById('mod_cli_ir').value = c.ingreso_real; document.getElementById('mod_cli_cb').value = c.coste_budget; document.getElementById('mod_cli_cr').value = c.coste_real; 
    
    document.querySelectorAll('#modalEditarCli .social-check').forEach(chk => chk.checked = false); 
    document.querySelectorAll('#modalEditarCli .social-fields').forEach(f => f.classList.add('d-none')); 
    
    try { 
        const json = c.credenciales ? JSON.parse(c.credenciales) : {}; 
        for(const [k,v] of Object.entries(json)){ 
            const ck = document.getElementById(`check_edit_${k}`), dv = document.getElementById(`edit_${k}`); 
            if(ck && dv && (v.user || v.pass)){ ck.checked = true; dv.classList.remove('d-none'); const i = dv.querySelectorAll('input'); if(i[0]) i[0].value = v.user; if(i[1]) i[1].value = v.pass; } 
        } 
    } catch(e){} 
    new bootstrap.Modal(document.getElementById('modalEditarCli')).show(); 
}

function abrirModalEditarTarea(t) { 
    document.getElementById('mod_tar_id').value = t.id; 
    document.getElementById('mod_tar_titulo').value = t.titulo || ''; 
    document.getElementById('mod_tar_desc').value = t.descripcion || ''; 
    document.getElementById('mod_tar_prio').value = t.prioridad; 
    
    // --> CARGAMOS EL ESTADO DE LA TAREA <--
    document.getElementById('mod_tar_estado').value = t.estado || 'pendiente';

    if(t.fecha_limite) { let partes = t.fecha_limite.split(' '); document.getElementById('mod_tar_fecha').value = partes[0]; document.getElementById('mod_tar_hora').value = partes[1] ? partes[1].substring(0, 5) : ''; } 
    
    const selAsignados = document.getElementById('mod_tar_asignados'); 
    Array.from(selAsignados.options).forEach(opt => opt.selected = false);
    if (t.empleados_ids) { 
        const ids = t.empleados_ids.split(','); 
        Array.from(selAsignados.options).forEach(opt => { if(ids.includes(opt.value)) opt.selected = true; }); 
    }
    
    new bootstrap.Modal(document.getElementById('modalEditarTarea')).show(); 
}

function exportTableToExcel(id, name){ 
    var t = document.getElementById(id); var b = new Blob(['\ufeff', t.outerHTML], {type:'application/vnd.ms-excel'}); var u = URL.createObjectURL(b); var a = document.createElement("a"); 
    a.href = u; a.download = name + '.xls'; document.body.appendChild(a); a.click(); document.body.removeChild(a); 
}

function verLogs(id){ 
    const m = new bootstrap.Modal(document.getElementById('modalLogs')); document.getElementById('cuerpoLogs').innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>'; m.show(); 
    fetch('?ajax_action=get_logs&id=' + id).then(r => r.json()).then(d => { 
        let h = '<ul class="list-group list-group-flush">'; if(d.length === 0) h += '<li class="list-group-item text-muted text-center">Sin historial.</li>'; 
        d.forEach(l => { h += `<li class="list-group-item d-flex justify-content-between align-items-center"><div>${l.accion}</div><small class="text-muted" style="font-size:0.75em">${new Date(l.fecha).toLocaleString()}</small></li>`; }); 
        h += '</ul>'; document.getElementById('cuerpoLogs').innerHTML = h; 
    }); 
}

function cargarMarca(id, elem) { 
    document.querySelectorAll('#listaClientesMarca a').forEach(a => a.classList.remove('active')); elem.classList.add('active'); 
    document.getElementById('panelMarca').classList.remove('d-none'); document.getElementById('marca_cliente_id').value = id; 
    
    fetch('?ajax_action=get_marca_data&id=' + id).then(res => res.json()).then(data => { 
        const logos = JSON.parse(data.cliente.logos || '[]'); document.querySelectorAll('#containerLogos input').forEach((i, idx) => i.value = logos[idx] || ''); 
        const colores = JSON.parse(data.cliente.colores || '[]'); document.querySelectorAll('#containerColores input[type="text"]').forEach((i, idx) => { const val = colores[idx] || ''; i.value = val; i.previousElementSibling.value = val || '#000000'; }); 
        const tipografias = JSON.parse(data.cliente.tipografias || '[]'); document.querySelectorAll('#containerFuentes input').forEach((i, idx) => i.value = tipografias[idx] || ''); 
        const tbody = document.getElementById('tbodyObjetivos'); tbody.innerHTML = ''; 
        if (data.objetivos.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Sin estrategias creadas.</td></tr>'; } else { 
            data.objetivos.forEach(o => { let icono = o.tipo === 'mensual' ? '📅' : '🎉'; tbody.innerHTML += `<tr><td><small>${o.fecha_orden}</small></td><td>${icono} ${o.tipo.toUpperCase()}</td><td class="fw-bold">${o.titulo}</td><td><a href="?borrar_objetivo=${o.id}" class="btn btn-sm btn-outline-danger" onclick="return confirm('¿Borrar?');">🗑️</a></td></tr><tr><td colspan="4" class="small text-muted ps-4 border-bottom pb-2"><em>${o.descripcion}</em></td></tr>`; }); 
        } 
    }); 
}

function calcularTiempo(input, cid) { 
    const mes = input.value; const div = document.getElementById('avg-result-' + cid); if (!mes) return; 
    div.innerHTML = '<div class="spinner-border spinner-border-sm text-light"></div>'; 
    fetch(window.location.pathname + `?ajax_action=get_avg_time&cliente_id=${cid}&mes=${mes}`).then(r => r.text()).then(text => {
        try { const data = JSON.parse(text); div.innerHTML = data.texto; } catch(e) { div.innerHTML = '<span class="text-danger" style="font-size:0.7em">Fallo PHP</span>'; }
    }).catch(e => { div.innerHTML = '<span class="text-danger" style="font-size:0.8em">Fallo de Red</span>'; }); 
}

function rellenarConcepto(select) { 
    const inputConcepto = select.previousElementSibling; const opt = select.options[select.selectedIndex]; const precio = opt.getAttribute('data-precio'); 
    if(select.value) inputConcepto.value = select.value; 
    if(precio) { const tr = select.closest('tr'); const inputPrecio = tr.querySelector('.gasto-precio'); inputPrecio.value = precio; inputPrecio.dispatchEvent(new Event('change')); } 
}

function guardarTablaIngresos(modo) { 
    const tableId = `table_ingreso_${modo}`; const container = document.getElementById(tableId); if(!container) return; 
    const inputs = container.querySelectorAll('.input-save'); let data = []; 
    inputs.forEach(inp => { data.push({ cid: inp.getAttribute('data-cid'), col: inp.getAttribute('data-col'), val: inp.value }); }); 
    const btn = event.target; const originalText = btn.innerText; btn.innerText = "Guardando..."; btn.disabled = true; 
    const fd = new FormData(); fd.append('data', JSON.stringify(data)); 
    fetch('?ajax_action=batch_save_clientes', { method: 'POST', body: fd }).then(r => r.json()).then(res => { btn.innerText = originalText; btn.disabled = false; if(res.status === 'ok') location.reload(); }); 
}

function agregarFilaCoste(modo) { 
    const table = document.getElementById(`table_coste_${modo}`).querySelector('tbody'); const tr = document.createElement('tr'); tr.className = 'fila-gasto-libre'; 
    let primerSelect = table.querySelector('select'); 
    tr.innerHTML = `<input type="hidden" class="gasto-id" value=""><td><div class="input-group input-group-sm"><input type="text" class="form-control gasto-concepto border-secondary" placeholder="Concepto"><select class="form-select border-secondary" style="max-width:130px;" onchange="rellenarConcepto(this)">${primerSelect ? primerSelect.innerHTML : ''}</select></div></td><td><input type="number" step="0.01" class="form-control form-control-sm gasto-precio text-end border-secondary" onchange="recalcularTotalCostes('${modo}')"></td><td><div class="form-check d-flex justify-content-center"><input class="form-check-input gasto-check-iva border-secondary" type="checkbox" onchange="recalcularTotalCostes('${modo}')"></div></td><td><input type="text" class="form-control form-control-sm gasto-iva-valor text-muted text-end border-secondary" readonly value="-" style="background:transparent"></td><td><button class="btn btn-sm btn-outline-danger border-0" onclick='this.closest("tr").remove(); recalcularTotalCostes("${modo}")'>🗑️</button></td>`; 
    table.appendChild(tr); 
}

function guardarTablaCostes(modo, mes) { 
    const table = document.getElementById(`table_coste_${modo}`); let data = []; 
    table.querySelectorAll('.fila-gasto-libre').forEach(tr => { 
        const id = tr.querySelector('.gasto-id').value; const concepto = tr.querySelector('.gasto-concepto').value; const precio = tr.querySelector('.gasto-precio').value; const tieneIva = tr.querySelector('.gasto-check-iva').checked; 
        if (id || concepto || precio) data.push({ id: id, concepto: concepto, precio: precio, tiene_iva: tieneIva }); 
    }); 
    const fd = new FormData(); fd.append('data', JSON.stringify(data)); fd.append('mes', mes); fd.append('tipo', modo); 
    fetch('?ajax_action=save_gastos_libres', { method: 'POST', body: fd }).then(r => r.json()).then(res => { if(res.status === 'ok') location.reload(); }); 
}

// ==========================================
// 5. NUEVAS FUNCIONES DE CALIDAD DE VIDA (QoL)
// ==========================================

// --- BUSCADOR GLOBAL (SPOTLIGHT) ---
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const m = new bootstrap.Modal(document.getElementById('modalBuscadorGlobal'));
        m.show();
    }
});

document.getElementById('modalBuscadorGlobal')?.addEventListener('shown.bs.modal', function () {
    document.getElementById('inputBuscadorGlobal').focus();
});

document.getElementById('inputBuscadorGlobal')?.addEventListener('keyup', debounce(function() {
    const q = this.value;
    const resDiv = document.getElementById('resultadosBuscadorGlobal');
    if (q.length < 2) { resDiv.innerHTML = ''; return; }
    
    fetch('?ajax_action=buscar_global&q=' + encodeURIComponent(q))
        .then(r => r.json())
        .then(data => {
            if(data.length === 0) { resDiv.innerHTML = '<div class="p-3 text-muted">No se encontraron resultados.</div>'; return; }
            let html = '';
            data.forEach(item => {
                let badgeColor = item.tipo === 'Cliente' ? 'bg-primary' : 'bg-warning text-dark';
                html += `
                <a href="#" class="list-group-item list-group-item-action border-secondary" style="background:transparent; color:var(--text-main)" onclick="document.querySelector('#modalBuscadorGlobal .btn-close').click(); alert('Has encontrado: ${item.nombre}');">
                    <span class="badge ${badgeColor} me-2">${item.tipo}</span> ${item.nombre}
                </a>`;
            });
            resDiv.innerHTML = html;
        });
}, 300));


// --- GRÁFICA DE RENTABILIDAD (CHART.JS) ---
<?php 
$chartLabels = []; $chartIngresos = []; $chartCostes = [];
if(isset($_SESSION['rol']) && $_SESSION['rol'] === 'superadmin') {
    foreach($clientesGlobal as $c) {
        $stmt = $pdo->prepare("SELECT ingreso_real, coste_real FROM clientes WHERE id = ?");
        $stmt->execute([$c['id']]);
        $cliData = $stmt->fetch(PDO::FETCH_ASSOC);
        if($cliData && ((float)$cliData['ingreso_real'] > 0 || (float)$cliData['coste_real'] > 0)) {
            $chartLabels[] = $c['nombre'];
            $chartIngresos[] = (float)$cliData['ingreso_real'];
            $chartCostes[] = (float)$cliData['coste_real'];
        }
    }
}
?>

function initChart() {
    const ctx = document.getElementById('rentabilidadChart');
    if (!ctx) return;
    
    const labels = <?= json_encode($chartLabels) ?>;
    const ingresos = <?= json_encode($chartIngresos) ?>;
    const costes = <?= json_encode($chartCostes) ?>;
    
    if(labels.length === 0) {
        ctx.outerHTML = '<p class="text-muted text-center py-4">Añade ingresos y costes reales a los clientes en Facturación para generar la gráfica.</p>';
        return;
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos Netos (€)',
                    data: ingresos,
                    backgroundColor: 'rgba(166, 227, 161, 0.7)', 
                    borderColor: '#a6e3a1',
                    borderWidth: 1
                },
                {
                    label: 'Costes Reales (€)',
                    data: costes,
                    backgroundColor: 'rgba(243, 139, 168, 0.7)', 
                    borderColor: '#f38ba8',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: '#45475a' }, ticks: { color: '#cdd6f4' } },
                x: { grid: { display: false }, ticks: { color: '#cdd6f4' } }
            },
            plugins: {
                legend: { labels: { color: '#cdd6f4' } }
            }
        }
    });
}

// ==========================================
// 6. INICIALIZACIÓN PRINCIPAL Y EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    
    initChart(); 

    let deferredPrompt;
    const installBtn = document.getElementById('btnInstallApp');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });

    if(installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
            } else {
                alert("📱 PARA APPLE (iOS/iPad): \nPulsa el botón de 'Compartir' del navegador y selecciona 'Añadir a la pantalla de inicio'.\n\n✅ Si ya la tienes instalada, puedes seguir usándola con normalidad.");
            }
        });
    }

    // 🔥 CALENDARIO
    <?php if(isset($jsonEventos)): ?>
    var allEvents = <?php echo $jsonEventos; ?>;
    
    allEvents = allEvents.map(function(ev) {
        if (ev.start && ev.start.includes('23:59')) {
            ev.allDay = true;
            ev.start = ev.start.split(' ')[0];
        }
        return ev;
    });

    var calendarEl = document.getElementById('calendarAdmin'); 
    if(calendarEl) {
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', 
            locale: 'es', 
            height: 'auto',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listMonth' },
            dayMaxEvents: true, 
            events: allEvents,
            eventDisplay: 'block',     
            displayEventTime: true,    
            eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false }
        });

        document.querySelector('button[data-bs-target="#calendario"]')?.addEventListener('shown.bs.tab', function() { calendar.render(); window.dispatchEvent(new Event('resize')); });
        document.getElementById('calendarClientFilter')?.addEventListener('change', e => {
            var selectedId = e.target.value; 
            calendar.removeAllEventSources();
            if(selectedId === 'all') calendar.addEventSource(allEvents);
            else calendar.addEventSource(allEvents.filter(ev => ev.extendedProps && ev.extendedProps.cliente_id == selectedId));
        });
    }
    <?php endif; ?>

    document.querySelectorAll('#adminTab button[data-bs-toggle="tab"]').forEach(tab => { 
        tab.addEventListener('shown.bs.tab', e => localStorage.setItem('activeDashboardTab', e.target.getAttribute('data-bs-target'))); 
    });

    document.querySelectorAll('#factTabs button[data-bs-toggle="tab"]').forEach(tab => { 
        tab.addEventListener('shown.bs.tab', e => localStorage.setItem('activeFactTab', e.target.getAttribute('data-bs-target'))); 
    });

    let activeTab = localStorage.getItem('activeDashboardTab');
    if (activeTab) { 
        let tabElement = document.querySelector(`#adminTab button[data-bs-target="${activeTab}"]`); 
        if (tabElement) new bootstrap.Tab(tabElement).show(); 
    }

    let activeFactTab = localStorage.getItem('activeFactTab');
    if (activeFactTab) { 
        let factTabElement = document.querySelector(`#factTabs button[data-bs-target="${activeFactTab}"]`); 
        if (factTabElement) new bootstrap.Tab(factTabElement).show(); 
    }

    function setupMirroring(srcId, tgtId) { const s = document.getElementById(srcId); const t = document.getElementById(tgtId); if(s && t) s.addEventListener('input', function() { t.value = this.value; }); }
    setupMirroring('new_cli_ib', 'new_cli_ir'); setupMirroring('new_cli_cb', 'new_cli_cr'); setupMirroring('mod_cli_ib', 'mod_cli_ir'); setupMirroring('mod_cli_cb', 'mod_cli_cr');

    setTimeout(() => {
        if(typeof recalcularTotalCostes === 'function') {
            recalcularTotalCostes('budget'); recalcularTotalCostes('real');
        }
        if(typeof recalcularGranTotalIngresos === 'function') {
            recalcularGranTotalIngresos('budget'); recalcularGranTotalIngresos('real');
        }
        document.querySelectorAll('input[type="number"][onchange*="calculoVisualIngresos"]').forEach(input => {
            input.dispatchEvent(new Event('change'));
        });

        document.querySelectorAll('.stats-month-input').forEach(input => {
            calcularTiempo(input, input.getAttribute('data-cid'));
        });

    }, 500);
}); 

// --- REGISTRO DEL SERVICE WORKER (Necesario para instalar la App) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado correctamente.', reg))
            .catch(err => console.log('Error al registrar el Service Worker:', err));
    });
}


document.addEventListener('change', function(e) { 
    if(e.target.classList.contains('social-check')) { 
        const c = document.getElementById(e.target.getAttribute('data-target')); 
        if(e.target.checked) c.classList.remove('d-none'); else c.classList.add('d-none'); 
    } 
});


// --- SISTEMA DE NOTIFICACIONES NATIVAS ---
function pedirPermisoNotificaciones() {
    if (!("Notification" in window)) { alert("Tu navegador no soporta notificaciones."); return; }
    Notification.requestPermission().then(permission => {
        if (permission === "granted") document.getElementById('btnNotif').style.display = 'none';
    });
}

if ("Notification" in window && Notification.permission === "granted") {
    const btnN = document.getElementById('btnNotif'); if(btnN) btnN.style.display = 'none';
}

function lanzarNotificacion(titulo, cuerpo) {
    if ("Notification" in window && Notification.permission === "granted") {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(titulo, { body: cuerpo, icon: '1.png', badge: '1.png', vibrate: [200, 100, 200] });
            }).catch(() => new Notification(titulo, { body: cuerpo, icon: '1.png' }));
        } else {
            new Notification(titulo, { body: cuerpo, icon: '1.png' });
        }
    }
}

let knownApprovalIds = JSON.parse(localStorage.getItem('knownApprovalIds')) || [];
let lastApprovalReminder = parseInt(localStorage.getItem('lastApprovalReminder')) || Date.now();
const REMINDER_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos (cámbialo aquí si quieres más o menos tiempo)

function checkAprobacionesAvanzado() {
    fetch('?ajax_action=get_aprobaciones_json')
        .then(r => r.json())
        .then(pendientes => {
            const currentIds = pendientes.map(p => p.id);
            let avisoNuevoDisparado = false;

            // 1. Notificación inmediata de tareas nuevas
            pendientes.forEach(p => {
                if (!knownApprovalIds.includes(p.id)) {
                    lanzarNotificacion("✋ Nueva Aprobación", `El equipo ha enviado "${p.titulo}" (${p.cliente}).`);
                    avisoNuevoDisparado = true;
                }
            });

            // 2. Recordatorio cada 30 minutos si hay tareas pendientes
            const now = Date.now();
            if (currentIds.length > 0 && !avisoNuevoDisparado) {
                if (now - lastApprovalReminder > REMINDER_INTERVAL_MS) {
                    lanzarNotificacion("⚠️ Recordatorio", `Tienes ${currentIds.length} tarea(s) esperando tu validación en el panel.`);
                    lastApprovalReminder = now;
                    localStorage.setItem('lastApprovalReminder', lastApprovalReminder);
                }
            }

            // Si no hay tareas, reseteamos el reloj
            if (currentIds.length === 0) {
                lastApprovalReminder = now;
                localStorage.setItem('lastApprovalReminder', lastApprovalReminder);
            }

            // Actualizamos la memoria
            knownApprovalIds = currentIds;
            localStorage.setItem('knownApprovalIds', JSON.stringify(knownApprovalIds));

            // 3. Actualizar la campanita roja en la pestaña
            const tabBtn = document.querySelector('button[data-bs-target="#aprobaciones"]');
            if (tabBtn) {
                if (currentIds.length > 0) {
                    tabBtn.innerHTML = `⚠️ Aprobaciones <span class='badge bg-danger ms-1'>${currentIds.length}</span>`;
                } else {
                    tabBtn.innerHTML = `⚠️ Aprobaciones`;
                }
            }

            // 4. Actualizar el HTML de las tarjetas solo si hay cambios y no estás escribiendo
            const isTyping = document.querySelector('#contenedorAprobaciones textarea:focus');
            if (!isTyping) {
                fetch('?ajax_action=get_aprobaciones_html')
                    .then(res => res.text())
                    .then(html => {
                        const cont = document.getElementById('contenedorAprobaciones');
                        if(cont && cont.innerHTML !== html) cont.innerHTML = html;
                    });
            }
        }).catch(e => {});
}

setInterval(checkAprobacionesAvanzado, 10000);


let lastMisTareasCountAdmin = parseInt(localStorage.getItem('lastMisTareasCountAdmin')) || 0;
function checkMisTareasAdmin() {
    fetch('?ajax_action=check_mis_tareas').then(r=>r.json()).then(d => {
        const currentCount = parseInt(d.count) || 0;
        const badge = document.getElementById('badgeMisTareas');
        
        if (currentCount > lastMisTareasCountAdmin) {
            lanzarNotificacion("Nuevas Asignaciones 📌", "Tienes nuevas tareas asignadas o rechazadas en tu panel.");
        }
        
        if (badge) {
            if (currentCount > 0) { badge.textContent = currentCount; badge.classList.remove('d-none'); } 
            else { badge.classList.add('d-none'); }
        }
        
        lastMisTareasCountAdmin = currentCount;
        localStorage.setItem('lastMisTareasCountAdmin', lastMisTareasCountAdmin);
    }).catch(e=>{});
}
checkMisTareasAdmin();
setInterval(checkMisTareasAdmin, 15000);

</script>
</body>
</html>
</div>