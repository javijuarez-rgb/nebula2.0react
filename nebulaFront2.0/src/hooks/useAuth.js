import { useState } from 'react';

export const useAuth = () => {
  // Inicialmente no está logueado
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    // Simulamos la validación que tienes en el PHP
    if (username === 'admin' && password === 'admin123') {
      const userData = { 
        id: 1, 
        name: 'Administrador', 
        username: 'admin',
        role: 'superadmin',
        created_at: '2025-01-15'
      };
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return { user, login, logout, isAuthenticated: !!user };
};  