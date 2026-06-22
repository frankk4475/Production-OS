import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Film, Lock, Mail, Eye, EyeOff, Sparkles, User } from 'lucide-react';

export default function LoginPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  
  const { 
    isFirstTimeSetup, 
    registerFirstUser, 
    login 
  } = useAuth();

  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // First-time Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate short network delay for aesthetics
    setTimeout(async () => {
      try {
        const result = await login(email, password);
        if (!result.success) {
          setError(language === 'th' ? result.error : 'Invalid email or password');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill all fields');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError(language === 'th' ? 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' : 'Passwords do not match');
      return;
    }

    if (regPassword.length < 6) {
      setError(language === 'th' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      try {
        await registerFirstUser(regName, regEmail, regPassword);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-200 ${
      theme === 'dark' ? 'bg-obsidian-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Decorative Blur Spheres (Cinematic Lights) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#808080_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Login / Register Card */}
      <div className={`w-full max-w-md p-8 md:p-10 rounded-2xl border backdrop-blur-md shadow-2xl space-y-6 z-10 transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-obsidian-900/60 border-obsidian-800/40 text-slate-100 shadow-gold-500/5' 
          : 'bg-white/90 border-slate-200 text-slate-900 shadow-slate-200'
      }`}>
        
        {/* Logo and Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-gold-600 to-amber-400 text-white shadow-lg mx-auto">
            <Film size={28} className="animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight font-serif flex items-center justify-center gap-1.5">
              <span>{language === 'th' ? 'ระบบจัดการกองถ่าย' : 'Production OS'}</span>
              <Sparkles size={16} className="text-gold-500" />
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
              {isFirstTimeSetup 
                ? (language === 'th' ? 'สร้างบัญชีผู้ดูแลคนแรก' : 'Admin First setup')
                : (language === 'th' ? 'ห้องควบคุมการผลิตภาพยนตร์' : 'Film Production Dashboard')}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold text-center animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Dynamic Forms Switch */}
        {isFirstTimeSetup ? (
          /* FIRST TIME SETUP: REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="p-3 rounded-lg bg-gold-500/5 border border-gold-500/20 text-xs text-center text-gold-500 font-medium">
              💡 {language === 'th' 
                ? 'ตรวจพบบัญชีผู้ใช้งานว่างเปล่า! กรุณาสร้างบัญชีผู้บริหารงานสร้างคนแรก (สิทธิ์ Producer/แอดมิน)'
                : 'No users found! Please register the first Executive Administrator (Producer role)'}
            </div>

            {/* Name input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'ชื่อ-นามสกุลจริง' : 'Full Name'}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Frank Kaifrabk"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'อีเมลสำหรับเข้าสู่ระบบ' : 'Login Email'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin@studio.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'ตั้งรหัสผ่าน' : 'Password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Confirm Password input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'ยืนยันรหัสผ่านอีกครั้ง' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{language === 'th' ? 'สร้างบัญชีแรกและเข้าสู่ระบบ' : 'Initialize Studio Admin Account'}</span>
              )}
            </button>
          </form>
        ) : (
          /* STANDARD LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'th' ? 'อีเมลผู้ใช้งาน' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studio.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'th' ? 'รหัสผ่าน' : 'Password'}
                </label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all ${
                    theme === 'dark' 
                      ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{language === 'th' ? 'เข้าสู่ระบบ' : 'Login to Dashboard'}</span>
              )}
            </button>
          </form>
        )}

        {/* Demo Credentials Hint */}
        {!isFirstTimeSetup && (
          <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
            theme === 'dark' ? 'bg-obsidian-950/60 border-obsidian-800/60' : 'bg-slate-50 border-slate-200/50 shadow-inner'
          }`}>
            <p className="font-bold text-gold-500 text-center">💡 บัญชีทดสอบสิทธิ์การใช้งาน (Demo Accounts)</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-450 font-mono text-[10px]">
              <div>Producer (Write):</div><div>producer@production.com</div>
              <div>1st AD (Write):</div><div>admin@production.com</div>
              <div>Crew (Trimmed):</div><div>crew@production.com</div>
              <div>Talent (Trimmed):</div><div>talent@production.com</div>
            </div>
            <p className="text-center text-[10px] text-slate-450 mt-1 font-semibold">Password: password123</p>
          </div>
        )}

      </div>
    </div>
  );
}
