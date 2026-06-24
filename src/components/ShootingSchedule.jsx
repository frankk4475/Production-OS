import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Film, 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar, 
  Clock, 
  Loader2, 
  Save, 
  Check,
  ChevronRight, 
  Sparkles,
  GripVertical
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

export default function ShootingSchedule() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();
  
  const {
    currentProject: project,
    activeScenes: scenes,
    updateScenes,
    activeEvents,
    setEvents,
    isLoading
  } = useProject();

  const [activeTab, setActiveTab] = useState('board'); // 'board' (Stripboard) | 'boneyard' (Boneyard)
  const [boardItems, setBoardItems] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Load and construct schedule list from scenes
  useEffect(() => {
    if (scenes && scenes.length > 0) {
      // 1. Separate scheduled and boneyard scenes
      const scheduled = scenes.filter(s => !s.tech_notes?.scheduling?.inBoneyard);
      
      // 2. Sort scheduled scenes by shoot order
      const sortedScheduled = [...scheduled].sort((a, b) => {
        const orderA = a.tech_notes?.scheduling?.order ?? parseFloat(a.scene_number) ?? 0;
        const orderB = b.tech_notes?.scheduling?.order ?? parseFloat(b.scene_number) ?? 0;
        return orderA - orderB;
      });

      // 3. Insert day break placeholders
      const items = [];
      sortedScheduled.forEach((scene) => {
        items.push({ type: 'scene', id: scene.id, scene });
        if (scene.tech_notes?.scheduling?.dayBreakAfter) {
          items.push({ type: 'day_break', id: `db-${scene.id}` });
        }
      });

      setBoardItems(items);
    } else {
      setBoardItems([]);
    }
  }, [scenes]);

  // Extract all unique characters to auto-generate Cast IDs (1, 2, 3...)
  const getCastIdsMap = () => {
    const chars = new Set();
    scenes.forEach(scene => {
      // Scan cast field
      if (scene.cast?.th) scene.cast.th.split(',').forEach(c => chars.add(c.trim().toUpperCase()));
      if (scene.cast?.en) scene.cast.en.split(',').forEach(c => chars.add(c.trim().toUpperCase()));
      // Scan tagged elements
      const elements = scene.tech_notes?.scene_elements || [];
      elements.filter(el => el.category === 'cast_members').forEach(el => chars.add(el.name.trim().toUpperCase()));
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
    const ids = [];
    const sceneChars = new Set();
    if (scene.cast?.th) scene.cast.th.split(',').forEach(c => sceneChars.add(c.trim().toUpperCase()));
    if (scene.cast?.en) scene.cast.en.split(',').forEach(c => sceneChars.add(c.trim().toUpperCase()));
    const elements = scene.tech_notes?.scene_elements || [];
    elements.filter(el => el.category === 'cast_members').forEach(el => sceneChars.add(el.name.trim().toUpperCase()));

    sceneChars.forEach(c => {
      if (castIdsMap[c]) ids.push(castIdsMap[c]);
    });
    return ids.sort((a, b) => a - b);
  };

  // Drag & Drop logic
  const handleDragStart = (index, e) => {
    setDraggedIndex(index);
    // Allow dragging inside HTML5
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index, e) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex, e) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updated = [...boardItems];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);
    
    setBoardItems(updated);
    setDraggedIndex(null);
  };

  // Add a Day Break after a scene item index
  const addDayBreak = (index) => {
    const updated = [...boardItems];
    const item = updated[index];
    if (item.type !== 'scene') return;

    const dbId = `db-${item.id}`;
    // Check if there is already a day break there
    if (updated[index + 1]?.type === 'day_break') return;

    updated.splice(index + 1, 0, { type: 'day_break', id: dbId });
    setBoardItems(updated);
  };

  // Remove a Day Break
  const removeDayBreak = (index) => {
    const updated = [...boardItems];
    if (updated[index].type !== 'day_break') return;
    updated.splice(index, 1);
    setBoardItems(updated);
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

  // Save current order and day breaks to database
  const handleSaveSchedule = async () => {
    if (!project) return;
    try {
      // 1. Calculate new scheduling properties for scenes
      const updatedScenes = [...scenes].map(s => {
        const itemIdx = boardItems.findIndex(bi => bi.type === 'scene' && bi.id === s.id);
        
        if (itemIdx !== -1) {
          const followedByDb = boardItems[itemIdx + 1]?.type === 'day_break';
          return {
            ...s,
            tech_notes: {
              ...(s.tech_notes || {}),
              scheduling: {
                inBoneyard: false,
                order: itemIdx + 1,
                dayBreakAfter: followedByDb
              }
            }
          };
        } else {
          const isBoneyard = s.tech_notes?.scheduling?.inBoneyard;
          return {
            ...s,
            tech_notes: {
              ...(s.tech_notes || {}),
              scheduling: {
                ...s.tech_notes?.scheduling,
                inBoneyard: isBoneyard ?? false,
                order: isBoneyard ? 99999 : parseFloat(s.scene_number) || 0
              }
            }
          };
        }
      });

      await updateScenes(updatedScenes);

      // 2. Automatically sync shoot dates to Calendar Events
      const sceneDates = {};
      let dayIndex = 1;
      const projectStart = project.start_date ? new Date(project.start_date) : new Date();

      boardItems.forEach((item) => {
        if (item.type === 'scene') {
          const dayDate = new Date(projectStart.getTime() + (dayIndex - 1) * 24 * 60 * 60 * 1000);
          sceneDates[item.scene.id] = dayDate.toISOString().split('T')[0];
        } else if (item.type === 'day_break') {
          dayIndex += 1;
        }
      });

      const projectSceneNumbers = scenes.map(s => s.scene_number);
      const otherEvents = (activeEvents || []).filter(e => 
        e.project_id !== project.id || 
        e.type !== 'shoot' || 
        !projectSceneNumbers.includes(e.scene_number)
      );

      const shootEvents = (activeEvents || []).filter(e => 
        e.project_id === project.id && 
        e.type === 'shoot' && 
        projectSceneNumbers.includes(e.scene_number)
      );

      const newShootEvents = [];
      boardItems.forEach((item) => {
        if (item.type === 'scene') {
          const scene = item.scene;
          const dateStr = sceneDates[scene.id];
          const existing = shootEvents.find(e => e.scene_number === scene.scene_number);

          if (existing) {
            newShootEvents.push({
              ...existing,
              date: dateStr,
              title: {
                th: `ถ่ายทำฉากที่ ${scene.scene_number}: ${scene.setting || ''}`,
                en: `Shooting Scene ${scene.scene_number}: ${scene.setting || ''}`
              }
            });
          } else {
            newShootEvents.push({
              id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              project_id: project.id,
              title: {
                th: `ถ่ายทำฉากที่ ${scene.scene_number}: ${scene.setting || ''}`,
                en: `Shooting Scene ${scene.scene_number}: ${scene.setting || ''}`
              },
              date: dateStr,
              time: '08:30 AM',
              type: 'shoot',
              location: { 
                th: scene.location?.th || scene.location?.en || '', 
                en: scene.location?.en || scene.location?.th || '' 
              },
              scene_number: scene.scene_number,
              crew_assigned: [],
              notes: {
                th: '',
                en: '',
                crew_call: '07:00 AM',
                shooting_call: '08:30 AM',
                lunch_time: '12:30 PM',
                wrap_time: '06:00 PM',
                camera_notes: '',
                art_notes: '',
                lighting_notes: '',
                sound_notes: '',
                wardrobe_notes: '',
                production_notes: ''
              }
            });
          }
        }
      });

      await setEvents([...otherEvents, ...newShootEvents]);

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      alert("Failed to save schedule: " + err.message);
    }
  };

  // Boneyard scenes list
  const boneyardScenes = scenes.filter(s => s.tech_notes?.scheduling?.inBoneyard)
    .sort((a, b) => (parseFloat(a.scene_number) || 0) - (parseFloat(b.scene_number) || 0));

  // Compute total pages per shoot day & display strips
  const renderStripsWithDaybreaks = () => {
    const list = [];
    let dayIndex = 1;
    let dayPagesSum = 0;

    // Helper to push a day break banner
    const pushDayBreak = (dbIndex, key) => {
      // Calculate shoot day date
      const projectStart = project?.start_date ? new Date(project.start_date) : new Date();
      // Add days (0-indexed for Day 1)
      const dayDate = new Date(projectStart.getTime() + (dayIndex - 1) * 24 * 60 * 60 * 1000);
      const dateStr = dayDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const formattedTotal = formatEighths(dayPagesSum);
      const savedIndex = dbIndex;

      list.push(
        <div 
          key={key} 
          className="my-4 overflow-hidden rounded-xl shadow-sm border border-slate-800 dark:border-obsidian-800/80 animate-fadeIn"
        >
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-300 px-6 py-3 flex justify-between items-center text-xs font-bold no-print">
            <span className="flex items-center gap-2 text-gold-500 uppercase tracking-widest font-black text-[11px]">
              <Calendar size={14} className="animate-pulse" />
              {language === 'th' ? `สิ้นสุดวันถ่ายทำที่ ${dayIndex}` : `End of Day ${dayIndex}`}
            </span>
            <span className="font-mono text-slate-355 text-[11px] flex items-center gap-4">
              <span>{language === 'th' ? 'หน้ากระดาษรวม:' : 'Total Pages:'} <strong className="text-white font-extrabold">{formattedTotal}</strong></span>
              <span className="opacity-40">•</span>
              <span className="text-gold-400">{dateStr}</span>
            </span>
            {hasWriteAccess() && (
              <button 
                onClick={() => removeDayBreak(savedIndex)} 
                className="text-red-400 hover:text-red-300 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase font-black pl-4 flex items-center gap-1"
              >
                <Trash2 size={11} />
                <span>{language === 'th' ? 'ลบตัวคั่น' : 'Remove Break'}</span>
              </button>
            )}
          </div>
        </div>
      );
      dayIndex += 1;
      dayPagesSum = 0;
    };

    boardItems.forEach((item, index) => {
      if (item.type === 'scene') {
        const scene = item.scene;
        const pgs = parseEighths(scene.pages || '1/8');
        dayPagesSum += pgs;

        // Custom WGA production stripboard styling
        let stripClass = "border rounded-xl p-3.5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.005] duration-200 border-l-2 ";
        
        if (theme === 'dark') {
          stripClass += "bg-obsidian-900/60 border-obsidian-800/80 text-slate-105 hover:bg-obsidian-850 ";
        } else {
          stripClass += "bg-white border-slate-200/80 text-slate-800 hover:bg-slate-50/50 ";
        }

        // Apply distinct WGA Stripboard colors on the left border based on INT/EXT and DAY/NIGHT
        if (scene.day_night === 'DAY') {
          if (scene.int_ext === 'INT') {
            // Day/Interior - Peach/Orange
            stripClass += "border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10";
          } else {
            // Day/Exterior - Yellow
            stripClass += "border-l-yellow-400 bg-yellow-500/5 dark:bg-yellow-500/10";
          }
        } else if (scene.day_night === 'NIGHT') {
          if (scene.int_ext === 'INT') {
            // Night/Interior - Indigo
            stripClass += "border-l-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10";
          } else {
            // Night/Exterior - Violet/Blue
            stripClass += "border-l-violet-600 bg-violet-500/5 dark:bg-violet-500/10";
          }
        } else if (scene.day_night === 'DUSK' || scene.day_night === 'DAWN') {
          // Dawn/Dusk - Pink/Rose
          stripClass += "border-l-rose-500 bg-rose-500/5 dark:bg-rose-500/10";
        } else {
          stripClass += "border-l-slate-400";
        }

        const castIds = getSceneCastIds(scene);

        list.push(
          <div
            key={item.id}
            draggable={hasWriteAccess()}
            onDragStart={(e) => handleDragStart(index, e)}
            onDragOver={(e) => handleDragOver(index, e)}
            onDrop={(e) => handleDrop(index, e)}
            className={`${stripClass} ${
              draggedIndex === index ? 'opacity-30 border-dashed border-gold-500' : ''
            }`}
          >
            <div className="flex items-center gap-3 w-full md:w-auto">
              {hasWriteAccess() && <GripVertical className="text-slate-500 shrink-0 no-print" size={15} />}
              
              {/* Scene heading metadata */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-gold-500 uppercase tracking-wider">SCENE {scene.scene_number}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-900/10 dark:bg-slate-100/10 border border-slate-200/20">{scene.int_ext}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-900/10 dark:bg-slate-100/10 border border-slate-200/20">{scene.day_night}</span>
                </div>
                <h4 className="text-sm font-extrabold tracking-tight mt-1 truncate max-w-sm">{scene.setting}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-md">{scene.description?.[language] || scene.description?.en || ''}</p>
              </div>
            </div>

            {/* Extra details right */}
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end text-xs shrink-0">
              {/* Cast IDs circles */}
              {castIds.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CAST:</span>
                  <div className="flex flex-wrap gap-1">
                    {castIds.map(id => (
                      <span key={id} className="w-5.5 h-5.5 rounded-full bg-slate-900/10 dark:bg-slate-100/10 text-slate-700 dark:text-slate-300 border border-slate-200/20 flex items-center justify-center font-mono text-[9px] font-extrabold" title={`Cast ID ${id}`}>
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location pin */}
              {(scene.location?.[language] || scene.location?.en) && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                  <MapPin size={12} className="text-gold-500/80" />
                  <span className="truncate max-w-[120px]">{scene.location?.[language] || scene.location?.en}</span>
                </div>
              )}

              {/* Pages */}
              <div className="font-mono font-black text-gold-500 bg-gold-500/5 px-2 py-0.5 rounded border border-gold-500/10">
                {scene.pages || '1/8'} pgs
              </div>

              {/* Quick Actions */}
              {hasWriteAccess() && (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200/20 dark:border-obsidian-800 no-print">
                  <button 
                    onClick={() => addDayBreak(index)} 
                    className="text-[9px] bg-slate-900 hover:bg-slate-800 text-gold-500 px-2 py-1 rounded-lg font-bold border border-slate-800 transition-all hover:scale-105"
                    title={language === 'th' ? 'แทรกวันหยุดคิวถ่ายทำ' : 'Insert Day Break'}
                  >
                    + {language === 'th' ? 'วันถ่ายทำ' : 'Day Break'}
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
      } else if (item.type === 'day_break') {
        pushDayBreak(index, item.id);
      }
    });

    // Handle trailing scenes page total
    if (dayPagesSum > 0) {
      // Calculate shoot day date
      const projectStart = project?.start_date ? new Date(project.start_date) : new Date();
      const dayDate = new Date(projectStart.getTime() + (dayIndex - 1) * 24 * 60 * 60 * 1000);
      const dateStr = dayDate.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      list.push(
        <div key="db-end" className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-slate-350 px-6 py-3 flex justify-between items-center text-xs font-bold my-4 rounded-lg shadow-sm animate-fadeIn">
          <span className="flex items-center gap-2 text-gold-500 uppercase tracking-widest font-black text-[11px]">
            <Clock size={14} className="animate-pulse" />
            {language === 'th' ? `วันสุดท้ายที่ถ่ายทำ (สิ้นสุดวันคิวที่ ${dayIndex})` : `Final Shoot Day (End of Day ${dayIndex})`}
          </span>
          <span className="font-mono text-slate-350 text-[11px] flex items-center gap-4">
            <span>{language === 'th' ? 'หน้ากระดาษรวม:' : 'Total Pages:'} <strong className="text-white font-extrabold">{formatEighths(dayPagesSum)}</strong></span>
            <span className="opacity-40">•</span>
            <span className="text-gold-400">{dateStr}</span>
          </span>
        </div>
      );
    }

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
      <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-obsidian-850 pb-px no-print">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('board')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'board'
                ? 'border-gold-500 text-gold-500 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>{language === 'th' ? 'บอร์ดวางแผนคิว (Stripboard)' : 'Production Board'}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              activeTab === 'board' ? 'bg-gold-500/10 text-gold-500' : 'bg-slate-500/10 text-slate-400'
            }`}>
              {boardItems.filter(i => i.type === 'scene').length} {language === 'th' ? 'ฉาก' : 'scenes'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('boneyard')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'boneyard'
                ? 'border-gold-500 text-gold-500 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-350'
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

    </div>
  );
}
