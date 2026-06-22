import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prod_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user state from localStorage:", e);
      localStorage.removeItem('prod_user');
      return null;
    }
  });

  const login = (email, role, name) => {
    const userData = { email, role, name, id: `u-${Date.now()}` };
    localStorage.setItem('prod_user', JSON.stringify(userData));
    setUser(userData);
    window.location.hash = '#/dashboard';
  };

  const logout = () => {
    localStorage.removeItem('prod_user');
    setUser(null);
    window.location.hash = '#/login';
  };

  const hasWriteAccess = () => {
    return ['Producer', '1st_AD'].includes(user?.role);
  };

  const isCrewOrTalent = () => {
    return ['Crew', 'Talent'].includes(user?.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasWriteAccess, isCrewOrTalent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
