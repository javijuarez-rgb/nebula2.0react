const ChatBubble = ({ message, sender, role, timestamp, isAudio }) => {
  // Definimos colores según el rol con mayor opacidad para contraste
  const roleStyles = {
    superadmin: { bg: 'rgba(243, 139, 168, 0.2)', border: '#f38ba8' },
    admin: { bg: 'rgba(249, 226, 175, 0.2)', border: '#f9e2af' },
    empleado: { bg: 'rgba(137, 180, 250, 0.2)', border: '#89b4fa' }
  };

  const style = roleStyles[role] || roleStyles.empleado;

  return (
    <div className="mb-3 p-3 rounded shadow-sm" style={{ 
      backgroundColor: style.bg, 
      borderLeft: `4px solid ${style.border}`,
      maxWidth: '85%',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="small fw-bold mb-1 d-flex justify-content-between">
        <span style={{ color: style.border }}>{sender.toUpperCase()}</span>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.85em' }}>{role}</span>
      </div>
      
      {isAudio ? (
        <audio controls src={message} className="w-100" style={{ height: '30px' }} />
      ) : (
        <div style={{ 
          color: '#ffffff', 
          fontSize: '1.05rem', 
          lineHeight: '1.5',
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}>
          {message}
        </div>
      )}
      
      <div className="text-end small mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.8em' }}>
        {timestamp}
      </div>
    </div>
  );
};

export default ChatBubble;  