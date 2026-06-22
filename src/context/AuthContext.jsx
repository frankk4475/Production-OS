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
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user state from localStorage:", e);
      localStorage.removeItem('prod_user');
      return null;
    }
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

  const login = async (email, password) => {
    // 1. Search in dynamic users database
    const allUsers = await api.getUsers();
    const matched = allUsers.find(
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
      const userExists = allUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (!userExists) {
        try {
          const added = await api.createUser(matchedDemo.name, matchedDemo.email, matchedDemo.password, matchedDemo.role);
          setUsers(prev => [...prev, added]);
          setIsFirstTimeSetup(false);
        } catch (e) {
          console.error("Failed to auto-create demo user:", e);
        }
      }
      localStorage.setItem('prod_user', JSON.stringify(matchedDemo));
      setUser(matchedDemo);
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
      console.error("Failed to auto-create crew member on first register:", err);
    }
    
    // Auto-login
    localStorage.setItem('prod_user', JSON.stringify(newUser));
    setUser(newUser);
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
      console.error("Failed to auto-create crew member on admin register:", err);
    }

    return newUser;
  };

  const deleteUserByAdmin = async (id) => {
    if (id === user?.id) {
      throw new Error('Cannot delete your own logged-in account');
    }

    const targetUser = users.find(u => u.id === id);

    await api.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    
    // Automatically delete corresponding crew member in roster
    if (targetUser && targetUser.email) {
      try {
        const allCrew = await api.getCrew();
        const matchCrew = allCrew.find(c => c.email.toLowerCase() === targetUser.email.toLowerCase());
        if (matchCrew) {
          await api.deleteCrewMember(matchCrew.id);
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
