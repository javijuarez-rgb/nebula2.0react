import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import ChatBubble from '../components/ChatBubble';
import { Send, Globe, User } from 'lucide-react';

const ChatView = ({ user }) => {
  // 1. Usamos tu hook que ya tiene la lógica de mensajes y envío
  const { mensajes, enviarMensaje, salaActual, setSalaActual } = useChat();
  const [text, setText] = useState('');
  
  // Referencia para hacer scroll automático al último mensaje
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    // Llamamos a la función de tu hook
    enviarMensaje(text);
    setText('');
  };

  return (
    <div className="card bg-dark border-secondary shadow-lg" style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
      {/* Cabecera del Chat */}
      <div className="card-header border-secondary d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center gap-2">
          <div className="p-2 bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
            {salaActual === 'global' ? <Globe size={18} color="white" /> : <User size={18} color="white" />}
          </div>
          <h5 className="mb-0 text-white">Sala: {salaActual.toUpperCase()}</h5>
        </div>
        
        <select 
          className="form-select form-select-sm w-auto bg-dark text-white border-secondary"
          value={salaActual}
          onChange={(e) => setSalaActual(e.target.value)}
        >
          <option value="global">🌍 Canal Global</option>
          <option value="privado">👤 Canal Privado</option>
        </select>
      </div>

      {/* Cuerpo del Chat (Aquí usamos ChatBubble) */}
      <div 
        ref={scrollRef}
        className="card-body overflow-auto p-4 d-flex flex-column" 
        style={{ flexGrow: 1, backgroundColor: '#181825' }}
      >
        {mensajes.length === 0 ? (
          <div className="text-center text-muted my-auto">
            <p>No hay mensajes en esta sala.</p>
            <small>Los mensajes se guardan localmente (Mock Mode)</small>
          </div>
        ) : (
          mensajes.map((m) => (
            <div key={m.id} className={m.nombre === user.name ? 'align-self-end w-100 d-flex flex-column align-items-end' : 'w-100'}>
              <ChatBubble 
                sender={m.nombre}
                message={m.mensaje}
                role={m.rol}
                timestamp={m.fecha}
                isAudio={m.esAudio}
              />
            </div>
          ))
        )}
      </div>

      {/* Input de Mensajes */}
      <form onSubmit={handleSend} className="card-footer border-secondary p-3 bg-dark">
        <div className="input-group">
          <input 
            type="text" 
            className="form-control bg-dark text-white border-secondary" 
            placeholder="Escribe un mensaje..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary d-flex align-items-center gap-2" type="submit">
            <Send size={18} />
            <span className="d-none d-md-inline">Enviar</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatView;