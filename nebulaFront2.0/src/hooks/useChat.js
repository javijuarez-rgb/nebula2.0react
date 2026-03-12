import { useState } from 'react';

export const useChat = () => {
  const [mensajes, setMensajes] = useState([]);
  const [salaActual, setSalaActual] = useState('global');

  const enviarMensaje = (texto, esAudio = false) => {
    const nuevoMsg = {
      id: Date.now(),
      usuario_id: 1, // Tu ID de Admin
      nombre: "Admin",
      rol: "superadmin",
      mensaje: texto,
      fecha: new Date().toLocaleTimeString(),
      esAudio: esAudio
    };
    
    setMensajes(prev => [...prev, nuevoMsg]);
  };

  return { mensajes, salaActual, setSalaActual, enviarMensaje };
};