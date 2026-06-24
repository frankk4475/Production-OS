import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import UserManager from './UserManager';
import { googleCalendar, DEFAULT_CLIENT_ID } from '../services/googleCalendar';
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
  Shield,
  Settings,
  Check,
  RefreshCw
} from 'lucide-react';

const STANDARD_CREW_ROLES = [
  { th: 'ผู้ดำเนินงานสร้าง', en: 'Producer' },
  { th: 'ผู้กำกับ', en: 'Director' },
  { th: 'นักเขียนบท', en: 'Screenwriter' },
  { th: 'ผู้ช่วยผู้กำกับ 1', en: '1st Assistant Director' },
  { th: 'ผู้จัดการกองถ่าย', en: 'Production Manager' },
  { th: 'ผู้บันทึกการถ่ายทำ', en: 'Script Supervisor' },
  { th: 'ผู้กำกับภาพ', en: 'Director of Photography' },
  { th: 'ผู้ช่วยกล้อง 1', en: 'Focus Puller' },
  { th: 'ผู้ช่วยกล้อง 2', en: 'Camera Assistant' },
  { th: 'หัวหน้าช่างคุมอุปกรณ์กล้อง', en: 'Key Grip' },
  { th: 'หัวหน้าช่างไฟ', en: 'Gaffer' },
  { th: 'ช่างไฟ', en: 'Best Boy Electric' },
  { th: 'ผู้กำกับศิลป์', en: 'Production Designer' },
  { th: 'ผู้ดูแลอุปกรณ์ประกอบฉาก', en: 'Prop Master' },
  { th: 'ช่างบันทึกเสียง', en: 'Sound Mixer' },
  { th: 'คนถือไมค์บูม', en: 'Boom Operator' },
  { th: 'ช่างแต่งหน้าหลัก', en: 'Key Makeup Artist' },
  { th: 'ช่างออกแบบเครื่องแต่งกาย', en: 'Costume Designer' },
  { th: 'นักแสดง', en: 'Actor/Talent' },
  { th: 'ผู้ช่วยทั่วไปในกองถ่าย', en: 'Production Assistant' }
];

const getCrewDepartment = (member) => {
  if (!member) return null;
  const role = (member.role || '').toLowerCase();
  const roleTh = (member.role_th || '').toLowerCase();
  if (role.includes('camera') || role.includes('photography') || role.includes('grip') || role.includes('dp') || role.includes('dop') || role.includes('focus') || role.includes('dit') || roleTh.includes('กล้อง') || roleTh.includes('ภาพ')) return 'camera';
  if (role.includes('art') || role.includes('prop') || role.includes('design') || role.includes('set') || roleTh.includes('ศิลป์') || roleTh.includes('ประกอบฉาก')) return 'art';
  if (role.includes('gaffer') || role.includes('light') || role.includes('electric') || roleTh.includes('ไฟ') || roleTh.includes('ไฟฟ้า')) return 'lighting';
  if (role.includes('sound') || role.includes('mixer') || role.includes('boom') || role.includes('audio') || roleTh.includes('เสียง') || roleTh.includes('บันทึกเสียง')) return 'sound';
  if (role.includes('makeup') || role.includes('wardrobe') || role.includes('stylist') || role.includes('costume') || roleTh.includes('แต่งหน้า') || roleTh.includes('เสื้อผ้า') || roleTh.includes('แต่งกาย')) return 'wardrobe';
  if (role.includes('director') || role.includes('ad') || role.includes('manager') || role.includes('coordinator') || role.includes('producer') || role.includes('writer') || role.includes('screen') || role.includes('script') || roleTh.includes('ผู้กำกับ') || roleTh.includes('กองถ่าย') || roleTh.includes('จัดการ') || roleTh.includes('เขียนบท') || roleTh.includes('บท')) return 'production';
  return null;
};

const generateGoogleCalendarUrl = (title, dateStr, location = '', details = '') => {
  if (!dateStr) return '#';
  const cleanDate = dateStr.replace(/-/g, '');
  const dateObj = new Date(dateStr);
  let endStr = cleanDate;
  if (!isNaN(dateObj.getTime())) {
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    endStr = `${year}${month}${day}`;
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${cleanDate}/${endStr}`,
    details: details,
    location: location
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export default function CrewPortal({ lockedCrewId }) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { user, hasWriteAccess, isCrewOrTalent } = useAuth();
  
  const {
    activeScenes,
    activeCrew: crew,
    addCrewMember,
    updateCrewMember,
    deleteCrewMember,
    activeEvents: events,
    saveEvents,
    activeCompletedTasks: completedTasks,
    setCompletedTasks: saveCompletedTasks,
    refreshCrew,
    isLoading
  } = useProject();

  // Tab View Mode: 'producer' (Roster) | 'crew' (My Schedule) | 'access' (UserManager)
  const [portalMode, setPortalMode] = useState(() => {
    return isCrewOrTalent() || lockedCrewId ? 'crew' : 'producer';
  });

  const [selectedCrewId, setSelectedCrewId] = useState(lockedCrewId || '');
  const [allEvents, setAllEvents] = useState([]);

  // Auto-select the logged-in crew member's ID if in crew/talent view
  useEffect(() => {
    if (user && isCrewOrTalent() && crew.length > 0) {
      const match = crew.find(c => c.email?.toLowerCase() === user.email?.toLowerCase());
      if (match) {
        setSelectedCrewId(match.id);
      }
    }
  }, [user, crew]);

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
        const dateVal = typeof d === 'string' ? d : d?.date;
        if (!dateVal) continue;
        const hasEvent = allEvents.some(e => e.date === dateVal && e.crew_assigned && e.crew_assigned.includes(memberId));
        if (hasEvent) {
          const conflictingEvents = allEvents.filter(e => e.date === dateVal && e.crew_assigned && e.crew_assigned.includes(memberId));
          const reasonVal = typeof d === 'string' ? (language === 'th' ? 'ติดธุระส่วนตัว' : 'Personal Errands') : (d?.reason || (language === 'th' ? 'ติดธุระส่วนตัว' : 'Personal Errands'));
          return { date: dateVal, reason: reasonVal, events: conflictingEvents };
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
        reason: language === 'th' ? 'งานซ้อนในโปรเจกต์' : 'Double Booked Events',
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
  const activeCrewMember = selectedCrewId === 'none' 
    ? null 
    : (crew.find(c => c.id === selectedCrewId) || crew[0]);

  // Get active crew member's events
  const crewEvents = activeCrewMember
    ? events.filter(e => e.crew_assigned && e.crew_assigned.includes(activeCrewMember.id)).sort((a,b) => a.date.localeCompare(b.date))
    : [];

  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !activeCrewMember) return;

    const currentTasksTh = activeCrewMember.tasks?.th || [];
    const currentTasksEn = activeCrewMember.tasks?.en || [];

    const updatedTasks = {
      th: language === 'th' ? [...currentTasksTh, newTaskText.trim()] : [...currentTasksTh, newTaskText.trim()],
      en: language === 'en' ? [...currentTasksEn, newTaskText.trim()] : [...currentTasksEn, newTaskText.trim()]
    };
    
    if (language === 'th') {
      updatedTasks.en = [...currentTasksEn, newTaskText.trim()];
    } else {
      updatedTasks.th = [...currentTasksTh, newTaskText.trim()];
    }

    const updatedMember = {
      ...activeCrewMember,
      tasks: updatedTasks
    };

    try {
      await updateCrewMember(updatedMember);
      setNewTaskText('');
    } catch (err) {
      alert("Failed to add task: " + err.message);
    }
  };

  const handleDeleteTask = async (taskIndex) => {
    if (!activeCrewMember) return;
    const confirmMsg = language === 'th' ? 'คุณต้องการลบหน้าที่รับผิดชอบนี้?' : 'Are you sure you want to delete this task?';
    if (!window.confirm(confirmMsg)) return;
    
    const currentTasksTh = activeCrewMember.tasks?.th || [];
    const currentTasksEn = activeCrewMember.tasks?.en || [];

    const updatedTasks = {
      th: currentTasksTh.filter((_, idx) => idx !== taskIndex),
      en: currentTasksEn.filter((_, idx) => idx !== taskIndex)
    };

    const updatedMember = {
      ...activeCrewMember,
      tasks: updatedTasks
    };

    try {
      await updateCrewMember(updatedMember);
      
      const key = `${activeCrewMember.id}-${taskIndex}`;
      if (completedTasks[key] !== undefined) {
        const updatedCompleted = { ...completedTasks };
        delete updatedCompleted[key];
        await saveCompletedTasks(updatedCompleted);
      }
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  const [personalIsConnected, setPersonalIsConnected] = useState(false);
  const [personalCalendars, setPersonalCalendars] = useState([]);
  const getPersonalKey = (baseKey) => user?.id ? `${baseKey}_${user.id}` : baseKey;

  const [selectedPersonalCalendarId, setSelectedPersonalCalendarId] = useState(() => localStorage.getItem(getPersonalKey('google_personal_calendar_id')) || '');
  const personalClientId = DEFAULT_CLIENT_ID;

  useEffect(() => {
    const handleAuthMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'GOOGLE_AUTH_CALLBACK' && event.data.state === 'personal-calendar') {
        const params = googleCalendar.parseHashParams(event.data.hash);
        if (params) {
          localStorage.setItem(getPersonalKey('google_personal_access_token'), params.accessToken);
          localStorage.setItem(getPersonalKey('google_personal_token_expires_at'), params.expiresAt);
          loadPersonalCalendars(params.accessToken);
        }
      }
    };
    window.addEventListener('message', handleAuthMessage);

    const hash = window.location.hash;
    if (hash && hash.includes('state=personal-calendar')) {
      const params = googleCalendar.parseHashParams();
      if (params) {
        localStorage.setItem(getPersonalKey('google_personal_access_token'), params.accessToken);
        localStorage.setItem(getPersonalKey('google_personal_token_expires_at'), params.expiresAt);
        window.location.hash = '#/personal';
        loadPersonalCalendars(params.accessToken);
      }
    } else {
      const token = localStorage.getItem(getPersonalKey('google_personal_access_token'));
      const expiresAt = localStorage.getItem(getPersonalKey('google_personal_token_expires_at'));
      if (token && expiresAt && Number(expiresAt) > Date.now()) {
        loadPersonalCalendars(token);
      }
    }

    return () => window.removeEventListener('message', handleAuthMessage);
  }, [user?.id]);

  const loadPersonalCalendars = async (token) => {
    try {
      const list = await googleCalendar.fetchCalendars(token);
      setPersonalCalendars(list);
      setPersonalIsConnected(true);
    } catch (err) {
      console.error("Failed to load Google personal calendars:", err);
      setPersonalIsConnected(false);
      localStorage.removeItem(getPersonalKey('google_personal_access_token'));
    }
  };

  const handleConnectPersonalGoogle = () => {
    const clientIdToUse = DEFAULT_CLIENT_ID;
    if (!clientIdToUse) {
      alert(language === 'th' ? 'กรุณาระบุ Google Client ID ก่อนเชื่อมต่อ' : 'Please provide a Google Client ID first');
      return;
    }
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = googleCalendar.getAuthUrl(clientIdToUse, redirectUri, 'personal-calendar');
    
    // Open in popup window
    const width = 550;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      authUrl,
      'GoogleAuthPopup',
      `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,scrollbars=yes`
    );
    if (popup) {
      popup.focus();
    }
  };

  const handleDisconnectPersonalGoogle = () => {
    localStorage.removeItem(getPersonalKey('google_personal_access_token'));
    localStorage.removeItem(getPersonalKey('google_personal_token_expires_at'));
    localStorage.removeItem(getPersonalKey('google_personal_calendar_id'));
    setPersonalCalendars([]);
    setSelectedPersonalCalendarId('');
    setPersonalIsConnected(false);
  };

  const handleSelectPersonalCalendar = (calId) => {
    setSelectedPersonalCalendarId(calId);
    localStorage.setItem(getPersonalKey('google_personal_calendar_id'), calId);
  };

  const handleSyncAllBlockedDatesToGoogle = async () => {
    const token = localStorage.getItem(getPersonalKey('google_personal_access_token'));
    const calId = localStorage.getItem(getPersonalKey('google_personal_calendar_id'));
    if (!token || !calId || !activeCrewMember) {
      alert(language === 'th' ? 'กรุณาเชื่อมต่อปฏิทิน Google ก่อน' : 'Please connect Google Calendar first');
      return;
    }
    
    try {
      const updatedDates = [];
      for (const d of (activeCrewMember.booked_dates || [])) {
        const dateVal = typeof d === 'string' ? d : d?.date;
        const reasonVal = typeof d === 'string' ? 'ติดธุระส่วนตัว' : d?.reason;
        let gId = typeof d === 'string' ? null : d?.googleEventId;
        
        const eventData = {
          title: (language === 'th' ? `ติดธุระ: ` : `Busy: `) + (activeCrewMember.name?.th || activeCrewMember.name?.en) + ` (${reasonVal})`,
          date: dateVal,
          description: language === 'th' ? `เหตุผล: ${reasonVal}` : `Reason: ${reasonVal}`
        };
        
        if (gId) {
          try {
            await googleCalendar.updateEvent(token, calId, gId, eventData);
          } catch (err) {
            const res = await googleCalendar.createEvent(token, calId, eventData);
            gId = res.id;
          }
        } else {
          const res = await googleCalendar.createEvent(token, calId, eventData);
          gId = res.id;
        }
        
        updatedDates.push({
          date: dateVal,
          reason: reasonVal,
          googleEventId: gId
        });
      }
      
      const updatedMember = {
        ...activeCrewMember,
        booked_dates: updatedDates
      };
      await updateCrewMember(updatedMember);
      alert(language === 'th' ? 'ซิงค์วันติดธุระไปยัง Google Calendar แล้ว' : 'Sync completed successfully');
    } catch (err) {
      alert("Failed to sync: " + err.message);
    }
  };

  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    if (!newBlockedDate || !activeCrewMember) return;
    
    const isAlreadyBlocked = (activeCrewMember.booked_dates || []).some(d => (typeof d === 'string' ? d : d?.date) === newBlockedDate);
    if (isAlreadyBlocked) {
      alert(language === 'th' ? 'วันนี้ถูกบันทึกไปแล้ว' : 'This date is already blocked');
      return;
    }

    const token = localStorage.getItem(getPersonalKey('google_personal_access_token'));
    const calId = localStorage.getItem(getPersonalKey('google_personal_calendar_id'));
    const expiresAt = localStorage.getItem(getPersonalKey('google_personal_token_expires_at'));
    const reasonText = newBlockedReason.trim() || (language === 'th' ? 'ติดธุระส่วนตัว' : 'Personal Errands');
    
    let googleEventId = null;
    if (token && calId && expiresAt && Number(expiresAt) > Date.now()) {
      try {
        const eventData = {
          title: (language === 'th' ? `ติดธุระ: ` : `Busy: `) + (activeCrewMember.name?.th || activeCrewMember.name?.en) + ` (${reasonText})`,
          date: newBlockedDate,
          description: language === 'th' ? `เหตุผล: ${reasonText}` : `Reason: ${reasonText}`
        };
        const res = await googleCalendar.createEvent(token, calId, eventData);
        googleEventId = res.id;
      } catch (err) {
        console.error("Failed to sync new blocked date to Google Calendar:", err);
      }
    }
    
    const newEntry = {
      date: newBlockedDate,
      reason: reasonText,
      googleEventId
    };

    const updatedMember = {
      ...activeCrewMember,
      booked_dates: [...(activeCrewMember.booked_dates || []), newEntry].sort((a, b) => {
        const dateA = typeof a === 'string' ? a : a?.date || '';
        const dateB = typeof b === 'string' ? b : b?.date || '';
        return dateA.localeCompare(dateB);
      })
    };
    
    try {
      await updateCrewMember(updatedMember);
      setNewBlockedDate('');
      setNewBlockedReason('');
    } catch (err) {
      alert("Failed to block date: " + err.message);
    }
  };

  const handleRemoveBlockedDate = async (dateStr) => {
    if (!activeCrewMember) return;
    const confirmMsg = language === 'th' 
      ? `ยืนยันการลบวันติดธุระวันที่ ${dateStr}?` 
      : `Are you sure you want to delete blocked date ${dateStr}?`;
    if (!window.confirm(confirmMsg)) return;

    const targetEntry = (activeCrewMember.booked_dates || []).find(d => (typeof d === 'string' ? d : d?.date) === dateStr);
    const googleEventId = targetEntry && typeof targetEntry === 'object' ? targetEntry.googleEventId : null;
    
    if (googleEventId) {
      const token = localStorage.getItem(getPersonalKey('google_personal_access_token'));
      const calId = localStorage.getItem(getPersonalKey('google_personal_calendar_id'));
      const expiresAt = localStorage.getItem(getPersonalKey('google_personal_token_expires_at'));
      if (token && calId && expiresAt && Number(expiresAt) > Date.now()) {
        try {
          await googleCalendar.deleteEvent(token, calId, googleEventId);
        } catch (err) {
          console.error("Failed to delete blocked date from Google Calendar:", err);
        }
      }
    }
    
    const updatedMember = {
      ...activeCrewMember,
      booked_dates: (activeCrewMember.booked_dates || []).filter(d => (typeof d === 'string' ? d : d?.date) !== dateStr)
    };
    
    try {
      await updateCrewMember(updatedMember);
    } catch (err) {
      alert("Failed to unblock date: " + err.message);
    }
  };

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

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gold-500 uppercase mb-1">
                  {language === 'th' ? 'เลือกตำแหน่งงานมาตรฐาน (หรือระบุเองด้านล่าง)' : 'Select Standard Role (or type below)'}
                </label>
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      // Let user type
                    } else if (val) {
                      const selected = STANDARD_CREW_ROLES.find(r => r.en === val);
                      if (selected) {
                        setFormRoleTh(selected.th);
                        setFormRoleEn(selected.en);
                      }
                    }
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">-- {language === 'th' ? 'เลือกตำแหน่งงาน' : 'Select Job Title'} --</option>
                  {STANDARD_CREW_ROLES.map((r, i) => (
                    <option key={i} value={r.en}>{language === 'th' ? `${r.th} (${r.en})` : r.en}</option>
                  ))}
                  <option value="custom">{language === 'th' ? 'ระบุเอง / Custom' : 'Custom...'}</option>
                </select>
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
                              <span 
                                className="px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20"
                                title={`${language === 'th' ? 'เหตุผล: ' : 'Reason: '}${conflict.reason}`}
                              >
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
                                className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-500/10 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/20 bg-transparent transition-all cursor-pointer"
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
                      {language === 'th' ? 'ชนคิวงานในวันที่' : 'Double booked on'} <span className="underline font-bold font-mono">{conflict.date}</span>
                      {conflict.reason && ` (${language === 'th' ? 'เหตุผล' : 'Reason'}: ${conflict.reason})`}:
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
                    {crewEvents.map((evt) => {
                      const matchedScene = evt.scene_number ? activeScenes.find(s => s.scene_number === evt.scene_number || s.id === evt.scene_number) : null;
                      const dept = getCrewDepartment(activeCrewMember);
                      
                      let deptLabel = '';
                      let deptNote = '';
                      if (dept === 'camera') {
                        deptLabel = language === 'th' ? 'หน้าที่/คำแนะนำแผนกกล้อง' : 'Camera & Grip Instructions';
                        deptNote = evt.notes?.camera_notes;
                      } else if (dept === 'art') {
                        deptLabel = language === 'th' ? 'หน้าที่/คำแนะนำแผนกศิลป์' : 'Art & Props Instructions';
                        deptNote = evt.notes?.art_notes;
                      } else if (dept === 'lighting') {
                        deptLabel = language === 'th' ? 'หน้าที่/คำแนะนำแผนกแสง' : 'Lighting & Electric Instructions';
                        deptNote = evt.notes?.lighting_notes;
                      } else if (dept === 'sound') {
                        deptLabel = language === 'th' ? 'หน้าที่/คำแนะนำแผนกเสียง' : 'Sound & Audio Instructions';
                        deptNote = evt.notes?.sound_notes;
                      } else if (dept === 'wardrobe') {
                        deptLabel = language === 'th' ? 'หน้าที่/คำแนะนำแผนกเครื่องแต่งกาย/แต่งหน้า' : 'Makeup & Wardrobe Instructions';
                        deptNote = evt.notes?.wardrobe_notes;
                      } else if (dept === 'production') {
                        deptLabel = language === 'th' ? 'หน้าที่/คำแนะนำแผนกจัดการกองถ่าย' : 'Production & Direction Instructions';
                        deptNote = evt.notes?.production_notes;
                      }

                      if (!deptNote && dept) {
                        if (matchedScene) {
                          if (dept === 'camera') deptNote = matchedScene.tech_notes?.camera_notes?.[language] || matchedScene.tech_notes?.camera_notes?.en || matchedScene.tech_notes?.[language] || matchedScene.tech_notes?.en;
                          else if (dept === 'art') deptNote = matchedScene.tech_notes?.art_notes?.[language] || matchedScene.tech_notes?.art_notes?.en;
                          else if (dept === 'lighting') deptNote = matchedScene.tech_notes?.lighting_notes?.[language] || matchedScene.tech_notes?.lighting_notes?.en;
                          else if (dept === 'sound') deptNote = matchedScene.tech_notes?.sound_notes?.[language] || matchedScene.tech_notes?.sound_notes?.en;
                          else if (dept === 'wardrobe') deptNote = matchedScene.tech_notes?.wardrobe_notes?.[language] || matchedScene.tech_notes?.wardrobe_notes?.en;
                          else if (dept === 'production') deptNote = matchedScene.tech_notes?.production_notes?.[language] || matchedScene.tech_notes?.production_notes?.en;
                        }
                        
                        if (!deptNote) {
                          if (dept === 'camera') deptNote = language === 'th' ? 'ตรวจสอบอุปกรณ์กล้อง เลนส์ การ์ดบันทึกข้อมูล และระบบไฟสำรอง' : 'Verify camera packages, lenses, media, and power backups.';
                          else if (dept === 'art') deptNote = language === 'th' ? 'เตรียมอุปกรณ์ประกอบฉากหลักและจัดฉากตามที่กำหนด' : 'Prepare props and set dressing as specified.';
                          else if (dept === 'lighting') deptNote = language === 'th' ? 'ติดตั้งไฟและแผงสะท้อนแสงตามทิศทางกล้อง ตรวจสอบระบบจ่ายไฟ 220V' : 'Refer to camera setup guidelines. Ensure 220V distro feeds are routed exterior.';
                          else if (dept === 'sound') deptNote = language === 'th' ? 'เตรียมไมโครโฟนบูมและไมค์ลาวาเลียร์ให้พร้อม ทดสอบระดับเสียงบรรยากาศ' : 'Ensure boom mics and lavaliers are prepped. Track ambient sound levels.';
                          else if (dept === 'wardrobe') deptNote = language === 'th' ? 'ตรวจเช็กเสื้อผ้าเครื่องแต่งกายของนักแสดงและคุมการแต่งหน้าทำผมให้ต่อเนื่อง' : 'Pre-check cast costumes and makeup continuity matching storyboard.';
                          else if (dept === 'production') deptNote = language === 'th' ? 'เตรียมใบสั่งงานกองถ่าย ดูแลความเรียบร้อยทั่วไปในกองถ่ายและประสานเวลา' : 'Prepare call sheets and script notes. Sync schedules with AD.';
                        }
                      }

                      return (
                        <div key={evt.id} className="glass-panel p-4 rounded-xl border border-slate-200/50 dark:border-obsidian-850 bg-slate-50/20 dark:bg-obsidian-950/20 flex flex-col gap-3 hover:scale-[1.002] transition-transform">
                          <div className="flex justify-between items-start gap-4">
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
                              <a
                                href={generateGoogleCalendarUrl(
                                  (evt.type === 'shoot' ? '🎥 ' : '🛠️ ') + (evt.title?.[language] || evt.title?.en || 'Event'),
                                  evt.date,
                                  evt.location?.[language] || evt.location?.en || '',
                                  `Time: ${evt.time}\n${evt.type === 'shoot' ? 'Shoot Day' : 'Prep Day'}\n${deptNote || ''}`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-500 hover:text-gold-600 transition-colors mt-1"
                              >
                                <CalendarIcon size={11} />
                                <span>{language === 'th' ? 'ซิงค์ลง Google Calendar' : 'Sync to Google Calendar'}</span>
                              </a>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-gold-500">{evt.date}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{evt.time}</p>
                            </div>
                          </div>

                          {evt.type === 'shoot' && (matchedScene || deptNote) && (
                            <div className="mt-2 pt-2.5 border-t border-slate-150 dark:border-obsidian-850/60 text-xs space-y-2 text-left animate-fadeIn">
                              {matchedScene && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-100/30 dark:bg-obsidian-950/40 p-2.5 rounded-lg border border-slate-200/40 dark:border-obsidian-800/40">
                                  <div>
                                    <span className="font-bold text-gold-500 block mb-0.5">{language === 'th' ? 'ฉาก / เนื้อเรื่องย่อ' : 'Scene / Story Synopsis'}</span>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                                      {language === 'th' ? `ฉาก ${matchedScene.scene_number}: ` : `Scene ${matchedScene.scene_number}: `}
                                      {matchedScene.description?.[language] || matchedScene.description?.en || '-'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-gold-500 block mb-0.5">{language === 'th' ? 'นักแสดงในฉาก' : 'Cast in Scene'}</span>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium">{matchedScene.cast?.[language] || matchedScene.cast?.en || '-'}</p>
                                  </div>
                                </div>
                              )}

                              {deptNote && (
                                <div className="p-2.5 rounded-lg border border-gold-500/10 bg-gold-500/5">
                                  <span className="font-bold text-gold-500 block mb-1">
                                    📌 {deptLabel}
                                  </span>
                                  <p className="text-slate-750 dark:text-slate-350 leading-relaxed font-medium whitespace-pre-line">
                                    {deptNote}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                        <div 
                          key={idx} 
                          className="py-2.5 flex items-start justify-between gap-3 group select-none"
                        >
                          <label className="flex items-start gap-3 cursor-pointer flex-1">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleTask(activeCrewMember.id, idx)}
                              className="rounded border-slate-350 dark:border-obsidian-800 accent-gold-500 mt-0.5 w-4 h-4 cursor-pointer focus:ring-0 focus:ring-offset-0"
                            />
                            <span className={`text-sm transition-all ${
                              isChecked 
                                ? 'line-through text-slate-400 dark:text-slate-500' 
                                : 'text-slate-800 dark:text-slate-200 group-hover:text-gold-500'
                            }`}>
                              {task}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(idx)}
                            className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                            title={language === 'th' ? "ลบหน้าที่รับผิดชอบ" : "Delete task"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Add Task Input Form */}
                    <form onSubmit={handleAddTask} className="flex gap-2 mt-4 pt-4 border-t border-slate-150 dark:border-obsidian-800/60">
                      <input
                        type="text"
                        required
                        placeholder={language === 'th' ? "เพิ่มหน้าที่รับผิดชอบใหม่..." : "Add new task..."}
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                          theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100 placeholder-slate-650' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-inner'
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gold-500 text-white hover:bg-gold-600 transition-colors"
                      >
                        {language === 'th' ? "เพิ่ม" : "Add"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* My Blocked Dates (Busy) */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-base font-bold font-serif flex items-center gap-1.5">
                    <CalendarIcon size={16} className="text-red-500" />
                    <span>{language === 'th' ? 'วันติดธุระของฉัน' : 'My Blocked Dates (Busy)'}</span>
                  </h3>
                  
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <form onSubmit={handleAddBlockedDate} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={newBlockedDate}
                          onChange={(e) => setNewBlockedDate(e.target.value)}
                          className={`w-1/2 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                            theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-inner'
                          }`}
                        />
                        <input
                          type="text"
                          placeholder={language === 'th' ? "ระบุเหตุผล (เช่น ติดธุระส่วนตัว)" : "Reason (e.g. Family Errands)"}
                          value={newBlockedReason}
                          onChange={(e) => setNewBlockedReason(e.target.value)}
                          className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                            theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900 shadow-inner'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-650 text-white transition-colors"
                      >
                        {language === 'th' ? 'บล็อกวันติดธุระ' : 'Block Date'}
                      </button>
                    </form>

                    <div className="divide-y divide-slate-100 dark:divide-obsidian-800/40 max-h-[220px] overflow-y-auto pr-1">
                      {(activeCrewMember.booked_dates || []).map((d, idx) => {
                        const dateVal = typeof d === 'string' ? d : d?.date;
                        const reasonVal = typeof d === 'string' ? (language === 'th' ? 'ติดธุระส่วนตัว' : 'Personal Errands') : d?.reason;
                        const hasConflict = crewEvents.some(evt => evt.date === dateVal);
                        
                        return (
                          <div key={idx} className="py-2.5 flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between gap-3 group select-none">
                              <div className="min-w-0 text-left">
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-350 block">{dateVal}</span>
                                <span className="text-[10px] text-slate-450 italic truncate block">{reasonVal}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={generateGoogleCalendarUrl(
                                    (language === 'th' ? `ติดธุระ: ` : `Busy: `) + (activeCrewMember.name?.th || activeCrewMember.name?.en) + ` (${reasonVal})`,
                                    dateVal,
                                    '',
                                    language === 'th' ? `เหตุผล: ${reasonVal}` : `Reason: ${reasonVal}`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-gold-500 hover:text-gold-600 flex items-center gap-1"
                                  title="Add to Google Calendar"
                                >
                                  <CalendarIcon size={12} />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBlockedDate(dateVal)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                                  title={language === 'th' ? "ลบวันติดธุระ" : "Unblock date"}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                            {hasConflict && (
                              <div className="text-[10px] font-bold text-red-500 flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded w-max">
                                <span>⚠️ {language === 'th' ? 'ชนคิวงานถ่ายทำ!' : 'Double-booked with shoot!'}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {(activeCrewMember.booked_dates || []).length === 0 && (
                        <p className="text-[11px] text-slate-400 italic py-4 text-center">
                          {language === 'th' ? 'ไม่มีการบล็อกวันติดธุระ' : 'No blocked dates added.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Google Calendar Sync Settings */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-base font-bold font-serif flex items-center gap-1.5">
                    <Settings size={16} className="text-gold-500" />
                    <span>{language === 'th' ? 'ตั้งค่า Google Calendar ส่วนตัว' : 'Personal Google Calendar'}</span>
                  </h3>
                  
                  <div className="glass-panel p-4 rounded-xl space-y-3 text-left">

                    
                    {personalIsConnected && (
                      <div className="text-right">
                        <button 
                          type="button"
                          onClick={() => setShowPersonalAdvanced(!showPersonalAdvanced)}
                          className="text-[10px] font-bold text-gold-500 hover:text-gold-400 focus:outline-none transition-colors"
                        >
                          {showPersonalAdvanced 
                            ? (language === 'th' ? '⚙️ ซ่อนข้อมูล Client ID' : '⚙️ Hide Client ID')
                            : (language === 'th' ? '⚙️ แสดงข้อมูล Client ID' : '⚙️ Show Client ID')
                          }
                        </button>
                        
                        {showPersonalAdvanced && (
                          <div className="mt-2 text-left p-2 rounded bg-slate-500/5 border border-slate-200 dark:border-obsidian-800/80 font-mono text-[10px] text-slate-400 truncate">
                            ID: {personalClientId}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {personalIsConnected ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <Check size={13} />
                            {language === 'th' ? 'เชื่อมต่อ Google แล้ว' : 'Connected'}
                          </span>
                          <button
                            type="button"
                            onClick={handleDisconnectPersonalGoogle}
                            className="text-[10px] text-red-500 hover:underline font-bold"
                          >
                            {language === 'th' ? 'ยกเลิกการเชื่อมต่อ' : 'Disconnect'}
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            {language === 'th' ? 'ปฏิทินที่จะซิงค์วันติดธุระ' : 'Select Google Calendar'}
                          </label>
                          <select
                            value={selectedPersonalCalendarId}
                            onChange={(e) => handleSelectPersonalCalendar(e.target.value)}
                            className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer ${
                              theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <option value="">-- Choose Calendar --</option>
                            {personalCalendars.map(c => (
                              <option key={c.id} value={c.id}>{c.summary}</option>
                            ))}
                          </select>
                        </div>

                        {selectedPersonalCalendarId && (
                          <button
                            type="button"
                            onClick={handleSyncAllBlockedDatesToGoogle}
                            className="w-full py-1.5 rounded-lg text-xs font-bold bg-gold-500 text-white hover:bg-gold-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <RefreshCw size={13} />
                            <span>{language === 'th' ? 'ซิงค์วันหยุดทั้งหมดลง Google' : 'Sync All Blocked Dates'}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectPersonalGoogle}
                        className="w-full py-2 rounded-lg text-xs font-bold bg-gold-500 text-white hover:bg-gold-600 transition-colors"
                      >
                        {language === 'th' ? 'เชื่อมต่อ Google Calendar' : 'Connect Google Account'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : selectedCrewId === 'none' ? (
            <div className="glass-panel p-8 text-center text-xs space-y-3 max-w-lg mx-auto border border-amber-500/20 bg-amber-500/5 rounded-xl">
              <p className="text-amber-500 font-bold text-sm">⚠️ {language === 'th' ? 'พบบัญชีผู้ใช้แต่ไม่พบคู่สัญญาในรายชื่อทีมงาน' : 'Account Not Linked to Crew Roster'}</p>
              <p className="text-slate-400 leading-relaxed font-medium">
                {language === 'th' 
                  ? 'บัญชีผู้ใช้นี้เข้าสู่ระบบสำเร็จแล้ว แต่ไม่ได้รับการเชื่อมโยงกับรายชื่อทีมงานในแผนกผลิต กรุณาติดต่อผู้ดำเนินงานสร้าง (Producer) เพื่อตรวจสอบให้แน่ใจว่าอีเมลของบัญชีตรงกับรายชื่อพนักงานในระบบหลัก' 
                  : 'Your account is logged in successfully, but has not been linked to a profile in the crew roster. Please ask the Producer or 1st AD to ensure your account email matches the roster email.'}
              </p>
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
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gold-500 uppercase mb-1">
                    {language === 'th' ? 'เลือกตำแหน่งงานมาตรฐาน (หรือระบุเองด้านล่าง)' : 'Select Standard Role (or type below)'}
                  </label>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        // Let user type
                      } else if (val) {
                        const selected = STANDARD_CREW_ROLES.find(r => r.en === val);
                        if (selected) {
                          setFormRoleTh(selected.th);
                          setFormRoleEn(selected.en);
                        }
                      }
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="">-- {language === 'th' ? 'เลือกตำแหน่งงาน' : 'Select Job Title'} --</option>
                    {STANDARD_CREW_ROLES.map((r, i) => (
                      <option key={i} value={r.en}>{language === 'th' ? `${r.th} (${r.en})` : r.en}</option>
                    ))}
                    <option value="custom">{language === 'th' ? 'ระบุเอง / Custom' : 'Custom...'}</option>
                  </select>
                </div>

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
