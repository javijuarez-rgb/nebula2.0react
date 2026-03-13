import React from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Users,
  Briefcase,
  ShieldCheck,
  LogOut,
  LineChart,
  Target,
  Calendar,
  User
} from "lucide-react";

const Sidebar = () => {
  const menuItems = [
    { id: "stats", label: "Stats", icon: <LayoutDashboard size={20} /> },
    { id: "tareas", label: "Tareas", icon: <CheckSquare size={20} /> },
    { id: "calendario", label: "Calendario", icon: <Calendar size={20} /> },
    { id: "chat", label: "Chat", icon: <MessageSquare size={20} /> },
    { id: "clientes", label: "Clientes", icon: <Briefcase size={20} /> },
    {
      id: "aprobaciones",
      label: "Aprobaciones",
      icon: <ShieldCheck size={20} />,
    },
    { id: "finanzas", label: "Finanzas", icon: <LineChart size={20} /> },
    { id: "estrategia", label: "Estrategia", icon: <Target size={20} /> },
    { id: "equipo", label: "Equipo", icon: <Users size={20} /> },
  ];

  return (
    <div
      className="d-flex flex-column flex-shrink-0 p-3 text-white"
      style={{
        width: "280px",
        height: "100vh",
        backgroundColor: "var(--bg-dark)",
        borderRight: "1px solid var(--border-color)",
        overflowY: "auto",
        position: "sticky",
        top: 0
      }}
    >
      <Link to="/stats" className="d-flex align-items-center mb-4 me-md-auto text-white text-decoration-none">
        <span className="fs-4 fw-bold" style={{ color: "var(--primary-color)" }}>Nebula 2.0</span>
      </Link>
      <hr style={{ borderColor: "var(--border-color)", opacity: 0.5 }} />
      <ul className="nav nav-pills flex-column mb-auto">
        {menuItems.map((item) => (
          <li key={item.id} className="nav-item mb-1">
            <NavLink
              to={`/${item.id}`}
              className={({ isActive }) =>
                `nav-link w-100 text-start d-flex align-items-center gap-2 border-0 ${
                  isActive ? "active text-dark" : "text-white"
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? "var(--primary-color)" : "transparent",
                transition: "all 0.2s",
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <hr style={{ borderColor: "var(--border-color)", opacity: 0.5 }} />
      <div className="dropdown">
        <button
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={() => window.location.reload()}
        >
          <LogOut size={18} />
          Salir
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
