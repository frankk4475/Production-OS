import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  FolderKanban,
  Sun,
  Moon,
  Languages,
  Menu,
  ChevronLeft,
  ChevronRight,
  Film,
  Sparkles,
  X,
  Layers,
  PenTool,
  BookOpen,
  Shield
} from 'lucide-react';

const getRoleLabel = (roleName, language) => {
  switch (roleName) {
    case 'Producer': return language === 'th' ? 'ผู้ดำเนินงานสร้าง' : 'Producer';
    case '1st_AD': return language === 'th' ? 'ผู้ช่วยผู้กำกับ 1' : '1st AD';
    case 'Director': return language === 'th' ? 'ผู้กำกับ' : 'Director';
    case 'Production_Manager': return language === 'th' ? 'ผู้จัดการกองถ่าย' : 'Production Manager';
    case 'Screenwriter': return language === 'th' ? 'นักเขียนบท' : 'Screenwriter';
    case 'Script_Supervisor': return language === 'th' ? 'ผู้บันทึกการถ่ายทำ' : 'Script Supervisor';
    case 'DP': return language === 'th' ? 'ผู้กำกับภาพ' : 'Director of Photography';
    case 'Focus_Puller': return language === 'th' ? 'ผู้ช่วยกล้อง 1' : 'Focus Puller';
    case 'Camera_Assistant': return language === 'th' ? 'ผู้ช่วยกล้อง 2' : 'Camera Assistant';
    case 'Key_Grip': return language === 'th' ? 'หัวหน้าช่างคุมอุปกรณ์กล้อง' : 'Key Grip';
    case 'Gaffer': return language === 'th' ? 'หัวหน้าช่างไฟ' : 'Gaffer';
    case 'Electric': return language === 'th' ? 'ช่างไฟ' : 'Best Boy Electric';
    case 'Production_Designer': return language === 'th' ? 'ผู้กำกับศิลป์' : 'Production Designer';
    case 'Prop_Master': return language === 'th' ? 'ผู้ดูแลอุปกรณ์ประกอบฉาก' : 'Prop Master';
    case 'Sound_Mixer': return language === 'th' ? 'ช่างบันทึกเสียง' : 'Sound Mixer';
    case 'Boom_Operator': return language === 'th' ? 'คนถือไมค์บูม' : 'Boom Operator';
    case 'Makeup_Artist': return language === 'th' ? 'ช่างแต่งหน้าหลัก' : 'Key Makeup Artist';
    case 'Costume_Designer': return language === 'th' ? 'ช่างออกแบบเครื่องแต่งกาย' : 'Costume Designer';
    case 'Talent': return language === 'th' ? 'นักแสดง' : 'Talent';
    case 'Production_Assistant': return language === 'th' ? 'ผู้ช่วยทั่วไปในกองถ่าย' : 'Production Assistant';
    case 'Crew': return language === 'th' ? 'ทีมงานฝ่ายผลิต' : 'Crew';
    default: return roleName;
  }
};

export default function Layout({ 
  children, 
  currentTab, 
  setCurrentTab
}) {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, hasWriteAccess, isCrewOrTalent } = useAuth();
  const {
    projects,
    currentProjectId,
    setCurrentProjectId,
    currentProject: project,
    handleAddProject
  } = useProject();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // New Project Form State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjNameTh, setNewProjNameTh] = useState('');
  const [newProjNameEn, setNewProjNameEn] = useState('');
  const [newProjDirectorTh, setNewProjDirectorTh] = useState('');
  const [newProjDirectorEn, setNewProjDirectorEn] = useState('');
  const [newProjProducerTh, setNewProjProducerTh] = useState('');
  const [newProjProducerEn, setNewProjProducerEn] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjStatus, setNewProjStatus] = useState('pre-prod');
  const [newProjStartDate, setNewProjStartDate] = useState('');
  const [newProjDeadline, setNewProjDeadline] = useState('');
  const [newProjBudget, setNewProjBudget] = useState('');
  const [newProjCompletion, setNewProjCompletion] = useState(0);

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjNameEn || !newProjDirectorEn) return;

    const newProj = {
      title: { th: newProjNameTh || newProjNameEn, en: newProjNameEn },
      director: { th: newProjDirectorTh || newProjDirectorEn, en: newProjDirectorEn },
      producer: { th: newProjProducerTh || newProjProducerEn, en: newProjProducerEn },
      client: newProjClient || '-',
      status: newProjStatus,
      start_date: newProjStartDate || new Date().toISOString().split('T')[0],
      deadline: newProjDeadline || new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
      total_budget: newProjBudget || '฿0',
      completion_percentage: Number(newProjCompletion)
    };

    try {
      await handleAddProject(newProj);
      setIsNewProjectModalOpen(false);

      // Reset fields
      setNewProjNameTh('');
      setNewProjNameEn('');
      setNewProjDirectorTh('');
      setNewProjDirectorEn('');
      setNewProjProducerTh('');
      setNewProjProducerEn('');
      setNewProjClient('');
      setNewProjStatus('pre-prod');
      setNewProjStartDate('');
      setNewProjDeadline('');
      setNewProjBudget('');
      setNewProjCompletion(0);
    } catch (err) {
      alert("Failed to create project: " + err.message);
    }
  };

  const baseMenuItems = isCrewOrTalent()
    ? [
        { id: 'personal', label: language === 'th' ? 'พื้นที่งานส่วนตัว' : 'Personal Workspace', icon: Users },
        { id: 'callsheets', label: language === 'th' ? 'ใบสั่งงานของฉัน' : 'My Call Sheets', icon: FileText },
        { id: 'calendar', label: language === 'th' ? 'ปฏิทินงานหลัก' : 'Calendar', icon: Calendar }
      ]
    : [
        { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { id: 'storyOutline', label: t('nav.storyOutline'), icon: BookOpen },
        { id: 'script', label: t('nav.scriptEditor'), icon: PenTool },
        { id: 'breakdown', label: t('nav.scriptBreakdown'), icon: Layers },
        { id: 'shootingSchedule', label: language === 'th' ? 'ตารางถ่ายทำ (Stripboard)' : 'Shooting Schedule', icon: Film },
        { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
        { id: 'crew', label: t('nav.crewPortal'), icon: Users },
        { id: 'docs', label: t('nav.documentsHub'), icon: FolderKanban },
      ];

  const menuItems = [...baseMenuItems];
  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${theme === 'dark' ? 'dark bg-obsidian-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Sidebar - Desktop */}
      <aside className={`no-print hidden md:flex flex-col border-r shrink-0 transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${
        theme === 'dark' 
          ? 'bg-obsidian-900/40 border-obsidian-800/40 backdrop-blur-md' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-inherit">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gold-500/10 text-gold-500' : 'bg-gold-100 text-gold-600'}`}>
              <Film size={20} />
            </div>
            {!sidebarCollapsed && (
              <span className="font-extrabold tracking-wide text-lg font-serif">
                {t('nav.title')}
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1.5 rounded-lg border transition-all ${
              theme === 'dark' 
                ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400 hover:text-slate-100' 
                : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-gold-500/15 text-gold-500 border-l-2 border-gold-500 pl-2.5 shadow-sm'
                      : 'bg-gold-50 text-gold-700 border-l-2 border-gold-600 pl-2.5 shadow-sm'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:bg-obsidian-800/50 hover:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-inherit' : 'text-slate-500'}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-inherit space-y-2">
          {!sidebarCollapsed && (
            <div className={`p-3 rounded-lg border text-xs ${
              theme === 'dark' ? 'bg-obsidian-800/30 border-obsidian-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold text-slate-400 mb-1">
                <Sparkles size={12} className="text-gold-500" />
                <span>{t('nav.tagline')}</span>
              </div>
              <p className="line-clamp-2">{project?.title?.[language] || ''}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="no-print fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`no-print fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        theme === 'dark' ? 'bg-obsidian-900 border-r border-obsidian-800' : 'bg-white border-r border-slate-200'
      }`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-inherit">
          <div className="flex items-center gap-3">
            <Film className="text-gold-500" size={24} />
            <span className="font-extrabold tracking-wide text-lg font-serif">
              {t('nav.title')}
            </span>
          </div>
          <button 
            onClick={() => setMobileOpen(false)}
            className={`p-1.5 rounded-lg border ${
              theme === 'dark' ? 'border-obsidian-800 text-slate-400' : 'border-slate-200 text-slate-600'
            }`}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-gold-500/15 text-gold-500 border-l-2 border-gold-500 pl-2.5'
                      : 'bg-gold-50 text-gold-700 border-l-2 border-gold-600 pl-2.5'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:bg-obsidian-800 hover:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Header */}
        <header className={`no-print h-16 flex items-center justify-between px-4 md:px-8 border-b sticky top-0 z-30 backdrop-blur-md ${
          theme === 'dark' 
            ? 'bg-obsidian-950/80 border-obsidian-800/40 text-slate-100' 
            : 'bg-slate-50/80 border-slate-200/50 text-slate-800'
        }`}>
          {/* Header Left: Mobile Toggle & Page title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className={`p-2 rounded-lg border md:hidden ${
                theme === 'dark' ? 'border-obsidian-800 text-slate-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={currentProjectId}
                  onChange={(e) => {
                    if (e.target.value === 'NEW') {
                      setIsNewProjectModalOpen(true);
                      e.target.value = currentProjectId; // reset visually
                    } else {
                      setCurrentProjectId(e.target.value);
                    }
                  }}
                  className={`pl-3 pr-8 py-1 rounded-lg border font-bold text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer appearance-none ${
                    theme === 'dark' 
                      ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' 
                      : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                  }`}
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${theme === 'dark' ? 'goldenrod' : 'gray'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 8px center', 
                    backgroundSize: '14px' 
                  }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title?.[language]}</option>
                  ))}
                  {hasWriteAccess() && (
                    <option value="NEW" className="text-gold-500 font-semibold">+ {language === 'th' ? 'สร้างโปรเจกต์ใหม่' : 'Create New Project'}</option>
                  )}
                </select>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wider ${
                project?.status === 'shooting'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {t(`project.status.${project?.status === 'pre-prod' ? 'preProd' : project?.status}`)}
              </span>
            </div>
          </div>

          {/* Header Right: Lang, Theme & Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-300'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
              title="Switch Language"
            >
              <Languages size={14} />
              <span>{language === 'th' ? 'EN' : 'ไทย'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'border-obsidian-800 hover:bg-obsidian-800 text-gold-500'
                  : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
              title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Avatar / Active User & Logout */}
            <div className="flex items-center gap-2 border-l pl-3 border-slate-200 dark:border-obsidian-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-600 to-amber-400 flex items-center justify-center text-xs font-extrabold text-white shadow-md">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'AD'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight truncate max-w-[100px]">{user?.name || 'User'}</span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight">
                    {getRoleLabel(user?.role, language) || '1st AD'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className={`ml-2 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                  theme === 'dark'
                    ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400'
                    : 'border-red-250 bg-red-50 hover:bg-red-100 text-red-650'
                }`}
              >
                {language === 'th' ? 'ออก' : 'Logout'}
              </button>
            </div>

          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>

      {/* New Project Creator Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-inherit flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <Sparkles size={18} className="text-gold-500" />
                <span>{language === 'th' ? 'สร้างโปรเจกต์ใหม่' : 'Create New Project'}</span>
              </h2>
              <button 
                onClick={() => setIsNewProjectModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateProjectSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Project Names TH & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ชื่อโปรเจกต์ (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={newProjNameTh}
                    onChange={(e) => setNewProjNameTh(e.target.value)}
                    placeholder="เช่น เงาเที่ยงคืน"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Project Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjNameEn}
                    onChange={(e) => setNewProjNameEn(e.target.value)}
                    placeholder="e.g. The Midnight Director"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Director TH & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ผู้กำกับ (Director) (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={newProjDirectorTh}
                    onChange={(e) => setNewProjDirectorTh(e.target.value)}
                    placeholder="ชื่อผู้กำกับภาษาไทย"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Director (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjDirectorEn}
                    onChange={(e) => setNewProjDirectorEn(e.target.value)}
                    placeholder="Director name in English"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Producer TH & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ผู้อำนวยการสร้าง (Producer) (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={newProjProducerTh}
                    onChange={(e) => setNewProjProducerTh(e.target.value)}
                    placeholder="ชื่อโปรดิวเซอร์ภาษาไทย"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Producer (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjProducerEn}
                    onChange={(e) => setNewProjProducerEn(e.target.value)}
                    placeholder="Producer name in English"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Client, Total Budget, Completion % */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ลูกค้า (Client)
                  </label>
                  <input
                    type="text"
                    value={newProjClient}
                    onChange={(e) => setNewProjClient(e.target.value)}
                    placeholder="e.g. A24"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    งบประมาณทั้งหมด (Total Budget)
                  </label>
                  <input
                    type="text"
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(e.target.value)}
                    placeholder="e.g. ฿5,000,000"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    เปอร์เซ็นต์เริ่มต้น (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newProjCompletion}
                    onChange={(e) => setNewProjCompletion(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Start Date, Deadline, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    วันเริ่มต้นโปรเจกต์ (Start Date)
                  </label>
                  <input
                    type="date"
                    value={newProjStartDate}
                    onChange={(e) => setNewProjStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    วันส่งมอบงาน (Deadline)
                  </label>
                  <input
                    type="date"
                    value={newProjDeadline}
                    onChange={(e) => setNewProjDeadline(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    สถานะการผลิต (Status)
                  </label>
                  <select
                    value={newProjStatus}
                    onChange={(e) => setNewProjStatus(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="pre-prod">{t('project.status.preProd')}</option>
                    <option value="shooting">{t('project.status.shooting')}</option>
                    <option value="wrap">{t('project.status.wrap')}</option>
                    <option value="post-prod">{t('project.status.postProd')}</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-inherit shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    theme === 'dark'
                      ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400 hover:text-slate-100'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {t('breakdown.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white shadow-md transition-all"
                >
                  {t('breakdown.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
