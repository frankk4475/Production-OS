import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Users, 
  FileText,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';

export default function MasterCalendar({ events, crew, setCurrentTab, setTabParams }) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  // Views: 'month' | 'week' | 'day'
  const [currentView, setCurrentView] = useState('month');
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
    return events.filter(e => e.date === dateStr);
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
                            : theme === 'dark'
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/15'
                              : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                        }`}
                      >
                        <span className="mr-1">{evt.type === 'shoot' ? '🎥' : '🛠️'}</span>
                        {evt.title[language]}
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
                          : theme === 'dark'
                            ? 'bg-blue-500/5 border-blue-500/20 text-blue-300'
                            : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5 font-bold">
                        <span>{evt.type === 'shoot' ? '🎥' : '🛠️'}</span>
                        <span className="uppercase tracking-widest text-[9px] px-1 rounded bg-current/10">
                          {t(`calendar.${evt.type}Day`)}
                        </span>
                      </div>
                      <p className="font-bold">{evt.title[language]}</p>
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
                    : theme === 'dark' ? 'bg-blue-500/5 border-blue-500/25 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-current/10 px-2 py-0.5 rounded">
                      {t(`calendar.${evt.type}Day`)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">🕒 {evt.time}</span>
                  </div>
                  <h3 className="text-lg font-bold">{evt.title[language]}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={12} />
                    <span>{evt.location[language]}</span>
                  </div>
                </div>

                <div className="flex -space-x-2 overflow-hidden self-start sm:self-auto">
                  {(evt.crew_assigned || []).map((crewId, idx) => {
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
                selectedEvent.type === 'shoot' ? 'bg-gold-500/10 text-gold-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {t(`calendar.${selectedEvent.type}Day`)}
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
                <h2 className="text-xl font-bold font-serif">{selectedEvent.title[language]}</h2>
                <p className="text-xs text-slate-400">
                  🗓️ {new Date(selectedEvent.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

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
                  <p className="text-sm font-bold truncate" title={selectedEvent.location[language]}>
                    {selectedEvent.location[language]}
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

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
