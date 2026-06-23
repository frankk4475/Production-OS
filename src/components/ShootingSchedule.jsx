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
    let tempDayStrips = [];

    // Helper to push a day break banner
    const pushDayBreak = (dbIndex, key, prevSceneId) => {
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
          className="my-3 overflow-hidden rounded-lg shadow-sm"
        >
          <div className="bg-slate-900 border-y border-slate-800 text-slate-300 px-6 py-2.5 flex justify-between items-center text-xs font-bold no-print">
            <span className="flex items-center gap-1.5 text-gold-500 uppercase tracking-widest font-black">
              <Calendar size={13} />
              {language === 'th' ? `สิ้นสุดวันถ่ายทำที่ ${dayIndex}` : `End of Day ${dayIndex}`}
            </span>
            <span className="font-mono text-slate-400">
              Total Pages: <strong className="text-white">{formattedTotal}</strong> • {dateStr}
            </span>
            {hasWriteAccess() && (
              <button 
                onClick={() => removeDayBreak(savedIndex)} 
                className="text-red-400 hover:text-red-300 text-[10px] uppercase font-black pl-4"
              >
                Remove Break
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

        // Color coding scene strips
        let stripColor = 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200';
        if (theme === 'dark') {
          stripColor = 'bg-obsidian-900 border-obsidian-850 text-slate-100 hover:bg-obsidian-800';
        }

        if (scene.day_night === 'DAY') {
          stripColor = scene.int_ext === 'INT'
            ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/15'
            : 'bg-yellow-500/5 text-yellow-805 dark:text-yellow-250 border-yellow-500/10 hover:bg-yellow-500/10';
        } else if (scene.day_night === 'NIGHT') {
          stripColor = 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-350 border-indigo-500/20 hover:bg-indigo-500/15';
        } else if (scene.day_night === 'DUSK' || scene.day_night === 'DAWN') {
          stripColor = 'bg-rose-500/10 text-rose-800 dark:text-rose-355 border-rose-500/20 hover:bg-rose-500/15';
        }

        const castIds = getSceneCastIds(scene);

        list.push(
          <div
            key={item.id}
            draggable={hasWriteAccess()}
            onDragStart={(e) => handleDragStart(index, e)}
            onDragOver={(e) => handleDragOver(index, e)}
            onDrop={(e) => handleDrop(index, e)}
            className={`border rounded-lg p-3 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-grab active:cursor-grabbing ${stripColor} ${
              draggedIndex === index ? 'opacity-30 border-dashed border-gold-500' : ''
            }`}
          >
            <div className="flex items-center gap-3 w-full md:w-auto">
              {hasWriteAccess() && <GripVertical className="text-slate-500 shrink-0 no-print" size={15} />}
              
              {/* Scene heading metadata */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-gold-500">SCENE {scene.scene_number}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900/10 dark:bg-slate-100/10">{scene.int_ext}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900/10 dark:bg-slate-100/10">{scene.day_night}</span>
                </div>
                <h4 className="text-sm font-extrabold tracking-tight mt-1 truncate max-w-sm">{scene.setting}</h4>
                <p className="text-[10px] text-slate-450 truncate max-w-xs">{scene.description?.[language] || scene.description?.en || ''}</p>
              </div>
            </div>

            {/* Extra details right */}
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end text-xs shrink-0">
              {/* Cast IDs circles */}
              {castIds.length > 0 && (
                <div className="flex gap-1.5 items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CAST:</span>
                  <div className="flex flex-wrap gap-1">
                    {castIds.map(id => (
                      <span key={id} className="w-5 h-5 rounded-full bg-slate-900/20 dark:bg-slate-100/20 flex items-center justify-center font-mono text-[10px] font-bold" title={`Cast ID ${id}`}>
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Location pin */}
              {scene.location?.[language] && (
                <div className="flex items-center gap-1 text-slate-400">
                  <MapPin size={12} />
                  <span className="truncate max-w-[120px]">{scene.location?.[language] || scene.location?.en}</span>
                </div>
              )}

              {/* Pages */}
              <div className="font-mono font-black text-gold-500">
                {scene.pages || '1/8'} pgs
              </div>

              {/* Quick Actions */}
              {hasWriteAccess() && (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200/20 no-print">
                  <button 
                    onClick={() => addDayBreak(index)} 
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-gold-500 px-2 py-1 rounded font-bold"
                    title="Insert Day Break"
                  >
                    + Day Break
                  </button>
                  <button 
                    onClick={() => moveToBoneyard(scene.id)} 
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-1"
                    title="Send to Boneyard"
                  >
                    Omit
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
        <div key="db-end" className="bg-slate-900 border-y border-slate-800 text-slate-350 px-6 py-2.5 flex justify-between items-center text-xs font-bold my-3 rounded-lg shadow-sm">
          <span className="flex items-center gap-1.5 text-gold-500 uppercase tracking-widest font-black">
            <Clock size={13} />
            {language === 'th' ? `วันสุดท้ายที่ถ่ายทำ (สิ้นสุดวันคิวที่ ${dayIndex})` : `Final Shoot Day (End of Day ${dayIndex})`}
          </span>
          <span className="font-mono text-slate-400">
            Total Pages: <strong className="text-white">{formatEighths(dayPagesSum)}</strong> • {dateStr}
          </span>
        </div>
      );
    }

    return list;
  };

  if (!project) {
    return (
      <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-xl mx-auto border border-dashed border-slate-350 dark:border-obsidian-800 animate-fadeIn">
        <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
          <Film size={32} />
        </div>
        <h3 className="text-lg font-bold font-serif">{language === 'th' ? 'กรุณาเลือกหรือสร้างโครงการเพื่อจัดทำตารางถ่ายทำ' : 'No Project Selected'}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-obsidian-850 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Film className="text-gold-500 animate-pulse" />
            <span>{language === 'th' ? 'ตารางวางแผนถ่ายทำ (Stripboard Schedule)' : 'Shooting Schedule Stripboard'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Drag strips to order scenes, insert day breaks, and auto-calculate pages per shoot day.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {hasWriteAccess() && (
            <>
              <button
                onClick={handleAutoSchedule}
                className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                  theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 hover:bg-obsidian-800 text-slate-350' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-650'
                }`}
              >
                Auto Day Breaks
              </button>

              <button
                onClick={handleSaveSchedule}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 active:scale-98"
              >
                {isSaved ? <Check size={14} /> : <Save size={14} />}
                <span>{isSaved ? 'Schedule Saved!' : 'Save Schedule'}</span>
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
                : 'border-transparent text-slate-400 hover:text-slate-350'
            }`}
          >
            <span>{language === 'th' ? 'บอร์ดวางแผนคิว (Stripboard)' : 'Production Board'}</span>
            <span className="px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-500 text-[10px]">
              {boardItems.filter(i => i.type === 'scene').length} scenes
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
            <span>{language === 'th' ? 'ฉากรอคิว (Boneyard / Omitted)' : 'Omitted / Boneyard'}</span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px]">
              {boneyardScenes.length} scenes
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
        <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-md mx-auto border border-dashed border-slate-350 dark:border-obsidian-800">
          <Film className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-extrabold">{language === 'th' ? 'ไม่พบฉากที่พร้อมถ่ายทำ' : 'No scenes scheduled'}</h3>
          <p className="text-xs text-slate-450 leading-relaxed">
            Create scenes in Script Breakdown or import a script to start planning your shooting schedule.
          </p>
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
                className={`p-4 rounded-xl border border-slate-200/50 dark:border-obsidian-850 flex flex-col justify-between gap-3 text-left ${
                  theme === 'dark' ? 'bg-obsidian-950/40' : 'bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center text-[10px]">
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
                      className="px-2.5 py-1 rounded bg-gold-600 hover:bg-gold-500 text-white font-black text-[9px] transition-all uppercase"
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
