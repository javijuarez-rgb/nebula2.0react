const ChatBubble = ({ message, sender, role, timestamp, isAudio }) => {
  // Definimos colores según el rol (como en tu PHP)
  const roleStyles = {
    superadmin: { bg: 'rgba(243, 139, 168, 0.1)', border: '#f38ba8' },
    admin: { bg: 'rgba(249, 226, 175, 0.1)', border: '#f9e2af' },
    empleado: { bg: 'rgba(137, 180, 250, 0.1)', border: '#89b4fa' }
  };

  const style = roleStyles[role] || roleStyles.empleado;

  return (
    <div className="mb-3 p-3 rounded" style={{ 
      backgroundColor: style.bg, 
      borderLeft: `4px solid ${style.border}`,
      maxWidth: '85%' 
    }}>
      <div className="small fw-bold mb-1" style={{ color: style.border }}>
        {sender.toUpperCase()} <span className="text-muted">({role})</span>
      </div>
      
      {isAudio ? (
        <audio controls src={message} className="w-100" style={{ height: '30px' }} />
      ) : (
        <div className="text-light">{message}</div>
      )}
      
      <div className="text-end small text-muted mt-1" style={{ fontSize: '0.7em' }}>
        {timestamp}
      </div>
    </div>
  );
};

export default ChatBubble;  