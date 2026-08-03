import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Printer, 
  Plus, 
  CloudSun, 
  MapPin, 
  Camera, 
  Wrench,
  Clapperboard,
  Edit,
  Trash2,
  Upload,
  Volume2,
  Sparkles,
  Briefcase,
  Layers,
  Calendar,
  Clock,
  Hospital,
  CheckCircle,
  X,
  Download,
  FolderPlus,
  Search,
  User,
  Users,
  Film,
  FolderOpen,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const ELEMENT_CATEGORIES = [
  { id: 'cast_members', label: 'Cast Members', labelTh: 'นักแสดงหลัก', dotColor: 'bg-purple-500', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  { id: 'extras', label: 'Extras', labelTh: 'ตัวประกอบ', dotColor: 'bg-pink-500', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  { id: 'props', label: 'Props', labelTh: 'อุปกรณ์ประกอบฉาก', dotColor: 'bg-amber-500', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { id: 'set_dressing', label: 'Set Dressing', labelTh: 'การตกแต่งฉาก', dotColor: 'bg-blue-500', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  { id: 'costumes', label: 'Costumes', labelTh: 'เครื่องแต่งกาย', dotColor: 'bg-emerald-500', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { id: 'makeup_hair', label: 'Makeup & Hair', labelTh: 'แต่งหน้าทำผม', dotColor: 'bg-teal-500', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  { id: 'sound', label: 'Sound', labelTh: 'เสียงและเอฟเฟกต์', dotColor: 'bg-violet-500', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
  { id: 'vfx', label: 'VFX', labelTh: 'วิชวลเอฟเฟกต์', dotColor: 'bg-indigo-500', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  { id: 'vehicles', label: 'Vehicles', labelTh: 'ยานพาหนะ', dotColor: 'bg-cyan-500', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { id: 'stunts', label: 'Stunts', labelTh: 'สตันท์', dotColor: 'bg-red-500', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  { id: 'animals', label: 'Animals', labelTh: 'นักแสดงสัตว์', dotColor: 'bg-green-500', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  { id: 'other', label: 'Other', labelTh: 'อื่นๆ', dotColor: 'bg-slate-500', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' }
];

const FILE_CATEGORIES = [
  { id: 'all', labelTh: 'ทั้งหมด', labelEn: 'All Files' },
  { id: 'contracts', labelTh: 'สัญญาและข้อตกลง', labelEn: 'Contracts & Agreements' },
  { id: 'permits', labelTh: 'ใบอนุญาตสถานที่', labelEn: 'Location Permits' },
  { id: 'plans', labelTh: 'ผังฉาก/ไฟ/บล็อกกิ้ง', labelEn: 'Floor Plans & Lighting Plots' },
  { id: 'scripts', labelTh: 'บทภาพยนตร์แก้ไข', labelEn: 'Script Revisions' },
  { id: 'reports', labelTh: 'รายงานกองถ่าย', labelEn: 'Production & Set Reports' },
  { id: 'safety', labelTh: 'เอกสารความปลอดภัย', labelEn: 'Safety & Risk Assessments' },
  { id: 'other', labelTh: 'อื่นๆ', labelEn: 'Other Documents' }
];

// Major Category Groups Definition
const DOCUMENT_GROUPS = [
  {
    id: 'preprod',
    titleTh: 'หมวดหมู่ที่ 1: เอกสารเตรียมการถ่ายทำ (Pre-Production Documents)',
    titleEn: 'Category 1: Pre-Production Documents',
    icon: FolderOpen,
    color: 'border-l-gold-500',
    tabs: [
      { id: 'callsheet', icon: FileText, labelTh: 'ใบสั่งงานกองถ่าย (Daily Call Sheet)', labelEn: 'Daily Call Sheet' },
      { id: 'breakdown', icon: Layers, labelTh: 'ใบแจกแจงฉาก (Scene Breakdown)', labelEn: 'Scene Breakdown Sheet' },
      { id: 'schedule_report', icon: Calendar, labelTh: 'ตารางคิวกองถ่าย (Shooting Schedule)', labelEn: 'One-Liner Schedule' }
    ]
  },
  {
    id: 'shooting_visual',
    titleTh: 'หมวดหมู่ที่ 2: เอกสารการถ่ายทำ & งานภาพ (Shooting & Visual Suite)',
    titleEn: 'Category 2: Shooting & Visual Suite',
    icon: Film,
    color: 'border-l-amber-500',
    tabs: [
      { id: 'shotlist', icon: Video, labelTh: 'รายการช็อตถ่ายทำ (Shot List)', labelEn: 'Shot List' },
      { id: 'storyboard', icon: ImageIcon, labelTh: 'สตอรี่บอร์ด & สเก็ตช์ (Storyboards)', labelEn: 'Storyboards & Previs' }
    ]
  },
  {
    id: 'vault',
    titleTh: 'หมวดหมู่ที่ 3: คลังจัดเก็บเอกสารกองถ่าย (Production File Vault)',
    titleEn: 'Category 3: Production File Vault & Archive',
    icon: FolderPlus,
    color: 'border-l-purple-500',
    tabs: [
      { id: 'file_vault', icon: FolderPlus, labelTh: 'คลังไฟล์เอกสาร (File Vault)', labelEn: 'Production File Vault' }
    ]
  }
];

// Bulletproof Helper function for text formatting (handles strings, objects, numbers, nulls)
const formatTextValue = (val, lang = 'th', fallback = '-') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const text = val[lang] || val.th || val.en || val.text || val.value;
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return String(text);
    return fallback;
  }
  return String(val);
};

function DocumentsHubContent({ 
  scenes = [], 
  crew = [], 
  weather, 
  initialSceneNum, 
  shotList = [], 
  setShotList, 
  lockedTab,
  events = [],
  setEvents
}) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const auth = useAuth();
  const { currentProject: project, pushUndoAction } = useProject();

  const isTh = language === 'th';
  const hasWriteAccess = typeof auth?.hasWriteAccess === 'function' ? auth.hasWriteAccess() : true;

  // Safe Array Wrappers
  const safeScenes = Array.isArray(scenes) ? scenes : [];
  const safeCrew = Array.isArray(crew) ? crew : [];
  const safeShotList = Array.isArray(shotList) ? shotList : [];
  const safeEvents = Array.isArray(events) ? events : [];

  // Active Major Document Tab State
  const [activeSubTab, setActiveSubTab] = useState(() => lockedTab || 'callsheet');

  useEffect(() => {
    if (lockedTab) {
      setActiveSubTab(lockedTab);
    }
  }, [lockedTab]);

  // Selected Scene Number (for Scene Breakdown, Shot List, Storyboard tabs)
  const [selectedSceneNum, setSelectedSceneNum] = useState(initialSceneNum || (safeScenes[0]?.scene_number || '1'));

  useEffect(() => {
    if (safeScenes.length > 0 && (!selectedSceneNum || !safeScenes.some(s => String(s.scene_number) === String(selectedSceneNum)))) {
      setSelectedSceneNum(String(safeScenes[0].scene_number));
    }
  }, [safeScenes, selectedSceneNum]);
  
  // Selected Shoot Day Number (for Call Sheet tab)
  const [selectedShootDay, setSelectedShootDay] = useState('1');

  // Print Orientation State ('portrait' | 'landscape')
  const [printOrientation, setPrintOrientation] = useState('portrait');

  // File Vault State (Persisted in LocalStorage per project)
  const [vaultFiles, setVaultFiles] = useState([]);
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState('all');
  const [vaultSearch, setVaultSearch] = useState('');
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);

  // Document Preview Modal State
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // File Upload Form State
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState('contracts');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newFileDataUrl, setNewFileDataUrl] = useState('');
  const [newFileType, setNewFileType] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Call Sheet Editor Modal State
  const [isCallSheetModalOpen, setIsCallSheetModalOpen] = useState(false);

  // Active Shoot Day / Event resolver
  const shootDaysList = (() => {
    const shootEvents = safeEvents.filter(e => e && e.type === 'shoot');
    if (shootEvents.length > 0) {
      return shootEvents.map((evt, idx) => ({
        dayNumber: String(idx + 1),
        eventId: evt.id,
        date: formatTextValue(evt.date, language, ''),
        sceneNumber: evt.scene_number || '1'
      }));
    }
    return [
      { dayNumber: '1', eventId: 'evt-day-1', date: formatTextValue(project?.start_date, language, new Date().toISOString().split('T')[0]), sceneNumber: '1' }
    ];
  })();

  // Current active Shoot Day event object & primitive ID for memoized effects
  const activeShootDayItem = shootDaysList.find(d => d && d.dayNumber === selectedShootDay) || shootDaysList[0];
  const activeEvent = safeEvents.find(e => e && (e.id === activeShootDayItem?.eventId || String(e.scene_number) === String(selectedSceneNum)));
  const activeEventId = activeEvent?.id || '';

  // Call Sheet Edit Form States (Always stored as formatted Strings to prevent React child object crashes!)
  const [callSheetDate, setCallSheetDate] = useState('');
  const [crewCallTime, setCrewCallTime] = useState('07:00 AM');
  const [shootCallTime, setShootCallTime] = useState('08:30 AM');
  const [lunchTime, setLunchTime] = useState('12:30 PM');
  const [wrapTime, setWrapTime] = useState('06:00 PM');
  const [shootLocation, setShootLocation] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [hospitalInfo, setHospitalInfo] = useState('');
  const [weatherAlertText, setWeatherAlertText] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [cameraNotes, setCameraNotes] = useState('');
  const [artNotes, setArtNotes] = useState('');
  const [lightingNotes, setLightingNotes] = useState('');
  const [soundNotes, setSoundNotes] = useState('');
  const [wardrobeNotes, setWardrobeNotes] = useState('');
  const [productionNotes, setProductionNotes] = useState('');
  const [assignedCrewIds, setAssignedCrewIds] = useState([]);
  const [castCallSchedules, setCastCallSchedules] = useState([]);

  // Shot List / Storyboard Form States
  const [newShotNum, setNewShotNum] = useState('');
  const [newShotFraming, setNewShotFraming] = useState('MCU');
  const [newShotLens, setNewShotLens] = useState('50mm');
  const [newShotAngle, setNewShotAngle] = useState('Eye-Level');
  const [newShotMove, setNewShotMove] = useState('Static');
  const [newShotEquipment, setNewShotEquipment] = useState('Tripod');
  const [newShotDescTh, setNewShotDescTh] = useState('');
  const [newShotDescEn, setNewShotDescEn] = useState('');
  const [isShotModalOpen, setIsShotModalOpen] = useState(false);

  // Edit Shot Form States
  const [editingShot, setEditingShot] = useState(null);
  const [editShotNum, setEditShotNum] = useState('');
  const [editShotFraming, setEditShotFraming] = useState('MCU');
  const [editShotLens, setEditShotLens] = useState('50mm');
  const [editShotAngle, setEditShotAngle] = useState('Eye-Level');
  const [editShotMove, setEditShotMove] = useState('Static');
  const [editShotEquipment, setEditShotEquipment] = useState('Tripod');
  const [editShotDescTh, setEditShotDescTh] = useState('');
  const [editShotDescEn, setEditShotDescEn] = useState('');
  const [isEditShotModalOpen, setIsEditShotModalOpen] = useState(false);

  // Load Vault Files from LocalStorage
  useEffect(() => {
    if (!project?.id) return;
    try {
      const stored = localStorage.getItem(`prod_vault_files_${project.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setVaultFiles(parsed);
          return;
        }
      }
      const defaultFiles = [
        {
          id: 'file-1',
          name: isTh ? 'สัญญาอนุญาตใช้สถานที่ถ่ายทำ (Location Release Form)' : 'Location Release Form.pdf',
          category: 'permits',
          desc: isTh ? 'เอกสารอนุญาตถ่ายทำสถานที่หลัก' : 'Main location shooting permit',
          uploadDate: new Date().toISOString().split('T')[0],
          fileSize: '1.4 MB',
          fileType: 'application/pdf',
          dataUrl: ''
        },
        {
          id: 'file-2',
          name: isTh ? 'ผังการตั้งไฟและตำแหน่งกล้อง Scene 1' : 'Lighting Plot Scene 1.png',
          category: 'plans',
          desc: isTh ? 'Floor plan & Gaffer lighting diagram' : 'Floor plan & Gaffer lighting diagram',
          uploadDate: new Date().toISOString().split('T')[0],
          fileSize: '2.8 MB',
          fileType: 'image/png',
          dataUrl: ''
        }
      ];
      setVaultFiles(defaultFiles);
    } catch (e) {
      console.error('Failed to load file vault:', e);
    }
  }, [project?.id, isTh]);

  // Save Vault Files to LocalStorage
  const saveVaultFiles = (newFilesList) => {
    setVaultFiles(newFilesList);
    if (project?.id) {
      try {
        localStorage.setItem(`prod_vault_files_${project.id}`, JSON.stringify(newFilesList));
      } catch (e) {
        console.error('Failed to save file vault:', e);
      }
    }
  };

  // Sync Call Sheet form states securely with formatTextValue on every single property!
  useEffect(() => {
    if (activeEvent) {
      setCallSheetDate(formatTextValue(activeEvent.date || project?.start_date, language, new Date().toISOString().split('T')[0]));
      setCrewCallTime(formatTextValue(activeEvent.notes?.crew_call, language, '07:00 AM'));
      setShootCallTime(formatTextValue(activeEvent.notes?.shooting_call || activeEvent.time, language, '08:30 AM'));
      setLunchTime(formatTextValue(activeEvent.notes?.lunch_time, language, '12:30 PM'));
      setWrapTime(formatTextValue(activeEvent.notes?.wrap_time, language, '06:00 PM'));
      setShootLocation(formatTextValue(activeEvent.location, language, isTh ? 'สถานที่หลักตามบท' : 'Main Set Location'));
      setMapsUrl(formatTextValue(activeEvent.notes?.maps_url, language, ''));
      setHospitalInfo(formatTextValue(activeEvent.notes?.hospital_info, language, isTh ? 'โรงพยาบาลศูนย์พิษณุโลก (โทร. 055-270-300)' : 'Phitsanulok Central Hospital (Tel. 055-270-300)'));
      setWeatherAlertText(formatTextValue(activeEvent.notes?.weather_alert, language, isTh ? 'สภาพอากาศเมฆครึ้ม ควรเตรียมผ้าพลาสติกคลุมกล้องและแผงไฟ' : 'Cloudy weather. Prepare camera rain covers & power distro protection.'));
      setGeneralNotes(formatTextValue(activeEvent.notes, language, ''));
      setCameraNotes(formatTextValue(activeEvent.notes?.camera_notes, language, isTh ? 'เตรียมกล้อง A/B Roll, เลนส์ระยะ 35mm, 50mm และการ์ดบันทึกสำรอง' : 'Prep A/B Camera Package, 35mm & 50mm lenses, spare media cards.'));
      setArtNotes(formatTextValue(activeEvent.notes?.art_notes, language, isTh ? 'เซ็ตอุปกรณ์ประกอบฉากหลัก กระเป๋าเดินทาง และพร็อพประจำตัวละคร' : 'Set up main props, travel bags, and character personal items.'));
      setLightingNotes(formatTextValue(activeEvent.notes?.lighting_notes, language, isTh ? 'ตั้งชุดไฟ HMI 2.5KW ด้านนอกหน้าต่างรถไฟ พร้อมสะท้อนแสง Hard Light' : 'Position 2.5KW HMI outside train window with Hard Light reflectors.'));
      setSoundNotes(formatTextValue(activeEvent.notes?.sound_notes, language, isTh ? 'ติดไมค์ลาวาเลียร์นักแสดงหลัก 2 ท่าน และใช้ไมค์บูมเก็บเสียงบรรยากาศ' : 'Lav two lead actors. Boom mic for ambient train tracks background.'));
      setWardrobeNotes(formatTextValue(activeEvent.notes?.wardrobe_notes, language, isTh ? 'เสื้อเชิ้ตทำงานรอยยับตามบท และสร้อยข้อมือแฮนด์เมด' : 'Worn work shirt with script wrinkles and handmade wristlet.'));
      setProductionNotes(formatTextValue(activeEvent.notes?.production_notes, language, isTh ? 'ตรวจเช็กใบสั่งงาน ปิดเสียงโทรศัพท์ในกองถ่าย ประสานงานรถรับส่งนักแสดง' : 'Check call sheets, enforce quiet on set, coordinate talent transport.'));
      setAssignedCrewIds(Array.isArray(activeEvent.crew_assigned) ? activeEvent.crew_assigned : []);
      setCastCallSchedules(Array.isArray(activeEvent.notes?.cast_calls) ? activeEvent.notes.cast_calls : [
        { charName: 'พลอย', actorName: 'พลอย (นักแสดงหลัก)', pickupTime: '06:00 AM', hmwTime: '06:30 AM', onSetTime: '08:15 AM' },
        { charName: 'ชายปริศนา', actorName: 'สมชาย (นักแสดงสมทบ)', pickupTime: '07:00 AM', hmwTime: '07:30 AM', onSetTime: '08:45 AM' }
      ]);
    } else {
      setCallSheetDate(formatTextValue(project?.start_date, language, new Date().toISOString().split('T')[0]));
      setCrewCallTime('07:00 AM');
      setShootCallTime('08:30 AM');
      setLunchTime('12:30 PM');
      setWrapTime('06:00 PM');
      setShootLocation(isTh ? 'สถานีรถไฟพิษณุโลก / บนขบวนรถไฟ' : 'Phitsanulok Railway Station');
      setMapsUrl('');
      setHospitalInfo(isTh ? 'โรงพยาบาลศูนย์พิษณุโลก (โทร. 055-270-300)' : 'Phitsanulok Central Hospital (Tel. 055-270-300)');
      setWeatherAlertText(isTh ? 'เมฆครึ้ม สภาพแสงโอเวอร์คาสต์ เหมาะกับการถ่ายฉากอารมณ์' : 'Overcast skies. Soft lighting ideal for emotional scenes.');
      setGeneralNotes('');
      setCameraNotes(isTh ? 'เช็กแพ็คเกจกล้อง เลนส์ การ์ดความจำ และระบบไฟสำรอง' : 'Verify camera packages, lenses, media, and power backups.');
      setArtNotes(isTh ? 'เตรียมพร็อพหลักตามที่ระบุในบทภาพยนตร์' : 'Prepare props and set dressing as specified.');
      setLightingNotes(isTh ? 'ติดตั้งไฟและแผงสะท้อนแสงตามทิศทางกล้อง' : 'Refer to camera setup guidelines and lighting plots.');
      setSoundNotes(isTh ? 'เตรียมไมโครโฟนบูมและไมค์ลาวาเลียร์ให้พร้อม' : 'Ensure boom mics and lavaliers are prepped.');
      setWardrobeNotes(isTh ? 'ตรวจเช็กเสื้อผ้าเครื่องแต่งกายของนักแสดง' : 'Pre-check cast costumes and makeup continuity.');
      setProductionNotes(isTh ? 'ดูแลความเรียบร้อยทั่วไปในกองถ่ายและประสานเวลา' : 'Prepare call sheets and sync schedules with AD.');
      setAssignedCrewIds([]);
      setCastCallSchedules([
        { charName: 'พลอย', actorName: 'พลอย (นักแสดงหลัก)', pickupTime: '06:00 AM', hmwTime: '06:30 AM', onSetTime: '08:15 AM' }
      ]);
    }
  }, [activeEventId, selectedShootDay, project?.start_date, isTh, language]);

  // Selected Scene Object resolver (Strict match without false fallback to safeScenes[0])
  const activeScene = safeScenes.find(s => {
    if (!s) return false;
    const curNum = String(selectedSceneNum || '1');
    const sNum = String(s.scene_number || s.sceneNum || s.id || '');
    return sNum === curNum || sNum === `Scene ${curNum}` || sNum.endsWith(`-${curNum}`);
  }) || { id: `scene-${selectedSceneNum || '1'}`, scene_number: String(selectedSceneNum || '1') };

  // Filter shots for selected scene with strict scene isolation
  const activeSceneShots = safeShotList.filter(s => {
    if (!s) return false;
    const curSceneNumStr = String(selectedSceneNum || '1');
    
    // Extract shot's explicit scene number, scene ID, and shot number
    const shotSceneNum = String(s.scene_number || s.description?.scene_number || s.sceneNum || '');
    const shotSceneId = String(s.scene_id || '');
    const shotNumStr = String(s.shot_number || s.shotNum || '');

    // Extract scene prefix from shot_number e.g. "2.1" -> "2", "1.4" -> "1"
    const shotNumPrefix = shotNumStr.includes('.') ? shotNumStr.split('.')[0] : null;

    // Strict Rule 1: If shot_number has an explicit scene prefix (e.g. "2.1"), it MUST match current scene
    if (shotNumPrefix && shotNumPrefix !== curSceneNumStr) {
      return false;
    }

    // Strict Rule 2: If shot has explicit scene_number (e.g. "2"), it MUST match current scene
    if (shotSceneNum && shotSceneNum !== curSceneNumStr) {
      return false;
    }

    // Match 1: Explicit scene_number matches current scene number
    if (shotSceneNum === curSceneNumStr) return true;

    // Match 2: Shot number prefix matches current scene number (e.g. "1.2" for scene "1")
    if (shotNumPrefix === curSceneNumStr) return true;

    // Match 3: Explicit scene_id matches current scene_number or activeScene.id
    if (shotSceneId && (shotSceneId === curSceneNumStr || (activeScene.id && shotSceneId === String(activeScene.id)))) return true;

    // Match 4: Fallback ONLY for Scene 1 if shot has absolutely no scene markers or prefixes
    if (!shotSceneNum && !shotSceneId && !shotNumPrefix && curSceneNumStr === '1') return true;

    return false;
  });

  // Save Call Sheet Form Updates into Calendar Event State
  const handleSaveCallSheet = (e) => {
    e.preventDefault();
    const eventId = activeEvent?.id || `evt-day-${selectedShootDay}-${Date.now()}`;
    const updatedEvent = {
      id: eventId,
      project_id: project?.id || `proj-${Date.now()}`,
      title: {
        th: `คิวกองถ่าย Day ${selectedShootDay}: ฉาก ${selectedSceneNum}`,
        en: `Shoot Day ${selectedShootDay}: Scene ${selectedSceneNum}`
      },
      date: callSheetDate,
      time: shootCallTime,
      type: 'shoot',
      location: { th: shootLocation, en: shootLocation },
      scene_number: selectedSceneNum,
      crew_assigned: assignedCrewIds,
      notes: {
        th: generalNotes,
        en: generalNotes,
        crew_call: crewCallTime,
        shooting_call: shootCallTime,
        lunch_time: lunchTime,
        wrap_time: wrapTime,
        maps_url: mapsUrl,
        hospital_info: hospitalInfo,
        weather_alert: weatherAlertText,
        camera_notes: cameraNotes,
        art_notes: artNotes,
        lighting_notes: lightingNotes,
        sound_notes: soundNotes,
        wardrobe_notes: wardrobeNotes,
        production_notes: productionNotes,
        cast_calls: castCallSchedules
      }
    };

    const existingIndex = safeEvents.findIndex(evt => evt && evt.id === eventId);
    let newEventsList;
    if (existingIndex !== -1) {
      newEventsList = [...safeEvents];
      newEventsList[existingIndex] = updatedEvent;
    } else {
      newEventsList = [...safeEvents, updatedEvent];
    }

    if (setEvents) setEvents(newEventsList);
    setIsCallSheetModalOpen(false);
  };

  // Open Create Shot Modal with Auto Shot Number
  const handleOpenAddShotModal = () => {
    const nextNum = `${selectedSceneNum}.${activeSceneShots.length + 1}`;
    setNewShotNum(nextNum);
    setNewShotFraming('MCU');
    setNewShotLens('50mm');
    setNewShotAngle('Eye-Level');
    setNewShotMove('Static');
    setNewShotEquipment('Tripod');
    setNewShotDescTh('');
    setNewShotDescEn('');
    setIsShotModalOpen(true);
  };

  // Add new Shot to Shot List (Non-blocking default values)
  const handleAddShotSubmit = (e) => {
    e.preventDefault();

    const curSceneStr = String(selectedSceneNum || '1');
    const matchingSceneId = (activeScene?.id && String(activeScene.scene_number) === curSceneStr) 
      ? String(activeScene.id) 
      : curSceneStr;

    const finalShotNum = newShotNum || `${curSceneStr}.${activeSceneShots.length + 1}`;
    const finalDescTh = newShotDescTh || newShotDescEn || `มุมกล้อง / ขนาดภาพ ${newShotFraming} (${newShotAngle} / ${newShotMove})`;
    const finalDescEn = newShotDescEn || newShotDescTh || `Camera Shot ${newShotFraming} (${newShotAngle} / ${newShotMove})`;

    const newShot = {
      id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scene_id: matchingSceneId,
      scene_number: curSceneStr,
      shotNum: finalShotNum,
      shot_number: finalShotNum,
      type: newShotFraming,
      size: newShotFraming,
      lens: newShotLens,
      angle: newShotAngle,
      movement: newShotMove,
      equipment: newShotEquipment,
      description: {
        th: finalDescTh,
        en: finalDescEn,
        scene_number: curSceneStr,
        image_url: ''
      }
    };

    const updatedShots = [...safeShotList, newShot];
    if (setShotList) setShotList(updatedShots);
    setNewShotNum('');
    setNewShotDescTh('');
    setNewShotDescEn('');
    setIsShotModalOpen(false);
  };

  // Open Edit Shot Modal
  const handleOpenEditShotModal = (shot) => {
    if (!shot) return;
    setEditingShot(shot);
    setEditShotNum(shot.shotNum || shot.shot_number || `${selectedSceneNum}.1`);
    setEditShotFraming(shot.type || shot.size || 'MCU');
    setEditShotLens(shot.lens || shot.description?.lens || '50mm');
    setEditShotAngle(shot.angle || 'Eye-Level');
    setEditShotMove(shot.movement || 'Static');
    setEditShotEquipment(shot.equipment || 'Tripod');
    setEditShotDescTh(formatTextValue(shot.description, 'th', ''));
    setEditShotDescEn(formatTextValue(shot.description, 'en', ''));
    setIsEditShotModalOpen(true);
  };

  // Submit Edit Shot
  const handleEditShotSubmit = (e) => {
    e.preventDefault();
    if (!editingShot) return;

    const updatedShots = safeShotList.map(s => {
      if (s && s.id === editingShot.id) {
        return {
          ...s,
          shotNum: editShotNum || s.shotNum || s.shot_number,
          shot_number: editShotNum || s.shot_number || s.shotNum,
          type: editShotFraming,
          size: editShotFraming,
          lens: editShotLens,
          angle: editShotAngle,
          movement: editShotMove,
          equipment: editShotEquipment,
          description: {
            ...(typeof s.description === 'object' ? s.description : {}),
            th: editShotDescTh || editShotDescEn || formatTextValue(s.description, 'th', '-'),
            en: editShotDescEn || editShotDescTh || formatTextValue(s.description, 'en', '-'),
            lens: editShotLens
          }
        };
      }
      return s;
    });

    if (setShotList) setShotList(updatedShots);
    setIsEditShotModalOpen(false);
    setEditingShot(null);
  };

  // Delete Shot
  const handleDeleteShot = (shotId) => {
    if (window.confirm(isTh ? 'ต้องการลบช็อตถ่ายทำนี้ใช่หรือไม่?' : 'Delete this shot item?')) {
      if (setShotList) setShotList(safeShotList.filter(s => s && s.id !== shotId));
    }
  };

  // Upload Storyboard Image to Cloud Storage / Drive with Fallback
  const handleStoryboardImageUpload = async (shotId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Compress image using HTML5 Canvas
      const compressedBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxWidth = 1000;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });

      let finalImageUrl = compressedBase64;

      // 2. Upload to Supabase Cloud Storage bucket if available
      if (isSupabaseConfigured && supabase) {
        try {
          const fileName = `storyboard-${shotId}-${Date.now()}.jpg`;
          const res = await fetch(compressedBase64);
          const blob = await res.blob();
          
          const { data: uploadData, error: uploadErr } = await supabase
            .storage
            .from('storyboards')
            .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase
              .storage
              .from('storyboards')
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              finalImageUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload fallback to base64:', storageErr);
        }
      }

      const updatedShots = safeShotList.map(s => {
        if (s && s.id === shotId) {
          return {
            ...s,
            scene_id: String(s.scene_id || s.scene_number || selectedSceneNum),
            scene_number: String(s.scene_number || s.scene_id || selectedSceneNum),
            description: {
              ...(typeof s.description === 'object' ? s.description : { th: s.description || '' }),
              image_url: finalImageUrl
            }
          };
        }
        return s;
      });
      if (setShotList) setShotList(updatedShots);
    } catch (err) {
      console.error("Failed to compress and upload storyboard image:", err);
    }
  };

  // Remove Storyboard Image
  const handleRemoveStoryboardImage = (shotId) => {
    if (window.confirm(isTh ? 'ต้องการลบภาพสเก็ตช์สตอรี่บอร์ดนี้ใช่หรือไม่?' : 'Remove storyboard image?')) {
      const updatedShots = safeShotList.map(s => {
        if (s && s.id === shotId) {
          return {
            ...s,
            description: {
              ...(typeof s.description === 'object' ? s.description : { th: s.description || '' }),
              image_url: ''
            }
          };
        }
        return s;
      });
      if (setShotList) setShotList(updatedShots);
    }
  };

  // Handle File Upload into Production Vault
  const handleVaultFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewFileName(file.name);
    setNewFileType(file.type);
    setNewFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewFileDataUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVaultFile = (e) => {
    e.preventDefault();
    if (!newFileName) return;

    const newVaultFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: newFileName,
      category: newFileCategory,
      desc: newFileDesc || (isTh ? 'เอกสารกองถ่ายอัปโหลดใหม่' : 'Uploaded document'),
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: newFileSize || '1.0 MB',
      fileType: newFileType || 'application/pdf',
      dataUrl: newFileDataUrl
    };

    const updatedVaultList = [newVaultFile, ...vaultFiles];
    saveVaultFiles(updatedVaultList);

    setNewFileName('');
    setNewFileCategory('contracts');
    setNewFileDesc('');
    setNewFileDataUrl('');
    setIsFileUploadModalOpen(false);
  };

  const handleDeleteVaultFile = (fileId) => {
    if (window.confirm(isTh ? 'ต้องการลบเอกสารนี้ออกจากคลังใช่หรือไม่?' : 'Delete this file from vault?')) {
      const safeV = Array.isArray(vaultFiles) ? vaultFiles : [];
      const updated = safeV.filter(f => f && f.id !== fileId);
      saveVaultFiles(updated);
    }
  };

  // Filtered Vault Files List
  const safeVaultFiles = Array.isArray(vaultFiles) ? vaultFiles : [];
  const filteredVaultFiles = safeVaultFiles.filter(f => {
    if (!f) return false;
    const matchCategory = vaultCategoryFilter === 'all' || f.category === vaultCategoryFilter;
    const matchQuery = !vaultSearch || (f.name && f.name.toLowerCase().includes(vaultSearch.toLowerCase())) || (f.desc && f.desc.toLowerCase().includes(vaultSearch.toLowerCase()));
    return matchCategory && matchQuery;
  });

  // Scheduled Scenes list for active Shoot Day
  const dayScheduledScenes = safeScenes.filter(s => 
    s && (s.tech_notes?.scheduling?.shootDay === selectedShootDay ||
    (selectedShootDay === '1' && !s.tech_notes?.scheduling?.shootDay))
  );

  // Safe Element Category items resolver
  const getCategoryElements = (categoryKey) => {
    const rawElements = activeScene?.tech_notes?.scene_elements;
    const safeElements = Array.isArray(rawElements) ? rawElements : [];
    return safeElements.filter(e => e && e.category === categoryKey);
  };

  const safeCastCallSchedules = Array.isArray(castCallSchedules) ? castCallSchedules : [];

  return (
    <div className="space-y-6 pb-20 no-print-padding font-sans">
      {/* Dynamic Print Style Injector */}
      <style>{`
        @media print {
          @page {
            size: ${printOrientation === 'landscape' ? 'landscape' : 'portrait'};
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print, nav, sidebar, header, button {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print-card {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #000000 !important;
          }
        }
      `}</style>

      {/* Active Project Sync Status Banner */}
      <div className="glass-panel p-3.5 rounded-xl border border-gold-500/30 bg-gold-500/10 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-black font-mono bg-gold-500 text-obsidian-950 uppercase tracking-wide shrink-0">
            {isTh ? 'โปรเจกต์ที่เปิดอยู่' : 'ACTIVE PROJECT'}
          </span>
          <span className="text-xs font-black text-slate-900 dark:text-white font-sans truncate">
            🎬 {formatTextValue(project?.title, language, isTh ? 'โปรเจกต์กองถ่าย' : 'Production Project')}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
          {isTh ? '💡 หากดูบนเบราว์เซอร์อื่น โปรดเลือกชื่อโปรเจกต์ที่เมนูด้านบนให้ตรงกัน' : '💡 Select the same project name in the top bar across browsers'}
        </div>
      </div>

      {/* TOP HEADER: Production Document Hub Title & PDF Toolbar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-obsidian-800/80 no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-gold-500/10 text-gold-500 border border-gold-500/20">
              {lockedTab === 'shotlist' ? <Video size={20} /> : lockedTab === 'storyboard' ? <ImageIcon size={20} /> : <Briefcase size={20} />}
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-sans">
              {lockedTab === 'shotlist' 
                ? (isTh ? 'รายการช็อตถ่ายทำ (Shot List Management)' : 'Shot List Management')
                : lockedTab === 'storyboard'
                  ? (isTh ? 'สตอรี่บอร์ด & สเก็ตช์ (Storyboards & Previs)' : 'Storyboards & Previs')
                  : (isTh ? 'คลังเอกสารโปรดักชั่น & ระบบออกเอกสารกองถ่าย' : 'Production Documents & Call Sheet Suite')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans pl-1">
            {lockedTab === 'shotlist'
              ? (isTh ? 'จัดการรายการช็อตถ่ายทำ กำหนดขนาดภาพ การเคลื่อนกล้อง เลนส์ และอุปกรณ์กองถ่ายรายฉาก' : 'Manage camera shot lists, framing sizes, lens choices, and movement notes per scene.')
              : lockedTab === 'storyboard'
                ? (isTh ? 'จัดการภาพร่างสเก็ตช์ภาพสตอรี่บอร์ดและการวางแผนงานภาพรายฉาก' : 'Manage storyboard sketch frames, shot visuals, and previs layout per scene.')
                : (isTh ? 'ศูนย์รวมการสร้าง จัดการ และออกเอกสารกองถ่ายมาตรฐานสากล (Call Sheets, Breakdown Sheets & Vault Files)' : 'Generate, manage, and export professional broadcast documents and project files.')}
          </p>
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Orientation Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-obsidian-950 border border-slate-200 dark:border-obsidian-800 text-xs font-bold font-sans">
            <button
              onClick={() => setPrintOrientation('portrait')}
              className={`px-3 py-1.5 rounded-lg transition-all ${printOrientation === 'portrait' ? 'bg-gold-500 text-obsidian-950 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {isTh ? 'แนวตั้ง (Portrait)' : 'Portrait'}
            </button>
            <button
              onClick={() => setPrintOrientation('landscape')}
              className={`px-3 py-1.5 rounded-lg transition-all ${printOrientation === 'landscape' ? 'bg-gold-500 text-obsidian-950 shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {isTh ? 'แนวนอน (Landscape)' : 'Landscape'}
            </button>
          </div>

          {/* Export / Print PDF Button */}
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-obsidian-950 font-black text-xs transition-all shadow-md hover:shadow-gold-500/20 active:scale-95 flex items-center gap-2 cursor-pointer font-sans"
          >
            <Printer size={15} />
            <span>{isTh ? 'พิมพ์เอกสาร / บันทึกเป็น PDF' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* TOP NAVIGATION: 2 MAJOR DOCUMENT CATEGORIES (Show only when inside Document Hub, not locked standalone tabs) */}
      {!lockedTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 no-print">
          {DOCUMENT_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.id} className={`glass-panel p-3.5 rounded-xl border border-slate-200 dark:border-obsidian-800/80 border-l-4 ${group.color} space-y-2 shadow-xs`}>
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 font-sans">
                  <GroupIcon size={16} className="text-gold-500 shrink-0" />
                  <span className="truncate">{isTh ? group.titleTh : group.titleEn}</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  {group.tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer font-sans text-left border ${
                          isActive 
                            ? 'bg-gold-500/20 border-gold-500/50 text-gold-500 dark:text-gold-400 shadow-xs' 
                            : 'bg-white/40 dark:bg-obsidian-950/40 border-slate-200/60 dark:border-obsidian-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-obsidian-800/60'
                        }`}
                      >
                        <TabIcon size={14} className={isActive ? 'text-gold-500' : 'text-slate-400'} />
                        <span className="truncate">{isTh ? tab.labelTh : tab.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 1: PRE-PRODUCTION DOCUMENTS */}
      {/* ========================================================================= */}
      
      {/* SUBTAB 1.1: DAILY CALL SHEET */}
      {activeSubTab === 'callsheet' && (
        <div className="space-y-5">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-800 no-print flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                {isTh ? 'เลือกคิววันถ่ายทำ (Shoot Day):' : 'Select Shoot Day:'}
              </label>
              <select
                value={selectedShootDay}
                onChange={(e) => setSelectedShootDay(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-gold-500 font-mono cursor-pointer"
              >
                {shootDaysList.map((day) => (
                  <option key={day.dayNumber} value={day.dayNumber}>
                    DAY {day.dayNumber} ({formatTextValue(day.date, language, isTh ? 'ยังไม่กำหนดวัน' : 'TBD')})
                  </option>
                ))}
              </select>
            </div>

            {hasWriteAccess && (
              <button
                onClick={() => setIsCallSheetModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 border border-gold-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <Edit size={14} />
                <span>{isTh ? '⚙️ แก้ไขข้อมูลใบสั่งงาน & กำหนดการ (Edit Call Sheet)' : '⚙️ Edit Call Sheet Details'}</span>
              </button>
            )}
          </div>

          <div className="print-area print-card glass-panel p-8 rounded-2xl border border-slate-200 dark:border-obsidian-800 space-y-6 text-slate-900 dark:text-slate-100 shadow-xl bg-white dark:bg-obsidian-950">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b-2 border-slate-900 dark:border-gold-500">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold-500 font-mono">
                  PRODUCTION CALL SHEET
                </span>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white font-sans mt-0.5">
                  {formatTextValue(project?.title, language, isTh ? 'ใบสั่งงานกองถ่ายประจำวัน' : 'Daily Call Sheet')}
                </h1>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans mt-1">
                  {isTh ? `คิววันถ่ายทำที่: DAY ${selectedShootDay}` : `SHOOT DAY ${selectedShootDay}`} | {isTh ? 'ผู้กำกับ:' : 'Director:'} {formatTextValue(project?.director, language, '-')} | {isTh ? 'ผู้ดำเนินงานสร้าง:' : 'Producer:'} {formatTextValue(project?.producer, language, '-')}
                </p>
              </div>

              <div className="text-right font-mono text-xs space-y-1 shrink-0">
                <div className="px-3 py-1 rounded bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 font-bold inline-block">
                  {isTh ? 'วันที่ถ่ายทำ (Date):' : 'DATE:'} <span className="text-gold-500">{formatTextValue(callSheetDate, language, 'TBD')}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isTh ? 'สภาพอากาศ:' : 'Weather:'} {formatTextValue(weatherAlertText, language, isTh ? 'ปกติ' : 'Normal')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { labelTh: 'เวลาเปิดกอง (CREW CALL)', labelEn: 'CREW CALL TIME', val: crewCallTime, icon: Clock, color: 'border-l-gold-500' },
                { labelTh: 'เริ่มถ่ายช็อตแรก (SHOOT CALL)', labelEn: 'SHOOTING CALL', val: shootCallTime, icon: Film, color: 'border-l-emerald-500' },
                { labelTh: 'เวลากลางวัน (LUNCH BREAK)', labelEn: 'LUNCH TIME', val: lunchTime, icon: CloudSun, color: 'border-l-amber-500' },
                { labelTh: 'เวลาเลิกกอง (EST. WRAP)', labelEn: 'ESTIMATED WRAP', val: wrapTime, icon: CheckCircle, color: 'border-l-purple-500' }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800 border-l-4 ${item.color}`}>
                    <span className="text-[9px] font-black uppercase text-slate-400 font-mono flex items-center gap-1 mb-1">
                      <Icon size={12} />
                      <span>{isTh ? item.labelTh : item.labelEn}</span>
                    </span>
                    <span className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                      {formatTextValue(item.val, language, '-')}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-obsidian-900/40 border border-slate-200 dark:border-obsidian-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                  <MapPin size={13} className="text-gold-500" />
                  <span>{isTh ? 'สถานที่ถ่ายทำหลัก (SHOOT LOCATION)' : 'SHOOT LOCATION'}</span>
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                  {formatTextValue(shootLocation, language, '-')}
                </p>
                {mapsUrl && typeof mapsUrl === 'string' && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-500 hover:underline font-mono no-print"
                  >
                    <span>{isTh ? 'เปิดแผนที่ Google Maps →' : 'Open Google Maps Navigation →'}</span>
                  </a>
                )}
              </div>

              <div className="p-4 rounded-xl bg-red-500/5 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 font-mono flex items-center gap-1.5">
                  <Hospital size={13} className="text-red-500" />
                  <span>{isTh ? 'โรงพยาบาลใกล้ที่สุดกรณีฉุกเฉิน (NEAREST HOSPITAL)' : 'NEAREST HOSPITAL'}</span>
                </span>
                <p className="text-xs font-bold text-red-700 dark:text-red-300 font-sans leading-relaxed">
                  {formatTextValue(hospitalInfo, language, '-')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Clapperboard size={14} className="text-gold-500" />
                <span>{isTh ? 'รายการฉากที่ถ่ายทำในวันนี้ (SCHEDULED SCENES)' : 'SCHEDULED SCENES'}</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-obsidian-800 rounded-xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 dark:bg-obsidian-900 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 font-black">{isTh ? 'ฉาก' : 'SCENE'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'ประเภท' : 'I/E'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'สถานที่ตามบท' : 'SETTING'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'ช่วงเวลา' : 'DAY/NIGHT'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'ความยาว' : 'PAGES'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'เนื้อเรื่องย่อ' : 'SYNOPSIS'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'นักแสดงในฉาก' : 'CAST IDs'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-obsidian-800/80">
                    {(dayScheduledScenes.length > 0 ? dayScheduledScenes : safeScenes.slice(0, 3)).map((sc, idx) => (
                      <tr key={sc?.id || idx} className="hover:bg-slate-50 dark:hover:bg-obsidian-900/30">
                        <td className="p-2.5 font-black font-mono text-gold-500">SCENE {sc?.scene_number || (idx + 1)}</td>
                        <td className="p-2.5 font-bold font-mono">{sc?.int_ext || 'INT'}</td>
                        <td className="p-2.5 font-bold">{sc?.setting || '-'}</td>
                        <td className="p-2.5 font-bold font-mono">{sc?.day_night || 'DAY'}</td>
                        <td className="p-2.5 font-mono">{sc?.pages || '1/8'} pgs</td>
                        <td className="p-2.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {formatTextValue(sc?.description, language, '-')}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-purple-400">
                          {formatTextValue(sc?.cast, language, '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Users size={14} className="text-gold-500" />
                <span>{isTh ? 'กำหนดเวลานักแสดง (CAST CALL TIMES)' : 'CAST CALL SCHEDULE'}</span>
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-obsidian-800 rounded-xl">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100 dark:bg-obsidian-900 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 font-black">{isTh ? 'ตัวละคร' : 'CHARACTER'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'นักแสดง' : 'ACTOR NAME'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'เวลารถรับ (PICKUP)' : 'PICKUP'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'เวลาแต่งหน้าทำผม (HMW)' : 'HMW CALL'}</th>
                      <th className="p-2.5 font-black">{isTh ? 'เวลาพร้อมหน้ากล้อง (ON SET)' : 'ON SET CALL'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-obsidian-800/80 font-mono">
                    {safeCastCallSchedules.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-obsidian-900/30">
                        <td className="p-2.5 font-black text-gold-500">{formatTextValue(c?.charName, language, '-')}</td>
                        <td className="p-2.5 font-sans font-bold">{formatTextValue(c?.actorName, language, '-')}</td>
                        <td className="p-2.5 text-slate-400">{formatTextValue(c?.pickupTime, language, '-')}</td>
                        <td className="p-2.5 text-amber-400">{formatTextValue(c?.hmwTime, language, '-')}</td>
                        <td className="p-2.5 font-bold text-emerald-400">{formatTextValue(c?.onSetTime, language, '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Wrench size={14} className="text-gold-500" />
                <span>{isTh ? 'ข้อกำหนดเทคนิคแยกตามแผนก (DEPARTMENTAL REQUIREMENTS)' : 'DEPARTMENTAL NOTES'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                {[
                  { title: isTh ? '📷 แผนกกล้อง & กริป' : 'CAMERA & GRIP', text: cameraNotes, color: 'border-l-blue-500' },
                  { title: isTh ? '🎨 แผนกศิลปกรรม & พร็อพ' : 'ART & PROPS', text: artNotes, color: 'border-l-amber-500' },
                  { title: isTh ? '💡 แผนกไฟ & กำลังไฟฟ้า' : 'LIGHTING & ELECTRIC', text: lightingNotes, color: 'border-l-yellow-500' },
                  { title: isTh ? '🎙️ แผนกเสียง & เอฟเฟกต์' : 'SOUND DEPARTMENT', text: soundNotes, color: 'border-l-violet-500' },
                  { title: isTh ? '👗 แผนกเสื้อผ้า & แต่งหน้า' : 'WARDROBE & HMW', text: wardrobeNotes, color: 'border-l-pink-500' },
                  { title: isTh ? '📋 ฝ่ายจัดการกองถ่าย & AD' : 'PRODUCTION & AD', text: productionNotes, color: 'border-l-emerald-500' }
                ].map((dept, idx) => (
                  <div key={idx} className={`p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/50 border border-slate-200 dark:border-obsidian-800 border-l-4 ${dept.color} space-y-1.5`}>
                    <span className="text-[10px] font-black uppercase text-slate-400 font-mono block">
                      {dept.title}
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {formatTextValue(dept.text, language, '-')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-obsidian-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Users size={14} className="text-gold-500" />
                <span>{isTh ? 'รายชื่อทีมงานที่ปฏิบัติหน้าที่ (CREW ROSTER)' : 'CREW ROSTER'}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-sans">
                {(safeCrew.length > 0 ? safeCrew : [
                  { name: 'ธนบดี กองศรี', role: 'Producer' },
                  { name: 'ผู้กำกับหลัก', role: 'Director' },
                  { name: 'ผู้ช่วยผู้กำกับ 1', role: '1st AD' },
                  { name: 'ผู้กำกับภาพ', role: 'DP' }
                ]).map((member, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-obsidian-900/40 border border-slate-200 dark:border-obsidian-800/60">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {formatTextValue(member?.name || member, language, '-')}
                    </div>
                    <div className="text-[10px] font-mono text-gold-500 truncate">
                      {formatTextValue(member?.role, language, '-')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 1.2: SCENE BREAKDOWN SHEET */}
      {activeSubTab === 'breakdown' && (
        <div className="space-y-5">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-800 no-print flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                {isTh ? 'เลือกฉากแจกแจงบท (Select Scene):' : 'Select Scene:'}
              </label>
              <select
                value={selectedSceneNum}
                onChange={(e) => setSelectedSceneNum(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-gold-500 font-mono cursor-pointer"
              >
                {safeScenes.map((s) => (
                  <option key={s.id} value={s.scene_number}>
                    Scene {s.scene_number} - {s.setting}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="print-area print-card glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 space-y-5 bg-white dark:bg-obsidian-950 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b-2 border-gold-500">
              <div>
                <span className="text-[10px] font-black uppercase text-gold-500 font-mono">SCENE BREAKDOWN SHEET</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans">
                  {isTh ? `ใบแจกแจงฉากที่ ${selectedSceneNum}: ${activeScene?.setting || ''}` : `Breakdown Sheet - Scene ${selectedSceneNum}: ${activeScene?.setting || ''}`}
                </h2>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800">
                {activeScene?.pages || '1/8'} PAGES
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800">
                <span className="text-[9px] font-black text-slate-400 font-mono block">SCENE NUMBER</span>
                <span className="font-black text-gold-500 font-mono text-sm">SCENE {selectedSceneNum}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800">
                <span className="text-[9px] font-black text-slate-400 font-mono block">INT / EXT</span>
                <span className="font-black text-slate-800 dark:text-slate-200 font-mono text-sm">{activeScene?.int_ext || 'INT'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800">
                <span className="text-[9px] font-black text-slate-400 font-mono block">DAY / NIGHT</span>
                <span className="font-black text-slate-800 dark:text-slate-200 font-mono text-sm">{activeScene?.day_night || 'DAY'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800">
                <span className="text-[9px] font-black text-slate-400 font-mono block">LOCATION</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{formatTextValue(activeScene?.location, language, '-')}</span>
              </div>
            </div>

            {/* Bulletproof Scene Synopsis rendering */}
            {activeScene?.description && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-obsidian-900/40 border border-slate-200 dark:border-obsidian-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 font-mono">SCENE SYNOPSIS</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                  {formatTextValue(activeScene.description, language, '-')}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
                {isTh ? 'องค์ประกอบฉากที่แจกแจงได้ (TAGGED ELEMENTS)' : 'TAGGED BREAKDOWN ELEMENTS'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                {ELEMENT_CATEGORIES.map((cat) => {
                  const items = getCategoryElements(cat.id);
                  return (
                    <div key={cat.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-obsidian-900/50 border border-slate-200 dark:border-obsidian-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cat.dotColor}`} />
                        <span className="font-black text-slate-800 dark:text-slate-200">{isTh ? cat.labelTh : cat.label}</span>
                        <span className="text-[10px] font-mono text-slate-400">({items.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {items.length > 0 ? (
                          items.map((it, idx) => (
                            <span key={idx} className={`px-2 py-0.5 rounded text-[11px] font-bold border ${cat.color}`}>
                              {formatTextValue(it?.name || it, language, '-')}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic font-sans">{isTh ? '- ไม่มี -' : '- None -'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 1.3: ONE-LINER SHOOTING SCHEDULE REPORT */}
      {activeSubTab === 'schedule_report' && (
        <div className="print-area print-card glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 space-y-4 bg-white dark:bg-obsidian-950 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b-2 border-gold-500">
            <div>
              <span className="text-[10px] font-black uppercase text-gold-500 font-mono">ONE-LINER SHOOTING SCHEDULE SUMMARY</span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans">
                {isTh ? 'รายงานสรุปตารางคิวกองถ่าย (Shooting Schedule Report)' : 'One-Liner Shooting Schedule Summary'}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
              {safeScenes.length} {isTh ? 'ฉากทั้งหมด' : 'Total Scenes'}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-obsidian-800 rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100 dark:bg-obsidian-900 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3 font-black">{isTh ? 'ฉาก' : 'SCENE'}</th>
                  <th className="p-3 font-black">{isTh ? 'ประเภท' : 'I/E'}</th>
                  <th className="p-3 font-black">{isTh ? 'สถานที่ตามบท' : 'SETTING'}</th>
                  <th className="p-3 font-black">{isTh ? 'ช่วงเวลา' : 'DAY/NIGHT'}</th>
                  <th className="p-3 font-black">{isTh ? 'ความยาว' : 'PAGES'}</th>
                  <th className="p-3 font-black">{isTh ? 'สถานที่ถ่ายทำ' : 'LOCATION'}</th>
                  <th className="p-3 font-black">{isTh ? 'นักแสดง' : 'CAST'}</th>
                  <th className="p-3 font-black">{isTh ? 'สถานะ' : 'STATUS'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-obsidian-800/80">
                {safeScenes.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50 dark:hover:bg-obsidian-900/30">
                    <td className="p-3 font-mono font-black text-gold-500">SCENE {sc.scene_number}</td>
                    <td className="p-3 font-mono font-bold">{sc.int_ext}</td>
                    <td className="p-3 font-bold">{sc.setting}</td>
                    <td className="p-3 font-mono">{sc.day_night}</td>
                    <td className="p-3 font-mono">{sc.pages || '1/8'} pgs</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{formatTextValue(sc.location, language, '-')}</td>
                    <td className="p-3 font-mono font-bold text-purple-400">{formatTextValue(sc.cast, language, '-')}</td>
                    <td className="p-3 uppercase font-mono text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded ${sc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                        {sc.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 2: SHOOTING & VISUAL SUITE */}
      {/* ========================================================================= */}

      {/* SUBTAB 2.1: SHOT LIST GENERATOR */}
      {activeSubTab === 'shotlist' && (
        <div className="space-y-5">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-800 no-print flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                {isTh ? 'เลือกฉากถ่ายทำ (Select Scene):' : 'Select Scene:'}
              </label>
              <select
                value={selectedSceneNum}
                onChange={(e) => setSelectedSceneNum(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-gold-500 font-mono cursor-pointer"
              >
                {safeScenes.map((s) => (
                  <option key={s.id} value={s.scene_number}>
                    Scene {s.scene_number} - {s.setting} ({s.int_ext} / {s.day_night})
                  </option>
                ))}
              </select>
            </div>

            {hasWriteAccess && (
              <button
                onClick={handleOpenAddShotModal}
                className="px-3.5 py-2 rounded-lg bg-gold-500 text-obsidian-950 hover:bg-gold-400 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow-xs"
              >
                <Plus size={15} />
                <span>{isTh ? 'เพิ่มช็อตถ่ายทำใหม่' : 'Add New Shot'}</span>
              </button>
            )}
          </div>

          <div className="print-area print-card glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 space-y-4 bg-white dark:bg-obsidian-950 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-obsidian-800">
              <div>
                <span className="text-[10px] font-black uppercase text-gold-500 font-mono">SHOT LIST DOCUMENT</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans">
                  {isTh ? `รายการช็อตถ่ายทำ - ฉากที่ ${selectedSceneNum}: ${activeScene?.setting || ''}` : `Shot List - Scene ${selectedSceneNum}: ${activeScene?.setting || ''}`}
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {activeSceneShots.length} {isTh ? 'ช็อตในฉากนี้' : 'Shots'}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-obsidian-800 rounded-xl">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100 dark:bg-obsidian-900 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3 font-black">SHOT #</th>
                    <th className="p-3 font-black">{isTh ? 'ขนาดภาพ (FRAMING)' : 'FRAMING'}</th>
                    <th className="p-3 font-black">{isTh ? 'มุมกล้อง (ANGLE)' : 'ANGLE'}</th>
                    <th className="p-3 font-black">{isTh ? 'การเคลื่อนกล้อง & ทิศทาง' : 'MOVEMENT'}</th>
                    <th className="p-3 font-black">{isTh ? 'เลนส์' : 'LENS'}</th>
                    <th className="p-3 font-black">{isTh ? 'อุปกรณ์' : 'EQUIPMENT'}</th>
                    <th className="p-3 font-black">{isTh ? 'รายละเอียดแอคชั่น / มุมกล้อง / บล็อกกิ้ง' : 'ACTION / CAMERA DETAILS'}</th>
                    <th className="p-3 font-black no-print">{isTh ? 'จัดการ' : 'ACTIONS'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-obsidian-800/80">
                  {activeSceneShots.length > 0 ? (
                    activeSceneShots.map((shot) => (
                      <tr key={shot.id} className="hover:bg-slate-50 dark:hover:bg-obsidian-900/30">
                        <td className="p-3 font-mono font-black text-gold-500">
                          {shot.shotNum || shot.shot_number || `${selectedSceneNum}.1`}
                        </td>
                        <td className="p-3 font-mono font-bold">{shot.type || shot.size || 'MCU'}</td>
                        <td className="p-3 font-mono text-amber-500 font-semibold">{shot.angle || 'Eye-Level'}</td>
                        <td className="p-3 font-mono">{shot.movement || 'Static'}</td>
                        <td className="p-3 font-mono">{shot.lens || '50mm'}</td>
                        <td className="p-3 font-mono text-slate-400">{shot.equipment || 'Tripod'}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-200 leading-relaxed">
                          {formatTextValue(shot.description, language, '-')}
                        </td>
                        <td className="p-3 no-print">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditShotModal(shot)}
                              className="p-1 rounded text-gold-500 hover:bg-gold-500/10 cursor-pointer transition-all"
                              title={isTh ? "แก้ไขช็อตถ่ายทำ" : "Edit Shot"}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteShot(shot.id)}
                              className="p-1 rounded text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                              title={isTh ? "ลบช็อตถ่ายทำ" : "Delete Shot"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-sans">
                        {isTh ? 'ยังไม่มีรายการช็อตถ่ายทำในฉากนี้ กดปุ่ม "+ เพิ่มช็อตถ่ายทำใหม่" ด้านบนเพื่อเริ่มบันทึก' : 'No shots added for this scene yet. Click "+ Add New Shot" to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2.2: STORYBOARDS & PREVIS GALLERY */}
      {activeSubTab === 'storyboard' && (
        <div className="space-y-5">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-800 no-print flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans">
                {isTh ? 'เลือกฉากสตอรี่บอร์ด:' : 'Select Storyboard Scene:'}
              </label>
              <select
                value={selectedSceneNum}
                onChange={(e) => setSelectedSceneNum(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-gold-500 font-mono cursor-pointer"
              >
                {safeScenes.map((s) => (
                  <option key={s.id} value={s.scene_number}>
                    Scene {s.scene_number} - {s.setting}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="print-area print-card glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 space-y-4 bg-white dark:bg-obsidian-950 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-obsidian-800">
              <div>
                <span className="text-[10px] font-black uppercase text-gold-500 font-mono">STORYBOARD GALLERY</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans">
                  {isTh ? `สตอรี่บอร์ด - ฉากที่ ${selectedSceneNum}: ${activeScene?.setting || ''}` : `Storyboard Gallery - Scene ${selectedSceneNum}: ${activeScene?.setting || ''}`}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSceneShots.map((shot, idx) => (
                <div key={shot.id} className="p-4 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800 space-y-3">
                  <div className="relative aspect-video rounded-lg bg-slate-200 dark:bg-obsidian-950 border border-slate-300 dark:border-obsidian-800 overflow-hidden flex items-center justify-center group">
                    {shot.description?.image_url ? (
                      <img 
                        src={shot.description.image_url} 
                        alt={`Storyboard Shot ${shot.shotNum}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 space-y-1 text-slate-400">
                        <ImageIcon size={24} className="mx-auto" />
                        <span className="text-[11px] block font-sans">{isTh ? 'ยังไม่มีรูปภาพสเก็ตช์' : 'No sketch image uploaded'}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 no-print">
                      <label className="px-3 py-1.5 rounded-lg bg-gold-500 text-obsidian-950 font-black text-xs cursor-pointer hover:bg-gold-400 transition-all flex items-center gap-1 font-sans">
                        <Upload size={13} />
                        <span>{isTh ? 'อัปโหลดรูป' : 'Upload Sketch'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleStoryboardImageUpload(shot.id, e)} 
                        />
                      </label>
                      {shot.description?.image_url && (
                        <button
                          onClick={() => handleRemoveStoryboardImage(shot.id)}
                          className="p-1.5 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs border-b border-slate-200 dark:border-obsidian-800/80 pb-2">
                    <span className="font-black text-gold-500">SHOT {shot.shotNum || shot.shot_number || `${selectedSceneNum}.${idx + 1}`}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-obsidian-800 font-bold">{shot.type || shot.size || 'MCU'} | {shot.lens || '50mm'}</span>
                      <button
                        onClick={() => handleOpenEditShotModal(shot)}
                        className="p-1 rounded text-gold-500 hover:bg-gold-500/10 cursor-pointer transition-all no-print"
                        title={isTh ? "แก้ไขช็อต" : "Edit Shot"}
                      >
                        <Edit size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed min-h-[40px]">
                    {formatTextValue(shot.description, language, '-')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORY 3: PRODUCTION FILE VAULT */}
      {/* ========================================================================= */}

      {/* SUBTAB 3.1: FILE VAULT & ATTACHMENTS ARCHIVE */}
      {activeSubTab === 'file_vault' && (
        <div className="space-y-5">
          <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-800 no-print space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isTh ? 'ค้นหาชื่อไฟล์เอกสาร...' : 'Search file vault...'}
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-gold-500 font-sans"
                />
              </div>

              {hasWriteAccess && (
                <button
                  onClick={() => setIsFileUploadModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 hover:bg-gold-400 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow-xs shrink-0"
                >
                  <Upload size={15} />
                  <span>{isTh ? 'อัปโหลดไฟล์เอกสารเข้าคลัง' : 'Upload Production File'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {FILE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setVaultCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans shrink-0 ${
                    vaultCategoryFilter === cat.id 
                      ? 'bg-gold-500/20 text-gold-500 border border-gold-500/40' 
                      : 'bg-slate-100 dark:bg-obsidian-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {isTh ? cat.labelTh : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVaultFiles.length > 0 ? (
              filteredVaultFiles.map((file) => (
                <div key={file.id} className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-800 space-y-3 hover:border-gold-500/40 transition-all shadow-xs flex flex-col justify-between group">
                  <div className="space-y-2 cursor-pointer" onClick={() => { setPreviewFile(file); setIsPreviewModalOpen(true); }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-lg bg-gold-500/10 text-gold-500 border border-gold-500/20 shrink-0">
                        <FileText size={20} />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800 text-slate-400">
                        {file.fileSize}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans leading-snug line-clamp-2 group-hover:text-gold-500 transition-colors">
                      {file.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed line-clamp-2">
                      {file.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-obsidian-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">{file.uploadDate}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setPreviewFile(file); setIsPreviewModalOpen(true); }}
                        className="p-1.5 rounded-lg text-gold-500 hover:bg-gold-500/10 transition-all cursor-pointer flex items-center gap-1 font-sans text-xs font-bold"
                        title="View Document"
                      >
                        <Eye size={15} />
                        <span className="text-[11px]">{isTh ? 'ดูเอกสาร' : 'View'}</span>
                      </button>
                      {file.dataUrl && (
                        <a
                          href={file.dataUrl}
                          download={file.name}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-gold-500 hover:bg-gold-500/10 transition-all cursor-pointer"
                          title="Download File"
                        >
                          <Download size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteVaultFile(file.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Delete File"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full glass-panel p-12 text-center text-slate-400 text-xs font-sans rounded-2xl border border-slate-200 dark:border-obsidian-800 space-y-2">
                <FolderPlus size={32} className="mx-auto text-slate-400 opacity-60" />
                <p>{isTh ? 'ยังไม่มีไฟล์เอกสารในคลังประเภทนี้ กดปุ่ม "อัปโหลดไฟล์เอกสารเข้าคลัง" เพื่อเริ่มบันทึกไฟล์' : 'No documents in this category. Click "Upload Production File" to add files.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. CALL SHEET MODAL */}
      {isCallSheetModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 max-w-3xl w-full space-y-5 animate-scaleIn text-slate-900 dark:text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button 
              onClick={() => setIsCallSheetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-400 cursor-pointer"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Edit size={18} className="text-gold-500" />
              <span>{isTh ? `⚙️ แก้ไขข้อมูลใบสั่งงานกองถ่าย - DAY ${selectedShootDay}` : `⚙️ Edit Call Sheet - DAY ${selectedShootDay}`}</span>
            </h2>

            <form onSubmit={handleSaveCallSheet} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'วันที่ถ่ายทำ:' : 'Shoot Date:'}</label>
                  <input
                    type="date"
                    value={callSheetDate}
                    onChange={(e) => setCallSheetDate(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'เวลาเปิดกอง (Crew Call):' : 'Crew Call Time:'}</label>
                  <input
                    type="text"
                    value={crewCallTime}
                    onChange={(e) => setCrewCallTime(e.target.value)}
                    placeholder="e.g. 07:00 AM"
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'เริ่มถ่ายช็อตแรก:' : 'Shooting Call:'}</label>
                  <input
                    type="text"
                    value={shootCallTime}
                    onChange={(e) => setShootCallTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'เวลาเลิกกอง:' : 'Wrap Time:'}</label>
                  <input
                    type="text"
                    value={wrapTime}
                    onChange={(e) => setWrapTime(e.target.value)}
                    placeholder="e.g. 06:00 PM"
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'สถานที่ถ่ายทำหลัก:' : 'Shoot Location:'}</label>
                  <input
                    type="text"
                    value={shootLocation}
                    onChange={(e) => setShootLocation(e.target.value)}
                    placeholder="e.g. สถานีรถไฟพิษณุโลก"
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'โรงพยาบาลใกล้ที่สุดกรณีฉุกเฉิน:' : 'Nearest Hospital:'}</label>
                  <input
                    type="text"
                    value={hospitalInfo}
                    onChange={(e) => setHospitalInfo(e.target.value)}
                    placeholder="e.g. โรงพยาบาลศูนย์พิษณุโลก โทร 055-270-300"
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-obsidian-800">
                <span className="font-bold text-gold-500 block">{isTh ? 'ข้อกำหนดเทคนิคแยกตามแผนก:' : 'Departmental Requirements:'}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">{isTh ? '📷 แผนกกล้อง & กริป:' : 'Camera Notes:'}</label>
                    <textarea
                      rows={2}
                      value={cameraNotes}
                      onChange={(e) => setCameraNotes(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">{isTh ? '🎨 แผนกศิลปกรรม & พร็อพ:' : 'Art Notes:'}</label>
                    <textarea
                      rows={2}
                      value={artNotes}
                      onChange={(e) => setArtNotes(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">{isTh ? '💡 แผนกไฟ:' : 'Lighting Notes:'}</label>
                    <textarea
                      rows={2}
                      value={lightingNotes}
                      onChange={(e) => setLightingNotes(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">{isTh ? '🎙️ แผนกเสียง:' : 'Sound Notes:'}</label>
                    <textarea
                      rows={2}
                      value={soundNotes}
                      onChange={(e) => setSoundNotes(e.target.value)}
                      className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-obsidian-800">
                <button
                  type="button"
                  onClick={() => setIsCallSheetModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-obsidian-900 cursor-pointer"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gold-500 text-obsidian-950 font-black hover:bg-gold-400 cursor-pointer"
                >
                  {isTh ? 'บันทึกใบสั่งงาน' : 'Save Call Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CREATE SHOT MODAL */}
      {isShotModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 max-w-xl w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsShotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-400 cursor-pointer"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Plus size={18} className="text-gold-500" />
              <span>{isTh ? `เพิ่มช็อตถ่ายทำใหม่ - ฉากที่ ${selectedSceneNum}` : `Add New Shot - Scene ${selectedSceneNum}`}</span>
            </h2>

            <form onSubmit={handleAddShotSubmit} className="space-y-3.5 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SHOT #:</label>
                  <input
                    type="text"
                    placeholder={`e.g. ${selectedSceneNum}.1`}
                    value={newShotNum}
                    onChange={(e) => setNewShotNum(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'ขนาดภาพ (Framing):' : 'Framing:'}</label>
                  <select
                    value={newShotFraming}
                    onChange={(e) => setNewShotFraming(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    {['ECU', 'CU', 'MCU', 'MS', 'MLS', 'WS', 'EWS'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'ระยะเลนส์ (Lens):' : 'Lens:'}</label>
                  <select
                    value={newShotLens}
                    onChange={(e) => setNewShotLens(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    {['14mm', '18mm', '24mm', '35mm', '50mm', '85mm', '105mm', '135mm', '70-200mm'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'มุมกล้อง (Camera Angle):' : 'Angle:'}</label>
                  <select
                    value={newShotAngle}
                    onChange={(e) => setNewShotAngle(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value="Eye-Level">{isTh ? 'Eye-Level (ระดับสายตา)' : 'Eye-Level'}</option>
                    <option value="High Angle">{isTh ? 'High Angle (มุมก้ม/มุมมองจากที่สูง)' : 'High Angle'}</option>
                    <option value="Low Angle">{isTh ? 'Low Angle (มุมเงย/เสยขึ้น)' : 'Low Angle'}</option>
                    <option value="Bird's Eye">{isTh ? "Bird's Eye (มุมสูงตรง Top-down)" : "Bird's Eye"}</option>
                    <option value="Worm's Eye">{isTh ? "Worm's Eye (มุมมดมองจากพื้น)" : "Worm's Eye"}</option>
                    <option value="Dutch Angle">{isTh ? 'Dutch Angle (มุมเอียงสร้างความกดดัน)' : 'Dutch Angle'}</option>
                    <option value="Over the Shoulder">{isTh ? 'Over the Shoulder (OTS / ถ่ายผ่านไหล่)' : 'Over the Shoulder'}</option>
                    <option value="Point of View">{isTh ? 'Point of View (POV / สายตาตัวละคร)' : 'Point of View'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'การเคลื่อนกล้อง & ทิศทาง:' : 'Movement & Direction:'}</label>
                  <select
                    value={newShotMove}
                    onChange={(e) => setNewShotMove(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value="Static">{isTh ? 'Static (ตั้งนิ่งบนขาตั้ง)' : 'Static'}</option>
                    <option value="Pan Left">{isTh ? 'Pan Left (แพนไปซ้าย)' : 'Pan Left'}</option>
                    <option value="Pan Right">{isTh ? 'Pan Right (แพนไปขวา)' : 'Pan Right'}</option>
                    <option value="Tilt Up">{isTh ? 'Tilt Up (ทิลท์ก้มเงยขึ้น)' : 'Tilt Up'}</option>
                    <option value="Tilt Down">{isTh ? 'Tilt Down (ทิลท์ก้มกดลง)' : 'Tilt Down'}</option>
                    <option value="Dolly In">{isTh ? 'Dolly In (ดอลลี่ดันเข้าหาตัวละคร)' : 'Dolly In'}</option>
                    <option value="Dolly Out">{isTh ? 'Dolly Out (ดอลลี่ถอยออก)' : 'Dolly Out'}</option>
                    <option value="Track Left">{isTh ? 'Track Left (ทรักตามไปทางซ้าย)' : 'Track Left'}</option>
                    <option value="Track Right">{isTh ? 'Track Right (ทรักตามไปทางขวา)' : 'Track Right'}</option>
                    <option value="Pedestal Up/Down">{isTh ? 'Pedestal Up/Down (ยกความสูงกล้อง)' : 'Pedestal Up/Down'}</option>
                    <option value="Handheld / Shoulder">{isTh ? 'Handheld (ถือกล้องประชิดตัว)' : 'Handheld'}</option>
                    <option value="Steadicam Follow">{isTh ? 'Steadicam Follow (สเตดี้แคมตาม)' : 'Steadicam Follow'}</option>
                    <option value="Gimbal Orbit">{isTh ? 'Gimbal Orbit (กิมบอลวนรอบตัว)' : 'Gimbal Orbit'}</option>
                    <option value="Zoom In/Out">{isTh ? 'Zoom In/Out (ซูมเข้า/ออก)' : 'Zoom In/Out'}</option>
                    <option value="Whip Pan">{isTh ? 'Whip Pan (แพนสะบัดเร็ว)' : 'Whip Pan'}</option>
                    <option value="Drone Flyover">{isTh ? 'Drone Flyover (โดรนบินข้ามฉาก)' : 'Drone Flyover'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'อุปกรณ์กล้อง (Equipment):' : 'Equipment:'}</label>
                  <select
                    value={newShotEquipment}
                    onChange={(e) => setNewShotEquipment(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value="Tripod">{isTh ? 'Tripod (ขาตั้งกล้องมาตรฐาน)' : 'Tripod'}</option>
                    <option value="Handheld / Shoulder Rig">{isTh ? 'Handheld / Shoulder Rig (ประชิดไหล่)' : 'Handheld / Shoulder Rig'}</option>
                    <option value="Gimbal / Steadicam">{isTh ? 'Gimbal / Steadicam (กิมบอล)' : 'Gimbal / Steadicam'}</option>
                    <option value="Dolly & Track">{isTh ? 'Dolly & Track (ดอลลี่วางราง)' : 'Dolly & Track'}</option>
                    <option value="Jib Arm / Crane">{isTh ? 'Jib Arm / Crane (เครนยกรักษาความสูง)' : 'Jib Arm / Crane'}</option>
                    <option value="Vehicle Mount">{isTh ? 'Vehicle Mount (ยึดติดยานพาหนะ)' : 'Vehicle Mount'}</option>
                    <option value="Drone / UAV">{isTh ? 'Drone / UAV (โดรนถ่ายภาพอากาศ)' : 'Drone / UAV'}</option>
                    <option value="Slider / Table Rig">{isTh ? 'Slider (สไลเดอร์รางสั้น)' : 'Slider'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{isTh ? 'รายละเอียดแอคชั่น / การกระทำ / เทคนิคภาพ:' : 'Action & Camera Details:'}</label>
                <textarea
                  rows={4}
                  value={newShotDescTh}
                  onChange={(e) => setNewShotDescTh(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-obsidian-800">
                <button
                  type="button"
                  onClick={() => setIsShotModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-obsidian-900 cursor-pointer"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gold-500 text-obsidian-950 font-black hover:bg-gold-400 cursor-pointer"
                >
                  {isTh ? 'บันทึกช็อต' : 'Save Shot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2.1 EDIT SHOT MODAL */}
      {isEditShotModalOpen && editingShot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 max-w-xl w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => { setIsEditShotModalOpen(false); setEditingShot(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-400 cursor-pointer"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Edit size={18} className="text-gold-500" />
              <span>{isTh ? `แก้ไขข้อมูลช็อตถ่ายทำ - SHOT ${editShotNum}` : `Edit Shot Details - SHOT ${editShotNum}`}</span>
            </h2>

            <form onSubmit={handleEditShotSubmit} className="space-y-3.5 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SHOT #:</label>
                  <input
                    type="text"
                    value={editShotNum}
                    onChange={(e) => setEditShotNum(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'ขนาดภาพ (Framing):' : 'Framing:'}</label>
                  <select
                    value={editShotFraming}
                    onChange={(e) => setEditShotFraming(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    {['ECU', 'CU', 'MCU', 'MS', 'MLS', 'WS', 'EWS'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'ระยะเลนส์ (Lens):' : 'Lens:'}</label>
                  <select
                    value={editShotLens}
                    onChange={(e) => setEditShotLens(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    {['14mm', '18mm', '24mm', '35mm', '50mm', '85mm', '105mm', '135mm', '70-200mm'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'มุมกล้อง (Camera Angle):' : 'Angle:'}</label>
                  <select
                    value={editShotAngle}
                    onChange={(e) => setEditShotAngle(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value="Eye-Level">{isTh ? 'Eye-Level (ระดับสายตา)' : 'Eye-Level'}</option>
                    <option value="High Angle">{isTh ? 'High Angle (มุมก้ม/มุมมองจากที่สูง)' : 'High Angle'}</option>
                    <option value="Low Angle">{isTh ? 'Low Angle (มุมเงย/เสยขึ้น)' : 'Low Angle'}</option>
                    <option value="Bird\'s Eye">{isTh ? "Bird's Eye (มุมสูงตรง Top-down)" : "Bird's Eye"}</option>
                    <option value="Worm\'s Eye">{isTh ? "Worm's Eye (มุมมดมองจากพื้น)" : "Worm's Eye"}</option>
                    <option value="Dutch Angle">{isTh ? 'Dutch Angle (มุมเอียงสร้างความกดดัน)' : 'Dutch Angle'}</option>
                    <option value="Over the Shoulder">{isTh ? 'Over the Shoulder (OTS / ถ่ายผ่านไหล่)' : 'Over the Shoulder'}</option>
                    <option value="Point of View">{isTh ? 'Point of View (POV / สายตาตัวละคร)' : 'Point of View'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'การเคลื่อนกล้อง & ทิศทาง:' : 'Movement & Direction:'}</label>
                  <select
                    value={editShotMove}
                    onChange={(e) => setEditShotMove(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value="Static">{isTh ? 'Static (ตั้งนิ่งบนขาตั้ง)' : 'Static'}</option>
                    <option value="Pan Left">{isTh ? 'Pan Left (แพนไปซ้าย)' : 'Pan Left'}</option>
                    <option value="Pan Right">{isTh ? 'Pan Right (แพนไปขวา)' : 'Pan Right'}</option>
                    <option value="Tilt Up">{isTh ? 'Tilt Up (ทิลท์ก้มเงยขึ้น)' : 'Tilt Up'}</option>
                    <option value="Tilt Down">{isTh ? 'Tilt Down (ทิลท์ก้มกดลง)' : 'Tilt Down'}</option>
                    <option value="Dolly In">{isTh ? 'Dolly In (ดอลลี่ดันเข้าหาตัวละคร)' : 'Dolly In'}</option>
                    <option value="Dolly Out">{isTh ? 'Dolly Out (ดอลลี่ถอยออก)' : 'Dolly Out'}</option>
                    <option value="Track Left">{isTh ? 'Track Left (ทรักตามไปทางซ้าย)' : 'Track Left'}</option>
                    <option value="Track Right">{isTh ? 'Track Right (ทรักตามไปทางขวา)' : 'Track Right'}</option>
                    <option value="Pedestal Up/Down">{isTh ? 'Pedestal Up/Down (ยกความสูงกล้อง)' : 'Pedestal Up/Down'}</option>
                    <option value="Handheld / Shoulder">{isTh ? 'Handheld (ถือกล้องประชิดตัว)' : 'Handheld'}</option>
                    <option value="Steadicam Follow">{isTh ? 'Steadicam Follow (สเตดี้แคมตาม)' : 'Steadicam Follow'}</option>
                    <option value="Gimbal Orbit">{isTh ? 'Gimbal Orbit (กิมบอลวนรอบตัว)' : 'Gimbal Orbit'}</option>
                    <option value="Zoom In/Out">{isTh ? 'Zoom In/Out (ซูมเข้า/ออก)' : 'Zoom In/Out'}</option>
                    <option value="Whip Pan">{isTh ? 'Whip Pan (แพนสะบัดเร็ว)' : 'Whip Pan'}</option>
                    <option value="Drone Flyover">{isTh ? 'Drone Flyover (โดรนบินข้ามฉาก)' : 'Drone Flyover'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">{isTh ? 'อุปกรณ์กล้อง (Equipment):' : 'Equipment:'}</label>
                  <select
                    value={editShotEquipment}
                    onChange={(e) => setEditShotEquipment(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 font-mono text-slate-800 dark:text-slate-200"
                  >
                    <option value="Tripod">{isTh ? 'Tripod (ขาตั้งกล้องมาตรฐาน)' : 'Tripod'}</option>
                    <option value="Handheld / Shoulder Rig">{isTh ? 'Handheld / Shoulder Rig (ประชิดไหล่)' : 'Handheld / Shoulder Rig'}</option>
                    <option value="Gimbal / Steadicam">{isTh ? 'Gimbal / Steadicam (กิมบอล)' : 'Gimbal / Steadicam'}</option>
                    <option value="Dolly & Track">{isTh ? 'Dolly & Track (ดอลลี่วางราง)' : 'Dolly & Track'}</option>
                    <option value="Jib Arm / Crane">{isTh ? 'Jib Arm / Crane (เครนยกรักษาความสูง)' : 'Jib Arm / Crane'}</option>
                    <option value="Vehicle Mount">{isTh ? 'Vehicle Mount (ยึดติดยานพาหนะ)' : 'Vehicle Mount'}</option>
                    <option value="Drone / UAV">{isTh ? 'Drone / UAV (โดรนถ่ายภาพอากาศ)' : 'Drone / UAV'}</option>
                    <option value="Slider / Table Rig">{isTh ? 'Slider (สไลเดอร์รางสั้น)' : 'Slider'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{isTh ? 'รายละเอียดแอคชั่น / การกระทำ / เทคนิคภาพ:' : 'Action & Camera Details:'}</label>
                <textarea
                  rows={4}
                  value={editShotDescTh}
                  onChange={(e) => setEditShotDescTh(e.target.value)}
                  placeholder={isTh ? 'ระบุการกระทำของนักแสดง, ทิศทางเคลื่อนกล้อง, เทคนิคแสง และบล็อกกิ้งฉาก...' : 'Describe actor action, camera movement direction, lighting technique and blocking...'}
                  className="w-full p-2.5 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-obsidian-800">
                <button
                  type="button"
                  onClick={() => { setIsEditShotModalOpen(false); setEditingShot(null); }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-obsidian-900 cursor-pointer"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gold-500 text-obsidian-950 font-black hover:bg-gold-400 cursor-pointer"
                >
                  {isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. PRODUCTION FILE UPLOAD MODAL */}
      {isFileUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 max-w-lg w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100 shadow-2xl relative">
            <button 
              onClick={() => setIsFileUploadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-400 cursor-pointer"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Upload size={18} className="text-gold-500" />
              <span>{isTh ? 'อัปโหลดไฟล์เอกสารเข้าคลังโปรดักชั่น' : 'Upload Production File to Vault'}</span>
            </h2>

            <form onSubmit={handleSaveVaultFile} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">{isTh ? 'เลือกไฟล์จากเครื่อง:' : 'Select File:'}</label>
                <input
                  type="file"
                  onChange={handleVaultFileUpload}
                  required
                  className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{isTh ? 'ชื่อไฟล์เอกสาร:' : 'Document Name:'}</label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. สัญญาเช่าอุปกรณ์กล้องหลัก.pdf"
                  required
                  className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{isTh ? 'หมวดหมู่เอกสาร:' : 'File Category:'}</label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                >
                  {FILE_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {isTh ? cat.labelTh : cat.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{isTh ? 'คำอธิบายเพิ่มเติม:' : 'Description:'}</label>
                <textarea
                  rows={2}
                  value={newFileDesc}
                  onChange={(e) => setNewFileDesc(e.target.value)}
                  placeholder={isTh ? 'ระบุรายละเอียดสั้นๆ ของเอกสารนี้...' : 'Brief note about this document...'}
                  className="w-full p-2 rounded-lg border bg-white dark:bg-obsidian-950 border-slate-200 dark:border-obsidian-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-obsidian-800">
                <button
                  type="button"
                  onClick={() => setIsFileUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-obsidian-900 cursor-pointer"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gold-500 text-obsidian-950 font-black hover:bg-gold-400 cursor-pointer"
                >
                  {isTh ? 'บันทึกเข้าคลัง' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DOCUMENT PREVIEWER MODAL */}
      {isPreviewModalOpen && previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 no-print">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 max-w-4xl w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-obsidian-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-gold-500" />
                <h2 className="text-base font-black text-slate-900 dark:text-white font-sans truncate max-w-md">
                  {previewFile.name}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-obsidian-900 text-slate-400">
                  {previewFile.fileSize}
                </span>
              </div>
              <button 
                onClick={() => { setIsPreviewModalOpen(false); setPreviewFile(null); }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2 scrollbar-thin">
              {/* Render Preview Content Based on File Type */}
              {previewFile.dataUrl && (previewFile.fileType?.includes('image') || previewFile.dataUrl.startsWith('data:image/') || previewFile.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                <div className="flex items-center justify-center bg-obsidian-950 p-4 rounded-xl border border-slate-800 min-h-[300px]">
                  <img src={previewFile.dataUrl} alt={previewFile.name} className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg" />
                </div>
              ) : previewFile.dataUrl && (previewFile.fileType?.includes('pdf') || previewFile.dataUrl.startsWith('data:application/pdf') || previewFile.name?.endsWith('.pdf')) ? (
                <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-slate-800 bg-obsidian-950">
                  <iframe src={previewFile.dataUrl} title={previewFile.name} className="w-full h-full border-none" />
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-50 dark:bg-obsidian-900/60 border border-slate-200 dark:border-obsidian-800 space-y-3 font-sans">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">DOCUMENT METADATA & SUMMARY</div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {previewFile.desc || (isTh ? 'ไม่มีคำอธิบายเพิ่มเติม' : 'No description provided')}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono pt-3 border-t border-slate-200 dark:border-obsidian-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">CATEGORY:</span>
                      <span className="font-bold text-gold-500 uppercase">{previewFile.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">UPLOAD DATE:</span>
                      <span className="font-bold">{previewFile.uploadDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">FILE TYPE:</span>
                      <span className="font-bold truncate">{previewFile.fileType || 'Document'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-obsidian-800">
              <span className="text-xs text-slate-400 font-mono">{isTh ? 'คลังจัดเก็บเอกสารกองถ่าย' : 'Production File Vault'}</span>
              <div className="flex items-center gap-2">
                {previewFile.dataUrl && (
                  <a
                    href={previewFile.dataUrl}
                    download={previewFile.name}
                    className="px-4 py-2 rounded-lg bg-gold-500 text-obsidian-950 hover:bg-gold-400 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    <span>{isTh ? 'ดาวน์โหลดไฟล์' : 'Download File'}</span>
                  </a>
                )}
                <button
                  onClick={() => { setIsPreviewModalOpen(false); setPreviewFile(null); }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-obsidian-900 cursor-pointer text-xs"
                >
                  {isTh ? 'ปิด' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// React Class Error Boundary Component with Error Inspection
class DocumentsHubErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DocumentsHub Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-8 rounded-2xl border border-red-500/30 text-center space-y-4 max-w-xl mx-auto my-12 text-slate-100 font-sans shadow-2xl bg-obsidian-950">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-black text-white">ระบบคลังเอกสารได้รับการฟื้นฟูอัตโนมัติ (Document Hub Safe Recovery)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            ระบบตรวจพบความผิดปกติของรูปแบบข้อมูลเอกสาร กดปุ่มด้านล่างเพื่อโหลดหน้าระบบคลังเอกสารใหม่
          </p>

          {/* Diagnostic Error Details Dropdown */}
          <div className="text-left font-mono text-[11px] text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-900/50 space-y-2">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}>
              <span className="font-bold uppercase tracking-wider text-red-300">📋 รายละเอียดความผิดพลาด (Error Diagnostic Log):</span>
              <span className="text-xs">{this.state.showDetails ? '▲ ซ่อน' : '▼ ดูเพิ่ม'}</span>
            </div>
            <div className="text-red-200 font-bold truncate">
              {this.state.error?.message || String(this.state.error)}
            </div>
            {this.state.showDetails && (
              <pre className="text-[10px] text-slate-400 overflow-x-auto max-h-40 whitespace-pre-wrap pt-2 border-t border-red-900/40">
                {this.state.error?.stack}
              </pre>
            )}
          </div>

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, showDetails: false });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 font-black text-xs hover:bg-gold-400 transition-all cursor-pointer shadow-md"
          >
            รีเฟรชหน้าระบบเอกสาร (Reload Document Suite)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DocumentsHub(props) {
  return (
    <DocumentsHubErrorBoundary>
      <DocumentsHubContent {...props} />
    </DocumentsHubErrorBoundary>
  );
}
