import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Film, 
  Trash2, 
  MapPin, 
  Calendar, 
  Clock, 
  Loader2, 
  Save, 
  Check,
  ChevronRight, 
  Sparkles,
  GripVertical,
  X,
  Printer
} from 'lucide-react';

// Helpers to parse and format page lengths in eighths of a page
const parseEighths = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.trim();
  const match = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (match) {
    const whole = parseInt(match[1], 10);
    const num = parseInt(match[2], 10);
    const den = parseInt(match[3], 10);
    return whole + (num / den);
  }
  const fractionMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    return num / den;
  }
  return parseFloat(cleaned) || 0;
};

const formatEighths = (val) => {
  if (val <= 0) return '0 pgs';
  const whole = Math.floor(val);
  const fraction = val - whole;
  const eighths = Math.round(fraction * 8);
  if (eighths === 8) {
    return `${whole + 1} pgs`;
  }
  if (whole === 0) {
    return eighths > 0 ? `${eighths}/8 pgs` : '0 pgs';
  }
  return eighths > 0 ? `${whole} ${eighths}/8 pgs` : `${whole} pgs`;
};

function ShootingSchedule() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();
  
  const {
    currentProject: project,
    activeScenes: scenes,
    updateScenes,
    updateScene,
    activeEvents,
    setEvents,
    isLoading
  } = useProject();

  const [activeTab, setActiveTab] = useState('board'); // 'board' (Stripboard) | 'boneyard' (Boneyard)
  const [boardItems, setBoardItems] = useState([]); // List of { type: 'scene'|'day_break', id, scene? }
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [shootDayModalScene, setShootDayModalScene] = useState(null);
  const [editingSceneTime, setEditingSceneTime] = useState({}); // sceneId -> tempValue

  // User explicit shoot day dates mapping (dayIndex -> 'YYYY-MM-DD' or '')
  const [shootDayDates, setShootDayDates] = useState(() => {
    const localKey = project?.id ? `prod_shoot_day_dates_${project.id}` : null;
    if (!localKey) return {};
    try {
      return JSON.parse(localStorage.getItem(localKey) || '{}');
    } catch {
      return {};
    }
  });

  const handleSetShootDayDate = (dayIndex, dateVal) => {
    const updated = { ...shootDayDates, [dayIndex]: dateVal };
    setShootDayDates(updated);
    if (project?.id) {
      localStorage.setItem(`prod_shoot_day_dates_${project.id}`, JSON.stringify(updated));
    }
  };

  const handleAssignShootDay = async (scene, dayNum) => {
    if (!dayNum) {
      setShootDayModalScene(null);
      return;
    }
    
    const targetDayNum = parseInt(dayNum, 10);
    if (isNaN(targetDayNum) || targetDayNum <= 0) return;

    // Clone board items
    const updatedItems = [...boardItems];
    const itemIndex = updatedItems.findIndex(bi => bi.type === 'scene' && bi.id === scene.id);
    if (itemIndex === -1) {
      setShootDayModalScene(null);
      return;
    }

    const [draggedItem] = updatedItems.splice(itemIndex, 1);

    // Count how many day breaks we currently have
    let currentDbCount = updatedItems.filter(bi => bi.type === 'day_break').length;
    
    // Append enough day breaks at the end to accommodate targetDayNum
    while (currentDbCount < targetDayNum - 1) {
      updatedItems.push({ 
        type: 'day_break', 
        id: `db-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` 
      });
      currentDbCount++;
    }

    // Re-calculate the day boundaries on the modified array (without the dragged item)
    const tempDays = [];
    let currentScenes = [];
    let startIndex = 0;

    updatedItems.forEach((item, index) => {
      if (item.type === 'scene') {
        currentScenes.push(item);
      } else if (item.type === 'day_break') {
        tempDays.push({
          scenes: currentScenes,
          startIndex,
          endIndex: index - 1,
          dayBreakIndex: index
        });
        currentScenes = [];
        startIndex = index + 1;
      }
    });
    tempDays.push({
      scenes: currentScenes,
      startIndex,
      endIndex: updatedItems.length - 1,
      dayBreakIndex: -1
    });

    // Find insertion point in target day
    const targetDay = tempDays[targetDayNum - 1];
    let insertIndex = updatedItems.length;

    if (targetDay.scenes.length > 0) {
      // Insert at the end of the target day's scenes
      const lastSceneInDay = targetDay.scenes[targetDay.scenes.length - 1];
      const flatIdx = updatedItems.findIndex(bi => bi.id === lastSceneInDay.id);
      insertIndex = flatIdx + 1;
    } else {
      // Empty day, insert after the day break of the previous day
      if (targetDayNum - 1 > 0) {
        const prevDay = tempDays[targetDayNum - 2];
        const prevDbIdx = updatedItems.findIndex(bi => bi.type === 'day_break' && bi.id === updatedItems[prevDay.dayBreakIndex]?.id);
        insertIndex = prevDbIdx !== -1 ? prevDbIdx + 1 : 0;
      } else {
        insertIndex = 0;
      }
    }

    updatedItems.splice(insertIndex, 0, draggedItem);
    setBoardItems(updatedItems);
    setShootDayModalScene(null);

    // Auto-save the new layout to DB
    await handleSaveSchedule(updatedItems);
  };

  // Load and construct schedule list from scenes
  useEffect(() => {
    const timer = setTimeout(() => {
      const safeScenesList = Array.isArray(scenes) ? scenes : [];
      if (safeScenesList.length > 0) {
        // 1. Separate scheduled and boneyard scenes
        const scheduled = safeScenesList.filter(s => s && !s.tech_notes?.scheduling?.inBoneyard);
        
        // 2. Sort scheduled scenes by shoot order
        const sortedScheduled = [...scheduled].sort((a, b) => {
          const orderA = a?.tech_notes?.scheduling?.order ?? parseFloat(a?.scene_number) ?? 0;
          const orderB = b?.tech_notes?.scheduling?.order ?? parseFloat(b?.scene_number) ?? 0;
          return orderA - orderB;
        });

        // 3. Insert day break placeholders & custom break items
        const items = [];
        sortedScheduled.forEach((scene) => {
          if (!scene) return;
          items.push({ type: 'scene', id: scene.id, scene });
          if (scene.tech_notes?.scheduling?.dayBreakAfter) {
            items.push({ type: 'day_break', id: `db-${scene.id}` });
          }
        });

        // Load custom break items from localStorage if saved
        const breakKey = project?.id ? `prod_stripboard_breaks_${project.id}` : null;
        if (breakKey) {
          try {
            const savedBreaks = JSON.parse(localStorage.getItem(breakKey) || '[]');
            savedBreaks.forEach(b => {
              if (b && b.insertAfterIndex !== undefined && b.insertAfterIndex <= items.length) {
                items.splice(b.insertAfterIndex, 0, b);
              }
            });
          } catch (e) {
            console.error("Failed to load saved break items:", e);
          }
        }

        setBoardItems(items);
      } else {
        setBoardItems([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [scenes, project?.id]);

  // Extract all unique characters to auto-generate Cast IDs (1, 2, 3...)
  const getCastIdsMap = () => {
    const chars = new Set();
    const safeScenesList = Array.isArray(scenes) ? scenes : [];
    safeScenesList.forEach(scene => {
      if (!scene) return;
      // Scan cast field
      if (scene.cast?.th && typeof scene.cast.th === 'string') {
        scene.cast.th.split(',').forEach(c => c && chars.add(c.trim().toUpperCase()));
      }
      if (scene.cast?.en && typeof scene.cast.en === 'string') {
        scene.cast.en.split(',').forEach(c => c && chars.add(c.trim().toUpperCase()));
      }
      // Scan tagged elements
      const elements = scene.tech_notes?.scene_elements || [];
      if (Array.isArray(elements)) {
        elements.filter(el => el && el.category === 'cast_members').forEach(el => el.name && chars.add(el.name.trim().toUpperCase()));
      }
    });
    
    const sortedChars = Array.from(chars).sort();
    const map = {};
    sortedChars.forEach((name, idx) => {
      map[name] = idx + 1;
    });
    return map;
  };

  const castIdsMap = getCastIdsMap();

  const getSceneCastIds = (scene) => {
    if (!scene) return [];
    const ids = [];
    const sceneChars = new Set();
    if (scene.cast?.th && typeof scene.cast.th === 'string') {
      scene.cast.th.split(',').forEach(c => c && sceneChars.add(c.trim().toUpperCase()));
    }
    if (scene.cast?.en && typeof scene.cast.en === 'string') {
      scene.cast.en.split(',').forEach(c => c && sceneChars.add(c.trim().toUpperCase()));
    }
    const elements = scene.tech_notes?.scene_elements || [];
    if (Array.isArray(elements)) {
      elements.filter(el => el && el.category === 'cast_members').forEach(el => el.name && sceneChars.add(el.name.trim().toUpperCase()));
    }

    sceneChars.forEach(c => {
      if (castIdsMap[c]) ids.push(castIdsMap[c]);
    });
    return ids.sort((a, b) => a - b);
  };

  // Add a Day Break after a scene item index
  const addDayBreak = async (index) => {
    const updated = [...boardItems];
    const item = updated[index];
    if (item.type !== 'scene') return;

    const dbId = `db-${item.id}`;
    // Check if there is already a day break there
    if (updated[index + 1]?.type === 'day_break') return;

    updated.splice(index + 1, 0, { type: 'day_break', id: dbId });
    setBoardItems(updated);

    // Auto-save layout on daybreak addition
    await handleSaveSchedule(updated);
  };

  // Remove a Day Break
  const removeDayBreak = async (index) => {
    const updated = [...boardItems];
    if (updated[index].type !== 'day_break') return;
    updated.splice(index, 1);
    setBoardItems(updated);

    // Auto-save layout on daybreak removal
    await handleSaveSchedule(updated);
  };

  // Move scene strip to boneyard
  const moveToBoneyard = async (sceneId) => {
    const updatedScenes = scenes.map(s => s.id === sceneId ? {
      ...s,
      tech_notes: {
        ...(s.tech_notes || {}),
        scheduling: {
          ...(s.tech_notes?.scheduling || {}),
          inBoneyard: true
        }
      }
    } : s);
    await updateScenes(updatedScenes);
  };

  // Move scene from boneyard back to board
  const restoreFromBoneyard = async (sceneId) => {
    const updatedScenes = scenes.map(s => s.id === sceneId ? {
      ...s,
      tech_notes: {
        ...(s.tech_notes || {}),
        scheduling: {
          ...(s.tech_notes?.scheduling || {}),
          inBoneyard: false,
          order: boardItems.length // Place at the end
        }
      }
    } : s);
    await updateScenes(updatedScenes);
  };

  // Auto-schedule day breaks based on a max page limit (e.g. 4 pages per day)
  const handleAutoSchedule = () => {
    const limitInput = prompt(language === 'th' ? "ระบุขีดจำกัดความยาวบทสูงสุดต่อวัน (หน้ากระดาษ):" : "Enter max pages limit per day:", "4");
    const limit = parseFloat(limitInput) || 4;

    const scheduledScenes = scenes.filter(s => !s.tech_notes?.scheduling?.inBoneyard)
      .sort((a, b) => {
        const orderA = a.tech_notes?.scheduling?.order ?? parseFloat(a.scene_number) ?? 0;
        const orderB = b.tech_notes?.scheduling?.order ?? parseFloat(b.scene_number) ?? 0;
        return orderA - orderB;
      });

    const newItems = [];
    let currentDayPages = 0;

    scheduledScenes.forEach((scene) => {
      const pgs = parseEighths(scene.pages || '1/8');
      if (currentDayPages + pgs > limit && newItems.length > 0) {
        // Mark previous scene as dayBreakAfter
        const prev = newItems[newItems.length - 1];
        if (prev.type === 'scene') {
          newItems.push({ type: 'day_break', id: `db-${prev.id}` });
        }
        currentDayPages = 0;
      }
      newItems.push({ type: 'scene', id: scene.id, scene });
      currentDayPages += pgs;
    });

    setBoardItems(newItems);
  };

  const moveItemUp = async (index) => {
    if (index <= 0) return;
    const updated = [...boardItems];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setBoardItems(updated);
    await handleSaveSchedule(updated);
  };

  const moveItemDown = async (index) => {
    if (index >= boardItems.length - 1) return;
    const updated = [...boardItems];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setBoardItems(updated);
    await handleSaveSchedule(updated);
  };

  const handleDragStart = (index, e) => {
    setDraggedIndex(index);
    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  };

  const handleDragOver = (index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
    }
  };

  const handleDrop = async (dropIndex, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const updated = [...boardItems];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);
    
    setBoardItems(updated);
    setDraggedIndex(null);

    await handleSaveSchedule(updated);
  };

  // Save current order and day breaks to database
  const handleSaveSchedule = async (customItems) => {
    if (!project) return;
    const items = customItems || boardItems;
    try {
      // 1. Calculate new scheduling properties for scenes based on exact flat index
      const updatedScenes = [...scenes].map(s => {
        const itemIdx = items.findIndex(bi => bi.type === 'scene' && bi.id === s.id);
        
        if (itemIdx !== -1) {
          let precedingDbCount = 0;
          for (let i = 0; i < itemIdx; i++) {
            if (items[i].type === 'day_break') {
              precedingDbCount++;
            }
          }
          const followedByDb = items[itemIdx + 1]?.type === 'day_break';
          
          return {
            ...s,
            tech_notes: {
              ...(s.tech_notes || {}),
              scheduling: {
                ...(s.tech_notes?.scheduling || {}),
                inBoneyard: false,
                order: itemIdx + 1, // Store exact flat position order!
                dayBreakAfter: followedByDb,
                shootDayNum: precedingDbCount + 1
              }
            }
          };
        } else {
          return s;
        }
      });

      // 2. Save break items location mapping to localStorage
      if (project?.id) {
        const breaksOnly = items.map((it, idx) => {
          if (it.type !== 'break') return null;
          let precedingDbCount = 0;
          for (let i = 0; i < idx; i++) {
            if (items[i].type === 'day_break') precedingDbCount++;
          }
          return {
            ...it,
            dayIndex: precedingDbCount + 1,
            insertAfterIndex: idx
          };
        }).filter(Boolean);

        localStorage.setItem(`prod_stripboard_breaks_${project.id}`, JSON.stringify(breaksOnly));
      }

      await updateScenes(updatedScenes);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Save schedule error:", err);
    }
  };

  // Boneyard scenes list
  const safeScenesList = Array.isArray(scenes) ? scenes : [];
  const boneyardScenes = safeScenesList.filter(s => s && s.tech_notes?.scheduling?.inBoneyard)
    .sort((a, b) => (parseFloat(a?.scene_number) || 0) - (parseFloat(b?.scene_number) || 0));

  // Helper to fetch explicit shoot date for a day index (returns null if unassigned)
  const getShootDayDate = (dayNum) => {
    const assignedDate = shootDayDates[dayNum];
    if (!assignedDate) return null;

    const dayDate = new Date(assignedDate);
    if (isNaN(dayDate.getTime())) return null;

    return dayDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to format total estimated minutes into human-readable duration
  const formatDuration = (mins) => {
    if (!mins || mins <= 0) return language === 'th' ? 'ไม่ได้กำหนดเวลา' : 'Not set';
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs === 0) {
      return language === 'th' ? `${remainingMins} นาที` : `${remainingMins} mins`;
    }
    const hrText = language === 'th' ? `${hrs} ชม.` : `${hrs}h`;
    const minText = remainingMins > 0 ? (language === 'th' ? ` ${remainingMins} นาที` : ` ${remainingMins}m`) : '';
    return `${hrText}${minText}`;
  };

  // Helper to determine background, border, and badge styles for classic stripboard colors
  const getSceneStripStyles = (scene) => {
    const isDark = theme === 'dark';
    
    // Default styles
    let bgClass = isDark 
      ? "bg-slate-900/60 border-slate-800 text-slate-100 hover:bg-slate-800/80" 
      : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50";
    let borderLeftClass = "border-l-4 border-l-slate-400";
    let badgeBgClass = isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600 font-bold";

    const dayNight = String(scene.day_night).toUpperCase();
    const intExt = String(scene.int_ext).toUpperCase();

    if (dayNight === 'DAY') {
      if (intExt === 'INT') {
        // Day/Interior - Amber/Orange
        bgClass = isDark 
          ? "bg-amber-950/20 border-amber-500/20 text-amber-100 hover:bg-amber-950/30" 
          : "bg-amber-50/70 border-amber-250/80 text-amber-900 hover:bg-amber-100/40";
        borderLeftClass = "border-l-4 border-l-amber-500";
        badgeBgClass = isDark ? "bg-amber-500/20 text-amber-300" : "bg-amber-100/80 text-amber-800 font-bold";
      } else {
        // Day/Exterior - Yellow/Gold
        bgClass = isDark 
          ? "bg-yellow-950/20 border-yellow-500/20 text-yellow-100 hover:bg-yellow-950/30" 
          : "bg-yellow-50/70 border-yellow-250/80 text-yellow-900 hover:bg-yellow-100/40";
        borderLeftClass = "border-l-4 border-l-yellow-400";
        badgeBgClass = isDark ? "bg-yellow-500/20 text-yellow-300" : "bg-yellow-100/80 text-yellow-800 font-bold";
      }
    } else if (dayNight === 'NIGHT') {
      if (intExt === 'INT') {
        // Night/Interior - Indigo/Blue
        bgClass = isDark 
          ? "bg-indigo-950/20 border-indigo-500/20 text-indigo-100 hover:bg-indigo-950/30" 
          : "bg-indigo-50/70 border-indigo-250/80 text-indigo-900 hover:bg-indigo-100/40";
        borderLeftClass = "border-l-4 border-l-indigo-500";
        badgeBgClass = isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-100/80 text-indigo-800 font-bold";
      } else {
        // Night/Exterior - Emerald Green (Industry Standard)
        bgClass = isDark 
          ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-100 hover:bg-emerald-950/30" 
          : "bg-emerald-50/70 border-emerald-250/80 text-emerald-900 hover:bg-emerald-100/40";
        borderLeftClass = "border-l-4 border-l-emerald-500";
        badgeBgClass = isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100/80 text-emerald-800 font-bold";
      }
    } else if (dayNight === 'DUSK' || dayNight === 'DAWN') {
      // Dawn/Dusk - Pink/Rose/Salmon
      bgClass = isDark 
        ? "bg-rose-950/20 border-rose-500/20 text-rose-100 hover:bg-rose-950/30" 
        : "bg-rose-50/70 border-rose-200/80 text-rose-900 hover:bg-rose-100/40";
      borderLeftClass = "border-l-4 border-l-rose-500";
      badgeBgClass = isDark ? "bg-rose-500/20 text-rose-300" : "bg-rose-100/80 text-rose-800 font-bold";
    }

    return { bgClass, borderLeftClass, badgeBgClass };
  };

  // Helper to handle scene estimated time change and update database
  const handleEstTimeChange = async (scene, newMins) => {
    const val = parseInt(newMins, 10);
    const updated = {
      ...scene,
      tech_notes: {
        ...(scene.tech_notes || {}),
        scheduling: {
          ...(scene.tech_notes?.scheduling || {}),
          estTime: isNaN(val) ? '' : String(val)
        }
      }
    };
    await updateScene(updated);
  };

  // Calculate dynamic day details from boardItems
  const getDaysMetadata = () => {
    const days = [];
    let currentScenes = [];
    let pagesSum = 0;
    let durationSum = 0;
    let startIndex = 0;

    boardItems.forEach((item, index) => {
      if (item.type === 'scene') {
        currentScenes.push(item);
        pagesSum += parseEighths(item.scene?.pages || '1/8');
        const estMins = parseInt(item.scene?.tech_notes?.scheduling?.estTime, 10) || 0;
        durationSum += estMins;
      } else if (item.type === 'day_break') {
        days.push({
          dayIndex: days.length + 1,
          scenes: currentScenes,
          pages: pagesSum,
          duration: durationSum,
          startIndex,
          endIndex: index - 1,
          dayBreakIndex: index,
        });
        currentScenes = [];
        pagesSum = 0;
        durationSum = 0;
        startIndex = index + 1;
      }
    });

    // Trailing Day
    days.push({
      dayIndex: days.length + 1,
      scenes: currentScenes,
      pages: pagesSum,
      duration: durationSum,
      startIndex,
      endIndex: boardItems.length - 1,
      dayBreakIndex: -1,
    });

    return days;
  };

  // Render the Day Header dividing bar
  const renderDayHeader = (day) => {
    const formattedTotal = formatEighths(day.pages);
    const dateStr = getShootDayDate(day.dayIndex);
    const durationText = formatDuration(day.duration);
    
    return (
      <div 
        key={`day-header-${day.dayIndex}`}
        className="mt-6 mb-3 overflow-hidden rounded-xl shadow-md border border-slate-800 dark:border-obsidian-800/80 animate-fadeIn"
      >
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-300 px-6 py-3 flex flex-wrap justify-between items-center gap-3 no-print">
          <div className="flex items-center gap-3.5">
            <span className="bg-gold-500 text-slate-950 text-xs px-2.5 py-1 rounded-md font-black tracking-widest uppercase shadow-sm">
              {language === 'th' ? `วันถ่ายทำที่ ${day.dayIndex}` : `DAY ${day.dayIndex}`}
            </span>
            
            {/* Explicit Shoot Date Display or Date Picker */}
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-extrabold ${dateStr ? 'text-gold-400' : 'text-slate-500 italic'}`}>
                {dateStr || (language === 'th' ? '(ยังไม่ได้กำหนดวันที่ถ่ายทำ)' : '(Date Unassigned)')}
              </span>

              {hasWriteAccess() && (
                <input
                  type="date"
                  value={shootDayDates[day.dayIndex] || ''}
                  onChange={(e) => handleSetShootDayDate(day.dayIndex, e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer"
                  title={language === 'th' ? `กำหนดวันที่ถ่ายจริงของ วันถ่ายทำที่ ${day.dayIndex}` : `Set Shoot Date for Day ${day.dayIndex}`}
                />
              )}
            </div>
          </div>

          <div className="font-mono text-slate-300 text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-450 uppercase font-bold">{language === 'th' ? 'คิวฉาก:' : 'Scenes:'}</span>
              <strong className="text-white font-extrabold">{day.scenes.length}</strong>
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-450 uppercase font-bold">{language === 'th' ? 'จำนวนหน้า:' : 'Pages:'}</span>
              <strong className="text-white font-extrabold">{formattedTotal}</strong>
            </span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-450 uppercase font-bold">{language === 'th' ? 'เวลารวม:' : 'Est. Time:'}</span>
              <strong className="text-gold-400 font-extrabold">{durationText}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasWriteAccess() && (
              <button
                onClick={() => {
                  const newBreak = {
                    type: 'break',
                    id: `break-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    breakType: 'meal',
                    title: language === 'th' ? '🍱 เวลาพักทานอาหาร (LUNCH BREAK)' : '🍱 LUNCH BREAK',
                    duration: 60,
                    dayIndex: day.dayIndex
                  };
                  const updated = [...boardItems];
                  let insertIdx = day.endIndex >= 0 ? day.endIndex + 1 : updated.length;
                  updated.splice(insertIdx, 0, newBreak);
                  setBoardItems(updated);

                  if (project?.id) {
                    const breaksOnly = updated.map((item, idx) => ({ ...item, insertAfterIndex: idx })).filter(item => item.type === 'break');
                    localStorage.setItem(`prod_stripboard_breaks_${project.id}`, JSON.stringify(breaksOnly));
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title={language === 'th' ? 'แทรกเวลาพักกอง/พักกินข้าวในคิววันนี้' : 'Add Meal/Break Banner'}
              >
                <span>🍱</span>
                <span>{language === 'th' ? '+ พักทานอาหาร' : '+ Add Meal Break'}</span>
              </button>
            )}

            <button
              onClick={() => {
                window.location.hash = '#/callsheets';
              }}
              className="px-2.5 py-1 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title={language === 'th' ? `สร้างใบสั่งงาน Call Sheet สำหรับวันถ่ายที่ ${day.dayIndex}` : `Generate Call Sheet for Day ${day.dayIndex}`}
            >
              <span>📄</span>
              <span>{language === 'th' ? 'สร้าง Call Sheet' : 'Call Sheet'}</span>
            </button>

            {hasWriteAccess() && day.dayBreakIndex !== -1 && (
              <button 
                onClick={() => removeDayBreak(day.dayBreakIndex)} 
                className="text-red-400 hover:text-red-300 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase font-black pl-2 flex items-center gap-1 cursor-pointer"
                title={language === 'th' ? 'ลบตัวคั่นวันเพื่อรวมวัน' : 'Remove Day Break'}
              >
                <Trash2 size={11} />
                <span className="hidden sm:inline">{language === 'th' ? 'ลบตัวคั่น' : 'Remove Break'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper to determine the actual day index of a scene dynamically
  const getSceneCurrentDayNum = (sceneId) => {
    const itemIdx = boardItems.findIndex(bi => bi.id === sceneId);
    if (itemIdx === -1) return 1;
    let precedingDbCount = 0;
    for (let i = 0; i < itemIdx; i++) {
      if (boardItems[i].type === 'day_break') {
        precedingDbCount++;
      }
    }
    return precedingDbCount + 1;
  };

  // Calculate dynamic start & end time for a scene strip in boardItems
  const getSceneTimeRange = (indexInBoard) => {
    let accumulatedMins = 8 * 60 + 30; // default 08:30 AM
    
    for (let i = 0; i <= indexInBoard; i++) {
      const it = boardItems[i];
      if (!it) continue;
      
      if (it.type === 'day_break') {
        accumulatedMins = 8 * 60 + 30; // Reset for new shoot day
      } else if (it.type === 'break') {
        accumulatedMins += (parseInt(it.duration, 10) || 60);
      } else if (it.type === 'scene') {
        let durationMins = parseInt(it.scene?.tech_notes?.scheduling?.estTime, 10);
        if (isNaN(durationMins) || durationMins <= 0) {
          const pgsText = String(it.scene?.pages || '1/8');
          if (pgsText.includes('1/8')) durationMins = 15;
          else if (pgsText.includes('2/8') || pgsText.includes('1/4')) durationMins = 30;
          else if (pgsText.includes('3/8')) durationMins = 45;
          else if (pgsText.includes('4/8') || pgsText.includes('1/2')) durationMins = 60;
          else durationMins = 60;
        }

        const startMins = accumulatedMins;
        const endMins = startMins + durationMins;

        if (i === indexInBoard) {
          const fmt = (m) => {
            const hrs24 = Math.floor(m / 60) % 24;
            const mins = m % 60;
            const ampm = hrs24 >= 12 ? 'PM' : 'AM';
            const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
            return `${String(hrs12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
          };
          return `${fmt(startMins)} - ${fmt(endMins)}`;
        }

        accumulatedMins = endMins;
      }
    }
    return null;
  };

  // Render an individual scene strip
  const renderSceneStrip = (item, indexInBoard) => {
    const scene = item.scene;
    const { bgClass, borderLeftClass, badgeBgClass } = getSceneStripStyles(scene);
    const castIds = getSceneCastIds(scene);
    const sceneShootTimeText = getSceneTimeRange(indexInBoard);

    return (
      <div
        key={item.id}
        draggable={hasWriteAccess()}
        onDragStart={(e) => handleDragStart(indexInBoard, e)}
        onDragOver={(e) => handleDragOver(indexInBoard, e)}
        onDrop={(e) => handleDrop(indexInBoard, e)}
        className={`border rounded-xl p-3.5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.005] duration-200 ${bgClass} ${borderLeftClass} ${
          draggedIndex === indexInBoard ? 'opacity-30 border-dashed border-gold-500' : ''
        }`}
      >
        {/* Left Side: Grip, Up/Down Buttons, Seq, Scene Number, Badges, Setting */}
        <div className="flex items-start md:items-center gap-3 w-full lg:w-auto min-w-0">
          {hasWriteAccess() && (
            <div className="flex items-center gap-1 shrink-0 no-print">
              <GripVertical className="text-slate-500 shrink-0 cursor-grab active:cursor-grabbing" size={15} />
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveItemUp(indexInBoard); }}
                  disabled={indexInBoard === 0}
                  className="p-0.5 px-1 text-[9px] text-slate-400 hover:text-gold-400 disabled:opacity-20 cursor-pointer font-bold leading-none bg-slate-900/30 dark:bg-slate-100/10 rounded hover:bg-gold-500/20"
                  title={language === 'th' ? 'เลื่อนคิวขึ้น' : 'Move Up'}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveItemDown(indexInBoard); }}
                  disabled={indexInBoard === boardItems.length - 1}
                  className="p-0.5 px-1 text-[9px] text-slate-400 hover:text-gold-400 disabled:opacity-20 cursor-pointer font-bold leading-none bg-slate-900/30 dark:bg-slate-100/10 rounded hover:bg-gold-500/20"
                  title={language === 'th' ? 'เลื่อนคิวลง' : 'Move Down'}
                >
                  ▼
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900/10 dark:bg-slate-100/10 text-slate-500" title="Sequence order">
                {indexInBoard + 1}
              </span>
              <span className="font-mono text-xs font-black text-gold-500 uppercase tracking-wider">
                SCENE {scene.scene_number}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-200/10 ${badgeBgClass}`}>
                {scene.int_ext}
              </span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border border-slate-200/10 ${badgeBgClass}`}>
                {scene.day_night}
              </span>
              {sceneShootTimeText && (
                <span className="text-[10px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap" title={language === 'th' ? 'ช่วงเวลาถ่ายทำคำนวณสะสม' : 'Estimated Shoot Time Window'}>
                  ⏱️ {sceneShootTimeText}
                </span>
              )}
            </div>

            <div className="text-left min-w-0 flex-1 md:ml-2">
              <h4 className="text-sm font-extrabold tracking-tight truncate max-w-xs xl:max-w-md">
                {scene.setting}
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-sm xl:max-w-lg">
                {scene.description?.[language] || scene.description?.en || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Cast, Location, Duration Editor, Page count, Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end text-xs shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/10">
          
          {/* Cast IDs circles */}
          {castIds.length > 0 && (
            <div className="flex gap-1.5 items-center bg-slate-900/5 dark:bg-slate-100/5 rounded-lg px-2.5 py-1 border border-slate-200/10">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                {language === 'th' ? 'นักแสดง:' : 'CAST:'}
              </span>
              <div className="flex flex-wrap gap-1">
                {castIds.map(id => (
                  <span 
                    key={id} 
                    className="w-5 h-5 rounded-full bg-slate-900/10 dark:bg-slate-100/10 text-slate-700 dark:text-slate-350 border border-slate-200/20 flex items-center justify-center font-mono text-[9px] font-extrabold animate-scaleIn" 
                    title={`Cast ID ${id}`}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location pin */}
          {(scene.location?.[language] || scene.location?.en) && (
            <div className="flex items-center gap-1 text-slate-450 text-[11px] font-semibold bg-slate-900/5 dark:bg-slate-100/5 px-2.5 py-1 rounded-lg border border-slate-200/10 max-w-[150px]">
              <MapPin size={11} className="text-gold-500/80 shrink-0" />
              <span className="truncate">{scene.location?.[language] || scene.location?.en}</span>
            </div>
          )}

          {/* Duration Editor (estTime) */}
          <div className="flex items-center gap-1 bg-slate-900/10 dark:bg-slate-100/5 px-2 py-0.5 rounded border border-slate-200/10 print:border-none print:bg-transparent">
            <Clock size={11} className="text-slate-450 shrink-0 animate-pulse print:hidden" />
            <input
              type="text"
              placeholder="mins"
              value={editingSceneTime[scene.id] !== undefined ? editingSceneTime[scene.id] : (scene.tech_notes?.scheduling?.estTime || '')}
              onChange={(e) => {
                setEditingSceneTime({
                  ...editingSceneTime,
                  [scene.id]: e.target.value
                });
              }}
              onBlur={async () => {
                const valStr = editingSceneTime[scene.id];
                if (valStr === undefined) return;
                const parsed = parseInt(valStr, 10);
                await handleEstTimeChange(scene, isNaN(parsed) ? '' : parsed);
                const updatedEditing = { ...editingSceneTime };
                delete updatedEditing[scene.id];
                setEditingSceneTime(updatedEditing);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              className="bg-transparent border-none outline-none w-10 text-center font-mono font-bold text-gold-500 placeholder-slate-500 p-0 focus:ring-0 cursor-pointer focus:cursor-text text-[11px] print:hidden"
              title={language === 'th' ? 'ระบุเวลาที่ใช้ถ่ายทำ (นาที)' : 'Set estimated shoot duration in minutes'}
            />
            <span className="hidden print:inline font-mono font-bold text-slate-800 dark:text-slate-200">
              {scene.tech_notes?.scheduling?.estTime ? `${scene.tech_notes.scheduling.estTime}m` : '-'}
            </span>
            <span className="text-[10px] text-slate-450 font-bold shrink-0 print:hidden">{language === 'th' ? 'น.' : 'm'}</span>
          </div>

          {/* Page count */}
          <div className="font-mono font-black text-gold-500 bg-gold-500/10 px-2.5 py-1 rounded-lg border border-gold-500/20 shrink-0">
            {scene.pages || '1/8'} pgs
          </div>

          {/* Quick Actions */}
          {hasWriteAccess() && (
            <div className="flex items-center gap-1.5 border-l border-slate-200/20 dark:border-obsidian-800 pl-1.5 no-print shrink-0">
              <button 
                onClick={() => {
                  const nextStatus = scene.status === 'completed' 
                    ? 'pending' 
                    : scene.status === 'in_progress' 
                      ? 'completed' 
                      : 'in_progress';
                  updateScene({ ...scene, status: nextStatus });
                }}
                className={`text-[9px] px-2 py-1 rounded-lg font-bold transition-all border shrink-0 ${
                  scene.status === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                    : scene.status === 'in_progress'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                      : 'bg-slate-800 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
                title={language === 'th' ? 'เปลี่ยนสถานะคิวถ่ายทำ' : 'Toggle Shoot Status'}
              >
                {scene.status === 'completed' 
                  ? (language === 'th' ? '✓ ถ่ายแล้ว' : '✓ Shot') 
                  : scene.status === 'in_progress' 
                    ? (language === 'th' ? '⚡ กำลังถ่าย' : '⚡ Shooting') 
                    : (language === 'th' ? '○ รอถ่าย' : '○ Pending')}
              </button>
              <button 
                onClick={() => setShootDayModalScene({ scene, index: indexInBoard })} 
                className="text-[9px] bg-slate-900 hover:bg-slate-800 text-gold-500 px-2 py-1 rounded-lg font-bold border border-slate-800 transition-all hover:scale-105"
                title={language === 'th' ? 'เลือกวันถ่ายทำ / แทรกวัน' : 'Select Shoot Day'}
              >
                + D{getSceneCurrentDayNum(scene.id)}
              </button>
              <button 
                onClick={() => moveToBoneyard(scene.id)} 
                className="text-[9px] text-red-400 hover:text-red-300 font-bold px-1.5 py-1 rounded hover:bg-red-500/10 transition-all"
                title={language === 'th' ? 'ละเว้นฉากนี้' : 'Send to Boneyard'}
              >
                {language === 'th' ? 'ละเว้น' : 'Omit'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render an individual custom break strip (Meal/Break)
  const renderBreakStrip = (item, indexInBoard) => {
    return (
      <div
        key={item.id}
        draggable={hasWriteAccess()}
        onDragStart={(e) => handleDragStart(indexInBoard, e)}
        onDragOver={(e) => handleDragOver(indexInBoard, e)}
        onDrop={(e) => handleDrop(indexInBoard, e)}
        className={`border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/15 rounded-xl p-3 my-1.5 flex items-center justify-between gap-3 text-xs font-bold text-amber-500 shadow-md ${
          draggedIndex === indexInBoard ? 'opacity-30 border-dashed' : ''
        }`}
      >
        <div className="flex items-center gap-2.5">
          {hasWriteAccess() && (
            <div className="flex items-center gap-1 shrink-0 no-print">
              <GripVertical className="text-amber-500/60 shrink-0 cursor-grab active:cursor-grabbing" size={15} />
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveItemUp(indexInBoard); }}
                  disabled={indexInBoard === 0}
                  className="p-0.5 px-1 text-[9px] text-amber-400 hover:text-amber-200 disabled:opacity-20 cursor-pointer font-bold leading-none bg-amber-950/40 rounded hover:bg-amber-500/30"
                  title={language === 'th' ? 'เลื่อนขึ้น' : 'Move Up'}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); moveItemDown(indexInBoard); }}
                  disabled={indexInBoard === boardItems.length - 1}
                  className="p-0.5 px-1 text-[9px] text-amber-400 hover:text-amber-200 disabled:opacity-20 cursor-pointer font-bold leading-none bg-amber-950/40 rounded hover:bg-amber-500/30"
                  title={language === 'th' ? 'เลื่อนลง' : 'Move Down'}
                >
                  ▼
                </button>
              </div>
            </div>
          )}
          <span className="text-sm font-black tracking-wide font-sans flex items-center gap-1.5">
            {item.title || (language === 'th' ? '🍱 เวลาพักทานอาหาร (LUNCH BREAK)' : '🍱 LUNCH BREAK')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30">
            <span className="text-[10px] uppercase font-mono text-amber-400">{language === 'th' ? 'เวลาพัก:' : 'Duration:'}</span>
            <input
              type="number"
              min="5"
              max="180"
              step="5"
              value={item.duration || 60}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                const updated = [...boardItems];
                updated[indexInBoard] = { ...updated[indexInBoard], duration: isNaN(val) ? 60 : val };
                setBoardItems(updated);
                if (project?.id) {
                  const breaksOnly = updated.map((it, idx) => ({ ...it, insertAfterIndex: idx })).filter(it => it.type === 'break');
                  localStorage.setItem(`prod_stripboard_breaks_${project.id}`, JSON.stringify(breaksOnly));
                }
              }}
              className="w-12 px-1 py-0.5 rounded bg-slate-950 border border-amber-500/50 text-amber-300 font-mono font-black text-center text-xs"
            />
            <span className="text-[10px] font-mono text-amber-400">{language === 'th' ? 'นาที' : 'mins'}</span>
          </div>

          {hasWriteAccess() && (
            <button
              onClick={() => {
                const updated = boardItems.filter((_, idx) => idx !== indexInBoard);
                setBoardItems(updated);
                if (project?.id) {
                  const breaksOnly = updated.map((it, idx) => ({ ...it, insertAfterIndex: idx })).filter(it => it.type === 'break');
                  localStorage.setItem(`prod_stripboard_breaks_${project.id}`, JSON.stringify(breaksOnly));
                }
              }}
              className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded cursor-pointer transition-all"
              title={language === 'th' ? 'ลบเวลาพักนี้ออก' : 'Remove break banner'}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Compute total pages per shoot day & display strips
  const renderStripsWithDaybreaks = () => {
    const list = [];
    const days = getDaysMetadata();

    days.forEach((day) => {
      // 1. Render Day Header
      list.push(renderDayHeader(day));

      // 2. Render Scenes and Break items of the Day
      const itemsInDay = boardItems.slice(day.startIndex, day.endIndex >= 0 ? day.endIndex + 1 : boardItems.length);
      itemsInDay.forEach((item) => {
        const indexInBoard = boardItems.findIndex(bi => bi.id === item.id);
        if (indexInBoard !== -1) {
          if (item.type === 'scene') {
            list.push(renderSceneStrip(item, indexInBoard));
          } else if (item.type === 'break') {
            list.push(renderBreakStrip(item, indexInBoard));
          }
        }
      });

      // 3. Render Empty day message if no scenes in the day
      if (day.scenes.length === 0) {
        list.push(
          <div 
            key={`empty-day-${day.dayIndex}`}
            className="py-4 text-center text-xs text-slate-400 italic border border-dashed border-slate-200/20 dark:border-obsidian-800 rounded-xl my-2 bg-slate-50/5 dark:bg-obsidian-950/10 no-print"
          >
            {language === 'th' 
              ? 'ไม่มีฉากถ่ายทำในวันนี้ (เลือกปรับหรือลากคิวมาวางที่นี่เพื่อจัดคิว)' 
              : 'No scenes scheduled for this day (drag scene strips here to plan)'}
          </div>
        );
      }
    });

    return list;
  };

  if (!project) {
    return (
      <div className="glass-panel p-16 text-center rounded-2xl border border-dashed border-slate-350 dark:border-obsidian-800 max-w-xl mx-auto space-y-6 animate-fadeIn mt-8">
        <div className="w-16 h-16 rounded-full bg-gold-500/10 text-gold-500 flex items-center justify-center mx-auto">
          <Film size={32} />
        </div>
        <h3 className="text-lg font-bold font-serif text-slate-800 dark:text-slate-105">
          {language === 'th' ? 'กรุณาเลือกโครงการ' : 'No Project Selected'}
        </h3>
        <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
          {language === 'th' 
            ? 'กรุณาเลือกหรือสร้างโครงการเพื่อจัดทำตารางและลำดับคิวถ่ายทำภาพยนตร์' 
            : 'Please select an existing project or create a new one to access the shooting schedule board.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-left">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-obsidian-850 pb-5 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Film className="text-gold-500 animate-pulse" size={24} />
            <span>{language === 'th' ? 'ตารางวางแผนถ่ายทำ (Stripboard Schedule)' : 'Shooting Schedule Stripboard'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'th' 
              ? 'จัดเรียงลำดับฉากคิวถ่ายทำ แทรกวันหยุดกอง และคำนวณจำนวนหน้ากระดาษรวมในแต่ละวันอัตโนมัติ' 
              : 'Drag strips to order scenes, insert day breaks, and auto-calculate pages per shoot day.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 no-print ${
              theme === 'dark' 
                ? 'bg-obsidian-900 border-obsidian-800 hover:bg-obsidian-800 text-slate-350 hover:text-white' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-900'
            }`}
            title={language === 'th' ? 'พิมพ์ตารางวางแผนถ่ายทำ' : 'Print Shooting Schedule'}
          >
            <Printer size={13} className="text-blue-500" />
            <span>{language === 'th' ? 'พิมพ์ตารางถ่ายทำ' : 'Print Schedule'}</span>
          </button>

          {hasWriteAccess() && (
            <>
              <button
                onClick={handleAutoSchedule}
                className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  theme === 'dark' 
                    ? 'bg-obsidian-900 border-obsidian-800 hover:bg-obsidian-800 text-slate-350 hover:text-white' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-900'
                }`}
              >
                <Sparkles size={13} className="text-gold-500" />
                <span>{language === 'th' ? 'แบ่งวันถ่ายอัตโนมัติ' : 'Auto Day Breaks'}</span>
              </button>

              <button
                onClick={handleSaveSchedule}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
              >
                {isSaved ? <Check size={14} className="animate-scaleIn" /> : <Save size={14} />}
                <span>{isSaved ? (language === 'th' ? 'บันทึกตารางแล้ว!' : 'Schedule Saved!') : (language === 'th' ? 'บันทึกตารางถ่ายทำ' : 'Save Schedule')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="flex items-center justify-between no-print">
        <div className="segmented-nav-container gap-1 max-w-max">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'board'
                ? 'bg-white dark:bg-obsidian-900 text-gold-500 shadow-sm border border-slate-200/50 dark:border-obsidian-800/40 glow-text-subtle font-extrabold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <span>{language === 'th' ? 'บอร์ดวางแผนคิว (Stripboard)' : 'Production Board'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              activeTab === 'board' ? 'bg-gold-500/10 text-gold-500' : 'bg-slate-500/10 text-slate-450'
            }`}>
              {boardItems.filter(i => i.type === 'scene').length} {language === 'th' ? 'ฉาก' : 'scenes'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('boneyard')}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'boneyard'
                ? 'bg-white dark:bg-obsidian-900 text-gold-500 shadow-sm border border-slate-200/50 dark:border-obsidian-800/40 glow-text-subtle font-extrabold'
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            <span>{language === 'th' ? 'ฉากละทิ้ง (Boneyard / Omitted)' : 'Omitted / Boneyard'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              activeTab === 'boneyard' ? 'bg-red-950/20 text-red-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {boneyardScenes.length} {language === 'th' ? 'ฉาก' : 'scenes'}
            </span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && boardItems.length === 0 && (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold-500" />
          <p className="text-xs text-slate-450 font-medium">Loading schedule board...</p>
        </div>
      )}

      {/* STRIPBOARD VIEW PANEL */}
      {activeTab === 'board' && boardItems.length > 0 && (
        <div className="space-y-3">
          {renderStripsWithDaybreaks()}
        </div>
      )}

      {activeTab === 'board' && boardItems.length === 0 && !isLoading && (
        <div className="glass-panel p-16 text-center rounded-2xl border border-dashed border-slate-350 dark:border-obsidian-800 max-w-xl mx-auto space-y-6 animate-fadeIn mt-8">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 text-gold-500 flex items-center justify-center mx-auto">
            <Film size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-serif text-slate-800 dark:text-slate-105">
              {language === 'th' ? 'ยังไม่มีฉากถ่ายทำในตาราง' : 'No Scenes Scheduled Yet'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              {language === 'th' 
                ? 'โปรเจกต์นี้ยังไม่มีฉากคิวถ่ายทำ โปรดเขียนบทภาพยนตร์ก่อน หรือแยกแยะฉากในหน้าแจกแจงบทถ่ายทำ เพื่อสร้างคิวแผ่นสคริปต์ลงในตารางวางแผนคิว' 
                : 'This project does not have any scene strips scheduled yet. Write a screenplay first or define scenes in the breakdown page to populate your stripboard schedule.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a 
              href="#/script" 
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 hover:border-gold-500/50 text-xs font-bold text-slate-650 dark:text-slate-300 dark:hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>{language === 'th' ? 'ไปหน้าเขียนบทภาพยนตร์' : 'Go to Screenplay Editor'}</span>
              <ChevronRight size={14} />
            </a>
            <a 
              href="#/breakdown" 
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold-600 to-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <span>{language === 'th' ? 'ไปหน้าแจกแจงบทถ่ายทำ' : 'Go to Script Breakdown'}</span>
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      )}

      {/* BONEYARD VIEW PANEL */}
      {activeTab === 'boneyard' && (
        <div className="glass-panel p-6 rounded-xl border border-slate-200/50 dark:border-obsidian-850/80 space-y-4">
          <div className="pb-2 border-b border-slate-200/20 text-left">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-450">
              Omitted Scenes / Unscheduled Boneyard
            </h3>
            <p className="text-[10px] text-slate-450 mt-0.5">
              These scenes are currently omitted from the active stripboard calendar. Press "Restore" to move them back into the schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boneyardScenes.map((scene) => (
              <div 
                key={scene.id} 
                className={`p-4 rounded-xl border border-dashed hover:border-solid hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3 text-left ${
                  theme === 'dark' 
                    ? 'bg-obsidian-950/20 border-obsidian-800/80 text-slate-400 hover:bg-obsidian-900 hover:text-slate-200 hover:border-gold-500/30' 
                    : 'bg-slate-50/30 border-slate-250 text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-gold-500/30'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center text-[9px] font-semibold">
                    <span className="font-mono font-bold text-gold-500">SCENE {scene.scene_number}</span>
                    <span className="opacity-75">{scene.int_ext} • {scene.day_night}</span>
                  </div>
                  <h4 className="text-xs font-extrabold mt-1 truncate">{scene.setting}</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5 truncate">{scene.description?.[language] || scene.description?.en || ''}</p>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200/10 pt-2.5 mt-1">
                  <span className="text-[10px] font-mono text-slate-400">{scene.pages || '1/8'} pgs</span>
                  {hasWriteAccess() && (
                    <button 
                      onClick={() => restoreFromBoneyard(scene.id)}
                      className="px-2.5 py-1 rounded bg-gold-600 hover:bg-gold-500 hover:scale-105 active:scale-95 text-white font-black text-[9px] transition-all uppercase"
                    >
                      Restore to Board
                    </button>
                  )}
                </div>
              </div>
            ))}

            {boneyardScenes.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-slate-450 italic">
                Boneyard is empty. All scenes are currently active on the stripboard.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHOOT DAY PICKER MODAL */}
      {shootDayModalScene && shootDayModalScene.scene && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-obsidian-800 max-w-lg w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100 shadow-2xl relative font-sans">
            <button 
              type="button"
              onClick={() => setShootDayModalScene(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-obsidian-800 text-slate-400 cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-black text-slate-900 dark:text-white font-sans flex items-center gap-2">
              <Calendar size={18} className="text-gold-500" />
              <span>{language === 'th' ? `กำหนดคิววันถ่ายทำ - ฉากที่ ${shootDayModalScene.scene.scene_number || ''}` : `Assign Shoot Day - Scene ${shootDayModalScene.scene.scene_number || ''}`}</span>
            </h3>

            <p className="text-xs text-slate-400 font-sans">
              {language === 'th' ? 'เลือกคิววันถ่ายทำ (Shoot Day) หรือแทรกเส้นคั่นแบ่งวันสำหรับฉากนี้' : 'Select a Shoot Day or insert a day break divider for this scene.'}
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 font-mono text-xs pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'].map((dayNum) => (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleAssignShootDay(shootDayModalScene.scene, dayNum)}
                  className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer ${
                    String(shootDayModalScene.scene.tech_notes?.scheduling?.shootDay || '') === dayNum
                      ? 'bg-gold-500 text-obsidian-950 border-gold-400 shadow-md scale-105'
                      : 'bg-slate-100 dark:bg-obsidian-900 border-slate-200 dark:border-obsidian-800 text-slate-700 dark:text-slate-200 hover:border-gold-500/50'
                  }`}
                >
                  DAY {dayNum}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-obsidian-800 flex flex-wrap justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addDayBreak(shootDayModalScene.index);
                    setShootDayModalScene(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold cursor-pointer font-sans"
                >
                  + {language === 'th' ? 'แทรกเส้นคั่น (Day Break)' : 'Insert Break'}
                </button>

                {shootDayModalScene.scene.tech_notes?.scheduling?.shootDay && (
                  <button
                    type="button"
                    onClick={() => handleAssignShootDay(shootDayModalScene.scene, '')}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold cursor-pointer font-sans"
                  >
                    {language === 'th' ? 'ลบคิววันถ่าย' : 'Clear Day'}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShootDayModalScene(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-obsidian-800 text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-obsidian-900 cursor-pointer font-sans"
              >
                {language === 'th' ? 'ปิด' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// React Class Error Boundary Component to prevent white screen crashes
class ShootingScheduleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ShootingSchedule Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 glass-panel rounded-2xl border border-red-500/30 bg-red-950/20 text-center font-sans space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h3 className="text-lg font-black text-white">เกิดข้อผิดพลาดในตารางวางแผนถ่ายทำ</h3>
          <p className="text-xs text-slate-400 font-mono">
            {this.state.error?.toString() || 'Unknown Render Error'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-gold-500 text-obsidian-950 rounded-xl font-bold text-xs hover:bg-gold-400 transition-all cursor-pointer"
          >
            รีเฟรชหน้าตารางถ่ายทำ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ShootingScheduleWithBoundary(props) {
  return (
    <ShootingScheduleErrorBoundary>
      <ShootingSchedule {...props} />
    </ShootingScheduleErrorBoundary>
  );
}
