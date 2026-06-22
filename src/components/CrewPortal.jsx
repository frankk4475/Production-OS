import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import UserManager from './UserManager';
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  ShieldAlert,
  ClipboardList,
  Calendar as CalendarIcon,
  Sparkles,
  X,
  Loader2,
  Trash2,
  Shield
} from 'lucide-react';

export default function CrewPortal({ lockedCrewId }) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess, isCrewOrTalent } = useAuth();
  
  const {
    activeCrew: crew,
    addCrewMember,
    updateCrewMember,
    deleteCrewMember,
    activeEvents: events,
    saveEvents,
    activeCompletedTasks: completedTasks,
    saveCompletedTasks,
    refreshCrew,
    isLoading
  } = useProject();

  // Tab View Mode: 'producer' (Roster) | 'crew' (My Schedule) | 'access' (UserManager)
  const [portalMode, setPortalMode] = useState(() => {
    return isCrewOrTalent() || lockedCrewId ? 'crew' : 'producer';
  });

  const [selectedCrewId, setSelectedCrewId] = useState(lockedCrewId || '');
  const [allEvents, setAllEvents] = useState([]);

  // Fetch all events across all projects for cross-project conflict checking in the roster list
  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        const projectsList = await api.getProjects();
        const eventsPromises = projectsList.map(p => api.getEvents(p.id));
        const eventsArrays = await Promise.all(eventsPromises);
        setAllEvents(eventsArrays.flat());
      } catch (err) {
        console.error("Failed to load all events for conflicts:", err);
      }
    };
    loadAllEvents();
  }, [crew]);

  // Form States for Add Crew Member
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formNameTh, setFormNameTh] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formRoleTh, setFormRoleTh] = useState('');
  const [formRoleEn, setFormRoleEn] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // Booking Shift State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingCrewId, setBookingCrewId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTitleTh, setBookingTitleTh] = useState('');
  const [bookingTitleEn, setBookingTitleEn] = useState('');
  const [bookingLocationTh, setBookingLocationTh] = useState('');
  const [bookingLocationEn, setBookingLocationEn] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 - 18:00');
  
  const [conflictWarning, setConflictWarning] = useState(null);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  const toggleTask = async (crewId, taskIndex) => {
    const key = `${crewId}-${taskIndex}`;
    const updated = {
      ...completedTasks,
      [key]: !completedTasks[key]
    };
    try {
      await saveCompletedTasks(updated);
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  // Helper: Get conflicts for a crew member dynamically
  const getCrewConflicts = (memberId) => {
    const memberObj = crew.find(c => c.id === memberId);
    if (memberObj && memberObj.booked_dates) {
      for (const d of memberObj.booked_dates) {
        const hasEvent = allEvents.some(e => e.date === d && e.crew_assigned && e.crew_assigned.includes(memberId));
        if (hasEvent) {
          const conflictingEvents = allEvents.filter(e => e.date === d && e.crew_assigned && e.crew_assigned.includes(memberId));
          return { date: d, events: conflictingEvents };
        }
      }
    }
    
    // Check if they are double booked on the same day in events
    const assignedEvents = allEvents.filter(e => e.crew_assigned && e.crew_assigned.includes(memberId));
    const dates = assignedEvents.map(e => e.date);
    const duplicates = dates.filter((item, index) => dates.indexOf(item) !== index);
    if (duplicates.length > 0) {
      const conflictDate = duplicates[0];
      const conflictEvents = assignedEvents.filter(e => e.date === conflictDate);
      return {
        date: conflictDate,
        events: conflictEvents
      };
    }
    return null;
  };

  // Handle Add Crew Member
  const handleAddCrew = async (e) => {
    e.preventDefault();
    if (!formNameEn || !formRoleEn) return;

    const newCrew = {
      name: {
        th: formNameTh || formNameEn,
        en: formNameEn || formNameTh
      },
      role: formRoleEn,
      role_th: formRoleTh || formRoleEn,
      phone: formPhone || '-',
      email: formEmail || '-',
      booked_dates: [],
      tasks: {
        th: ["เตรียมอุปกรณ์ส่วนตัวสำหรับการทำงาน", "ตรวจสอบใบสั่งงานกองถ่าย (Call Sheet)"],
        en: ["Prepare personal tools for the day", "Review daily call sheets"]
      }
    };

    try {
      await addCrewMember(newCrew);
      setIsFormOpen(false);
      
      // Reset form
      setFormNameTh('');
      setFormNameEn('');
      setFormRoleTh('');
      setFormRoleEn('');
      setFormPhone('');
      setFormEmail('');
    } catch (err) {
      alert("Failed to add crew member: " + err.message);
    }
  };

  // Deep Asynchronous Booking Conflict Checking
  const handleCheckBookingConflicts = async (crewId, dateStr) => {
    if (!crewId || !dateStr) return;
    setIsCheckingConflicts(true);
    setConflictWarning(null);

    try {
      const conflictResult = await api.checkCrewConflict(crewId, dateStr);
      if (conflictResult.hasConflict) {
        setConflictWarning({
          message: language === 'th' ? `⚠️ ${conflictResult.messageTh}` : `⚠️ ${conflictResult.messageEn}`
        });
      } else {
        setConflictWarning(null);
      }
    } catch (err) {
      console.error("Conflict verification failed:", err);
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  // Handle Booking Shift
  const handleBookShift = async (e) => {
    e.preventDefault();
    if (!bookingCrewId || !bookingDate || !bookingTitleEn) return;

    // Double check conflict before writing to DB
    const conflictResult = await api.checkCrewConflict(bookingCrewId, bookingDate);
    if (conflictResult.hasConflict) {
      alert(language === 'th' ? conflictResult.messageTh : conflictResult.messageEn);
      return;
    }

    const newEvent = {
      title: {
        th: bookingTitleTh || bookingTitleEn,
        en: bookingTitleEn || bookingTitleTh
      },
      date: bookingDate,
      type: "shoot", 
      location: {
        th: bookingLocationTh || bookingLocationEn,
        en: bookingLocationEn || bookingLocationTh
      },
      time: bookingTime,
      crew_assigned: [bookingCrewId]
    };

    try {
      // 1. Save new event to project
      await saveEvents([...events, newEvent]);

      // 2. Update crew member booked dates profile
      const memberObj = crew.find(c => c.id === bookingCrewId);
      if (memberObj) {
        const updatedMember = {
          ...memberObj,
          booked_dates: [...(memberObj.booked_dates || []), bookingDate]
        };
        await updateCrewMember(updatedMember);
      }

      setIsBookingOpen(false);

      // Reset fields
      setBookingCrewId('');
      setBookingDate('');
      setBookingTitleTh('');
      setBookingTitleEn('');
      setBookingLocationTh('');
      setBookingLocationEn('');
      setBookingTime('09:00 - 18:00');
      setConflictWarning(null);
    } catch (err) {
      alert("Failed to book shift: " + err.message);
    }
  };

  const handleDeleteCrewClick = async (crewId) => {
    if (window.confirm(language === 'th' ? 'ยืนยันการลบรายชื่อทีมงานคนนี้ออกจากฐานข้อมูลสตูดิโอ?' : 'Are you sure you want to delete this crew member from the studio database?')) {
      try {
        await deleteCrewMember(crewId);
        if (selectedCrewId === crewId) {
          setSelectedCrewId('');
        }
      } catch (err) {
        alert("Failed to delete crew member: " + err.message);
      }
    }
  };

  // Get selected crew details for personal portal
  const activeCrewMember = crew.find(c => c.id === selectedCrewId) || crew[0];

  // Get active crew member's events
  const crewEvents = activeCrewMember
    ? events.filter(e => e.crew_assigned && e.crew_assigned.includes(activeCrewMember.id)).sort((a,b) => a.date.localeCompare(b.date))
    : [];

  if (isLoading && crew.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold-500" />
        <p className="text-sm text-slate-400 font-medium">
          {language === 'th' ? 'กำลังโหลดข้อมูลทีมงานปฏิบัติหน้าที่...' : 'Loading crew roster...'}
        </p>
      </div>
    );
  }

  // Active Empty-State UI for Roster when Roster is empty
  if (crew.length === 0) {
    return (
      <div className="max-w-md mx-auto p-4 md:p-8 space-y-6 text-center animate-fadeIn">
        <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500 mb-2">
          <Users size={36} />
        </div>
        <h2 className="text-xl font-extrabold font-serif tracking-tight">
          {language === 'th' ? 'ยังไม่มีรายชื่อทีมงานในระบบ' : 'No Crew Members Logged'}
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
          {language === 'th' 
            ? 'โปรดเพิ่มสมาชิกทีมงานคนแรกเพื่อลงทะเบียนตำแหน่งหน้าที่ กำหนดพอร์ตโฟลิโอ และเริ่มเช็กคิวว่างการจัดตารางวันถ่ายทำภาพยนตร์' 
            : 'Add your first crew member to list roles, define scheduling conflicts, and start booking shifts.'}
        </p>

        {/* Form to add first crew member */}
        <div className="glass-panel p-6 rounded-xl border border-slate-200/40 dark:border-obsidian-800/40 text-left space-y-4 shadow-xl">
          <h3 className="text-sm font-bold font-serif flex items-center gap-1.5 border-b pb-2 border-slate-200/30 dark:border-obsidian-850">
            <UserPlus size={16} className="text-gold-500" />
            <span>{language === 'th' ? 'ลงทะเบียนทีมงานคนแรก' : 'Register First Crew Member'}</span>
          </h3>

          <form onSubmit={handleAddCrew} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ชื่อไทย</label>
                <input
                  type="text"
                  value={formNameTh}
                  onChange={(e) => setFormNameTh(e.target.value)}
                  placeholder="เช่น ณัฐดนัย"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Name (EN) *</label>
                <input
                  type="text"
                  required
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="e.g. Natdanai"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ตำแหน่ง (ไทย)</label>
                <input
                  type="text"
                  value={formRoleTh}
                  onChange={(e) => setFormRoleTh(e.target.value)}
                  placeholder="เช่น ผู้กำกับภาพ"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role (EN) *</label>
                <input
                  type="text"
                  required
                  value={formRoleEn}
                  onChange={(e) => setFormRoleEn(e.target.value)}
                  placeholder="e.g. Director of Photography"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. crew@studio.com"
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                  theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs rounded-lg shadow-md transition-all"
            >
              + {language === 'th' ? 'เพิ่มรายชื่อทีมงาน' : 'Add First Member'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handlePortalModeChange = async (mode) => {
    setPortalMode(mode);
    if (mode === 'producer' || mode === 'access') {
      await refreshCrew();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-obsidian-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Users size={24} className="text-gold-500" />
            <span>{language === 'th' ? 'จัดการทีมงานและสิทธิ์' : 'Crew & Access Management'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {portalMode === 'producer' 
              ? (language === 'th' ? 'ตารางรายชื่อทีมงานและการจัดคิวคิวงานถ่ายทำ' : 'Roster View & Shift Scheduling') 
              : portalMode === 'crew'
              ? (language === 'th' ? 'กระดานแสดงข้อมูลคิวงานและงานรับผิดชอบรายบุคคล' : 'Individual Personal Dashboard')
              : (language === 'th' ? 'การตั้งค่ารหัสบัญชีล็อกอินและระดับสิทธิ์ (Role) ระบบปฏิบัติการ' : 'User Accounts, Passwords & System Roles')}
          </p>
        </div>

        {/* View mode toggle */}
        {!isCrewOrTalent() && (
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-obsidian-800">
            <button
              onClick={() => handlePortalModeChange('producer')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                portalMode === 'producer'
                  ? 'bg-gold-500/15 text-gold-500 font-extrabold'
                  : theme === 'dark' ? 'bg-obsidian-900 text-slate-400 hover:bg-obsidian-800' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {language === 'th' ? 'รายชื่อและมอบหมายงาน' : 'Crew Roster'}
            </button>
            <button
              onClick={() => handlePortalModeChange('crew')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
                portalMode === 'crew'
                  ? 'bg-gold-500/15 text-gold-500 font-extrabold'
                  : theme === 'dark' ? 'bg-obsidian-900 text-slate-400 hover:bg-obsidian-800' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {language === 'th' ? 'ตารางงานบุคคล' : 'Crew Schedule'}
            </button>
            <button
              onClick={() => handlePortalModeChange('access')}
              className={`px-4 py-2 text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                portalMode === 'access'
                  ? 'bg-gold-500/15 text-gold-500 font-extrabold'
                  : theme === 'dark' ? 'bg-obsidian-900 text-slate-400 hover:bg-obsidian-800' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Shield size={13} />
              <span>{language === 'th' ? 'บัญชีและสิทธิ์ (Role)' : 'Access Control'}</span>
            </button>
          </div>
        )}
      </div>

      {/* PRODUCER ROSTER MODE */}
      {portalMode === 'producer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Roster list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold font-serif flex items-center gap-1.5">
                <ClipboardList size={16} className="text-gold-500" />
                <span>{t('crew.availabilityTitle')}</span>
              </h2>
              {hasWriteAccess() && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsBookingOpen(true)}
                    className="px-3 py-1.5 border border-gold-500/20 bg-gold-500/5 hover:bg-gold-500/10 text-gold-500 text-xs font-bold rounded-lg transition-all"
                  >
                    🗓️ {language === 'th' ? 'จองตารางงานทีมงาน' : 'Book Shift'}
                  </button>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1"
                  >
                    <UserPlus size={14} />
                    <span>{t('crew.addCrew')}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                      theme === 'dark' ? 'bg-obsidian-900/50 border-obsidian-800/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <th className="py-3 px-4">{t('crew.name')}</th>
                      <th className="py-3 px-4">{t('crew.role')}</th>
                      <th className="py-3 px-4">{t('crew.conflictCheck')}</th>
                      <th className="py-3 px-4 text-right no-print">{language === 'th' ? 'การจัดการ' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-obsidian-800/40 text-xs">
                    {crew.map((member) => {
                      const conflict = getCrewConflicts(member.id);
                      return (
                        <tr key={member.id} className="hover:bg-slate-100/10 dark:hover:bg-obsidian-800/10 transition-colors">
                          <td className="py-3.5 px-4 font-semibold">
                            {member.name?.[language] || member.name?.en || ''}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {language === 'th' ? (member.role_th || member.role) : member.role}
                          </td>
                          <td className="py-3.5 px-4">
                            {conflict ? (
                              <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                Double Booked ({conflict.date})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                {t('crew.noConflicts')}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right no-print">
                            {hasWriteAccess() && (
                              <button
                                onClick={() => handleDeleteCrewClick(member.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                                title="Remove Crew Member"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Conflict Detector Sidebar */}
          <div className="space-y-4">
            <h2 className="text-base font-bold font-serif flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-red-500 animate-pulse" />
              <span>{language === 'th' ? 'การเฝ้าระวังตารางซ้อน' : 'Double-booking Watch'}</span>
            </h2>

            <div className="glass-panel p-4 rounded-xl space-y-3">
              {crew.map((member) => {
                const conflict = getCrewConflicts(member.id);
                if (!conflict) return null;
                return (
                  <div 
                    key={member.id} 
                    className={`p-3 rounded-lg border text-xs ${
                      theme === 'dark' ? 'bg-red-500/5 border-red-500/20 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertTriangle size={12} />
                      <span>{t('crew.conflictAlert')}</span>
                    </div>
                    <p className="font-semibold">{member.name?.[language] || member.name?.en || ''}</p>
                    <p className="mt-1 leading-relaxed">
                      Double booked on <span className="underline font-bold font-mono">{conflict.date}</span>:
                    </p>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {conflict.events.map(e => (
                        <li key={e.id}>{e.title?.[language] || 'TBD'} ({e.time})</li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {crew.every(m => !getCrewConflicts(m.id)) && (
                <div className="text-center py-8 text-slate-400 italic text-xs">
                  👍 All schedules are healthy. No booking conflicts.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* INDIVIDUAL CREW DASHBOARD MODE */}
      {portalMode === 'crew' && (
        <div className="space-y-6">
          
          {/* Select Crew Member context */}
          {!lockedCrewId && (
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 max-w-md">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('crew.viewAsCrew')}</span>
              <select
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold focus:outline-none ${
                  theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200'
                }`}
              >
                {crew.map(m => (
                  <option key={m.id} value={m.id}>{m.name?.[language] || m.name?.en || ''} ({m.role})</option>
                ))}
              </select>
            </div>
          )}

          {activeCrewMember ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              
              {/* Personal Schedule list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold font-serif flex items-center gap-1.5">
                  <CalendarIcon size={16} className="text-gold-500" />
                  <span>{t('crew.mySchedule')} ({activeCrewMember.name?.[language] || activeCrewMember.name?.en || ''})</span>
                </h3>

                {crewEvents.length === 0 ? (
                  <div className="glass-panel p-10 text-center text-xs text-slate-450 italic">
                    No assigned dates in this project schedule.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {crewEvents.map((evt) => (
                      <div key={evt.id} className="glass-panel p-4 rounded-xl border border-slate-200/50 dark:border-obsidian-850 bg-slate-50/20 dark:bg-obsidian-950/20 flex justify-between items-center gap-4 hover:scale-[1.005] transition-transform">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${
                            evt.type === 'shoot' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {evt.type === 'shoot' ? t('calendar.shootDay') : t('calendar.prepDay')}
                          </span>
                          <h4 className="text-sm font-bold pt-1">{evt.title?.[language] || evt.title?.en}</h4>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="shrink-0">📍</span>
                            <span>{evt.location?.[language] || evt.location?.en}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-gold-500">{evt.date}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{evt.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Department/Personal tasks checklist */}
              <div className="space-y-4">
                <h3 className="text-base font-bold font-serif flex items-center gap-1.5">
                  <ClipboardList size={16} className="text-gold-500" />
                  <span>{t('crew.myTasks')}</span>
                </h3>

                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <div className="divide-y divide-slate-100 dark:divide-obsidian-800/40">
                    {(activeCrewMember.tasks?.[language] || activeCrewMember.tasks?.en || []).map((task, idx) => {
                      const isChecked = !!completedTasks[`${activeCrewMember.id}-${idx}`];
                      return (
                        <label 
                          key={idx} 
                          className="py-3 flex items-start gap-3 cursor-pointer group select-none"
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTask(activeCrewMember.id, idx)}
                            className="rounded border-slate-300 dark:border-obsidian-850 text-gold-500 focus:ring-gold-500 mt-0.5 w-4 h-4 bg-obsidian-950 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className={`text-sm transition-all ${
                            isChecked 
                              ? 'line-through text-slate-400 dark:text-slate-500' 
                              : 'text-slate-800 dark:text-slate-200 group-hover:text-gold-500'
                          }`}>
                            {task}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 italic text-slate-455 text-xs">
              Please register a crew member first.
            </div>
          )}

        </div>
      )}

      {/* ACCESS CONTROL MODE */}
      {portalMode === 'access' && (
        <UserManager hideHeader={true} />
      )}

      {/* BOOK SHIFT MODAL */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden border ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="px-5 py-4 border-b border-inherit flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif flex items-center gap-1.5">
                <Sparkles size={16} className="text-gold-500" />
                <span>Book Crew Shift</span>
              </h3>
              <button 
                onClick={() => setIsBookingOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookShift} className="p-5 space-y-4">
              
              {/* Select Crew Member */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Crew Member *
                </label>
                <select
                  required
                  value={bookingCrewId}
                  onChange={(e) => {
                    setBookingCrewId(e.target.value);
                    handleCheckBookingConflicts(e.target.value, bookingDate);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">-- Choose Crew --</option>
                  {crew.map(m => (
                    <option key={m.id} value={m.id}>{m.name?.[language] || m.name?.en || ''} ({m.role})</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Shift Date *
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    handleCheckBookingConflicts(bookingCrewId, e.target.value);
                  }}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              {/* Conflict alerts */}
              {isCheckingConflicts && (
                <p className="text-[10px] text-slate-450 flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin text-gold-500" />
                  Checking database conflict schedules...
                </p>
              )}

              {conflictWarning && (
                <div className={`p-3 rounded-lg border text-xs flex gap-2 ${
                  theme === 'dark' ? 'bg-red-500/10 border-red-500/25 text-red-400' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>{conflictWarning.message}</p>
                </div>
              )}

              {/* Shift Title */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    ชื่องาน (ไทย) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingTitleTh}
                    onChange={(e) => setBookingTitleTh(e.target.value)}
                    placeholder="เช่น ถ่ายทำ ซีน 1"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Title (EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingTitleEn}
                    onChange={(e) => setBookingTitleEn(e.target.value)}
                    placeholder="e.g. Shoot Day - Scene 1"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    สถานที่ (ไทย)
                  </label>
                  <input
                    type="text"
                    value={bookingLocationTh}
                    onChange={(e) => setBookingLocationTh(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Location (EN)
                  </label>
                  <input
                    type="text"
                    value={bookingLocationEn}
                    onChange={(e) => setBookingLocationEn(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className={`px-3.5 py-1.5 rounded text-xs font-semibold border ${
                    theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!conflictWarning || isCheckingConflicts}
                  className={`px-4 py-1.5 rounded text-xs font-bold text-white transition-all shadow-md ${
                    conflictWarning || isCheckingConflicts
                      ? 'bg-slate-600 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400'
                  }`}
                >
                  Save Shift
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ADD CREW MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden border ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="px-5 py-4 border-b border-inherit flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif flex items-center gap-1.5">
                <UserPlus size={16} className="text-gold-500" />
                <span>{t('crew.addCrew')}</span>
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCrew} className="p-5 space-y-4">
              
              {/* Names (TH/EN) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    ชื่อ-นามสกุล (ไทย)
                  </label>
                  <input
                    type="text"
                    value={formNameTh}
                    onChange={(e) => setFormNameTh(e.target.value)}
                    placeholder="เช่น ณัฐดนัย"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Name (EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    placeholder="e.g. Natdanai"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Roles (TH/EN) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    ตำแหน่ง (ไทย)
                  </label>
                  <input
                    type="text"
                    value={formRoleTh}
                    onChange={(e) => setFormRoleTh(e.target.value)}
                    placeholder="เช่น ผู้กำกับภาพ"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Role (EN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRoleEn}
                    onChange={(e) => setFormRoleEn(e.target.value)}
                    placeholder="e.g. Director of Photography"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Contact (Phone/Email) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 081-xxx-xxxx"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. crew@studio.com"
                    className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className={`px-3.5 py-1.5 rounded text-xs font-semibold border ${
                    theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-650'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-bold text-white bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 shadow-md"
                >
                  Save Crew Member
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
