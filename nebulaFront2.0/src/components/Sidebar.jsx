import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Users,
  Briefcase,
  ShieldCheck,
  LogOut,
  LineChart,
  Palette
} from "lucide-react";

const Sidebar = () => {
  const menuItems = [
    { id: "stats", label: "Stats", icon: <LayoutDashboard size={20} /> },
    { id: "tareas", label: "Tareas", icon: <CheckSquare size={20} /> },
    { id: "chat", label: "Chat", icon: <MessageSquare size={20} /> },
    { id: "clientes", label: "Clientes", icon: <Briefcase size={20} /> },
    {
      id: "aprobaciones",
      label: "Aprobaciones",
      icon: <ShieldCheck size={20} />,
    },
    { id: "finanzas", label: "Finanzas", icon: <LineChart size={20} /> },
    { id: "marca", label: "Marca", icon: <Palette size={20} /> },
    { id: "equipo", label: "Equipo", icon: <Users size={20} /> },
  ];

  return (
    <div
      className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark"
      style={{
        width: "280px",
        minHeight: "100vh",
        borderRight: "1px solid #313244",
      }}
    >
      <div className="d-flex align-items-center mb-4 me-md-auto text-white text-decoration-none">
        <span className="fs-4 fw-bold text-primary">Nebula 2.0</span>
      </div>
      <hr style={{ backgroundColor: "#45475a" }} />
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
                backgroundColor: isActive ? "#89b4fa" : "transparent",
                transition: "all 0.2s",
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <hr />
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
