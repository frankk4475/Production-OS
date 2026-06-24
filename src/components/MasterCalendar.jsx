import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { googleCalendar } from '../services/googleCalendar';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  FileText,
  Calendar as CalendarIcon,
  X,
  Settings,
  RefreshCw,
  Check
} from 'lucide-react';

export default function MasterCalendar({ events, crew, setCurrentTab, setTabParams }) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  // Views: 'month' | 'week' | 'day'
  const [currentView, setCurrentView] = useState('month');
  const { user, hasWriteAccess } = useAuth();
  const getProjectKey = (baseKey) => user?.id ? `${baseKey}_${user.id}` : baseKey;

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState(() => localStorage.getItem(getProjectKey('google_project_calendar_id')) || '');
  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('google_client_id') || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const loadCalendars = async (token) => {
    try {
      const list = await googleCalendar.fetchCalendars(token);
      setGoogleCalendars(list);
      setIsConnected(true);
    } catch (err) {
      console.error("Failed to load Google calendars:", err);
      setIsConnected(false);
      localStorage.removeItem(getProjectKey('google_project_access_token'));
    }
  };

  useEffect(() => {
    const params = googleCalendar.parseHashParams();
    if (params) {
      localStorage.setItem(getProjectKey('google_project_access_token'), params.accessToken);
      localStorage.setItem(getProjectKey('google_project_token_expires_at'), params.expiresAt);
      window.location.hash = '#/calendar';
      loadCalendars(params.accessToken);
      setIsGoogleModalOpen(true);
    } else {
      const token = localStorage.getItem(getProjectKey('google_project_access_token'));
      const expiresAt = localStorage.getItem(getProjectKey('google_project_token_expires_at'));
      if (token && expiresAt && Number(expiresAt) > Date.now()) {
        loadCalendars(token);
      }
    }
  }, [user?.id]);

  const handleConnectGoogle = () => {
    if (!googleClientId) {
      alert(language === 'th' ? 'กรุณาระบุ Google Client ID ก่อนเชื่อมต่อ' : 'Please provide a Google Client ID first');
      return;
    }
    localStorage.setItem('google_client_id', googleClientId);
    const redirectUri = window.location.origin + window.location.pathname;
    window.location.href = googleCalendar.getAuthUrl(googleClientId, redirectUri, 'project-calendar');
  };

  const handleDisconnectGoogle = () => {
    localStorage.removeItem(getProjectKey('google_project_access_token'));
    localStorage.removeItem(getProjectKey('google_project_token_expires_at'));
    localStorage.removeItem(getProjectKey('google_project_calendar_id'));
    setGoogleCalendars([]);
    setSelectedCalendarId('');
    setIsConnected(false);
  };

  const handleSelectCalendar = (calId) => {
    setSelectedCalendarId(calId);
    localStorage.setItem(getProjectKey('google_project_calendar_id'), calId);
  };

  const handleSyncAll = async () => {
    const token = localStorage.getItem(getProjectKey('google_project_access_token'));
    if (!token || !selectedCalendarId) {
      alert(language === 'th' ? 'กรุณาเชื่อมปฏิทิน Google Calendar ก่อน' : 'Please connect a Google Calendar first');
      return;
    }
    
    setIsSyncing(true);
    setSyncStatusMsg(language === 'th' ? 'กำลังซิงค์ข้อมูล...' : 'Syncing...');
    
    try {
      const syncedEvents = JSON.parse(localStorage.getItem(`synced_google_events_${selectedCalendarId}`) || '{}');
      
      for (const evt of events) {
        const attendeesEmails = (evt.crew_assigned || []).map(crewId => {
          const cInfo = crew.find(c => c.id === crewId);
          return cInfo?.email !== '-' ? cInfo?.email : null;
        }).filter(email => !!email);

        const eventData = {
          title: evt.title[language] || evt.title.en || 'Shoot Event',
          date: evt.date,
          location: evt.location?.[language] || evt.location?.en || '',
          description: `Project Event\nTime: ${evt.time || ''}\nScene: ${evt.scene_number || 'N/A'}`,
          attendees: attendeesEmails
        };

        const googleEventId = syncedEvents[evt.id];
        if (googleEventId) {
          try {
            await googleCalendar.updateEvent(token, selectedCalendarId, googleEventId, eventData);
          } catch (err) {
            console.warn("Event update failed, recreating:", err);
            const res = await googleCalendar.createEvent(token, selectedCalendarId, eventData);
            syncedEvents[evt.id] = res.id;
          }
        } else {
          const res = await googleCalendar.createEvent(token, selectedCalendarId, eventData);
          syncedEvents[evt.id] = res.id;
        }
      }
      
      localStorage.setItem(`synced_google_events_${selectedCalendarId}`, JSON.stringify(syncedEvents));
      alert(language === 'th' ? 'ซิงค์ข้อมูลกับ Google Calendar เรียบร้อยแล้ว!' : 'Google Calendar sync completed successfully!');
    } catch (err) {
      alert("Sync failed: " + err.message);
    } finally {
      setIsSyncing(false);
      setSyncStatusMsg('');
    }
  };
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation helpers
  const nextPeriod = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (currentView === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const prevPeriod = () => {
    if (currentView === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (currentView === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  // Month Date generation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  // Prev month padding cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`
    });
  }
  // Current month cells
  for (let i = 1; i <= totalDays; i++) {
    cells.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }
  // Next month padding cells
  const remainingCells = 42 - cells.length;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  // Week view calculation
  const getWeekDays = (start) => {
    const week = [];
    const temp = new Date(start);
    const day = temp.getDay();
    const diff = temp.getDate() - day; // adjust to Sunday
    const sunday = new Date(temp.setDate(diff));
    
    for (let i = 0; i < 7; i++) {
      const current = new Date(sunday);
      current.setDate(sunday.getDate() + i);
      week.push(current);
    }
    return week;
  };

  // Locale names
  const monthNames = {
    th: [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ],
    en: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
  };

  const dayLabels = {
    th: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  };

  const weekDays = getWeekDays(currentDate);

  // Helper to filter events by date
  const getEventsForDate = (dateStr) => {
    const matchedEvents = events.filter(e => e.date === dateStr);
    const blockedEvents = [];
    
    (crew || []).forEach(c => {
      if (!c.booked_dates) return;
      const found = c.booked_dates.find(d => (typeof d === 'string' ? d : d?.date) === dateStr);
      if (found) {
        const reason = typeof found === 'string' 
          ? (language === 'th' ? 'ติดธุระส่วนตัว' : 'Personal Errands') 
          : (found.reason || (language === 'th' ? 'ติดธุระส่วนตัว' : 'Personal Errands'));
        
        blockedEvents.push({
          id: `blocked-${c.id}-${dateStr}`,
          title: {
            th: `ติดธุระ: ${c.name?.th || c.name?.en} (${reason})`,
            en: `Busy: ${c.name?.en || c.name?.th} (${reason})`
          },
          date: dateStr,
          type: 'blocked',
          crew_member: c,
          reason: reason,
          location: {
            th: 'ไม่มีระบุสถานที่',
            en: 'N/A'
          },
          time: language === 'th' ? 'ทั้งวัน' : 'All Day'
        });
      }
    });
    
    return [...matchedEvents, ...blockedEvents];
  };

  // Crew name resolver helper
  const getCrewInfo = (crewId) => {
    return crew.find(c => c.id === crewId);
  };

  // Handle call sheet navigation
  const viewCallSheet = (sceneNum) => {
    setSelectedEvent(null);
    if (setTabParams) {
      setTabParams({ sceneNum });
    }
    setCurrentTab('docs');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <CalendarIcon size={24} className="text-gold-500" />
            <span>{t('nav.calendar')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {monthNames[language][month]} {year + (language === 'th' ? 543 : 0)}
          </p>
        </div>

        {/* View togglers & Navigation */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {/* Month/Week/Day Selector */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-obsidian-800">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => {
                  setCurrentView(v);
                  setCurrentDate(new Date());
                }}
                className={`px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
                  currentView === v
                    ? 'bg-gold-500/10 text-gold-500 font-bold'
                    : theme === 'dark'
                      ? 'bg-obsidian-950 hover:bg-obsidian-800 text-slate-400'
                      : 'bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                {t(`calendar.${v}`)}
              </button>
            ))}
          </div>

          {/* Google Calendar Settings Button (Producers/ADs only) */}
          {hasWriteAccess() && (
            <button
              onClick={() => setIsGoogleModalOpen(true)}
              className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all text-xs font-bold ${
                isConnected
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                  : theme === 'dark'
                    ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-655'
              }`}
              title="Google Calendar Integration Settings"
            >
              <Settings size={15} className={isSyncing ? 'animate-spin text-gold-500' : ''} />
              <span className="hidden sm:inline">Google Calendar</span>
            </button>
          )}

          {/* Prev/Next buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevPeriod}
              className={`p-1.5 rounded-lg border transition-all ${
                theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPeriod}
              className={`p-1.5 rounded-lg border transition-all ${
                theme === 'dark' ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {currentView === 'month' && (
        <div className="glass-panel rounded-xl overflow-hidden shadow-sm">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-obsidian-800 text-center py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            {dayLabels[language].map((lbl, idx) => (
              <div key={idx} className="py-2">{lbl}</div>
            ))}
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-200/50 dark:divide-obsidian-800/40 border-l border-t border-transparent">
            {cells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.dateString);
              const isToday = cell.dateString === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] md:min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                    cell.isCurrentMonth
                      ? theme === 'dark'
                        ? 'bg-obsidian-900/10'
                        : 'bg-white'
                      : theme === 'dark'
                        ? 'bg-obsidian-950/20 text-slate-600'
                        : 'bg-slate-100/40 text-slate-400'
                  }`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-gold-500 text-white font-extrabold shadow-sm'
                        : cell.isCurrentMonth
                          ? theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                          : 'text-slate-400'
                    }`}>
                      {cell.day}
                    </span>
                  </div>

                  {/* Events list container */}
                  <div className="flex-1 mt-2 flex flex-col gap-1 overflow-y-auto max-h-[70px]">
                    {dayEvents.map(evt => (
                      <button
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-bold truncate transition-all hover:scale-[1.02] border ${
                          evt.type === 'shoot'
                            ? theme === 'dark'
                              ? 'bg-gold-500/10 border-gold-500/20 text-gold-400 hover:bg-gold-500/15'
                              : 'bg-gold-50 border-gold-200 text-gold-800 hover:bg-gold-100'
                            : evt.type === 'blocked'
                              ? theme === 'dark'
                                ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15'
                                : 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100'
                              : theme === 'dark'
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/15'
                                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                        }`}
                      >
                        <span className="mr-1">
                          {evt.type === 'shoot' ? '🎥' : evt.type === 'blocked' ? '❌' : '🛠️'}
                        </span>
                        {evt.title[language] || evt.title.en}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {currentView === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, idx) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayEvents = getEventsForDate(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={idx} 
                className={`glass-panel p-4 rounded-xl flex flex-col min-h-[300px] border ${
                  isToday ? 'border-gold-500/40 ring-1 ring-gold-500/10' : ''
                }`}
              >
                <div className="border-b pb-2 mb-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {dayLabels[language][day.getDay()]}
                  </p>
                  <p className={`text-xl font-mono font-extrabold mt-0.5 ${isToday ? 'text-gold-500' : ''}`}>
                    {day.getDate()}
                  </p>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {dayEvents.map(evt => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] ${
                        evt.type === 'shoot'
                          ? theme === 'dark'
                            ? 'bg-gold-500/5 border-gold-500/20 text-gold-300'
                            : 'bg-gold-50 border-gold-200 text-gold-800'
                          : evt.type === 'blocked'
                            ? theme === 'dark'
                              ? 'bg-red-500/5 border-red-500/20 text-red-350'
                              : 'bg-red-50 border-red-200 text-red-800'
                            : theme === 'dark'
                              ? 'bg-blue-500/5 border-blue-500/20 text-blue-300'
                              : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5 font-bold">
                        <span>{evt.type === 'shoot' ? '🎥' : evt.type === 'blocked' ? '❌' : '🛠️'}</span>
                        <span className="uppercase tracking-widest text-[9px] px-1 rounded bg-current/10">
                          {evt.type === 'blocked' ? (language === 'th' ? 'ติดธุระ' : 'Busy') : t(`calendar.${evt.type}Day`)}
                        </span>
                      </div>
                      <p className="font-bold">{evt.title[language] || evt.title.en}</p>
                      <p className="text-[10px] opacity-75 mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        <span>{evt.time}</span>
                      </p>
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-xs py-10">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DAY VIEW */}
      {currentView === 'day' && (
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {dayLabels[language][currentDate.getDay()]}
              </p>
              <h2 className="text-xl font-bold font-serif mt-1">
                {currentDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
            </div>
            {currentDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
              <span className="text-xs font-bold uppercase bg-gold-500/10 text-gold-500 px-2.5 py-1 rounded-full">
                Today
              </span>
            )}
          </div>

          <div className="space-y-4">
            {getEventsForDate(currentDate.toISOString().split('T')[0]).map(evt => (
              <div 
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:scale-[1.005] ${
                  evt.type === 'shoot'
                    ? theme === 'dark' ? 'bg-gold-500/5 border-gold-500/25 text-gold-300' : 'bg-gold-50 border-gold-200 text-gold-800'
                    : evt.type === 'blocked'
                      ? theme === 'dark' ? 'bg-red-500/5 border-red-500/25 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                      : theme === 'dark' ? 'bg-blue-500/5 border-blue-500/25 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-current/10 px-2 py-0.5 rounded">
                      {evt.type === 'blocked' ? (language === 'th' ? 'ติดธุระ' : 'Busy') : t(`calendar.${evt.type}Day`)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">🕒 {evt.time}</span>
                  </div>
                  <h3 className="text-lg font-bold">{evt.title[language] || evt.title.en}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={12} />
                    <span>{evt.location[language] || evt.location.en}</span>
                  </div>
                </div>

                <div className="flex -space-x-2 overflow-hidden self-start sm:self-auto">
                  {evt.type === 'blocked' ? (
                    <div 
                      className="w-8 h-8 rounded-full border border-obsidian-950 bg-red-650 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      title={`${evt.crew_member?.name?.[language]} - ${evt.crew_member?.role}`}
                    >
                      {evt.crew_member?.name?.en?.split(' ').map(n => n[0]).join('') || '??'}
                    </div>
                  ) : (evt.crew_assigned || []).map((crewId, idx) => {
                    const cInfo = getCrewInfo(crewId);
                    return (
                      <div 
                        key={idx}
                        className="w-8 h-8 rounded-full border border-obsidian-950 bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        title={`${cInfo?.name[language]} - ${cInfo?.role}`}
                      >
                        {cInfo?.name?.en?.split(' ').map(n => n[0]).join('') || '??'}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {getEventsForDate(currentDate.toISOString().split('T')[0]).length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-12">
                No scheduled activities for this day.
              </p>
            )}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-inherit flex items-center justify-between shrink-0">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                selectedEvent.type === 'shoot'
                  ? 'bg-gold-500/10 text-gold-500'
                  : selectedEvent.type === 'blocked'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-blue-500/10 text-blue-500'
              }`}>
                {selectedEvent.type === 'blocked' ? (language === 'th' ? 'ติดธุระ' : 'Busy') : t(`calendar.${selectedEvent.type}Day`)}
              </span>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Event title */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold font-serif">{selectedEvent.title[language] || selectedEvent.title.en}</h2>
                <p className="text-xs text-slate-400">
                  🗓️ {new Date(selectedEvent.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {selectedEvent.type === 'blocked' ? (
                /* Blocked Crew Details */
                <div className="space-y-4 animate-fadeIn">
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                  } space-y-2`}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {language === 'th' ? 'ทีมงานที่แจ้งติดธุระ' : 'Crew Member Profile'}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                        {selectedEvent.crew_member?.name?.en?.split(' ').map(n => n[0]).join('') || '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {selectedEvent.crew_member?.name?.[language] || selectedEvent.crew_member?.name?.en}
                        </p>
                        <p className="text-xs text-slate-400">
                          {language === 'th' ? selectedEvent.crew_member?.role_th : selectedEvent.crew_member?.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                      {language === 'th' ? 'รายละเอียดเพิ่มเติม' : 'Description'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {selectedEvent.reason 
                        ? `${language === 'th' ? 'เหตุผลที่ติดธุระ: ' : 'Reason: '}${selectedEvent.reason}`
                        : (language === 'th' 
                            ? 'ทีมงานแจ้งวันหยุดติดธุระส่วนตัวในระบบพอร์ทัลหลัก และบล็อกคิวงานสำหรับช่วงวันดังกล่าว'
                            : 'Member marked this day as busy in their roster workspace, blocking schedule bookings for this date.')}
                    </p>
                  </div>
                </div>
              ) : (
                /* Regular Event Details */
                <>
                  {/* Time slot & location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg border ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                        <Clock size={10} />
                        <span>{t('calendar.scheduledTime')}</span>
                      </p>
                      <p className="text-sm font-bold">{selectedEvent.time}</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                        <MapPin size={10} />
                        <span>{t('calendar.shootLocation')}</span>
                      </p>
                      <p className="text-sm font-bold truncate" title={selectedEvent.location[language] || selectedEvent.location.en}>
                        {selectedEvent.location[language] || selectedEvent.location.en}
                      </p>
                    </div>
                  </div>

                  {/* Crew assigned */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-gold-500" />
                      <span>{t('calendar.assignedCrew')}</span>
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {(selectedEvent.crew_assigned || []).map((crewId) => {
                        const cInfo = getCrewInfo(crewId);
                        return (
                          <div 
                            key={crewId} 
                            className={`p-2 rounded-lg border flex items-center gap-2.5 ${
                              theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-850' : 'bg-slate-50 border-slate-100 shadow-xs'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gold-600 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
                              {cInfo?.name?.en?.split(' ').map(n => n[0]).join('') || '??'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{cInfo?.name?.[language]}</p>
                              <p className="text-[10px] text-slate-400 truncate">{language === 'th' ? cInfo?.role_th : cInfo?.role}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Button: Call Sheet */}
                  {selectedEvent.type === 'shoot' && selectedEvent.scene_number && (
                    <button
                      onClick={() => viewCallSheet(selectedEvent.scene_number)}
                      className="w-full py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <FileText size={16} />
                      <span>{t('crew.callSheetLink')} (Scene {selectedEvent.scene_number})</span>
                    </button>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}
      {/* GOOGLE CALENDAR SETTINGS MODAL */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-md rounded-xl shadow-2xl overflow-hidden border ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="px-5 py-4 border-b border-inherit flex items-center justify-between">
              <h3 className="text-sm font-bold font-serif flex items-center gap-1.5">
                <Settings size={16} className="text-gold-500" />
                <span>{language === 'th' ? 'ตั้งค่าซิงค์ Google Calendar' : 'Google Calendar Sync Settings'}</span>
              </h3>
              <button 
                onClick={() => setIsGoogleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Google Client ID setup */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Google API Client ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12345-abcde.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'th' 
                    ? 'ได้มาจาก Google Cloud Console (OAuth Client ID) โดยตั้งค่า Redirect URIs ให้ตรงกับแอดเดรสของหน้าเว็บนี้'
                    : 'Obtained from Google Cloud Console. Set Authorized Redirect URIs to match this web app URL.'}
                </p>
              </div>

              {/* Status / Actions */}
              <div className="pt-2 border-t border-inherit">
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <Check size={14} />
                        {language === 'th' ? 'เชื่อมต่อ Google Account แล้ว' : 'Connected to Google'}
                      </span>
                      <button
                        onClick={handleDisconnectGoogle}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        {language === 'th' ? 'ยกเลิกการเชื่อมต่อ' : 'Disconnect'}
                      </button>
                    </div>

                    {/* Select Calendar */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                        {language === 'th' ? 'เลือกปฏิทินที่ใช้ซิงค์' : 'Select Sync Calendar'}
                      </label>
                      <select
                        value={selectedCalendarId}
                        onChange={(e) => handleSelectCalendar(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                          theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <option value="">-- Choose Calendar --</option>
                        {googleCalendars.map(c => (
                          <option key={c.id} value={c.id}>{c.summary}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sync Button */}
                    {selectedCalendarId && (
                      <button
                        onClick={handleSyncAll}
                        disabled={isSyncing}
                        className="w-full py-2 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        <span>{isSyncing ? syncStatusMsg : (language === 'th' ? 'เริ่มการซิงค์ตารางงานปฏิทิน' : 'Sync Calendar Events')}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleConnectGoogle}
                    className="w-full py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs rounded-lg shadow-md transition-all"
                  >
                    {language === 'th' ? 'เชื่อมต่อ Google Account' : 'Connect Google Account'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
