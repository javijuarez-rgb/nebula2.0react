import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_LIMIT = 45 * 60 * 1000; // 45 minutes in milliseconds

export const useAuth = () => {
  // Initialize user from localStorage to persist session on refresh
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('nebula_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const timerRef = useRef(null);

  const logout = useCallback(() => {
    if (user) {
      const logoutTime = new Date().toLocaleString();
      console.log(`Usuario ${user.username} cerró sesión a las: ${logoutTime}`);
      
      // Here you could also update a 'session_logs' in localStorage or send to a backend
      const sessions = JSON.parse(localStorage.getItem('nebula_sessions') || '[]');
      const lastSessionIndex = sessions.findIndex(s => s.username === user.username && !s.logout_time);
      if (lastSessionIndex !== -1) {
        sessions[lastSessionIndex].logout_time = logoutTime;
        localStorage.setItem('nebula_sessions', JSON.stringify(sessions));
      }
    }

    setUser(null);
    localStorage.removeItem('nebula_user');
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [user]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (user) {
      timerRef.current = setTimeout(() => {
        console.log('Sesión cerrada por inactividad (45 minutos)');
        logout();
      }, INACTIVITY_LIMIT);
    }
  }, [user, logout]);

  useEffect(() => {
    if (user) {
      // Set up activity listeners
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      const handleActivity = () => resetTimer();

      events.forEach(event => window.addEventListener(event, handleActivity));
      
      // Initial timer start
      resetTimer();

      return () => {
        events.forEach(event => window.removeEventListener(event, handleActivity));
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [user, resetTimer]);

  const login = (username, password) => {
    if (username === 'admin' && password === 'admin123') {
      const loginTime = new Date().toLocaleString();
      const userData = { 
        id: 1, 
        name: 'Administrador', 
        username: 'admin',
        role: 'superadmin',
        created_at: '2025-01-15',
        login_time: loginTime
      };

      // Record session in localStorage
      const sessions = JSON.parse(localStorage.getItem('nebula_sessions') || '[]');
      sessions.push({
        username: userData.username,
        login_time: loginTime,
        logout_time: null
      });
      localStorage.setItem('nebula_sessions', JSON.stringify(sessions));
      
      setUser(userData);
      localStorage.setItem('nebula_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  return { user, login, logout, isAuthenticated: !!user };
};