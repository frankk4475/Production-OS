import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Clapperboard, 
  Clock, 
  CloudSun,
  User,
  Layers,
  ArrowRight,
  Edit2,
  Database,
  Download,
  Upload,
  RotateCcw,
  X,
  Sparkles,
  MapPin,
  Loader2,
  Plus
} from 'lucide-react';

export default function Dashboard({ setCurrentTab }) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();

  const {
    projects,
    currentProject: project,
    updateProject: setProject,
    handleDeleteProject: onDeleteProject,
    handleAddProject,
    activeScenes: scenes,
    activeCrew: crew,
    activeEvents: events,
    weather,
    setWeather,
    isLoading,
    exportDatabase: onExportData,
    importDatabase: onImportData,
    resetDatabase: onResetData
  } = useProject();

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Fields for editing project
  const [editNameTh, setEditNameTh] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editDirectorTh, setEditDirectorTh] = useState('');
  const [editDirectorEn, setEditDirectorEn] = useState('');
  const [editProducerTh, setEditProducerTh] = useState('');
  const [editProducerEn, setEditProducerEn] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editStatus, setEditStatus] = useState('pre-prod');
  const [editDeadline, setEditDeadline] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editTotalBudget, setEditTotalBudget] = useState('');
  const [editCompletion, setEditCompletion] = useState(0);

  // Fields for empty state creation
  const [emptyTitleTh, setEmptyTitleTh] = useState('');
  const [emptyTitleEn, setEmptyTitleEn] = useState('');
  const [emptyDirectorTh, setEmptyDirectorTh] = useState('');
  const [emptyDirectorEn, setEmptyDirectorEn] = useState('');
  const [emptyProducerTh, setEmptyProducerTh] = useState('');
  const [emptyProducerEn, setEmptyProducerEn] = useState('');
  const [emptyClient, setEmptyClient] = useState('');
  const [emptyStartDate, setEmptyStartDate] = useState('');
  const [emptyDeadline, setEmptyDeadline] = useState('');
  const [emptyBudget, setEmptyBudget] = useState('');

  const handleOpenEditModal = () => {
    if (!project) return;
    setEditNameTh(project.title?.th || '');
    setEditNameEn(project.title?.en || '');
    setEditDirectorTh(project.director?.th || '');
    setEditDirectorEn(project.director?.en || '');
    setEditProducerTh(project.producer?.th || '');
    setEditProducerEn(project.producer?.en || '');
    setEditClient(project.client || '');
    setEditStatus(project.status || 'pre-prod');
    setEditDeadline(project.deadline || '');
    setEditStartDate(project.start_date || '');
    setEditTotalBudget(project.total_budget || '');
    setEditCompletion(project.completion_percentage || 0);
    setIsEditModalOpen(true);
  };

  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const mapWmoToWeatherState = (code) => {
    if (code === 0) return 'Sunny';
    if ([1, 2, 3, 45, 48].includes(code)) return 'Cloudy';
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86].includes(code)) return 'Rainy';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';
    return 'Sunny'; // fallback
  };

  const handleFetchLiveWeather = () => {
    if (!navigator.geolocation) {
      const errTh = "เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS";
      const errEn = "Geolocation is not supported by your browser";
      alert(language === 'th' ? errTh : errEn);
      return;
    }

    setIsWeatherLoading(true);
    setWeatherError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
          );
          
          if (!weatherResponse.ok) throw new Error("Weather service error");
          
          const weatherData = await weatherResponse.json();
          const current = weatherData.current;
          const temp = Math.round(current.temperature_2m);
          const humidity = current.relative_humidity_2m;
          const windSpeed = Math.round(current.wind_speed_10m);
          const wmoCode = current.weather_code;

          const mappedState = mapWmoToWeatherState(wmoCode);

          let locationName = '';
          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=${language}`
            );
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              const addr = geoData.address;
              locationName = addr.city || addr.town || addr.suburb || addr.village || addr.province || addr.state || '';
            }
          } catch (geoErr) {
            console.error("Reverse geocoding failed", geoErr);
          }

          const locationText = locationName ? ` (${locationName})` : ` (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
          const detailsString = `${temp}°C | ${language === 'th' ? 'ความชื้น' : 'Humidity'} ${humidity}% | ${language === 'th' ? 'ลม' : 'Wind'} ${windSpeed} km/h${locationText}`;

          setWeather(mappedState, detailsString);
          setIsWeatherLoading(false);
        } catch (err) {
          console.error("Failed to fetch weather data:", err);
          const errMsg = language === 'th' 
            ? "ไม่สามารถดึงข้อมูลสภาพอากาศจริงได้: " + err.message
            : "Failed to fetch actual weather: " + err.message;
          setWeatherError(errMsg);
          setIsWeatherLoading(false);
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        const errMsg = geoError.code === geoError.PERMISSION_DENIED
          ? (language === 'th' 
              ? "การเข้าถึงพิกัดถูกปฏิเสธ โปรดเปิดสิทธิ์เข้าถึง GPS ในเบราว์เซอร์"
              : "Location permission denied. Please enable GPS access in your browser.")
          : (language === 'th' 
              ? "ไม่สามารถดึงตำแหน่ง GPS ได้: " + geoError.message
              : "Unable to retrieve GPS coordinates: " + geoError.message);
        setWeatherError(errMsg);
        setIsWeatherLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await setProject({
        ...project,
        title: { th: editNameTh, en: editNameEn },
        director: { th: editDirectorTh, en: editDirectorEn },
        producer: { th: editProducerTh, en: editProducerEn },
        client: editClient,
        status: editStatus,
        deadline: editDeadline,
        start_date: editStartDate,
        total_budget: editTotalBudget,
        completion_percentage: Number(editCompletion)
      });
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to update project: " + err.message);
    }
  };

  const handleEmptySubmit = async (e) => {
    e.preventDefault();
    if (!emptyTitleEn || !emptyDirectorEn) return;

    const newProj = {
      title: { th: emptyTitleTh || emptyTitleEn, en: emptyTitleEn },
      director: { th: emptyDirectorTh || emptyDirectorEn, en: emptyDirectorEn },
      producer: { th: emptyProducerTh || emptyProducerEn, en: emptyProducerEn },
      client: emptyClient || '-',
      status: 'pre-prod',
      start_date: emptyStartDate || new Date().toISOString().split('T')[0],
      deadline: emptyDeadline || new Date(Date.now() + 60*24*60*60*1000).toISOString().split('T')[0],
      total_budget: emptyBudget || '฿0',
      completion_percentage: 0
    };

    try {
      await handleAddProject(newProj);
      // Reset forms
      setEmptyTitleTh('');
      setEmptyTitleEn('');
      setEmptyDirectorTh('');
      setEmptyDirectorEn('');
      setEmptyProducerTh('');
      setEmptyProducerEn('');
      setEmptyClient('');
      setEmptyStartDate('');
      setEmptyDeadline('');
      setEmptyBudget('');
    } catch (err) {
      alert("Failed to create project: " + err.message);
    }
  };

  const handleDeleteProjectClick = async () => {
    if (window.confirm(language === 'th' ? `ยืนยันการลบโปรเจกต์ "${project?.title?.[language] || project?.title?.en || ''}"? ฉาก ภาพ และตารางงานทั้งหมดที่เกี่ยวข้องจะถูกลบอย่างถาวร!` : `Confirm deletion of project "${project?.title?.[language] || project?.title?.en || ''}"? All associated scenes, crew, events, and shot lists will be permanently deleted.`)) {
      try {
        await onDeleteProject(project.id);
        setIsEditModalOpen(false);
      } catch (err) {
        alert("Failed to delete project: " + err.message);
      }
    }
  };

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target.result);
        onImportData(parsed);
      } catch (err) {
        console.error("Failed to parse JSON backup file:", err);
        alert("Failed to parse JSON backup file: " + err.message);
      }
    };
  };

  // Loading indicator for API calls
  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
        <p className="text-sm text-slate-400 font-medium font-serif">
          {language === 'th' ? 'กำลังเชื่อมต่อระบบฐานข้อมูลสตูดิโอ...' : 'Connecting to Studio Database...'}
        </p>
      </div>
    );
  }

  // Active Empty-State landing UI
  if (!project) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 animate-fadeIn">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500 mb-2">
            <Clapperboard size={36} />
          </div>
          <h1 className="text-3xl font-extrabold font-serif tracking-tight">
            {language === 'th' ? 'ยินดีต้อนรับสู่ระบบจัดการกองถ่าย' : 'Welcome to Production OS'}
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
            {language === 'th' 
              ? 'ขณะนี้ยังไม่มีโปรเจกต์งานสร้างสารคดีหรือภาพยนตร์ใด ๆ ในระบบ โปรดสร้างโปรเจกต์แรกของคุณเพื่อเริ่มแจกแจงบทถ่ายทำ จัดการคิวงาน และเขียนตารางงาน'
              : 'There are currently no active projects. Create your first production project to start breakdown scheduling, crew booking, and call sheet building.'}
          </p>
        </div>

        {/* Create First Project Form */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-200/40 dark:border-obsidian-800/40 relative overflow-hidden space-y-6">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
          <h2 className="text-lg font-bold font-serif flex items-center gap-2 border-b pb-3 border-slate-200/30 dark:border-obsidian-850">
            <Plus size={20} className="text-gold-500" />
            <span>{language === 'th' ? 'สร้างโปรเจกต์การผลิตแรก' : 'Create First Project'}</span>
          </h2>

          <form onSubmit={handleEmptySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ชื่อโปรเจกต์ (ภาษาไทย)
                </label>
                <input
                  type="text"
                  value={emptyTitleTh}
                  onChange={(e) => setEmptyTitleTh(e.target.value)}
                  placeholder="เช่น เงาเที่ยงคืน"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
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
                  value={emptyTitleEn}
                  onChange={(e) => setEmptyTitleEn(e.target.value)}
                  placeholder="e.g. The Midnight Director"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ผู้กำกับ (Director) (ภาษาไทย)
                </label>
                <input
                  type="text"
                  value={emptyDirectorTh}
                  onChange={(e) => setEmptyDirectorTh(e.target.value)}
                  placeholder="เช่น อนุชา บุญยวรรธนะ"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
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
                  value={emptyDirectorEn}
                  onChange={(e) => setEmptyDirectorEn(e.target.value)}
                  placeholder="Director name in English"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ลูกค้า / สตูดิโอทุน (Client/Studio)
                </label>
                <input
                  type="text"
                  value={emptyClient}
                  onChange={(e) => setEmptyClient(e.target.value)}
                  placeholder="e.g. A24 & GMM Studios"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  งบประมาณ (Budget)
                </label>
                <input
                  type="text"
                  value={emptyBudget}
                  onChange={(e) => setEmptyBudget(e.target.value)}
                  placeholder="e.g. ฿5,000,000"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  วันเริ่มต้นถ่ายทำ (Start Date)
                </label>
                <input
                  type="date"
                  value={emptyStartDate}
                  onChange={(e) => setEmptyStartDate(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  วันส่งมอบงาน (Deadline)
                </label>
                <input
                  type="date"
                  value={emptyDeadline}
                  onChange={(e) => setEmptyDeadline(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg text-sm font-bold bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white shadow-lg transition-all"
            >
              🚀 {language === 'th' ? 'สร้างโปรเจกต์และเริ่มเข้าห้องควบคุม' : 'Launch First Project & Begin'}
            </button>
          </form>
        </div>

        {/* Database Import backup layer */}
        <div className="glass-panel p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="text-slate-400 text-center md:text-left">
            <span className="font-semibold text-slate-300 block mb-1">📥 {language === 'th' ? 'มีไฟล์สำรองข้อมูลของระบบหรือไม่?' : 'Have a backup file?'}</span>
            {language === 'th' ? 'คุณสามารถนำเข้าไฟล์สำรองข้อมูล JSON (.json) เพื่อกู้คืนฐานข้อมูลสตูดิโอล่าสุดได้ทันที' : 'You can restore your previous studio settings by importing a database JSON backup.'}
          </div>
          <label className="px-4 py-2 rounded-lg border border-gold-500/20 bg-gold-500/5 hover:bg-gold-500/10 text-gold-500 font-bold transition-all cursor-pointer">
            <span>{language === 'th' ? 'นำเข้าไฟล์สำรอง' : 'Import Database File'}</span>
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>
    );
  }

  // Find upcoming shoot days (type === 'shoot' and date >= today)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingShoots = events.filter(e => e.type === 'shoot' && e.date >= todayStr);

  const calculateDaysRemaining = () => {
    if (!project || !project.deadline) return 0;
    const today = new Date();
    const deadlineDate = new Date(project.deadline);
    const timeDiff = deadlineDate - today;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  const stats = [
    { 
      label: t('dashboard.activeCrew'), 
      value: crew.length, 
      icon: Users,
      color: "from-blue-600 to-indigo-500",
      tab: "crew"
    },
    { 
      label: t('dashboard.upcomingShoots'), 
      value: upcomingShoots.length, 
      icon: CalendarIcon,
      color: "from-gold-600 to-amber-500",
      tab: "calendar"
    },
    { 
      label: t('dashboard.totalScenes'), 
      value: scenes.length, 
      icon: Clapperboard,
      color: "from-purple-600 to-pink-500",
      tab: "breakdown"
    },
    { 
      label: t('dashboard.daysToGo'), 
      value: calculateDaysRemaining(), 
      icon: Clock,
      color: "from-emerald-600 to-teal-500",
      tab: "calendar"
    }
  ];

  const weatherIcons = {
    Sunny: "☀️",
    Cloudy: "☁️",
    Rainy: "🌧️",
    Thunderstorm: "⛈️"
  };

  const weatherLabels = {
    Sunny: { th: "แดดจัด", en: "Sunny" },
    Cloudy: { th: "มีเมฆมาก", en: "Cloudy" },
    Rainy: { th: "ฝนตก", en: "Rainy" },
    Thunderstorm: { th: "พายุฝนฟ้าคะนอง", en: "Thunderstorm" }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner / Overview Card */}
      <div className={`p-6 md:p-8 rounded-2xl glass-panel relative overflow-hidden flex flex-col md:flex-row justify-between gap-6`}>
        {/* Decorative ambient blur background */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-4 max-w-2xl z-10">
          <span className={`text-xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full ${
            theme === 'dark' ? 'bg-gold-500/10 text-gold-500' : 'bg-gold-50 text-gold-700'
          }`}>
            {t('dashboard.overview')}
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold font-serif tracking-tight">
              {project.title?.[language] || project.title?.en || ''}
            </h1>
            {hasWriteAccess() && (
              <button
                onClick={handleOpenEditModal}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-400 hover:text-gold-500 transition-colors"
                title={language === 'th' ? "แก้ไขข้อมูลโปรเจกต์" : "Edit Project Info"}
              >
                <Edit2 size={18} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t('project.director')}</p>
                <p className="text-sm font-semibold">{project.director?.[language] || project.director?.en || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t('project.producer')}</p>
                <p className="text-sm font-semibold">{project.producer?.[language] || project.producer?.en || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Layers size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t('project.client')}</p>
                <p className="text-sm font-semibold">{project.client}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Circular Progress Indicator */}
        <div className="flex flex-col items-center justify-center bg-inherit p-4 rounded-xl border border-slate-200/40 dark:border-obsidian-800/40 z-10 shrink-0 md:w-56">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-slate-200 dark:stroke-obsidian-800 fill-none"
                strokeWidth="6"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                className="stroke-gold-500 fill-none transition-all duration-1000"
                strokeWidth="6"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * project.completion_percentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xl font-bold font-serif">{project.completion_percentage}%</span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-3 uppercase tracking-wider">
            {t('dashboard.projectProgress')}
          </p>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <button
              key={idx}
              onClick={() => setCurrentTab(stat.tab)}
              className="glass-card p-5 rounded-xl flex items-center justify-between group text-left hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl md:text-3xl font-extrabold font-serif">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-tr ${stat.color} text-white shadow-md transform group-hover:rotate-12 transition-transform duration-300`}>
                <Icon size={20} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Scenes & Schedule Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Scenes Checklist */}
          <div className="glass-panel p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <Clapperboard size={18} className="text-gold-500" />
                <span>{language === 'th' ? 'ฉากถ่ายทำล่าสุด' : 'Recent Scenes'}</span>
              </h2>
              <button 
                onClick={() => setCurrentTab('breakdown')}
                className="text-xs font-bold text-gold-500 hover:underline flex items-center gap-1"
              >
                <span>{language === 'th' ? 'แจกแจงบททั้งหมด' : 'Go to Breakdown'}</span>
                <ArrowRight size={12} />
              </button>
            </div>
            
            {scenes.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-300 dark:border-obsidian-850 rounded-xl text-center text-xs text-slate-400 space-y-2">
                <p>{language === 'th' ? 'ยังไม่มีการเพิ่มรายละเอียดฉากถ่ายทำ' : 'No scenes logged for this project yet.'}</p>
                <button
                  onClick={() => setCurrentTab('breakdown')}
                  className="px-3 py-1.5 rounded-lg border border-gold-500/20 bg-gold-500/5 text-gold-500 hover:bg-gold-500/10 font-bold transition-all"
                >
                  + {t('breakdown.addScene')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-obsidian-800/40">
                {scenes.slice(0, 3).map((scene) => (
                  <div key={scene.id} className="py-3 flex justify-between items-start gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="font-mono text-xs text-gold-500 font-bold">
                        Scene {scene.scene_number} ({scene.int_ext}/{scene.day_night})
                      </span>
                      <p className="font-semibold text-slate-300">{scene.setting}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {scene.description[language]}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 uppercase tracking-wider ${
                      scene.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : scene.status === 'shooting'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {scene.status || 'pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Preview */}
          <div className="glass-panel p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <CalendarIcon size={18} className="text-gold-500" />
                <span>{language === 'th' ? 'คิวกองถ่ายทำในสัปดาห์นี้' : 'This Week\'s Shoot Days'}</span>
              </h2>
              <button 
                onClick={() => setCurrentTab('calendar')}
                className="text-xs font-bold text-gold-500 hover:underline flex items-center gap-1"
              >
                <span>{language === 'th' ? 'ดูปฏิทินปฎิบัติงาน' : 'Open Calendar'}</span>
                <ArrowRight size={12} />
              </button>
            </div>
            
            {upcomingShoots.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-300 dark:border-obsidian-850 rounded-xl text-center text-xs text-slate-400">
                {t('dashboard.noUpcomingEvents')}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingShoots.slice(0, 3).map((event) => (
                  <div key={event.id} className="p-3.5 rounded-xl border border-slate-200/50 dark:border-obsidian-850 bg-slate-50/50 dark:bg-obsidian-900/40 flex justify-between items-center gap-4">
                    <div className="space-y-1 text-sm">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${
                        event.type === 'shoot' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {event.type === 'shoot' ? t('calendar.shootDay') : t('calendar.prepDay')}
                      </span>
                      <h4 className="font-bold pt-1">{event.title[language]}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>{event.location[language]}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-gold-500">{event.date}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weather Integration & Tools */}
        <div className="space-y-6">
          
          {/* Weather Widget */}
          <div className="glass-panel p-5 rounded-xl space-y-4">
            <h2 className="text-lg font-bold font-serif flex items-center gap-2">
              <CloudSun size={18} className="text-gold-500" />
              <span>{t('dashboard.weatherWidget')}</span>
            </h2>
            
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              theme === 'dark' ? 'bg-obsidian-800/40 border-obsidian-800/40' : 'bg-slate-50 border-slate-200/50 shadow-inner'
            }`}>
              <div className="space-y-1">
                <span className="text-3xl select-none">{weatherIcons[weather]}</span>
                <p className="text-sm font-semibold">{weatherLabels[weather][language]}</p>
                <p className="text-xs text-slate-400">
                  {project.weather_detail || (
                    weather === 'Sunny' 
                      ? (language === 'th' ? '34°C | ดัชนี UV สูง' : '34°C | UV Index High') 
                      : weather === 'Cloudy' 
                        ? (language === 'th' ? '30°C | มีเมฆบางส่วน' : '30°C | Partly Cloudy') 
                        : (language === 'th' ? '26°C | ลม 15 กม./ชม.' : '26°C | Wind 15km/h')
                  )}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  weather === 'Rainy' || weather === 'Thunderstorm'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {weather === 'Rainy' || weather === 'Thunderstorm' ? 'HIGH RISK' : 'LOW RISK'}
                </span>
              </div>
            </div>

            {/* Weather selector buttons */}
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(weatherIcons).map((wKey) => (
                <button
                  key={wKey}
                  onClick={() => setWeather(wKey, '')}
                  disabled={!hasWriteAccess()}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    weather === wKey
                      ? 'border-gold-500 bg-gold-500/10 text-gold-500 font-bold'
                      : theme === 'dark'
                        ? 'border-obsidian-800 hover:bg-obsidian-800/50 text-slate-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm'
                  }`}
                >
                  <span>{weatherIcons[wKey]}</span>
                  <span>{weatherLabels[wKey][language]}</span>
                </button>
              ))}
            </div>

            {/* Fetch GPS Weather button */}
            <button
              onClick={handleFetchLiveWeather}
              disabled={isWeatherLoading || !hasWriteAccess()}
              className={`w-full py-2 px-4 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'dark'
                  ? 'bg-gold-500/10 border-gold-500/30 text-gold-500 hover:bg-gold-500/25'
                  : 'bg-gold-50 border-gold-200 text-gold-700 hover:bg-gold-100 shadow-sm'
              }`}
            >
              {isWeatherLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{language === 'th' ? 'กำลังดึงข้อมูลสภาพอากาศ...' : 'Fetching Live Weather...'}</span>
                </>
              ) : (
                <>
                  <MapPin size={14} />
                  <span>{language === 'th' ? 'ดึงสภาพอากาศจริงจาก GPS' : 'Get Live Weather (GPS)'}</span>
                </>
              )}
            </button>

            {weatherError && (
              <p className="text-[10px] text-red-500 font-medium text-center mt-1">
                ⚠️ {weatherError}
              </p>
            )}
          </div>

          {/* Quick Links / Shortcuts */}
          <div className="glass-panel p-5 rounded-xl space-y-3">
            <h2 className="text-base font-bold font-serif">{t('dashboard.quickStats')}</h2>
            <div className="space-y-2">
              <button 
                onClick={() => setCurrentTab('docs')}
                className={`w-full p-3 rounded-lg border text-left text-xs font-medium flex items-center justify-between transition-all ${
                  theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
                }`}
              >
                <span>📄 {t('docs.createCallSheet')}</span>
                <ArrowRight size={12} />
              </button>
              <button 
                onClick={() => setCurrentTab('docs')}
                className={`w-full p-3 rounded-lg border text-left text-xs font-medium flex items-center justify-between transition-all ${
                  theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs'
                }`}
              >
                <span>🎥 {t('docs.createShotList')}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Database Backup Controls */}
          <div className="glass-panel p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold font-serif flex items-center gap-2">
              <Database size={15} className="text-gold-500" />
              <span>{language === 'th' ? 'การจัดเก็บสำรองข้อมูลสตูดิโอ' : 'Database OS Backup'}</span>
            </h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onExportData}
                  className={`py-2 px-3 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs'
                  }`}
                >
                  <Download size={12} />
                  <span>{language === 'th' ? 'ส่งออกไฟล์' : 'Export DB'}</span>
                </button>
                <label className={`py-2 px-3 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs'
                }`}>
                  <Upload size={12} />
                  <span>{language === 'th' ? 'นำเข้าไฟล์' : 'Import DB'}</span>
                  <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <button
                onClick={onResetData}
                className="w-full py-2 rounded-lg border border-red-500/10 hover:bg-red-500/5 text-red-500 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw size={12} />
                <span>{language === 'th' ? 'รีเซ็ตข้อมูลทั้งหมด' : 'Factory Reset Database'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Edit Project Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-inherit flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <Sparkles size={18} className="text-gold-500" />
                <span>{language === 'th' ? 'แก้ไขรายละเอียดโปรเจกต์' : 'Edit Project Details'}</span>
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Project Names TH & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ชื่อโปรเจกต์ (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editNameTh}
                    onChange={(e) => setEditNameTh(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
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
                    value={editNameEn}
                    onChange={(e) => setEditNameEn(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Director TH & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ผู้กำกับ (Director) (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editDirectorTh}
                    onChange={(e) => setEditDirectorTh(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
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
                    value={editDirectorEn}
                    onChange={(e) => setEditDirectorEn(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Producer TH & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ผู้อำนวยการสร้าง (Producer) (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editProducerTh}
                    onChange={(e) => setEditProducerTh(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
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
                    value={editProducerEn}
                    onChange={(e) => setEditProducerEn(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Client, Total Budget, Completion % */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    ลูกค้า (Client) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    งบประมาณทั้งหมด (Total Budget) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTotalBudget}
                    onChange={(e) => setEditTotalBudget(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    เปอร์เซ็นต์ความคืบหน้า (0-100) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={editCompletion}
                    onChange={(e) => setEditCompletion(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Start Date, Deadline, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    วันเริ่มต้นโปรเจกต์ (Start Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    วันส่งมอบงาน (Deadline) *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    สถานะการผลิต (Production Status)
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
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
              <div className="flex items-center justify-between pt-4 border-t border-inherit shrink-0">
                <div>
                  {projects.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteProjectClick}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 transition-colors"
                    >
                      {language === 'th' ? 'ลบโปรเจกต์' : 'Delete Project'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
