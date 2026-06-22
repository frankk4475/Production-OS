import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Load users from localStorage (database of registered users)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('prod_api_users');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error reading prod_api_users:", e);
      return [];
    }
  });

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

  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(() => {
    try {
      const saved = localStorage.getItem('prod_api_users');
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length === 0;
    } catch (e) {
      return true;
    }
  });

  // Sync users list to localStorage
  useEffect(() => {
    localStorage.setItem('prod_api_users', JSON.stringify(users));
    setIsFirstTimeSetup(users.length === 0);
  }, [users]);

  const login = (email, password) => {
    // 1. Search in dynamic users database
    const matched = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (matched) {
      const userData = { email: matched.email, role: matched.role, name: matched.name, id: matched.id };
      localStorage.setItem('prod_user', JSON.stringify(userData));
      setUser(userData);
      window.location.hash = '#/dashboard';
      return { success: true };
    }

    // 2. Fallback to demo accounts for ease of presentation/testing
    const demoAccounts = [
      { email: 'producer@production.com', password: 'password123', role: 'Producer', name: 'Executive Producer', id: 'u-prod' },
      { email: 'admin@production.com', password: 'password123', role: '1st_AD', name: 'Assistant Director', id: 'crew-4' },
      { email: 'crew@production.com', password: 'password123', role: 'Crew', name: 'Natdanai (DP)', id: 'crew-1' },
      { email: 'talent@production.com', password: 'password123', role: 'Talent', name: 'Pimrada (Designer)', id: 'crew-2' }
    ];
    
    const matchedDemo = demoAccounts.find(d => d.email === email && d.password === password);
    if (matchedDemo) {
      // Auto-add demo user to dynamic list so they appear in user tables
      const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (!userExists) {
        setUsers(prev => [...prev, matchedDemo]);
      }
      localStorage.setItem('prod_user', JSON.stringify(matchedDemo));
      setUser(matchedDemo);
      window.location.hash = '#/dashboard';
      return { success: true };
    }

    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  };

  const registerFirstUser = (name, email, password) => {
    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      password,
      role: 'Producer' // First user is automatically Producer (Admin role)
    };
    setUsers([newUser]);
    
    // Auto-login
    localStorage.setItem('prod_user', JSON.stringify(newUser));
    setUser(newUser);
    window.location.hash = '#/dashboard';
  };

  const registerUserByAdmin = (name, email, password, role) => {
    // Check if email already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      password,
      role
    };

    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const deleteUserByAdmin = (id) => {
    if (id === user?.id) {
      throw new Error('Cannot delete your own logged-in account');
    }
    setUsers(prev => prev.filter(u => u.id !== id));
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
    <AuthContext.Provider value={{ 
      user, 
      users,
      login, 
      logout, 
      hasWriteAccess, 
      isCrewOrTalent,
      isFirstTimeSetup,
      registerFirstUser,
      registerUserByAdmin,
      deleteUserByAdmin
    }}>
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
