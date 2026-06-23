
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
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
  Bookmark,
  Edit,
  Trash2,
  Upload,
  Settings,
  Volume2,
  Sparkles,
  Briefcase
} from 'lucide-react';

export default function DocumentsHub({ 
  scenes, 
  crew, 
  weather, 
  initialSceneNum, 
  shotList, 
  setShotList, 
  lockedTab,
  events = [],
  setEvents
}) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();

  // Sub-tabs: 'callsheet' | 'shotlist' | 'storyboard'
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return lockedTab || 'callsheet';
  });

  // Selected Scene State (shared across all tabs)
  const [selectedSceneNum, setSelectedSceneNum] = useState(initialSceneNum || (scenes[0]?.scene_number || '1'));
  
  // Print Orientation State
  const [printOrientation, setPrintOrientation] = useState('portrait'); // 'portrait' | 'landscape'

  // Inline edit state for editing storyboard/shot details
  const [editingShot, setEditingShot] = useState(null);

  // Dynamic Shot Form State
  const [newShotNum, setNewShotNum] = useState('');
  const [newShotFraming, setNewShotFraming] = useState('MCU');
  const [newShotLens, setNewShotLens] = useState('50mm');
  const [newShotMove, setNewShotMove] = useState('Static');
  const [newShotDescTh, setNewShotDescTh] = useState('');
  const [newShotDescEn, setNewShotDescEn] = useState('');

  // Selected Scene resolver
  const activeScene = scenes.find(s => s.scene_number === selectedSceneNum) || scenes[0];

  // Scheduler states linked with calendar events
  const sceneEvents = (events || []).filter(e => e.scene_number === selectedSceneNum && e.type === 'shoot');
  const [activeEventId, setActiveEventId] = useState(() => sceneEvents[0]?.id || 'new');
  
  const [schedDate, setSchedDate] = useState('');
  const [schedLocation, setSchedLocation] = useState('');
  const [schedCrewCall, setSchedCrewCall] = useState('07:00 AM');
  const [schedShootCall, setSchedShootCall] = useState('08:30 AM');
  const [schedLunchTime, setSchedLunchTime] = useState('12:30 PM');
  const [schedWrapTime, setSchedWrapTime] = useState('06:00 PM');
  const [schedGeneralNotesTh, setSchedGeneralNotesTh] = useState('');
  const [schedGeneralNotesEn, setSchedGeneralNotesEn] = useState('');
  const [schedCameraNotes, setSchedCameraNotes] = useState('');
  const [schedArtNotes, setSchedArtNotes] = useState('');
  const [schedLightingNotes, setSchedLightingNotes] = useState('');
  const [schedSoundNotes, setSchedSoundNotes] = useState('');
  const [schedWardrobeNotes, setSchedWardrobeNotes] = useState('');
  const [schedProductionNotes, setSchedProductionNotes] = useState('');
  const [schedCrewAssigned, setSchedCrewAssigned] = useState([]);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  // Sync selection state with scene change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const currentSceneEvents = (events || []).filter(e => e.scene_number === selectedSceneNum && e.type === 'shoot');
    if (currentSceneEvents.length > 0) {
      if (!currentSceneEvents.some(e => e.id === activeEventId)) {
        setActiveEventId(currentSceneEvents[0].id);
      }
    } else {
      setActiveEventId('new');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSceneNum, events]);

  // Sync form inputs with selected event
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (activeEventId && activeEventId !== 'new') {
      const evt = (events || []).find(e => e.id === activeEventId);
      if (evt) {
        setSchedDate(evt.date || '');
        setSchedLocation(evt.location?.[language] || evt.location?.en || evt.location?.th || '');
        setSchedCrewCall(evt.notes?.crew_call || '07:00 AM');
        setSchedShootCall(evt.notes?.shooting_call || evt.time || '08:30 AM');
        setSchedLunchTime(evt.notes?.lunch_time || '12:30 PM');
        setSchedWrapTime(evt.notes?.wrap_time || '06:00 PM');
        setSchedGeneralNotesTh(evt.notes?.th || '');
        setSchedGeneralNotesEn(evt.notes?.en || '');
        setSchedCameraNotes(evt.notes?.camera_notes || '');
        setSchedArtNotes(evt.notes?.art_notes || '');
        setSchedLightingNotes(evt.notes?.lighting_notes || '');
        setSchedSoundNotes(evt.notes?.sound_notes || '');
        setSchedWardrobeNotes(evt.notes?.wardrobe_notes || '');
        setSchedProductionNotes(evt.notes?.production_notes || '');
        setSchedCrewAssigned(evt.crew_assigned || []);
        return;
      }
    }

    // Default values for new shoot day
    setSchedDate(new Date().toISOString().split('T')[0]);
    setSchedLocation(activeScene?.location?.[language] || activeScene?.location?.en || activeScene?.location?.th || '');
    setSchedCrewCall('07:00 AM');
    setSchedShootCall('08:30 AM');
    setSchedLunchTime('12:30 PM');
    setSchedWrapTime('06:00 PM');
    setSchedGeneralNotesTh('');
    setSchedGeneralNotesEn('');
    setSchedCameraNotes(activeScene?.tech_notes?.camera_notes?.[language] || activeScene?.tech_notes?.camera_notes?.en || activeScene?.tech_notes?.[language] || activeScene?.tech_notes?.en || '');
    
    const defaultArtNotes = activeScene 
      ? `${language === 'th' ? 'อุปกรณ์:' : 'Props:'} ${activeScene.props?.[language] || activeScene.props?.en || '-'}, ${language === 'th' ? 'เสื้อผ้า:' : 'Wardrobe:'} ${activeScene.wardrobe?.[language] || activeScene.wardrobe?.en || '-'}`
      : '';
    setSchedArtNotes(activeScene?.tech_notes?.art_notes?.[language] || activeScene?.tech_notes?.art_notes?.en || defaultArtNotes);
    setSchedLightingNotes(activeScene?.tech_notes?.lighting_notes?.[language] || activeScene?.tech_notes?.lighting_notes?.en || '');
    setSchedSoundNotes(activeScene?.tech_notes?.sound_notes?.[language] || activeScene?.tech_notes?.sound_notes?.en || '');
    setSchedWardrobeNotes(activeScene?.tech_notes?.wardrobe_notes?.[language] || activeScene?.tech_notes?.wardrobe_notes?.en || '');
    setSchedProductionNotes(activeScene?.tech_notes?.production_notes?.[language] || activeScene?.tech_notes?.production_notes?.en || '');
    setSchedCrewAssigned([]);
  }, [activeEventId, selectedSceneNum, activeScene, events, language]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Filter shots for active scene (supporting both database schema 'scene_id' and 'scene_number')
  const activeSceneShots = shotList.filter(s => 
    s.scene_id === selectedSceneNum || 
    s.scene_number === selectedSceneNum || 
    s.sceneNum === selectedSceneNum ||
    (!s.scene_id && !s.scene_number && !s.sceneNum && selectedSceneNum === '1')
  );

  // Resolve crew for departments
  const dp = crew.find(c => c.role.includes('Director of Photography') || c.role.includes('DP') || c.role.includes('DOP'));
  const art = crew.find(c => c.role.includes('Production Designer') || c.role.includes('Designer') || c.role.includes('Art'));
  const gaffer = crew.find(c => c.role.includes('Gaffer') || c.role.includes('Lighting'));
  const soundRecordist = crew.find(c => c.role.toLowerCase().includes('sound') || c.role.toLowerCase().includes('mixer') || c.role.toLowerCase().includes('record'));
  const wardrobeStylist = crew.find(c => c.role.toLowerCase().includes('makeup') || c.role.toLowerCase().includes('hair') || c.role.toLowerCase().includes('wardrobe') || c.role.toLowerCase().includes('stylist') || c.role.toLowerCase().includes('costume'));
  const director = crew.find(c => c.role.toLowerCase().includes('director') || c.role.toLowerCase().includes('ad') || c.role.toLowerCase().includes('producer'));

  // Resolve active event schedule details
  const currentEvent = (events || []).find(e => e.id === activeEventId) || null;
  const callSheetDate = currentEvent ? currentEvent.date : '';
  const crewCallTime = currentEvent?.notes?.crew_call || '07:00 AM';
  const shootCallTime = currentEvent?.notes?.shooting_call || currentEvent?.time || '08:30 AM';
  const lunchTime = currentEvent?.notes?.lunch_time || '12:30 PM';
  const wrapTime = currentEvent?.notes?.wrap_time || '06:00 PM';
  
  const resolvedLocation = currentEvent?.location?.[language] || currentEvent?.location?.en || activeScene?.location?.[language] || 'TBD';
  const resolvedCameraNotes = currentEvent?.notes?.camera_notes || activeScene?.tech_notes?.camera_notes?.[language] || activeScene?.tech_notes?.camera_notes?.en || activeScene?.tech_notes?.[language] || activeScene?.tech_notes?.en || (language === 'th' ? 'ตรวจสอบอุปกรณ์กล้อง เลนส์ การ์ดบันทึกข้อมูล และระบบไฟสำรอง' : 'Verify camera packages, lenses, media, and power backups.');
  const resolvedArtNotes = currentEvent?.notes?.art_notes || activeScene?.tech_notes?.art_notes?.[language] || activeScene?.tech_notes?.art_notes?.en || (activeScene ? `${language === 'th' ? 'อุปกรณ์:' : 'Props:'} ${activeScene.props?.[language] || activeScene.props?.en || 'TBD'}. ${language === 'th' ? 'เสื้อผ้า:' : 'Wardrobe:'} ${activeScene.wardrobe?.[language] || activeScene.wardrobe?.en || 'TBD'}` : (language === 'th' ? 'เตรียมอุปกรณ์ประกอบฉากหลักและจัดฉากตามที่กำหนด' : 'Prepare props and set dressing as specified.'));
  const resolvedLightingNotes = currentEvent?.notes?.lighting_notes || activeScene?.tech_notes?.lighting_notes?.[language] || activeScene?.tech_notes?.lighting_notes?.en || (language === 'th' ? 'ติดตั้งไฟและแผงสะท้อนแสงตามทิศทางกล้อง ตรวจสอบระบบจ่ายไฟ 220V ให้ปลอดภัย' : 'Refer to camera setup guidelines. Ensure 220V distro feeds are routed exterior.');
  const resolvedSoundNotes = currentEvent?.notes?.sound_notes || activeScene?.tech_notes?.sound_notes?.[language] || activeScene?.tech_notes?.sound_notes?.en || (language === 'th' ? 'เตรียมไมโครโฟนบูมและไมค์ลาวาเลียร์ให้พร้อม ทดสอบระดับเสียงบรรยากาศ' : 'Ensure boom mics and lavaliers are prepped. Track ambient sound levels.');
  const resolvedWardrobeNotes = currentEvent?.notes?.wardrobe_notes || activeScene?.tech_notes?.wardrobe_notes?.[language] || activeScene?.tech_notes?.wardrobe_notes?.en || (language === 'th' ? 'ตรวจเช็กเสื้อผ้าเครื่องแต่งกายของนักแสดงและคุมการแต่งหน้าทำผมให้ต่อเนื่อง' : 'Pre-check cast costumes and makeup continuity matching storyboard.');
  const resolvedProductionNotes = currentEvent?.notes?.production_notes || activeScene?.tech_notes?.production_notes?.[language] || activeScene?.tech_notes?.production_notes?.en || (language === 'th' ? 'เตรียมใบสั่งงานกองถ่าย ดูแลความเรียบร้อยทั่วไปในกองถ่ายและประสานเวลา' : 'Prepare call sheets and script notes. Sync schedules with AD.');
  
  const assignedCrewMembers = (currentEvent?.crew_assigned || []).map(id => crew.find(c => c.id === id)).filter(Boolean);

  // Filter assigned crew by department
  const deptCameraCrew = assignedCrewMembers.filter(c => {
    const role = (c.role || '').toLowerCase();
    const roleTh = (c.role_th || '').toLowerCase();
    return role.includes('camera') || role.includes('photography') || role.includes('grip') || role.includes('dp') || role.includes('dop') || role.includes('focus') || role.includes('dit') || roleTh.includes('กล้อง') || roleTh.includes('ภาพ');
  });

  const deptArtCrew = assignedCrewMembers.filter(c => {
    const role = (c.role || '').toLowerCase();
    const roleTh = (c.role_th || '').toLowerCase();
    return role.includes('art') || role.includes('prop') || role.includes('design') || role.includes('set') || roleTh.includes('ศิลป์') || roleTh.includes('ประกอบฉาก');
  });

  const deptLightingCrew = assignedCrewMembers.filter(c => {
    const role = (c.role || '').toLowerCase();
    const roleTh = (c.role_th || '').toLowerCase();
    return role.includes('light') || role.includes('gaffer') || role.includes('electric') || role.includes('genny') || role.includes('spark') || roleTh.includes('ไฟ') || roleTh.includes('ช่างไฟ');
  });

  const deptSoundCrew = assignedCrewMembers.filter(c => {
    const role = (c.role || '').toLowerCase();
    const roleTh = (c.role_th || '').toLowerCase();
    return role.includes('sound') || role.includes('audio') || role.includes('mixer') || role.includes('boom') || role.includes('record') || roleTh.includes('เสียง');
  });

  const deptMakeupCrew = assignedCrewMembers.filter(c => {
    const role = (c.role || '').toLowerCase();
    const roleTh = (c.role_th || '').toLowerCase();
    return role.includes('makeup') || role.includes('hair') || role.includes('wardrobe') || role.includes('costume') || role.includes('stylist') || roleTh.includes('แต่งหน้า') || roleTh.includes('เสื้อผ้า') || roleTh.includes('ผม');
  });

  const deptProductionCrew = assignedCrewMembers.filter(c => {
    const role = (c.role || '').toLowerCase();
    const roleTh = (c.role_th || '').toLowerCase();
    return role.includes('producer') || role.includes('director') || role.includes('ad') || role.includes('script') || role.includes('continuity') || role.includes('pa') || role.includes('assistant') || roleTh.includes('ดำเนิน') || roleTh.includes('กำกับ') || roleTh.includes('ประสาน') || roleTh.includes('บท');
  });

  // Handle PDF Print
  const handlePrint = () => {
    window.print();
  };

  // Add new shot to list linked to selected scene
  const handleAddShot = (e) => {
    e.preventDefault();
    if (!newShotNum || !newShotDescEn) return;

    const newShot = {
      id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scene_id: selectedSceneNum,
      scene_number: selectedSceneNum,
      shotNum: newShotNum,
      shot_number: newShotNum,
      type: newShotFraming,
      size: newShotFraming,
      lens: newShotLens,
      movement: newShotMove,
      equipment: newShotMove === 'Static' ? 'Tripod' : 'Dolly / Gimbal',
      description: {
        th: newShotDescTh || newShotDescEn,
        en: newShotDescEn || newShotDescTh,
        image_url: ''
      }
    };

    const newShots = [...shotList, newShot];
    setShotList(newShots);
    
    setNewShotNum('');
    setNewShotDescTh('');
    setNewShotDescEn('');
  };

  // Delete shot from list
  const handleDeleteShot = (shotId) => {
    if (window.confirm(language === 'th' ? 'ต้องการลบช็อตนี้ใช่หรือไม่?' : 'Are you sure you want to delete this shot?')) {
      const newShots = shotList.filter(s => s.id !== shotId);
      setShotList(newShots);
    }
  };

  // Add a quick storyboard panel
  const handleAddStoryboardFrame = () => {
    const defaultShotNum = `${selectedSceneNum}.${activeSceneShots.length + 1}`;
    const newShot = {
      id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scene_id: selectedSceneNum,
      scene_number: selectedSceneNum,
      shotNum: defaultShotNum,
      shot_number: defaultShotNum,
      type: 'MCU',
      size: 'MCU',
      lens: '50mm',
      movement: 'Static',
      equipment: 'Tripod',
      description: {
        th: 'คำอธิบายแอ็คชั่นใหม่',
        en: 'New action description',
        image_url: ''
      }
    };
    const newShots = [...shotList, newShot];
    setShotList(newShots);
  };

  // Handle file uploads for storyboards, convert to base64
  const handleImageUpload = (shotId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const newShots = shotList.map(s => {
        if (s.id === shotId) {
          return {
            ...s,
            description: {
              ...s.description,
              image_url: base64Data
            }
          };
        }
        return s;
      });
      setShotList(newShots);
    };
    reader.readAsDataURL(file);
  };

  // Remove image from storyboard
  const handleRemoveImage = (shotId) => {
    if (window.confirm(language === 'th' ? 'ต้องการลบรูปภาพสตอรี่บอร์ดนี้ใช่หรือไม่?' : 'Are you sure you want to remove this storyboard image?')) {
      const newShots = shotList.map(s => {
        if (s.id === shotId) {
          return {
            ...s,
            description: {
              ...s.description,
              image_url: ''
            }
          };
        }
        return s;
      });
      setShotList(newShots);
    }
  };

  // Start editing shot details
  const startEditing = (shot) => {
    setEditingShot({ ...shot });
  };

  // Save the inline edited details
  const saveEditedShot = () => {
    if (!editingShot) return;
    const newShots = shotList.map(s => {
      if (s.id === editingShot.id) {
        const num = editingShot.shotNum || editingShot.shot_number;
        const sz = editingShot.type || editingShot.size;
        return {
          ...editingShot,
          shotNum: num,
          shot_number: num,
          type: sz,
          size: sz
        };
      }
      return s;
    });
    setShotList(newShots);
    setEditingShot(null);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!schedDate || !schedShootCall) return;

    const id = activeEventId === 'new' ? `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : activeEventId;

    const eventObj = {
      id,
      project_id: activeScene?.project_id || `proj-${Date.now()}`,
      title: {
        th: `ถ่ายทำฉากที่ ${selectedSceneNum}: ${activeScene?.setting || ''}`,
        en: `Shooting Scene ${selectedSceneNum}: ${activeScene?.setting || ''}`
      },
      date: schedDate,
      time: schedShootCall,
      type: 'shoot',
      location: { th: schedLocation, en: schedLocation },
      scene_number: selectedSceneNum,
      crew_assigned: schedCrewAssigned,
      notes: {
        th: schedGeneralNotesTh,
        en: schedGeneralNotesEn,
        crew_call: schedCrewCall,
        shooting_call: schedShootCall,
        lunch_time: schedLunchTime,
        wrap_time: schedWrapTime,
        camera_notes: schedCameraNotes,
        art_notes: schedArtNotes,
        lighting_notes: schedLightingNotes,
        sound_notes: schedSoundNotes,
        wardrobe_notes: schedWardrobeNotes,
        production_notes: schedProductionNotes
      }
    };

    try {
      let updatedEvents;
      if (activeEventId === 'new') {
        updatedEvents = [...(events || []), eventObj];
      } else {
        updatedEvents = (events || []).map(e => e.id === activeEventId ? eventObj : e);
      }
      
      await setEvents(updatedEvents);
      alert(language === 'th' ? 'บันทึกตารางถ่ายทำสำเร็จ!' : 'Shoot schedule saved successfully!');
      setActiveEventId(id);
      setIsSchedulerOpen(false);
    } catch (err) {
      alert("Failed to save schedule: " + err.message);
    }
  };

  const handleDeleteSchedule = async () => {
    if (activeEventId === 'new') return;
    const confirmMsg = language === 'th' 
      ? 'คุณต้องการลบตารางถ่ายทำนี้ใช่หรือไม่? (การลบจะลบออกจากปฏิทินด้วย)' 
      : 'Are you sure you want to delete this shoot schedule? (It will be removed from calendar)';
    
    if (window.confirm(confirmMsg)) {
      try {
        const updatedEvents = (events || []).filter(e => e.id !== activeEventId);
        await setEvents(updatedEvents);
        setActiveEventId('new');
        alert(language === 'th' ? 'ลบตารางถ่ายทำสำเร็จ!' : 'Shoot schedule deleted!');
      } catch (err) {
        alert("Failed to delete schedule: " + err.message);
      }
    }
  };

  const weatherWarnings = {
    Sunny: {
      th: "☀️ อุณหภูมิสูง: เตรียมน้ำดื่มเสริมความเย็น และเต็นท์บังแดดให้นักแสดงและทีมงานภายนอก",
      en: "☀️ High Temp Warning: Ensure hydration stations and sunshades are ready for outdoor shoot."
    },
    Cloudy: {
      th: "☁️ เมฆครึ้ม: สภาพแสงไม่คงที่ Gaffer ควรเตรียมแผ่นสะท้อนแสงและไฟเสริมความเปรียบต่าง",
      en: "☁️ Overcast Conditions: Unstable ambient light. Gaffer should prepare bounces and contrast lighting."
    },
    Rainy: {
      th: "🌧️ ฝนตกหนัก: โลเคชั่นภายนอกมีความเสี่ยงสูง เตรียมผ้าใบคลุมกล้องและอุปกรณ์ไฟฟ้าด่วน!",
      en: "🌧️ Rainy Forecast: High risk for exterior locations. Prepare rain covers and waterproof cable sleeves!"
    },
    Thunderstorm: {
      th: "⛈️ พายุฝนฟ้าคะนอง: อันตราย! ควรงดใช้อุปกรณ์ไฟฟ้าภายนอกอาคารและสับเปลี่ยนไปซีนภายใน",
      en: "⛈️ Thunderstorm Danger: Avoid operating electrical rigs outdoors. Switch to backup interior scenes."
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Dynamic Printing Style Hook (No Print) */}
      <style>
        {`
          @media print {
            @page {
              size: ${printOrientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
              margin: 18mm 15mm;
            }
          }
        `}
      </style>

      {/* Title Hub & Documents Sub Navigation (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-obsidian-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Bookmark size={24} className="text-gold-500" />
            <span>{t('docs.hubTitle')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate and export shoot files
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sub Navigation Tabs */}
          {!lockedTab && (
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-obsidian-800">
              <button
                onClick={() => setActiveSubTab('callsheet')}
                className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeSubTab === 'callsheet'
                    ? 'bg-gold-500/10 text-gold-500 font-bold'
                    : theme === 'dark'
                      ? 'bg-obsidian-950 hover:bg-obsidian-800 text-slate-400'
                      : 'bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <FileText size={14} />
                <span>{t('docs.callSheet')}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('shotlist')}
                className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeSubTab === 'shotlist'
                    ? 'bg-gold-500/10 text-gold-500 font-bold'
                    : theme === 'dark'
                      ? 'bg-obsidian-950 hover:bg-obsidian-800 text-slate-400'
                      : 'bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Video size={14} />
                <span>{t('docs.shotList')}</span>
              </button>
              <button
                onClick={() => setActiveSubTab('storyboard')}
                className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeSubTab === 'storyboard'
                    ? 'bg-gold-500/10 text-gold-500 font-bold'
                    : theme === 'dark'
                      ? 'bg-obsidian-950 hover:bg-obsidian-800 text-slate-400'
                      : 'bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ImageIcon size={14} />
                <span>Storyboards</span>
              </button>
            </div>
          )}

          {/* Print orientation switcher */}
          <div className="flex items-center gap-2 border border-slate-200 dark:border-obsidian-800 rounded-lg p-1.5 bg-white dark:bg-obsidian-950 no-print">
            <span className="text-[10px] font-bold text-slate-400 uppercase pl-1.5">{language === 'th' ? 'เลย์เอาต์พิมพ์:' : 'Print Layout:'}</span>
            <select
              value={printOrientation}
              onChange={(e) => setPrintOrientation(e.target.value)}
              className={`px-2 py-1 rounded text-xs font-semibold focus:outline-none ${
                theme === 'dark' ? 'bg-obsidian-900 border-obsidian-850 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="portrait">{language === 'th' ? 'แนวตั้ง (Portrait)' : 'Portrait'}</option>
              <option value="landscape">{language === 'th' ? 'แนวนอน (Landscape)' : 'Landscape'}</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white shadow-sm hover:shadow-md transition-all"
          >
            <Printer size={14} />
            <span>{t('docs.generatePdf')}</span>
          </button>
        </div>
      </div>

      {/* GLOBAL SCENE SELECTOR BAR (Available in all tabs) */}
      {scenes.length > 0 && (
        <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print border border-slate-200 dark:border-obsidian-800">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">
              {language === 'th' ? 'เลือกฉากถ่ายทำ:' : 'Select Scene:'}
            </span>
            <select
              value={selectedSceneNum}
              onChange={(e) => setSelectedSceneNum(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {scenes.map(s => (
                <option key={s.id} value={s.scene_number}>
                  Scene {s.scene_number} - {s.setting} ({s.int_ext} / {s.day_night})
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
            <span>
              {language === 'th' 
                ? `สถานะ: ${activeScene?.status?.toUpperCase() || 'PENDING'}` 
                : `Status: ${activeScene?.status?.toUpperCase() || 'PENDING'}`}
            </span>
          </div>
        </div>
      )}

      {/* DYNAMIC SHOOT SCHEDULER & CALL SHEET SETTINGS PANEL (No Print) */}
      {activeSubTab === 'callsheet' && scenes.length > 0 && hasWriteAccess() && (
        <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-obsidian-800 no-print space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-gold-500" />
              <h2 className="text-sm font-bold font-serif">
                {language === 'th' ? 'ตัววางแผนกำหนดเวลาถ่ายทำและทีมงาน' : 'Shoot Schedule & Call Sheet Planner'}
              </h2>
            </div>
            <button
              onClick={() => setIsSchedulerOpen(!isSchedulerOpen)}
              className={`px-3 py-1 rounded text-[11px] font-bold border transition-colors ${
                isSchedulerOpen 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                  : 'bg-gold-500/10 border-gold-500/20 text-gold-500 hover:bg-gold-500/20'
              }`}
            >
              {isSchedulerOpen 
                ? (language === 'th' ? 'ปิดแผงควบคุม' : 'Close Planner') 
                : (language === 'th' ? '⚙️ เปิดตั้งค่าคิวถ่ายทำ' : '⚙️ Open Shoot Planner')}
            </button>
          </div>

          {/* Date Selector for this Scene */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                {language === 'th' ? 'เลือกคิววันที่ถ่ายทำ:' : 'Select Target Shoot Day:'}
              </span>
              <select
                value={activeEventId}
                onChange={(e) => setActiveEventId(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none ${
                  theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {sceneEvents.map(e => (
                  <option key={e.id} value={e.id}>
                    🎥 {e.date} {e.time ? `[${e.time}]` : ''} ({e.location?.th || e.location?.en || 'TBD'})
                  </option>
                ))}
                <option value="new">➕ {language === 'th' ? 'สร้างคิววันถ่ายทำใหม่...' : 'Schedule New Shoot Day...'}</option>
              </select>
            </div>
            
            {activeEventId === 'new' ? (
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded animate-pulse">
                ⚠️ {language === 'th' ? 'คิวฉากนี้ยังไม่ได้ถูกบรรจุลงในปฏิทิน' : 'Scene is draft: Not scheduled in Calendar yet'}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                ✓ {language === 'th' ? 'บันทึกในปฏิทินแล้ว' : 'Scheduled in Active Calendar'}
              </span>
            )}
          </div>

          {isSchedulerOpen && (
            <form onSubmit={handleSaveSchedule} className="space-y-4 pt-3 border-t border-slate-200/50 dark:border-obsidian-800/40 animate-slideDown">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'th' ? 'วันที่ถ่ายทำ *' : 'Shoot Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Crew Call Time</label>
                  <input
                    type="text"
                    value={schedCrewCall}
                    onChange={(e) => setSchedCrewCall(e.target.value)}
                    placeholder="e.g. 07:00 AM"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shooting Call Time</label>
                  <input
                    type="text"
                    value={schedShootCall}
                    onChange={(e) => setSchedShootCall(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lunch Time</label>
                  <input
                    type="text"
                    value={schedLunchTime}
                    onChange={(e) => setSchedLunchTime(e.target.value)}
                    placeholder="e.g. 12:30 PM"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Wrap Time</label>
                  <input
                    type="text"
                    value={schedWrapTime}
                    onChange={(e) => setSchedWrapTime(e.target.value)}
                    placeholder="e.g. 06:00 PM"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Department Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Camera & Grip Instructions</label>
                  <textarea
                    rows={2}
                    value={schedCameraNotes}
                    onChange={(e) => setSchedCameraNotes(e.target.value)}
                    placeholder="Lenses, setups, gear notes..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Art Department & Props</label>
                  <textarea
                    rows={2}
                    value={schedArtNotes}
                    onChange={(e) => setSchedArtNotes(e.target.value)}
                    placeholder="Props lists, scene setup..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lighting & Electric Requirements</label>
                  <textarea
                    rows={2}
                    value={schedLightingNotes}
                    onChange={(e) => setSchedLightingNotes(e.target.value)}
                    placeholder="Gaffer specs, generator needs, dimmers..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sound & Audio Instructions</label>
                  <textarea
                    rows={2}
                    value={schedSoundNotes}
                    onChange={(e) => setSchedSoundNotes(e.target.value)}
                    placeholder="Boom mic setup, radio frequencies..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Makeup & Wardrobe Notes</label>
                  <textarea
                    rows={2}
                    value={schedWardrobeNotes}
                    onChange={(e) => setSchedWardrobeNotes(e.target.value)}
                    placeholder="Styling, costume presets..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Production & Direction Notes</label>
                  <textarea
                    rows={2}
                    value={schedProductionNotes}
                    onChange={(e) => setSchedProductionNotes(e.target.value)}
                    placeholder="AD instructions, PA tasks, director cues..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Roster Assignment */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {language === 'th' ? 'มอบหมายทีมงานปฏิบัติหน้าที่ประจำวัน (คลิกเพื่อเลือก/ยกเลิก):' : 'Assign Crew Members (Click to toggle):'}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-3 border border-slate-200 dark:border-obsidian-800/60 rounded-xl bg-slate-950/20">
                  {crew.map(c => {
                    const isAssigned = schedCrewAssigned.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isAssigned) {
                            setSchedCrewAssigned(prev => prev.filter(id => id !== c.id));
                          } else {
                            setSchedCrewAssigned(prev => [...prev, c.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          isAssigned
                            ? 'bg-gold-500/20 border-gold-500 text-gold-500 font-extrabold shadow-sm'
                            : theme === 'dark'
                              ? 'bg-obsidian-950 border-obsidian-850 hover:bg-obsidian-800 text-slate-400'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {c.name[language] || c.name.en} ({language === 'th' ? c.role_th || c.role : c.role})
                      </button>
                    );
                  })}
                  {crew.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">No crew available in roster. Add crew in Crew tab first.</p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between items-center pt-2">
                {activeEventId !== 'new' ? (
                  <button
                    type="button"
                    onClick={handleDeleteSchedule}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    🗑️ {language === 'th' ? 'ลบคิววันถ่ายทำนี้' : 'Delete Day'}
                  </button>
                ) : <div />}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsSchedulerOpen(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                      theme === 'dark' ? 'bg-obsidian-800 hover:bg-obsidian-750 text-slate-350' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white hover:opacity-95 shadow"
                  >
                    💾 {language === 'th' ? 'บันทึกตารางถ่ายทำ' : 'Save Shoot Schedule'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* CALL SHEET VIEW */}
      {activeSubTab === 'callsheet' && (
        scenes.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-xl mx-auto border border-dashed border-slate-300 dark:border-obsidian-800 animate-fadeIn">
            <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold font-serif">{language === 'th' ? 'ยังไม่มีฉากสำหรับสร้างใบสั่งงาน (Call Sheet)' : 'No Scenes for Call Sheet'}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              {language === 'th' 
                ? 'กรุณาเพิ่มฉากถ่ายทำในส่วน "บทถ่ายทำ" ก่อนเพื่อนำข้อมูลมาสร้างเอกสารใบสั่งงาน' 
                : 'Please add a scene in the Script Breakdown tab first to generate call sheets.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* CALL SHEET TEMPLATE BODY (Ready for PDF Print) */}
            <div className={`p-8 md:p-12 rounded-xl border glass-panel shadow-md space-y-8 print-container ${
              theme === 'dark' ? 'border-obsidian-800 bg-obsidian-950/20' : 'border-slate-200 bg-white'
            }`}>
              
              {/* Header metadata */}
              <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gold-500 tracking-widest uppercase">Production Document</p>
                  <h2 className="text-2xl font-serif font-black tracking-tight">{t('docs.callSheetHeader')}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Scene {activeScene?.scene_number} | Setting: {activeScene?.setting}</p>
                </div>
                <div className="text-right font-mono text-xs space-y-0.5">
                  <p><span className="text-slate-400">{language === 'th' ? 'วันถ่ายทำ (Shoot Date):' : 'Date:'}</span> {callSheetDate || (language === 'th' ? 'ยังไม่ได้ระบุ' : 'TBD')}</p>
                  <p><span className="text-slate-400">Weather:</span> {weather} ({weatherWarnings[weather] ? 'Risk Checked' : 'Clear'})</p>
                </div>
              </div>

              {/* Key Schedule Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-r border-slate-200 dark:border-obsidian-800 pr-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.crewCallTime')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5 text-gold-500">{crewCallTime}</p>
                </div>
                <div className="border-r border-slate-200 dark:border-obsidian-800 pr-4 pl-0 md:pl-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.shootingCall')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5">{shootCallTime}</p>
                </div>
                <div className="border-r border-slate-200 dark:border-obsidian-800 pr-4 pl-0 md:pl-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.lunchTime')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5 text-slate-400">{lunchTime}</p>
                </div>
                <div className="pl-0 md:pl-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.wrapTime')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5">{wrapTime}</p>
                </div>
              </div>

              {/* Weather Alert Integration */}
              <div className={`p-4 rounded-lg border text-xs flex gap-2.5 items-start ${
                weather === 'Rainy' || weather === 'Thunderstorm'
                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              }`}>
                <CloudSun size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('docs.weatherForecast')}: {weather}</p>
                  <p className="mt-1 leading-relaxed">{weatherWarnings[weather]?.[language] || 'Clear weather forecast.'}</p>
                </div>
              </div>

              {/* Map Link / Coordinates Block */}
              <div className={`p-4 rounded-lg border text-xs space-y-2 ${
                theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className="font-bold flex items-center gap-1">
                  <MapPin size={12} className="text-gold-500" />
                  <span>{t('docs.mapLocation')}</span>
                </p>
                <p className="text-slate-400">📍 {resolvedLocation}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolvedLocation)}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-block mt-1 font-semibold text-gold-500 hover:underline no-print"
                >
                  Open Google Maps Navigation →
                </a>
              </div>

              {/* Shoot Scene Specific details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider border-b pb-1 border-slate-200 dark:border-obsidian-800">
                  Scene Specific Breakdown Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold mb-1">SCENE DESCRIPTION</p>
                    <p className="leading-relaxed font-medium">{activeScene?.description?.[language] || activeScene?.description?.en || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold mb-1">CAST & TALENT</p>
                    <p className="leading-relaxed font-medium">{activeScene?.cast?.[language] || activeScene?.cast?.en || 'TBD'}</p>
                  </div>
                </div>
              </div>

              {/* Department Tech Requirements */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider border-b pb-1 border-slate-200 dark:border-obsidian-800">
                  {t('docs.techRequirements')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Camera / Grip */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Camera size={12} />
                      <span>CAMERA & GRIP (DP: {dp?.name?.[language] || dp?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-750 dark:text-slate-300 font-medium whitespace-pre-line">
                      {resolvedCameraNotes}
                    </p>
                    {deptCameraCrew.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-obsidian-800/60 text-[10px] text-slate-400">
                        <span className="font-bold">{language === 'th' ? 'ผู้ปฏิบัติงาน:' : 'Crew:'} </span>
                        {deptCameraCrew.map(c => `${c.name[language] || c.name.en} (${language === 'th' ? c.role_th || c.role : c.role})`).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Art Department */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Clapperboard size={12} />
                      <span>ART & PROPS (Designer: {art?.name?.[language] || art?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-750 dark:text-slate-300 font-medium whitespace-pre-line">
                      {resolvedArtNotes}
                    </p>
                    {deptArtCrew.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-obsidian-800/60 text-[10px] text-slate-400">
                        <span className="font-bold">{language === 'th' ? 'ผู้ปฏิบัติงาน:' : 'Crew:'} </span>
                        {deptArtCrew.map(c => `${c.name[language] || c.name.en} (${language === 'th' ? c.role_th || c.role : c.role})`).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Electric / Lights */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Wrench size={12} />
                      <span>LIGHTING & ELECTRIC (Gaffer: {gaffer?.name?.[language] || gaffer?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-750 dark:text-slate-300 font-medium whitespace-pre-line">
                      {resolvedLightingNotes}
                    </p>
                    {deptLightingCrew.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-obsidian-800/60 text-[10px] text-slate-400">
                        <span className="font-bold">{language === 'th' ? 'ผู้ปฏิบัติงาน:' : 'Crew:'} </span>
                        {deptLightingCrew.map(c => `${c.name[language] || c.name.en} (${language === 'th' ? c.role_th || c.role : c.role})`).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Sound & Audio */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Volume2 size={12} />
                      <span>SOUND & AUDIO (Mixer: {soundRecordist?.name?.[language] || soundRecordist?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-750 dark:text-slate-300 font-medium whitespace-pre-line">
                      {resolvedSoundNotes}
                    </p>
                    {deptSoundCrew.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-obsidian-800/60 text-[10px] text-slate-400">
                        <span className="font-bold">{language === 'th' ? 'ผู้ปฏิบัติงาน:' : 'Crew:'} </span>
                        {deptSoundCrew.map(c => `${c.name[language] || c.name.en} (${language === 'th' ? c.role_th || c.role : c.role})`).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Makeup & Wardrobe */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Sparkles size={12} />
                      <span>MAKEUP & WARDROBE (Stylist: {wardrobeStylist?.name?.[language] || wardrobeStylist?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-750 dark:text-slate-300 font-medium whitespace-pre-line">
                      {resolvedWardrobeNotes}
                    </p>
                    {deptMakeupCrew.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-obsidian-800/60 text-[10px] text-slate-400">
                        <span className="font-bold">{language === 'th' ? 'ผู้ปฏิบัติงาน:' : 'Crew:'} </span>
                        {deptMakeupCrew.map(c => `${c.name[language] || c.name.en} (${language === 'th' ? c.role_th || c.role : c.role})`).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Production & Scripts */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Briefcase size={12} />
                      <span>PRODUCTION & DIRECTION (AD: {director?.name?.[language] || director?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-750 dark:text-slate-300 font-medium whitespace-pre-line">
                      {resolvedProductionNotes}
                    </p>
                    {deptProductionCrew.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-obsidian-800/60 text-[10px] text-slate-400">
                        <span className="font-bold">{language === 'th' ? 'ผู้ปฏิบัติงาน:' : 'Crew:'} </span>
                        {deptProductionCrew.map(c => `${c.name[language] || c.name.en} (${language === 'th' ? c.role_th || c.role : c.role})`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Assigned Crew List Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider border-b pb-1 border-slate-200 dark:border-obsidian-800">
                  {language === 'th' ? 'ทีมงานปฏิบัติหน้าที่ประจำวัน (Assigned Crew)' : 'Assigned Crew Roster'}
                </h3>
                {assignedCrewMembers.length === 0 ? (
                  <p className="text-xs text-slate-450 italic">{language === 'th' ? 'ยังไม่ได้ระบุทีมงานปฏิบัติหน้าที่' : 'No crew members assigned to this shoot day.'}</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    {assignedCrewMembers.map(c => (
                      <div 
                        key={c.id} 
                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                          theme === 'dark' ? 'bg-obsidian-950 border-obsidian-850' : 'bg-slate-50 border-slate-150'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gold-500/10 text-gold-500 flex items-center justify-center font-bold text-[9px] shrink-0">
                          {c.name.en?.split(' ').map(n => n[0]).join('') || '??'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{c.name[language] || c.name.en}</p>
                          <p className="text-[9px] text-slate-400 truncate">{language === 'th' ? c.role_th || c.role : c.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider border-b pb-1 border-slate-200 dark:border-obsidian-800">
                  {t('docs.cameraShotList')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                        theme === 'dark' ? 'bg-obsidian-900/50 border-obsidian-800/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <th className="py-2 px-3 w-16">{t('docs.shotNum')}</th>
                        <th className="py-2 px-3 w-20">{t('docs.framing')}</th>
                        <th className="py-2 px-3 w-20">{t('docs.lens')}</th>
                        <th className="py-2 px-3 w-24">{t('docs.movement')}</th>
                        <th className="py-2 px-3 w-28">{t('docs.equipment')}</th>
                        <th className="py-2 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-obsidian-800/40 text-xs">
                      {activeSceneShots.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-4 text-center text-slate-400 italic">
                            {language === 'th' ? 'ไม่มีรายการช็อตสำหรับฉากนี้' : 'No shots defined for this scene.'}
                          </td>
                        </tr>
                      ) : (
                        activeSceneShots.map((shot, idx) => (
                          <tr key={shot.id || idx} className="hover:bg-slate-100/20 dark:hover:bg-obsidian-850/10">
                            <td className="py-2.5 px-3 font-mono font-bold text-gold-500">{shot.shotNum || shot.shot_number}</td>
                            <td className="py-2.5 px-3 font-semibold">{shot.type || shot.size}</td>
                            <td className="py-2.5 px-3 font-mono">{shot.lens}</td>
                            <td className="py-2.5 px-3">{shot.movement}</td>
                            <td className="py-2.5 px-3 text-slate-400">{shot.equipment}</td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                              {shot.description?.[language] || shot.description?.en || ''}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Storyboard Visual References in Call Sheet (Incredible premium feature!) */}
              {activeSceneShots.some(s => s.description?.image_url) && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-obsidian-800 page-break-before">
                  <h3 className="text-sm font-bold font-serif uppercase tracking-wider">
                    {language === 'th' ? 'ภาพสตอรี่บอร์ดอ้างอิงกองถ่าย' : 'Visual Storyboard References'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {activeSceneShots.filter(s => s.description?.image_url).map((shot, idx) => (
                      <div 
                        key={shot.id || idx} 
                        className={`rounded-lg border p-2 space-y-2 overflow-hidden ${
                          theme === 'dark' ? 'border-obsidian-800 bg-obsidian-950/30' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="h-24 overflow-hidden rounded bg-slate-900 flex items-center justify-center">
                          <img 
                            src={shot.description.image_url} 
                            alt={`Shot ${shot.shotNum || shot.shot_number}`}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="text-[10px] space-y-0.5 font-mono">
                          <p className="font-bold text-gold-500">SHOT {shot.shotNum || shot.shot_number}</p>
                          <p className="text-slate-400 font-semibold">{shot.type || shot.size} | {shot.lens}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )
      )}

      {/* SHOT LIST VIEW */}
      {activeSubTab === 'shotlist' && (
        <div className="space-y-6">
          {/* Add Shot Form (No Print) */}
          {hasWriteAccess() && (
            <div className="glass-panel p-5 rounded-xl space-y-4 no-print border border-slate-200 dark:border-obsidian-800">
              <h2 className="text-sm font-bold font-serif flex items-center gap-1.5">
                <Plus size={16} className="text-gold-500" />
                <span>
                  {language === 'th' 
                    ? `เพิ่มช็อตกล้องสำหรับฉากที่ ${selectedSceneNum}` 
                    : `Add Camera Shot for Scene ${selectedSceneNum}`}
                </span>
              </h2>

              <form onSubmit={handleAddShot} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shot # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1A"
                    value={newShotNum}
                    onChange={(e) => setNewShotNum(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Framing / Size</label>
                  <select
                    value={newShotFraming}
                    onChange={(e) => setNewShotFraming(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="ECU">ECU (Extreme Close Up)</option>
                    <option value="CU">CU (Close Up)</option>
                    <option value="MCU">MCU (Medium Close Up)</option>
                    <option value="MS">MS (Medium Shot)</option>
                    <option value="WS">WS (Wide Shot)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lens</label>
                  <input
                    type="text"
                    placeholder="e.g. 50mm prime"
                    value={newShotLens}
                    onChange={(e) => setNewShotLens(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Movement</label>
                  <input
                    type="text"
                    placeholder="e.g. Static / Dolly Push"
                    value={newShotMove}
                    onChange={(e) => setNewShotMove(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">รายละเอียดช็อต (ภาษาไทย)</label>
                  <input
                    type="text"
                    value={newShotDescTh}
                    onChange={(e) => setNewShotDescTh(e.target.value)}
                    placeholder="กล้องจับภาพที่หน้าตา..."
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="md:col-span-2 flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shot Action Description (EN) *</label>
                    <input
                      type="text"
                      required
                      value={newShotDescEn}
                      onChange={(e) => setNewShotDescEn(e.target.value)}
                      placeholder="Camera tracks characters reaction..."
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white hover:from-gold-500 shadow-sm shrink-0 h-9"
                  >
                    Add Shot
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shot List Table */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-obsidian-800 print-container">
            <div className="p-4 border-b border-inherit bg-slate-50/50 dark:bg-obsidian-900/30 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {language === 'th' ? `รายการช็อตของฉากที่ ${selectedSceneNum}` : `Shot List for Scene ${selectedSceneNum}`}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {activeSceneShots.length} Shots
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    theme === 'dark' ? 'bg-obsidian-900/50 border-obsidian-800/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-3.5 px-4 w-20">{t('docs.shotNum')}</th>
                    <th className="py-3.5 px-4 w-28">{t('docs.framing')}</th>
                    <th className="py-3.5 px-4 w-28">{t('docs.lens')}</th>
                    <th className="py-3.5 px-4 w-32">{t('docs.movement')}</th>
                    <th className="py-3.5 px-4 w-36">{t('docs.equipment')}</th>
                    <th className="py-3.5 px-4">Description</th>
                    {hasWriteAccess() && <th className="py-3.5 px-4 w-24 text-right no-print">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-obsidian-800/40 text-xs">
                  {activeSceneShots.length === 0 ? (
                    <tr>
                      <td colSpan={hasWriteAccess() ? 7 : 6} className="py-8 text-center text-slate-400 italic">
                        {language === 'th' ? 'ยังไม่มีช็อตในฉากนี้ กดเพิ่มช็อตด้านบน' : 'No shots defined for this scene. Add a shot above.'}
                      </td>
                    </tr>
                  ) : (
                    activeSceneShots.map((shot, idx) => (
                      <tr key={shot.id || idx} className="hover:bg-slate-100/20 dark:hover:bg-obsidian-850/10">
                        <td className="py-3.5 px-4 font-mono font-bold text-gold-500">{shot.shotNum || shot.shot_number}</td>
                        <td className="py-3.5 px-4 font-semibold">{shot.type || shot.size}</td>
                        <td className="py-3.5 px-4 font-mono">{shot.lens}</td>
                        <td className="py-3.5 px-4">{shot.movement}</td>
                        <td className="py-3.5 px-4 text-slate-400">{shot.equipment}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {shot.description?.[language] || shot.description?.en || ''}
                        </td>
                        {hasWriteAccess() && (
                          <td className="py-3.5 px-4 text-right space-x-1.5 no-print">
                            <button
                              onClick={() => startEditing(shot)}
                              className="p-1 hover:text-gold-500 transition-colors inline-block"
                              title="Edit Shot"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteShot(shot.id)}
                              className="p-1 hover:text-red-500 transition-colors inline-block"
                              title="Delete Shot"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STORYBOARD VIEW */}
      {activeSubTab === 'storyboard' && (
        scenes.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-xl mx-auto border border-dashed border-slate-300 dark:border-obsidian-800 animate-fadeIn">
            <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-lg font-bold font-serif">{language === 'th' ? 'ยังไม่มีฉากสำหรับแสดงสตอรี่บอร์ด' : 'No Scenes for Storyboards'}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              {language === 'th' 
                ? 'กรุณาเพิ่มฉากถ่ายทำในส่วน "บทถ่ายทำ" ก่อนเพื่อเปิดดูภาพสตอรี่บอร์ด' 
                : 'Please add a scene in the Script Breakdown tab first to view storyboards.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Storyboard toolbar */}
            <div className="flex justify-between items-center no-print">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                {language === 'th' ? `สตอรี่บอร์ดของฉากที่ ${selectedSceneNum}` : `Storyboard Cards for Scene ${selectedSceneNum}`}
              </h3>
              {hasWriteAccess() && (
                <button
                  onClick={handleAddStoryboardFrame}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold-500/10 text-gold-500 hover:bg-gold-500/20 border border-gold-500/20 transition-all"
                >
                  <Plus size={14} />
                  <span>{language === 'th' ? 'เพิ่มการ์ดสตอรี่บอร์ด' : 'Add Storyboard Panel'}</span>
                </button>
              )}
            </div>

            {activeSceneShots.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-xl mx-auto border border-dashed border-slate-300 dark:border-obsidian-800 animate-fadeIn">
                <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
                  <Camera size={32} />
                </div>
                <h3 className="text-sm font-bold font-serif">
                  {language === 'th' ? 'ยังไม่มีช็อตสำหรับทำสตอรี่บอร์ดในฉากนี้' : 'No Storyboard panels defined for this scene'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {language === 'th'
                    ? 'สตอรี่บอร์ดจะเชื่อมโยงกับ Shot List โดยตรง คุณสามารถสร้างช็อตแรกได้ที่นี่เลย'
                    : 'Storyboard cards link directly to your Shot List. Start creating shots right here!'}
                </p>
                {hasWriteAccess() && (
                  <button
                    onClick={handleAddStoryboardFrame}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white shadow"
                  >
                    + {language === 'th' ? 'เพิ่มช็อตแรกในฉากนี้' : 'Create First Scene Shot'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-container">
                {activeSceneShots.map((shot, idx) => {
                  const shotImage = shot.description?.image_url;
                  
                  return (
                    <div 
                      key={shot.id || idx} 
                      className={`rounded-xl border overflow-hidden glass-panel flex flex-col group transition-all duration-300 hover:shadow-lg ${
                        theme === 'dark' ? 'border-obsidian-800 bg-obsidian-900/40' : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Storyboard Frame Drawing / Reference image */}
                      <div className="h-48 relative bg-slate-950 flex items-center justify-center overflow-hidden border-b border-inherit">
                        {shotImage ? (
                          <img 
                            src={shotImage} 
                            alt={`Shot ${shot.shotNum || shot.shot_number} drawing`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                        ) : (
                          <>
                            {/* Sleek Camera grid/viewfinder sketch fallback */}
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]" />
                            <div className="absolute w-8 h-8 border-l border-t border-slate-700 top-6 left-6" />
                            <div className="absolute w-8 h-8 border-r border-t border-slate-700 top-6 right-6" />
                            <div className="absolute w-8 h-8 border-l border-b border-slate-700 bottom-6 left-6" />
                            <div className="absolute w-8 h-8 border-r border-b border-slate-700 bottom-6 right-6" />
                            
                            <div className="relative text-center space-y-2 z-10 p-4">
                              <Camera size={24} className="mx-auto text-slate-600 animate-pulse" />
                              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                                {shot.type || shot.size || 'MCU'}
                              </p>
                              <p className="text-[9px] text-slate-600 italic">
                                {language === 'th' ? 'ไม่มีรูปภาพ (กดอัพโหลดเพื่อใส่รูปภาพร่าง)' : 'No sketch (Upload frame sketch)'}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Floating quick actions overlay for write access (No Print) */}
                        {hasWriteAccess() && (
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 no-print z-20">
                            
                            {/* File Upload Label */}
                            <label className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 text-[11px] font-bold">
                              <Upload size={14} />
                              <span>{shotImage ? (language === 'th' ? 'เปลี่ยนรูป' : 'Change') : (language === 'th' ? 'อัพโหลด' : 'Upload')}</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(shot.id, e)} 
                                className="hidden" 
                              />
                            </label>

                            {/* Remove Image Button */}
                            {shotImage && (
                              <button
                                onClick={() => handleRemoveImage(shot.id)}
                                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-all hover:scale-105"
                                title="Remove Image"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

                            {/* Quick edit parameters */}
                            <button
                              onClick={() => startEditing(shot)}
                              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all hover:scale-105 flex items-center gap-1.5 text-[11px] font-bold"
                            >
                              <Edit size={14} />
                              <span>{language === 'th' ? 'แก้ไข' : 'Edit'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Storyboard caption info */}
                      <div className="p-4 flex-1 space-y-2 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gold-500 font-mono tracking-wider">
                              SHOT {shot.shotNum || shot.shot_number}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              theme === 'dark' ? 'bg-obsidian-950 text-slate-400' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {shot.type || shot.size} | {shot.lens}
                            </span>
                          </div>
                          
                          <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                            {shot.description?.[language] || shot.description?.en || ''}
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-200/50 dark:border-obsidian-800/40 text-[9px] font-mono text-slate-400 flex justify-between items-center">
                          <span>CAM: {shot.movement}</span>
                          <span>EQ: {shot.equipment}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* STORYBOARD / SHOT INLINE EDIT MODAL overlay */}
      {editingShot && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
          <div className={`w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Header */}
            <h3 className="text-base font-bold font-serif mb-5 flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-obsidian-800/60">
              <Edit size={18} className="text-gold-500" />
              <span>{language === 'th' ? 'แก้ไขคุณสมบัติช็อตและสตอรี่บอร์ด' : 'Edit Shot & Storyboard Card'}</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shot Number *</label>
                  <input
                    type="text"
                    required
                    value={editingShot.shotNum || editingShot.shot_number || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingShot(prev => ({ ...prev, shotNum: val, shot_number: val }));
                    }}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Framing / Size</label>
                  <select
                    value={editingShot.type || editingShot.size || 'MCU'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingShot(prev => ({ ...prev, type: val, size: val }));
                    }}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="ECU">ECU (Extreme Close Up)</option>
                    <option value="CU">CU (Close Up)</option>
                    <option value="MCU">MCU (Medium Close Up)</option>
                    <option value="MS">MS (Medium Shot)</option>
                    <option value="WS">WS (Wide Shot)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lens</label>
                  <input
                    type="text"
                    value={editingShot.lens || ''}
                    onChange={(e) => setEditingShot(prev => ({ ...prev, lens: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Movement</label>
                  <input
                    type="text"
                    value={editingShot.movement || ''}
                    onChange={(e) => setEditingShot(prev => ({ ...prev, movement: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Camera Equipment</label>
                  <input
                    type="text"
                    value={editingShot.equipment || ''}
                    onChange={(e) => setEditingShot(prev => ({ ...prev, equipment: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">คำอธิบายภาพช็อต (TH)</label>
                <textarea
                  rows={2}
                  value={editingShot.description?.th || ''}
                  onChange={(e) => setEditingShot(prev => ({
                    ...prev,
                    description: { ...prev.description, th: e.target.value }
                  }))}
                  placeholder="กล้องถ่ายภาพเคลื่อนไหวช้า..."
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shot Action Description (EN) *</label>
                <textarea
                  rows={2}
                  required
                  value={editingShot.description?.en || ''}
                  onChange={(e) => setEditingShot(prev => ({
                    ...prev,
                    description: { ...prev.description, en: e.target.value }
                  }))}
                  placeholder="Camera slowly pans to reveal..."
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-slate-200/60 dark:border-obsidian-800/60">
              <button
                onClick={() => setEditingShot(null)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  theme === 'dark' ? 'bg-obsidian-800 hover:bg-obsidian-750 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={saveEditedShot}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white hover:opacity-90 shadow-sm"
              >
                {language === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
