import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import { useAuth } from './hooks/useAuth';

// Import view components for nested routes
import ChatView from './pages/ChatView';
import ClientesView from './pages/ClientesView';
import AprobacionesView from './pages/AprobacionesView';
import FinanzasView from './pages/FinanzasView';
import EquipoView from './pages/EquipoView';
import EstrategiaView from './pages/EstrategiaView';
import CalendarioView from './pages/CalendarioView';
import TareasView from './pages/TareasView';
import PerfilView from './pages/PerfilView';
import StatsView from './pages/StatsView';
import { useTareas } from './hooks/useTareas';


function App() {
  const { user, login, isAuthenticated } = useAuth();

  // Si no está logueado, mostramos el componente Login que ya tienes
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  // Si está logueado, configuramos las rutas del Dashboard
  return (
    <Routes>
      <Route path="/" element={<Dashboard user={user} />}>
        <Route index element={<Navigate to="/stats" replace />} />
        <Route path="stats" element={<StatsView />} />
        <Route path="tareas" element={<TareasView user={user} />} />
        <Route path="calendario" element={<CalendarioView />} />
        <Route path="chat" element={<ChatView user={user} />} />
        <Route path="clientes" element={<ClientesView />} />
        <Route path="estrategia" element={<EstrategiaView />} />
        <Route path="estrategia/:clientId" element={<EstrategiaView />} />
        <Route path="aprobaciones" element={<AprobacionesView />} />
        <Route path="finanzas" element={<FinanzasView />} />
        <Route path="equipo" element={<EquipoView />} />
        <Route path="perfil" element={<PerfilView user={user} />} />
        <Route path="*" element={<Navigate to="/stats" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;