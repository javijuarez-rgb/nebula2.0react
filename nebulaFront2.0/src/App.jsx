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
import MarcaView from './pages/MarcaView';
import StatCard from './components/StatCard';
import TablaTareas from './components/TablaTareas';
import { useTareas } from './hooks/useTareas';

// Create a small wrapper for Stats
function StatsView() {
  const { tareas } = useTareas();
  return (
    <div className="row g-3">
      <div className="col-md-4">
        <StatCard
          title="Total Tareas"
          value={tareas.length}
          color="#89b4fa"
          icon="📁"
        />
      </div>
      {/* Aquí irían las demás Stats del PHP */}
    </div>
  );
}

// Create a wrapper for Tareas
function TareasView() {
  const { tareas } = useTareas();
  return (
    <div className="card bg-transparent border-secondary p-3">
      <TablaTareas tareas={tareas} />
    </div>
  );
}

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
        <Route path="tareas" element={<TareasView />} />
        <Route path="chat" element={<ChatView user={user} />} />
        <Route path="clientes" element={<ClientesView />} />
        <Route path="aprobaciones" element={<AprobacionesView />} />
        <Route path="finanzas" element={<FinanzasView />} />
        <Route path="marca" element={<MarcaView />} />
        <Route path="*" element={<Navigate to="/stats" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;