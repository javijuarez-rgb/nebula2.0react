const TaskRow = ({ task }) => {
  const priorityColors = {
    urgente: '#f38ba8',
    alta: '#fab387',
    media: '#f9e2af',
    baja: '#a6e3a1'
  };

  return (
    <tr>
      <td><span style={{ color: '#89b4fa' }}>{task.cliente}</span></td>
      <td>
        <span className="me-2" style={{ 
          display: 'inline-block', 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          backgroundColor: priorityColors[task.prioridad] 
        }}></span>
        <strong>{task.titulo}</strong>
      </td>
      <td>
        <span className={`badge bg-${task.estado === 'terminada' ? 'success' : 'warning'}`}>
          {task.estado}
        </span>
      </td>
      <td><small className="text-muted">{task.fecha_limite}</small></td>
    </tr>
  );
};

export default TaskRow;