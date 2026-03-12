// src/pages/Dashboard.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Dashboard = ({ user }) => {
  return (
    <div
      className="d-flex w-100"
      style={{ minHeight: "100vh", backgroundColor: "#11111b", width: "100vw" }}
    >
      <Sidebar />

      <div className="flex-grow-1 p-4">
        <header className="mb-4 d-flex justify-content-between align-items-center">
          <h2 className="text-white">Panel de {user.name}</h2>
          <div className="d-flex gap-2">
            <span className="badge bg-primary d-flex align-items-center">
              {user.role}
            </span>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => window.location.reload()}
            >
              Salir
            </button>
          </div>
        </header>
        
        {/* Aquí se renderizarán los componentes hijos de las rutas */}
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
