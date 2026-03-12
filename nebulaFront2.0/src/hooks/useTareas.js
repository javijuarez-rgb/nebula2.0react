import { useState, useEffect } from 'react';
import { MOCK_TAREAS } from '../mocks/data'; // Importamos tus datos de prueba

export const useTareas = () => {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Simulamos un retraso de red de 1 segundo para que veas cómo queda
    const timer = setTimeout(() => {
      setTareas(MOCK_TAREAS);
      setCargando(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Función para filtrar por estado (como hacías en el PHP)
  const filtrarPorEstado = (estado) => {
    if (estado === 'all') return tareas;
    return tareas.filter(t => t.estado === estado);
  };

  return { tareas, cargando, filtrarPorEstado };
};