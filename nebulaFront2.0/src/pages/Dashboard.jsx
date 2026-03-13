// src/pages/Dashboard.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const Dashboard = ({ user }) => {
  return (
    <div
      className="d-flex w-100"
      style={{ height: "100vh", backgroundColor: "var(--bg-deep)", width: "100vw", overflow: "hidden" }}
    >
      <Sidebar />

      <div className="flex-grow-1 p-4 d-flex flex-column" style={{ minWidth: 0, height: "100vh", overflowY: "auto" }}>
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
        
        <div className="flex-grow-1">
          <Outlet />
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
