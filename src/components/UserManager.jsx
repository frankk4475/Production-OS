import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  Users,
  Trash2, 
  Key, 
  Mail, 
  ShieldAlert, 
  Sparkles, 
  User, 
  Shield, 
  Check, 
  RefreshCw 
} from 'lucide-react';

export default function UserManager() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  
  const { 
    user: currentUser, 
    users, 
    registerUserByAdmin, 
    deleteUserByAdmin 
  } = useAuth();

  // New user form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Crew');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบทุกช่อง' : 'Please fill out all fields');
      return;
    }

    if (password.length < 6) {
      setError(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      try {
        await registerUserByAdmin(name, email, password, role);
        setSuccessMsg(language === 'th' ? 'สร้างบัญชีผู้ใช้งานสำเร็จ!' : 'User account created successfully!');
        
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setRole('Crew');
      } catch (err) {
        setError(language === 'th' ? `ข้อผิดพลาด: อีเมลนี้อาจถูกใช้งานไปแล้ว` : `Error: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }, 500);
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === currentUser?.id) {
      alert(language === 'th' ? 'คุณไม่สามารถลบบัญชีที่กำลังล็อกอินใช้งานอยู่ได้' : 'Cannot delete your own active account!');
      return;
    }

    const confirmMsg = language === 'th'
      ? `คุณแน่ใจว่าต้องการลบบัญชีผู้ใช้ "${userEmail}" ใช่หรือไม่?`
      : `Are you sure you want to delete user account "${userEmail}"?`;

    if (window.confirm(confirmMsg)) {
      try {
        await deleteUserByAdmin(userId);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Helper to translate roles nicely
  const getRoleLabel = (roleName) => {
    switch (roleName) {
      case 'Producer':
        return language === 'th' ? 'ผู้ดำเนินงานสร้าง (Producer)' : 'Producer';
      case '1st_AD':
        return language === 'th' ? 'ผู้ช่วยผู้กำกับ 1 (1st AD)' : '1st AD (Assistant Director)';
      case 'Crew':
        return language === 'th' ? 'ทีมงานฝ่ายผลิต (Crew)' : 'Crew Member';
      case 'Talent':
        return language === 'th' ? 'นักแสดง / แบบ (Talent)' : 'Talent / Actor';
      default:
        return roleName;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-obsidian-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Shield className="text-gold-500 animate-pulse" size={24} />
            <span>{language === 'th' ? 'จัดการสิทธิ์และบัญชีผู้ใช้งาน' : 'User Access Management'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'th'
              ? 'ระบบการควบคุมสิทธิ์ เพิ่มบัญชีทีมงาน และควบคุมระดับการแก้ไขข้อมูลในการผลิต'
              : 'Add new crew member logins, manage authorization levels, and control write permissions.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CREATE ACCOUNT PANEL */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800/80 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800/50 pb-2 flex items-center gap-1.5">
            <UserPlus size={16} className="text-gold-500" />
            <span>{language === 'th' ? 'สร้างบัญชีผู้ใช้งานใหม่' : 'Register New User'}</span>
          </h2>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold text-center animate-shake">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs font-semibold text-center flex items-center justify-center gap-1">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-left">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'ชื่อ-นามสกุลทีมงาน' : 'Full Name'}
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Somchai Dev"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'อีเมลแอดเดรส' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="somchai@production.com"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'ตั้งรหัสผ่านเริ่มต้น' : 'Temporary Password'}
              </label>
              <div className="relative">
                <Key size={14} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Role select */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'ระดับสิทธิ์การใช้งาน (User Role)' : 'Authorized Level Role'}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all text-xs ${
                  theme === 'dark' 
                    ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 shadow-inner'
                }`}
              >
                <option value="Producer">{language === 'th' ? 'ผู้ดำเนินงานสร้าง (Producer) • สิทธิ์เขียน/แก้ไข' : 'Producer (Write/Edit Access)'}</option>
                <option value="1st_AD">{language === 'th' ? 'ผู้ช่วยผู้กำกับ 1 (1st AD) • สิทธิ์เขียน/แก้ไข' : '1st AD (Write/Edit Access)'}</option>
                <option value="Crew">{language === 'th' ? 'ทีมงาน (Crew) • ดูข้อมูลคิวตัวเอง/อ่านอย่างเดียว' : 'Crew Member (Personal schedule / Read-only)'}</option>
                <option value="Talent">{language === 'th' ? 'นักแสดง (Talent) • ดูข้อมูลคิวตัวเอง/อ่านอย่างเดียว' : 'Talent / Actor (Personal schedule / Read-only)'}</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98"
            >
              {isSubmitting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>{language === 'th' ? 'สร้างบัญชีผู้ใช้งาน' : 'Create User Account'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* LIST OF ACCOUNTS */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800/80 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800/50 pb-2 flex items-center gap-1.5">
            <Users size={16} className="text-gold-500" />
            <span>{language === 'th' ? 'บัญชีผู้ใช้งานที่ลงทะเบียนแล้ว' : 'Registered System Users'}</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/50 text-slate-400 uppercase tracking-widest text-[9px] font-mono">
                  <th className="py-3 px-2">{language === 'th' ? 'ชื่อ-นามสกุล' : 'Name'}</th>
                  <th className="py-3 px-2">{language === 'th' ? 'อีเมล' : 'Email Address'}</th>
                  <th className="py-3 px-2">{language === 'th' ? 'ระดับสิทธิ์' : 'Role level'}</th>
                  <th className="py-3 px-2 text-right">{language === 'th' ? 'จัดการ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const safeUsers = Array.isArray(users) ? users : [];
                  return safeUsers.map((u) => {
                    const isCurrent = u.id === currentUser?.id;
                    return (
                      <tr 
                        key={u.id} 
                        className={`border-b border-slate-800/20 hover:bg-slate-900/10 dark:hover:bg-obsidian-900/40 transition-colors ${
                          isCurrent ? 'bg-gold-500/5 dark:bg-gold-500/5 text-gold-500 font-medium' : ''
                        }`}
                      >
                        <td className="py-3.5 px-2 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-500 uppercase shrink-0">
                              {language === 'th' ? 'คุณ' : 'You'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-slate-400 font-mono select-all">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            u.role === 'Producer' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : u.role === '1st_AD'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={isCurrent}
                            className="p-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 disabled:opacity-20 transition-all cursor-pointer inline-flex"
                            title={isCurrent ? "Cannot delete yourself" : "Delete account"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}

                {(!Array.isArray(users) || users.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 italic">
                      {language === 'th' ? 'ไม่มีรายชื่อผู้ใช้งานลงทะเบียนในขณะนี้' : 'No registered users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-slate-400 leading-relaxed flex gap-2">
            <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">{language === 'th' ? 'ข้อควรรู้เกี่ยวกับระดับสิทธิ์:' : 'Role Access Policy Info:'}</p>
              <ul className="list-disc pl-4 space-y-0.5 mt-1 font-sans">
                <li>{language === 'th' ? 'สิทธิ์ Producer และ 1st AD สามารถเข้าถึง เขียน แก้ไข จัดการคิวงาน และจัดการรายชื่อบัญชีผู้ใช้งานได้ทั้งหมด' : 'Producer and 1st AD accounts hold root editor permissions including user management.'}</li>
                <li>{language === 'th' ? 'สิทธิ์ Crew และ Talent จะไม่สามารถแก้ไขข้อมูลการผลิตได้ โดยสามารถล็อกอินเข้ามาเพื่อดู คิวงานนัดหมาย และตารางเวลาปฏิบัติหน้าที่ส่วนตัวเท่านั้น' : 'Crew and Talent accounts are restricted to personal schedule viewer modes.'}</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
