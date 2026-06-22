import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Film, Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const [email, setEmail] = useState('admin@production.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      if (password === 'password123') {
        if (email === 'producer@production.com') {
          onLogin({ email, role: 'Producer', name: 'Executive Producer', id: 'u-prod' });
        } else if (email === 'admin@production.com') {
          onLogin({ email, role: '1st_AD', name: 'Assistant Director', id: 'crew-4' });
        } else if (email === 'crew@production.com') {
          onLogin({ email, role: 'Crew', name: 'Natdanai (DP)', id: 'crew-1' });
        } else if (email === 'talent@production.com') {
          onLogin({ email, role: 'Talent', name: 'Pimrada (Designer)', id: 'crew-2' });
        } else {
          setError(language === 'th' ? 'อีเมลไม่ถูกต้องสำหรับผู้ใช้สาธิต' : 'Invalid email for demo user');
          setIsLoading(false);
        }
      } else {
        setError(language === 'th' ? 'รหัสผ่านไม่ถูกต้อง (ลองใช้ password123)' : 'Invalid password (try password123)');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-200 ${
      theme === 'dark' ? 'bg-obsidian-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Decorative Blur Spheres (Cinematic Lights) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#808080_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Login Card */}
      <div className={`w-full max-w-md p-8 md:p-10 rounded-2xl border backdrop-blur-md shadow-2xl space-y-8 z-10 transition-all duration-300 ${
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
              {language === 'th' ? 'ห้องควบคุมการผลิตภาพยนตร์' : 'Film Production Dashboard'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-xs font-semibold text-center animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="director@studio.com"
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

          {/* Submit Button */}
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

        {/* Demo Credentials Hint */}
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

      </div>
    </div>
  );
}
