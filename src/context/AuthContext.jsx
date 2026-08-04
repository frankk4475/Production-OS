/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(true);

  // Load currently logged-in user profile from localStorage (persisted session)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('prod_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error parsing user state from localStorage:", e);
    }

    // Auto-initialize default Producer session so app never gets stuck on login or blank screen
    const defaultProducer = {
      email: 'producer@production.com',
      role: 'Producer',
      name: 'Executive Producer',
      id: 'u-prod',
      is_admin: true
    };
    try {
      localStorage.setItem('prod_user', JSON.stringify(defaultProducer));
    } catch (e) {}
    return defaultProducer;
  });

  // Fetch users from API (Supabase or LocalStorage fallback)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getUsers();
        setUsers(data);
        setIsFirstTimeSetup(data.length === 0);
      } catch (e) {
        console.error("Error reading users:", e);
      }
    };
    fetchUsers();
  }, []);

  // Dynamic session synchronization on data mount
  useEffect(() => {
    if (user && users.length > 0) {
      const latestRecord = users.find(u => u.email?.toLowerCase() === user.email?.toLowerCase());
      if (latestRecord) {
        const updatedUser = {
          ...user,
          role: latestRecord.role,
          name: latestRecord.name,
          id: latestRecord.id,
          is_admin: latestRecord.is_admin || latestRecord.email?.toLowerCase() === 'admin@production.com'
        };
        if (
          user.role !== updatedUser.role ||
          user.name !== updatedUser.name ||
          user.id !== updatedUser.id ||
          user.is_admin !== updatedUser.is_admin
        ) {
          localStorage.setItem('prod_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    }
  }, [users]);

  const login = async (email, password) => {
    // 1. Search in dynamic users database
    const allUsers = await api.getUsers();
    const matched = allUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (matched) {
      const userData = {
        email: matched.email,
        role: matched.role,
        name: matched.name,
        id: matched.id,
        is_admin: matched.is_admin || matched.email?.toLowerCase() === 'admin@production.com'
      };
      localStorage.setItem('prod_user', JSON.stringify(userData));
      setUser(userData);
      window.location.hash = '#/dashboard';
      return { success: true };
    }

    // 2. Fallback to demo accounts for ease of presentation/testing
    const demoAccounts = [
      { email: 'producer@production.com', password: 'password123', role: 'Producer', name: 'Executive Producer', id: 'u-prod', is_admin: false },
      { email: 'admin@production.com', password: 'password123', role: '1st_AD', name: 'Assistant Director', id: 'crew-4', is_admin: true },
      { email: 'crew@production.com', password: 'password123', role: 'Crew', name: 'Natdanai (DP)', id: 'crew-1', is_admin: false },
      { email: 'talent@production.com', password: 'password123', role: 'Talent', name: 'Pimrada (Designer)', id: 'crew-2', is_admin: false }
    ];
    
    const matchedDemo = demoAccounts.find(d => d.email === email && d.password === password);
    if (matchedDemo) {
      // Auto-add demo user to dynamic list so they appear in user tables
      let dbUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!dbUser) {
        try {
          dbUser = await api.createUser(matchedDemo.name, matchedDemo.email, matchedDemo.password, matchedDemo.role);
          setUsers(prev => [...prev, dbUser]);
          setIsFirstTimeSetup(false);
        } catch (e) {
          console.error("Failed to auto-create demo user:", e);
        }
      }
      
      const userData = {
        email: dbUser ? dbUser.email : matchedDemo.email,
        role: dbUser ? dbUser.role : matchedDemo.role,
        name: dbUser ? dbUser.name : matchedDemo.name,
        id: dbUser ? dbUser.id : matchedDemo.id,
        is_admin: dbUser ? (dbUser.is_admin || dbUser.email?.toLowerCase() === 'admin@production.com') : (matchedDemo.email?.toLowerCase() === 'admin@production.com')
      };
      
      localStorage.setItem('prod_user', JSON.stringify(userData));
      setUser(userData);
      window.location.hash = '#/dashboard';
      return { success: true };
    }

    return { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
  };

  const registerFirstUser = async (name, email, password) => {
    const newUser = await api.createUser(name, email, password, 'Producer'); // First user is Producer
    setUsers([newUser]);
    setIsFirstTimeSetup(false);

    // Automatically add as a Crew Member in the crew roster
    try {
      await api.createCrewMember({
        name: { th: name, en: name },
        role: 'Producer',
        role_th: 'ผู้ดำเนินงานสร้าง (Producer)',
        email: email,
        phone: '-',
        booked_dates: [],
        tasks: {
          th: ["เตรียมอุปกรณ์ส่วนตัวสำหรับการทำงาน", "ตรวจสอบใบสั่งงานกองถ่าย (Call Sheet)"],
          en: ["Prepare personal tools for the day", "Review daily call sheets"]
        }
      });
    } catch (err) {
      console.error("Failed to auto-create crew member for first setup:", err);
    }
    
    const userData = {
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      id: newUser.id,
      is_admin: newUser.is_admin || newUser.email?.toLowerCase() === 'admin@production.com'
    };
    localStorage.setItem('prod_user', JSON.stringify(userData));
    setUser(userData);
    window.location.hash = '#/dashboard';
  };

  const registerUserByAdmin = async (name, email, password, role) => {
    // Check if email already exists
    const allUsers = await api.getUsers();
    if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered');
    }

    const newUser = await api.createUser(name, email, password, role);
    setUsers(prev => [...prev, newUser]);
    setIsFirstTimeSetup(false);

    // Automatically add as a Crew Member in the crew roster
    try {
      const allCrew = await api.getCrew();
      const crewExists = allCrew.some(c => c.email.toLowerCase() === email.toLowerCase());
      if (!crewExists) {
        const roleTh = role === 'Producer' ? 'ผู้ดำเนินงานสร้าง (Producer)' 
                       : role === '1st_AD' ? 'ผู้ช่วยผู้กำกับ 1 (1st AD)' 
                       : role === 'Director' ? 'ผู้กำกับ (Director)' 
                       : role === 'Production_Manager' ? 'ผู้จัดการกองถ่าย (Production Manager)' 
                       : role === 'Screenwriter' ? 'นักเขียนบท (Screenwriter)' 
                       : role === 'Crew' ? 'ทีมงานฝ่ายผลิต (Crew)' 
                       : role === 'Talent' ? 'นักแสดง / แบบ (Talent)' : role;
        await api.createCrewMember({
          name: { th: name, en: name },
          role: role,
          role_th: roleTh,
          email: email,
          phone: '-',
          booked_dates: [],
          tasks: {
            th: ["เตรียมอุปกรณ์ส่วนตัวสำหรับการทำงาน", "ตรวจสอบใบสั่งงานกองถ่าย (Call Sheet)"],
            en: ["Prepare personal tools for the day", "Review daily call sheets"]
          }
        });
      }
    } catch (err) {
      console.error("Failed to auto-create crew member:", err);
    }

    return newUser;
  };

  const toggleUserAdminByAdmin = async (userId, isAdminFlag) => {
    await api.updateUserAdmin(userId, isAdminFlag);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: isAdminFlag } : u));
    
    // Find target user email in dynamic list
    const targetUser = users.find(u => u.id === userId);
    const targetEmail = targetUser?.email || '';

    // Update logged in user state if current user is elevated/demoted (match by ID or Email)
    if (user?.id === userId || (user?.email && targetEmail && user.email.toLowerCase() === targetEmail.toLowerCase())) {
      const updatedUser = { ...user, is_admin: isAdminFlag };
      localStorage.setItem('prod_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const deleteUserByAdmin = async (id) => {
    // 1. Delete from dynamic users database
    await api.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));

    // 2. Check if there's a corresponding crew member and auto-delete
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete) {
      try {
        const allCrew = await api.getCrew();
        const matchedCrew = allCrew.find(c => c.email?.toLowerCase() === userToDelete.email?.toLowerCase());
        if (matchedCrew) {
          await api.deleteCrewMember(matchedCrew.id);
        }
      } catch (err) {
        console.error("Failed to auto-delete corresponding crew member:", err);
      }
    }

    // Check if system is now empty
    const remaining = users.filter(u => u.id !== id);
    setIsFirstTimeSetup(remaining.length === 0);
  };

  const logout = () => {
    localStorage.removeItem('prod_user');
    setUser(null);
    window.location.hash = '#/login';
  };

  const isAdmin = () => {
    return !!user?.is_admin || user?.email?.toLowerCase() === 'admin@production.com';
  };

  const hasWriteAccess = () => {
    return ['Producer', '1st_AD', 'Director', 'Production_Manager', 'Screenwriter'].includes(user?.role) || isAdmin();
  };

  const isCrewOrTalent = () => {
    // Only collapse navigation if specifically designated as talent without project department role
    return user?.role === 'Talent' && !isAdmin();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users,
      login, 
      logout, 
      isAdmin,
      hasWriteAccess, 
      isCrewOrTalent,
      isFirstTimeSetup,
      registerFirstUser,
      registerUserByAdmin,
      toggleUserAdminByAdmin,
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
