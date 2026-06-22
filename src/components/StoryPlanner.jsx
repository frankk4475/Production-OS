import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  BookOpen, 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Compass, 
  Users, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  RefreshCw,
  Workflow,
  GitCommit
} from 'lucide-react';

export default function StoryPlanner() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();
  
  const {
    currentProject: project,
    storyOutline,
    saveStoryOutline,
    isLoading
  } = useProject();

  const [activeTab, setActiveTab] = useState('beats'); // beats, plotlines, characters, outlineText
  const [localOutline, setLocalOutline] = useState({ plotlines: [], characters: [], beats: [] });
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to read localized values safely (supporting string fallbacks for legacy/flat data)
  const getString = (val) => {
    if (!val) return '';
    if (typeof val === 'object') {
      return val[language] || val['th'] || val['en'] || '';
    }
    return val;
  };

  // Modals visibility states
  const [isAddBeatOpen, setIsAddBeatOpen] = useState(false);
  const [isEditBeatOpen, setIsEditBeatOpen] = useState(false);
  const [isAddPlotlineOpen, setIsAddPlotlineOpen] = useState(false);
  const [isEditPlotlineOpen, setIsEditPlotlineOpen] = useState(false);
  const [isAddCharOpen, setIsAddCharOpen] = useState(false);
  const [isEditCharOpen, setIsEditCharOpen] = useState(false);

  // --- ADD FORM STATES ---
  const [newBeat, setNewBeat] = useState({ 
    titleTh: '', titleEn: '', act: 'Act I', plotlineId: '', 
    descriptionTh: '', descriptionEn: '', sceneTarget: '' 
  });
  
  const [newPlotline, setNewPlotline] = useState({ 
    nameTh: '', nameEn: '', color: '#ef4444', 
    descriptionTh: '', descriptionEn: '' 
  });
  
  const [newChar, setNewChar] = useState({ 
    nameTh: '', nameEn: '', roleTh: '', roleEn: '', 
    goalTh: '', goalEn: '', arcTh: '', arcEn: '', 
    conflictTh: '', conflictEn: '' 
  });

  // --- EDIT FORM STATES ---
  const [editBeatId, setEditBeatId] = useState('');
  const [editBeatTitleTh, setEditBeatTitleTh] = useState('');
  const [editBeatTitleEn, setEditBeatTitleEn] = useState('');
  const [editBeatAct, setEditBeatAct] = useState('Act I');
  const [editBeatPlotlineId, setEditBeatPlotlineId] = useState('');
  const [editBeatDescriptionTh, setEditBeatDescriptionTh] = useState('');
  const [editBeatDescriptionEn, setEditBeatDescriptionEn] = useState('');
  const [editBeatSceneTarget, setEditBeatSceneTarget] = useState('');

  const [editPlotlineId, setEditPlotlineId] = useState('');
  const [editPlotlineNameTh, setEditPlotlineNameTh] = useState('');
  const [editPlotlineNameEn, setEditPlotlineNameEn] = useState('');
  const [editPlotlineColor, setEditPlotlineColor] = useState('#ef4444');
  const [editPlotlineDescriptionTh, setEditPlotlineDescriptionTh] = useState('');
  const [editPlotlineDescriptionEn, setEditPlotlineDescriptionEn] = useState('');

  const [editCharId, setEditCharId] = useState('');
  const [editCharNameTh, setEditCharNameTh] = useState('');
  const [editCharNameEn, setEditCharNameEn] = useState('');
  const [editCharRoleTh, setEditCharRoleTh] = useState('');
  const [editCharRoleEn, setEditCharRoleEn] = useState('');
  const [editCharGoalTh, setEditCharGoalTh] = useState('');
  const [editCharGoalEn, setEditCharGoalEn] = useState('');
  const [editCharArcTh, setEditCharArcTh] = useState('');
  const [editCharArcEn, setEditCharArcEn] = useState('');
  const [editCharConflictTh, setEditCharConflictTh] = useState('');
  const [editCharConflictEn, setEditCharConflictEn] = useState('');

  useEffect(() => {
    if (storyOutline) {
      setLocalOutline(storyOutline);
    }
  }, [storyOutline]);

  // Color options for plotlines
  const colorOptions = [
    { value: '#ef4444', label: language === 'th' ? 'แดง (เส้นเรื่องหลัก)' : 'Red (Main Plot)' },
    { value: '#3b82f6', label: language === 'th' ? 'น้ำเงิน (เส้นเรื่องย่อย A)' : 'Blue (Subplot A)' },
    { value: '#10b981', label: language === 'th' ? 'เขียว (เส้นเรื่องย่อย B)' : 'Green (Subplot B)' },
    { value: '#f59e0b', label: language === 'th' ? 'ส้ม (เส้นเรื่องย่อย C)' : 'Orange (Subplot C)' },
    { value: '#8b5cf6', label: language === 'th' ? 'ม่วง (แก่นเรื่อง)' : 'Purple (Theme)' },
    { value: '#ec4899', label: language === 'th' ? 'ชมพู (เส้นรัก/ความสัมพันธ์)' : 'Pink (Romance)' }
  ];

  if (!project) {
    return (
      <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-xl mx-auto border border-dashed border-slate-350 dark:border-obsidian-800 animate-fadeIn">
        <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
          <BookOpen size={32} />
        </div>
        <h3 className="text-lg font-bold font-serif">
          {language === 'th' ? 'กรุณาเลือกหรือสร้างโครงการก่อนเพื่อวางแผนโครงเรื่อง' : 'No Project Selected'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          {language === 'th' 
            ? 'การทำเส้นเรื่องและโครงขยายจำเป็นต้องอิงเข้ากับข้อมูลการผลิตในแต่ละโครงการหลัก' 
            : 'Please select an existing project or create a new one to access the story & outline planner.'}
        </p>
      </div>
    );
  }

  const handleSave = async (updatedOutline = localOutline) => {
    try {
      setIsSaving(true);
      await saveStoryOutline(updatedOutline);
      setIsSavedSuccessfully(true);
      setTimeout(() => {
        setIsSavedSuccessfully(false);
      }, 3000);
    } catch (err) {
      alert(language === 'th' ? "ล้มเหลวในการบันทึกโครงเรื่อง: " + err.message : "Failed to save outline: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- PLOTLINE CRUD ---
  const handleAddPlotline = (e) => {
    e.preventDefault();
    if (!newPlotline.nameTh.trim() && !newPlotline.nameEn.trim()) return;

    const plotlineEntry = {
      id: `p-${Date.now()}`,
      name: { 
        th: newPlotline.nameTh || newPlotline.nameEn, 
        en: newPlotline.nameEn || newPlotline.nameTh 
      },
      color: newPlotline.color,
      description: { 
        th: newPlotline.descriptionTh, 
        en: newPlotline.descriptionEn 
      }
    };

    const updated = {
      ...localOutline,
      plotlines: [...(localOutline.plotlines || []), plotlineEntry]
    };
    
    setLocalOutline(updated);
    setNewPlotline({ nameTh: '', nameEn: '', color: '#ef4444', descriptionTh: '', descriptionEn: '' });
    setIsAddPlotlineOpen(false);
    handleSave(updated);
  };

  const openEditPlotline = (plot) => {
    setEditPlotlineId(plot.id);
    setEditPlotlineColor(plot.color);
    setEditPlotlineNameTh(plot.name?.th || (typeof plot.name === 'string' ? plot.name : ''));
    setEditPlotlineNameEn(plot.name?.en || (typeof plot.name === 'string' ? plot.name : ''));
    setEditPlotlineDescriptionTh(plot.description?.th || (typeof plot.description === 'string' ? plot.description : ''));
    setEditPlotlineDescriptionEn(plot.description?.en || (typeof plot.description === 'string' ? plot.description : ''));
    setIsEditPlotlineOpen(true);
  };

  const handleUpdatePlotlineSubmit = (e) => {
    e.preventDefault();
    const updatedPlotlines = localOutline.plotlines.map(p => {
      if (p.id === editPlotlineId) {
        return {
          ...p,
          name: { th: editPlotlineNameTh, en: editPlotlineNameEn },
          color: editPlotlineColor,
          description: { th: editPlotlineDescriptionTh, en: editPlotlineDescriptionEn }
        };
      }
      return p;
    });

    const updated = { ...localOutline, plotlines: updatedPlotlines };
    setLocalOutline(updated);
    setIsEditPlotlineOpen(false);
    handleSave(updated);
  };

  const handleDeletePlotline = (id) => {
    const confirmMsg = language === 'th' 
      ? 'คุณต้องการลบเส้นเรื่องนี้ใช่หรือไม่? การ์ดโครงเรื่องที่เชื่อมโยงจะถูกยกเลิกการเชื่อมโยงการแสดงผลพล็อตย่อย' 
      : 'Are you sure you want to delete this plotline? Connected beat cards will be unlinked.';
    
    if (window.confirm(confirmMsg)) {
      const updatedPlotlines = localOutline.plotlines.filter(p => p.id !== id);
      const updatedBeats = localOutline.beats.map(b => b.plotlineId === id ? { ...b, plotlineId: '' } : b);
      const updated = { ...localOutline, plotlines: updatedPlotlines, beats: updatedBeats };
      setLocalOutline(updated);
      handleSave(updated);
    }
  };

  // --- CHARACTER CRUD ---
  const handleAddCharacter = (e) => {
    e.preventDefault();
    if (!newChar.nameTh.trim() && !newChar.nameEn.trim()) return;

    const charEntry = {
      id: `c-${Date.now()}`,
      name: { th: newChar.nameTh || newChar.nameEn, en: newChar.nameEn || newChar.nameTh },
      role: { th: newChar.roleTh, en: newChar.roleEn },
      goal: { th: newChar.goalTh, en: newChar.goalEn },
      conflict: { th: newChar.conflictTh, en: newChar.conflictEn },
      arc: { th: newChar.arcTh, en: newChar.arcEn }
    };

    const updated = {
      ...localOutline,
      characters: [...(localOutline.characters || []), charEntry]
    };

    setLocalOutline(updated);
    setNewChar({ nameTh: '', nameEn: '', roleTh: '', roleEn: '', goalTh: '', goalEn: '', arcTh: '', arcEn: '', conflictTh: '', conflictEn: '' });
    setIsAddCharOpen(false);
    handleSave(updated);
  };

  const openEditCharacter = (char) => {
    setEditCharId(char.id);
    setEditCharNameTh(char.name?.th || (typeof char.name === 'string' ? char.name : ''));
    setEditCharNameEn(char.name?.en || (typeof char.name === 'string' ? char.name : ''));
    setEditCharRoleTh(char.role?.th || (typeof char.role === 'string' ? char.role : ''));
    setEditCharRoleEn(char.role?.en || (typeof char.role === 'string' ? char.role : ''));
    setEditCharGoalTh(char.goal?.th || (typeof char.goal === 'string' ? char.goal : ''));
    setEditCharGoalEn(char.goal?.en || (typeof char.goal === 'string' ? char.goal : ''));
    setEditCharArcTh(char.arc?.th || (typeof char.arc === 'string' ? char.arc : ''));
    setEditCharArcEn(char.arc?.en || (typeof char.arc === 'string' ? char.arc : ''));
    setEditCharConflictTh(char.conflict?.th || (typeof char.conflict === 'string' ? char.conflict : ''));
    setEditCharConflictEn(char.conflict?.en || (typeof char.conflict === 'string' ? char.conflict : ''));
    setIsEditCharOpen(true);
  };

  const handleUpdateCharacterSubmit = (e) => {
    e.preventDefault();
    const updatedCharacters = localOutline.characters.map(c => {
      if (c.id === editCharId) {
        return {
          ...c,
          name: { th: editCharNameTh, en: editCharNameEn },
          role: { th: editCharRoleTh, en: editCharRoleEn },
          goal: { th: editCharGoalTh, en: editCharGoalEn },
          conflict: { th: editCharConflictTh, en: editCharConflictEn },
          arc: { th: editCharArcTh, en: editCharArcEn }
        };
      }
      return c;
    });

    const updated = { ...localOutline, characters: updatedCharacters };
    setLocalOutline(updated);
    setIsEditCharOpen(false);
    handleSave(updated);
  };

  const handleDeleteCharacter = (id) => {
    const confirmMsg = language === 'th' 
      ? 'คุณต้องการลบตัวละครนี้ออกจากบอร์ดวางแผนใช่หรือไม่?' 
      : 'Are you sure you want to delete this character?';
      
    if (window.confirm(confirmMsg)) {
      const updatedCharacters = localOutline.characters.filter(c => c.id !== id);
      const updated = { ...localOutline, characters: updatedCharacters };
      setLocalOutline(updated);
      handleSave(updated);
    }
  };

  // --- BEAT CARD CRUD ---
  const handleAddBeat = (e) => {
    e.preventDefault();
    if (!newBeat.titleTh.trim() && !newBeat.titleEn.trim()) return;

    const beatEntry = {
      id: `b-${Date.now()}`,
      title: { th: newBeat.titleTh || newBeat.titleEn, en: newBeat.titleEn || newBeat.titleTh },
      act: newBeat.act,
      plotlineId: newBeat.plotlineId || (localOutline.plotlines?.[0]?.id || ''),
      description: { th: newBeat.descriptionTh, en: newBeat.descriptionEn },
      sceneTarget: newBeat.sceneTarget
    };

    const updated = {
      ...localOutline,
      beats: [...(localOutline.beats || []), beatEntry]
    };

    setLocalOutline(updated);
    setNewBeat({ titleTh: '', titleEn: '', act: 'Act I', plotlineId: '', descriptionTh: '', descriptionEn: '', sceneTarget: '' });
    setIsAddBeatOpen(false);
    handleSave(updated);
  };

  const openEditBeat = (beat) => {
    setEditBeatId(beat.id);
    setEditBeatTitleTh(beat.title?.th || (typeof beat.title === 'string' ? beat.title : ''));
    setEditBeatTitleEn(beat.title?.en || (typeof beat.title === 'string' ? beat.title : ''));
    setEditBeatAct(beat.act);
    setEditBeatPlotlineId(beat.plotlineId);
    setEditBeatDescriptionTh(beat.description?.th || (typeof beat.description === 'string' ? beat.description : ''));
    setEditBeatDescriptionEn(beat.description?.en || (typeof beat.description === 'string' ? beat.description : ''));
    setEditBeatSceneTarget(beat.sceneTarget || '');
    setIsEditBeatOpen(true);
  };

  const handleUpdateBeatSubmit = (e) => {
    e.preventDefault();
    const updatedBeats = localOutline.beats.map(b => {
      if (b.id === editBeatId) {
        return {
          ...b,
          title: { th: editBeatTitleTh, en: editBeatTitleEn },
          act: editBeatAct,
          plotlineId: editBeatPlotlineId,
          description: { th: editBeatDescriptionTh, en: editBeatDescriptionEn },
          sceneTarget: editBeatSceneTarget
        };
      }
      return b;
    });

    const updated = { ...localOutline, beats: updatedBeats };
    setLocalOutline(updated);
    setIsEditBeatOpen(false);
    handleSave(updated);
  };

  const handleDeleteBeat = (id) => {
    const confirmMsg = language === 'th' ? 'คุณต้องการลบการ์ดโครงเรื่องนี้ใช่หรือไม่?' : 'Are you sure you want to delete this beat card?';
    if (window.confirm(confirmMsg)) {
      const updatedBeats = localOutline.beats.filter(b => b.id !== id);
      const updated = { ...localOutline, beats: updatedBeats };
      setLocalOutline(updated);
      handleSave(updated);
    }
  };

  const moveBeatOrder = (index, direction) => {
    const actBeats = localOutline.beats || [];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === actBeats.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newBeats = [...actBeats];
    const temp = newBeats[index];
    newBeats[index] = newBeats[targetIndex];
    newBeats[targetIndex] = temp;

    const updated = { ...localOutline, beats: newBeats };
    setLocalOutline(updated);
    handleSave(updated);
  };

  // Helper to get plotline details
  const getPlotline = (id) => {
    return localOutline.plotlines?.find(p => p.id === id) || { 
      name: { th: 'ไม่มีเส้นเรื่อง', en: 'No Plotline' }, 
      color: '#94a3b8' 
    };
  };

  // Filter beats by Act
  const getBeatsByAct = (actName) => {
    return (localOutline.beats || []).filter(b => b.act === actName);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-obsidian-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Compass className="text-gold-500 animate-spin-slow" size={26} />
            <span>{language === 'th' ? 'โครงเรื่องและเส้นเรื่อง' : 'Story Outline & Plots'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'th' 
              ? 'วางโครงสร้าง พัฒนาเส้นเรื่องย่อย และกำหนดเป้าหมายตัวละคร ก่อนการเขียนบทภาพยนตร์'
              : 'Structure narrative beats, map subplots, and define character arcs pre-screenplay.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {hasWriteAccess() && (
            <button
              onClick={() => handleSave()}
              disabled={isSaving || isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white shadow-sm hover:shadow-md transition-all shrink-0 active:scale-[0.98]"
            >
              {isSavedSuccessfully ? (
                <>
                  <Check size={14} />
                  <span>{language === 'th' ? 'บันทึกสำเร็จ!' : 'Saved Successfully!'}</span>
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{language === 'th' ? 'บันทึกโครงเรื่อง' : 'Save Storyboard'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Visual Plotline Rhythm Timeline (Visualizer) */}
      <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Workflow size={14} className="text-gold-500" />
          <span>{language === 'th' ? 'จังหวะความเคลื่อนไหวของเส้นเรื่อง' : 'Narrative Arc Visualizer'}</span>
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin">
          {(localOutline.beats || []).map((beat, idx) => {
            const plot = getPlotline(beat.plotlineId);
            return (
              <div key={beat.id} className="flex items-center shrink-0">
                <div 
                  className="group relative px-3 py-2 rounded-lg border border-slate-700/30 flex flex-col items-center gap-1 cursor-default transition-all hover:scale-105"
                  style={{ borderLeftColor: plot.color, borderLeftWidth: '4px' }}
                >
                  <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                  <span className="text-[11px] font-bold max-w-[80px] truncate">{getString(beat.title)}</span>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plot.color }} title={getString(plot.name)} />
                  
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 border border-slate-800 rounded-lg p-2.5 shadow-xl w-48 z-40 text-left">
                    <p className="text-[10px] font-bold text-gold-500 font-mono">
                      {getString(beat.act === 'Act I' ? (language === 'th' ? 'องก์ I' : 'Act I') : beat.act === 'Act II' ? (language === 'th' ? 'องก์ II' : 'Act II') : (language === 'th' ? 'องก์ III' : 'Act III'))} • {language === 'th' ? 'ฉาก' : 'Scenes'} {beat.sceneTarget || '?'}
                    </p>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{getString(beat.title)}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-3 mt-1 leading-normal">{getString(beat.description)}</p>
                    <span className="inline-block text-[9px] font-semibold mt-1.5 px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: plot.color }}>{getString(plot.name)}</span>
                  </div>
                </div>
                {idx < localOutline.beats.length - 1 && (
                  <span className="text-slate-600 font-bold mx-1">→</span>
                )}
              </div>
            );
          })}
          {(!localOutline.beats || localOutline.beats.length === 0) && (
            <p className="text-xs text-slate-500 italic py-2">
              {language === 'th' ? 'ยังไม่มีการ์ดโครงเรื่อง กรุณาเพิ่มการ์ดโครงเรื่องด้านล่าง' : 'No beat cards added yet. Create beats below to visualize the narrative flow.'}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-obsidian-800 gap-1 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('beats')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'beats'
              ? 'border-gold-500 text-gold-500 bg-gold-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={16} />
          <span>{language === 'th' ? 'บอร์ดวางโครงเรื่องย่อย' : 'Beat Board'}</span>
        </button>
        <button
          onClick={() => setActiveTab('plotlines')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'plotlines'
              ? 'border-gold-500 text-gold-500 bg-gold-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCommit size={16} />
          <span>{language === 'th' ? 'เส้นเรื่องและพล็อตย่อย' : 'Plotlines & Story Arcs'}</span>
        </button>
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'characters'
              ? 'border-gold-500 text-gold-500 bg-gold-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={16} />
          <span>{language === 'th' ? 'พัฒนาการและปมตัวละคร' : 'Character Arcs'}</span>
        </button>
        <button
          onClick={() => setActiveTab('outlineText')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'outlineText'
              ? 'border-gold-500 text-gold-500 bg-gold-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen size={16} />
          <span>{language === 'th' ? 'โครงขยายบทละครแบบข้อความ' : 'Outline & Treatment Text'}</span>
        </button>
      </div>

      {/* --- TAB CONTENT: BEATS BOARD --- */}
      {activeTab === 'beats' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {language === 'th' ? 'การขยายความโครงเรื่องแต่ละองก์' : 'Outlining Chapters / Acts'}
            </h2>
            {hasWriteAccess() && (
              <button
                onClick={() => setIsAddBeatOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold-600/20 text-gold-400 border border-gold-600/30 hover:bg-gold-600/30 transition-all"
              >
                <Plus size={14} />
                <span>{language === 'th' ? 'เพิ่มบีต/โครงเรื่องย่อย' : 'Add Beat Card'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Acts */}
            {['Act I', 'Act II', 'Act III'].map((actName) => {
              const actBeats = getBeatsByAct(actName);
              const displayActName = actName === 'Act I' 
                ? (language === 'th' ? 'องก์ I (ปูเรื่อง / Setup)' : 'Act I (Setup)')
                : actName === 'Act II'
                ? (language === 'th' ? 'องก์ II (เผชิญหน้า / Confrontation)' : 'Act II (Confrontation)')
                : (language === 'th' ? 'องก์ III (คลี่คลาย / Resolution)' : 'Act III (Resolution)');

              return (
                <div key={actName} className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-obsidian-850 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-obsidian-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gold-500">{displayActName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                      {actBeats.length} {language === 'th' ? 'เหตุการณ์' : 'beats'}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {actBeats.map((beat, index) => {
                      const plot = getPlotline(beat.plotlineId);
                      const absoluteIndex = localOutline.beats.findIndex(b => b.id === beat.id);
                      return (
                        <div 
                          key={beat.id} 
                          className="p-3.5 rounded-lg bg-slate-900/60 dark:bg-obsidian-900 border border-slate-700/20 hover:border-gold-500/20 transition-all space-y-2 relative group/card shadow-sm"
                          style={{ borderLeftColor: plot.color, borderLeftWidth: '3.5px' }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <span className="text-[9px] font-mono text-slate-500 block">
                                {language === 'th' ? 'กลุ่มฉากเป้าหมาย:' : 'SCENE TARGET:'} {beat.sceneTarget || '-'}
                              </span>
                              <h4 className="text-xs font-bold text-slate-200 leading-tight mt-0.5">
                                {getString(beat.title)}
                              </h4>
                            </div>
                            
                            <span 
                              className="text-[9px] font-semibold px-2 py-0.5 rounded text-white shrink-0"
                              style={{ backgroundColor: plot.color }}
                            >
                              {getString(plot.name)}
                            </span>
                          </div>

                          <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans whitespace-pre-line line-clamp-4">
                            {getString(beat.description)}
                          </p>

                          {/* Controls (Up / Down / Edit / Delete) */}
                          {hasWriteAccess() && (
                            <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-800/40 opacity-0 group-hover/card:opacity-100 transition-opacity no-print">
                              <button
                                onClick={() => moveBeatOrder(absoluteIndex, 'up')}
                                disabled={absoluteIndex === 0}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                onClick={() => moveBeatOrder(absoluteIndex, 'down')}
                                disabled={absoluteIndex === localOutline.beats.length - 1}
                                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              >
                                <ArrowDown size={11} />
                              </button>
                              <button
                                onClick={() => openEditBeat(beat)}
                                className="p-1 rounded hover:bg-slate-850 text-slate-400 hover:text-white"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteBeat(beat.id)}
                                className="p-1 rounded hover:bg-red-950/20 text-slate-400 hover:text-red-400"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {actBeats.length === 0 && (
                      <div className="py-8 text-center border border-dashed border-slate-800/40 rounded-lg text-[10px] text-slate-500 italic">
                        {language === 'th' ? 'ไม่มีบีตเรื่องย่อยในองก์นี้' : 'No beats in this act.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PLOTLINES --- */}
      {activeTab === 'plotlines' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {language === 'th' ? 'การจัดการเส้นเรื่องและโครงขยาย (Story Lines)' : 'Managing Plotlines & Story Arcs'}
            </h2>
            {hasWriteAccess() && (
              <button
                onClick={() => setIsAddPlotlineOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold-600/20 text-gold-400 border border-gold-600/30 hover:bg-gold-600/30 transition-all"
              >
                <Plus size={14} />
                <span>{language === 'th' ? 'เพิ่มเส้นเรื่องใหม่' : 'Add Plotline'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(localOutline.plotlines || []).map((plot) => (
              <div 
                key={plot.id} 
                className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-obsidian-850/80 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: plot.color }} />
                      <h3 className="text-sm font-bold font-serif">{getString(plot.name)}</h3>
                    </div>
                    {hasWriteAccess() && (
                      <div className="flex items-center gap-1.5 no-print">
                        <button
                          onClick={() => openEditPlotline(plot)}
                          className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeletePlotline(plot.id)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed whitespace-pre-line">
                    {getString(plot.description) || (language === 'th' ? 'ไม่มีรายละเอียดเพิ่มเติม' : 'No description provided.')}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800/40 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>ID: {plot.id}</span>
                  <span 
                    className="px-2 py-0.5 rounded text-white font-sans text-[9px] font-bold" 
                    style={{ backgroundColor: plot.color + '20', color: plot.color }}
                  >
                    {language === 'th' ? 'สีแท็กเส้นเรื่อง' : 'Color Tag'}
                  </span>
                </div>
              </div>
            ))}

            {(localOutline.plotlines || []).length === 0 && (
              <div className="col-span-2 text-center py-12 border border-dashed border-slate-800/40 rounded-xl">
                <p className="text-xs text-slate-400 italic">
                  {language === 'th' ? 'ไม่มีเส้นเรื่องในโครงการ กรุณากดเพิ่มด้านบน' : 'No story lines created yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: CHARACTERS --- */}
      {activeTab === 'characters' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              {language === 'th' ? 'โครงขยายตัวละครหลักและการเติบโต (Character Profile & Arc)' : 'Character Arc & Profile Mapping'}
            </h2>
            {hasWriteAccess() && (
              <button
                onClick={() => setIsAddCharOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gold-600/20 text-gold-400 border border-gold-600/30 hover:bg-gold-600/30 transition-all"
              >
                <Plus size={14} />
                <span>{language === 'th' ? 'เพิ่มข้อมูลตัวละคร' : 'Add Character'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(localOutline.characters || []).map((char) => (
              <div 
                key={char.id} 
                className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-obsidian-850/80 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded bg-amber-500/10 text-amber-500 font-bold text-sm">
                      👤
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{getString(char.name)}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{getString(char.role) || (language === 'th' ? 'ไม่ระบุบทบาท' : 'Unspecified Role')}</span>
                    </div>
                  </div>

                  {hasWriteAccess() && (
                    <div className="flex items-center gap-1.5 no-print">
                      <button
                        onClick={() => openEditCharacter(char)}
                        className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(char.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3.5 text-xs">
                  <div>
                    <span className="font-bold text-amber-500 block mb-0.5">🎯 {language === 'th' ? 'เป้าหมายหลัก / ความต้องการ (Goal / Motivation)' : 'Goal / Need'}</span>
                    <p className="text-slate-300 leading-relaxed font-sans">{getString(char.goal) || '-'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-red-500 block mb-0.5">⚠️ {language === 'th' ? 'อุปสรรค / ปมความขัดแย้ง (Conflict / Obstacle)' : 'Conflict / Obstacle'}</span>
                    <p className="text-slate-300 leading-relaxed font-sans">{getString(char.conflict) || '-'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-gold-500 block mb-0.5">📈 {language === 'th' ? 'วิวัฒนาการของตัวละคร (Character Arc / Growth)' : 'Growth Arc / Path'}</span>
                    <p className="text-slate-300 leading-relaxed font-sans">{getString(char.arc) || '-'}</p>
                  </div>
                </div>
              </div>
            ))}

            {(localOutline.characters || []).length === 0 && (
              <div className="col-span-2 text-center py-12 border border-dashed border-slate-800/40 rounded-xl">
                <p className="text-xs text-slate-400 italic">
                  {language === 'th' ? 'ไม่มีข้อมูลตัวละครในแผนงาน กรุณากดเพิ่มด้านบน' : 'No characters mapped yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: TEXT TREATMENT OUTLINE --- */}
      {activeTab === 'outlineText' && (
        <div className="glass-panel p-6 md:p-8 rounded-xl border border-slate-200 dark:border-obsidian-850 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-obsidian-800 pb-3 no-print">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                {language === 'th' ? 'เอกสารขยายบทละครย่อ (Outline Treatment Plan)' : 'Screenplay Outline & Treatment Summary'}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'th' 
                  ? 'เอกสารสรุปองก์เรื่อง พล็อตย่อย และเป้าหมายการดำเนินเรื่องของตัวละครที่ระบบสร้างขึ้นอัตโนมัติ' 
                  : 'Autogenerated formatted view of all Acts, story beats, and character goals.'}
              </p>
            </div>
          </div>

          <div className="space-y-8 font-sans max-w-3xl mx-auto text-slate-800 dark:text-slate-200">
            {/* Project Header */}
            <div className="text-center space-y-2 border-b border-slate-800/50 pb-6">
              <h1 className="text-xl md:text-2xl font-serif font-bold uppercase tracking-wider text-gold-500">
                {project?.title?.[language] || 'Untitled Treatment'}
              </h1>
              <p className="text-xs text-slate-400">
                {language === 'th' ? 'เอกสารโครงขยายและเส้นเรื่องสำหรับผลิต' : 'Creative Treatment Document'}
              </p>
              <div className="flex justify-center gap-6 text-[11px] text-slate-400 mt-2 font-mono">
                <span>{language === 'th' ? 'ผู้กำกับ' : 'Director'}: {project?.director?.[language] || '-'}</span>
                <span>{language === 'th' ? 'ผู้อำนวยการสร้าง' : 'Producer'}: {project?.producer?.[language] || '-'}</span>
              </div>
            </div>

            {/* Acts & Beats section */}
            {['Act I', 'Act II', 'Act III'].map((actName) => {
              const actBeats = getBeatsByAct(actName);
              const displayActName = actName === 'Act I' 
                ? (language === 'th' ? 'องก์ I' : 'Act I')
                : actName === 'Act II'
                ? (language === 'th' ? 'องก์ II' : 'Act II')
                : (language === 'th' ? 'องก์ III' : 'Act III');

              return (
                <div key={actName} className="space-y-4">
                  <h3 className="text-sm font-bold font-serif text-amber-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">
                    {displayActName}
                  </h3>

                  <div className="space-y-4 pl-3">
                    {actBeats.map((beat, idx) => {
                      const plot = getPlotline(beat.plotlineId);
                      return (
                        <div key={beat.id} className="space-y-1 bg-obsidian-950/20 p-3 rounded-lg border border-slate-800/30">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300">
                              {idx + 1}. {getString(beat.title)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({language === 'th' ? 'กลุ่มฉากเป้าหมาย' : 'Scenes'} {beat.sceneTarget || '?'})
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans whitespace-pre-line mt-1">
                            {getString(beat.description)}
                          </p>
                          <div className="flex items-center gap-1.5 pt-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: plot.color }} />
                            <span className="text-[9px] font-mono text-slate-500">{getString(plot.name)}</span>
                          </div>
                        </div>
                      );
                    })}
                    {actBeats.length === 0 && (
                      <p className="text-xs text-slate-500 italic pl-4">
                        {language === 'th' ? 'ไม่มีรายละเอียดโครงขยายในองก์นี้' : 'No beats mapped for this act.'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Character list section */}
            <div className="space-y-4 pt-4 border-t border-slate-850">
              <h3 className="text-sm font-bold font-serif text-gold-500 uppercase tracking-widest border-l-2 border-gold-500 pl-3">
                {language === 'th' ? 'สรุปเป้าหมายและการวิเคราะห์ตัวละคร' : 'Character Motivation Summary'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3">
                {(localOutline.characters || []).map((char) => (
                  <div key={char.id} className="text-xs space-y-1.5 p-3 rounded-lg bg-obsidian-950/20 border border-slate-800/30">
                    <h4 className="font-bold text-slate-200">{getString(char.name)} <span className="font-normal text-slate-400 text-[10px]">({getString(char.role)})</span></h4>
                    <p className="text-slate-400 leading-normal"><strong className="text-gold-500 font-semibold">{language === 'th' ? 'เป้าหมาย' : 'Goal'}:</strong> {getString(char.goal) || '-'}</p>
                    <p className="text-slate-400 leading-normal"><strong className="text-red-500 font-semibold">{language === 'th' ? 'อุปสรรค' : 'Conflict'}:</strong> {getString(char.conflict) || '-'}</p>
                    <p className="text-slate-400 leading-normal"><strong className="text-amber-500 font-semibold">{language === 'th' ? 'พัฒนาการ' : 'Arc'}:</strong> {getString(char.arc) || '-'}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD BEAT MODAL --- */}
      {isAddBeatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-obsidian-800 max-w-md w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100">
            <h3 className="text-sm font-bold font-serif border-b border-slate-800/50 pb-2">
              {language === 'th' ? 'เพิ่มโครงเรื่อง / บีตใหม่' : 'Create New Beat Card'}
            </h3>
            
            <form onSubmit={handleAddBeat} className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตอน/ชื่อบีตภาษาไทย' : 'Beat Title (TH)'}</label>
                <input
                  type="text"
                  required
                  value={newBeat.titleTh}
                  onChange={(e) => setNewBeat({ ...newBeat, titleTh: e.target.value })}
                  placeholder={language === 'th' ? 'เช่น ลีโอส่งมอบฐานข้อมูลลับให้แนท' : 'e.g. Leo delivers secret data to Nat'}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตอน/ชื่อบีตภาษาอังกฤษ' : 'Beat Title (EN)'}</label>
                <input
                  type="text"
                  required
                  value={newBeat.titleEn}
                  onChange={(e) => setNewBeat({ ...newBeat, titleEn: e.target.value })}
                  placeholder="e.g. Leo hands over database to Nat"
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'องก์ (Act)' : 'Act Group'}</label>
                  <select
                    value={newBeat.act}
                    onChange={(e) => setNewBeat({ ...newBeat, act: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  >
                    <option value="Act I">{language === 'th' ? 'องก์ I (เริ่มเรื่อง)' : 'Act I (Setup)'}</option>
                    <option value="Act II">{language === 'th' ? 'องก์ II (เผชิญหน้า)' : 'Act II (Confrontation)'}</option>
                    <option value="Act III">{language === 'th' ? 'องก์ III (คลี่คลาย)' : 'Act III (Resolution)'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'กลุ่มฉากเป้าหมาย' : 'Target Scene Range'}</label>
                  <input
                    type="text"
                    value={newBeat.sceneTarget}
                    onChange={(e) => setNewBeat({ ...newBeat, sceneTarget: e.target.value })}
                    placeholder="e.g. 1-4 or 12"
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'เส้นเรื่องที่เกี่ยวข้อง' : 'Connect Plotline'}</label>
                <select
                  value={newBeat.plotlineId}
                  onChange={(e) => setNewBeat({ ...newBeat, plotlineId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                >
                  <option value="">-- {language === 'th' ? 'เลือกเส้นเรื่อง' : 'Select Plotline'} --</option>
                  {(localOutline.plotlines || []).map(p => (
                    <option key={p.id} value={p.id}>{getString(p.name)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'คำอธิบายความในตอนภาษาไทย' : 'Beat Action Details (TH)'}</label>
                <textarea
                  rows={3}
                  value={newBeat.descriptionTh}
                  onChange={(e) => setNewBeat({ ...newBeat, descriptionTh: e.target.value })}
                  placeholder="เช่น แนทรีบวิ่งหนีออกจากคาเฟ่หลบซ่อนตัวในโกดัง ลีโอถูกรถปริศนาขวางทางทำให้พ่ายแพ้"
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'คำอธิบายความในตอนภาษาอังกฤษ' : 'Beat Action Details (EN)'}</label>
                <textarea
                  rows={3}
                  value={newBeat.descriptionEn}
                  onChange={(e) => setNewBeat({ ...newBeat, descriptionEn: e.target.value })}
                  placeholder="e.g. Nat runs out of the café and hides in a warehouse. Leo is blocked by a black sedan."
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddBeatOpen(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all font-bold"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-gold-600 to-amber-500 hover:opacity-90 text-white font-bold transition-all"
                >
                  {language === 'th' ? 'เพิ่มการ์ด' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT BEAT MODAL --- */}
      {isEditBeatOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-obsidian-800 max-w-md w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100">
            <h3 className="text-sm font-bold font-serif border-b border-slate-800/50 pb-2">
              {language === 'th' ? 'แก้ไขการ์ดโครงเรื่อง' : 'Edit Beat Card'}
            </h3>
            
            <form onSubmit={handleUpdateBeatSubmit} className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตอน/ชื่อบีตภาษาไทย' : 'Beat Title (TH)'}</label>
                <input
                  type="text"
                  required
                  value={editBeatTitleTh}
                  onChange={(e) => setEditBeatTitleTh(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตอน/ชื่อบีตภาษาอังกฤษ' : 'Beat Title (EN)'}</label>
                <input
                  type="text"
                  required
                  value={editBeatTitleEn}
                  onChange={(e) => setEditBeatTitleEn(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'องก์ (Act)' : 'Act Group'}</label>
                  <select
                    value={editBeatAct}
                    onChange={(e) => setEditBeatAct(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  >
                    <option value="Act I">{language === 'th' ? 'องก์ I (เริ่มเรื่อง)' : 'Act I (Setup)'}</option>
                    <option value="Act II">{language === 'th' ? 'องก์ II (เผชิญหน้า)' : 'Act II (Confrontation)'}</option>
                    <option value="Act III">{language === 'th' ? 'องก์ III (คลี่คลาย)' : 'Act III (Resolution)'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'กลุ่มฉากเป้าหมาย' : 'Target Scene Range'}</label>
                  <input
                    type="text"
                    value={editBeatSceneTarget}
                    onChange={(e) => setEditBeatSceneTarget(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'เส้นเรื่องที่เกี่ยวข้อง' : 'Connect Plotline'}</label>
                <select
                  value={editBeatPlotlineId}
                  onChange={(e) => setEditBeatPlotlineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                >
                  <option value="">-- {language === 'th' ? 'เลือกเส้นเรื่อง' : 'Select Plotline'} --</option>
                  {(localOutline.plotlines || []).map(p => (
                    <option key={p.id} value={p.id}>{getString(p.name)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'คำอธิบายความในตอนภาษาไทย' : 'Beat Action Details (TH)'}</label>
                <textarea
                  rows={3}
                  value={editBeatDescriptionTh}
                  onChange={(e) => setEditBeatDescriptionTh(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'คำอธิบายความในตอนภาษาอังกฤษ' : 'Beat Action Details (EN)'}</label>
                <textarea
                  rows={3}
                  value={editBeatDescriptionEn}
                  onChange={(e) => setEditBeatDescriptionEn(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditBeatOpen(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all font-bold"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-gold-600 to-amber-500 hover:opacity-90 text-white font-bold transition-all"
                >
                  {language === 'th' ? 'บันทึกแก้ไข' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD PLOTLINE MODAL --- */}
      {isAddPlotlineOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-obsidian-800 max-w-sm w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100">
            <h3 className="text-sm font-bold font-serif border-b border-slate-800/50 pb-2">
              {language === 'th' ? 'เพิ่มเส้นเรื่องย่อยใหม่' : 'Create Story Plotline'}
            </h3>
            
            <form onSubmit={handleAddPlotline} className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อเส้นเรื่องภาษาไทย (เช่น รักโรแมนติก / การแก้แค้น)' : 'Plotline Name (TH)'}</label>
                <input
                  type="text"
                  required
                  value={newPlotline.nameTh}
                  onChange={(e) => setNewPlotline({ ...newPlotline, nameTh: e.target.value })}
                  placeholder="เช่น เส้นเรื่องรองการทรยศของลีโอ"
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อเส้นเรื่องภาษาอังกฤษ' : 'Plotline Name (EN)'}</label>
                <input
                  type="text"
                  required
                  value={newPlotline.nameEn}
                  onChange={(e) => setNewPlotline({ ...newPlotline, nameEn: e.target.value })}
                  placeholder="e.g. Subplot: Leo's Betrayal"
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'แท็กสีประจำพล็อต (Color Tag)' : 'Color Association'}</label>
                <select
                  value={newPlotline.color}
                  onChange={(e) => setNewPlotline({ ...newPlotline, color: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100 text-slate-300 font-mono"
                >
                  {colorOptions.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'รายละเอียดเส้นเรื่องภาษาไทย' : 'Plot summary (TH)'}</label>
                <textarea
                  rows={2}
                  value={newPlotline.descriptionTh}
                  onChange={(e) => setNewPlotline({ ...newPlotline, descriptionTh: e.target.value })}
                  placeholder="ระบุความขัดแย้งของปมย่อยหรือสิ่งที่จะคลี่คลาย..."
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'รายละเอียดเส้นเรื่องภาษาอังกฤษ' : 'Plot summary (EN)'}</label>
                <textarea
                  rows={2}
                  value={newPlotline.descriptionEn}
                  onChange={(e) => setNewPlotline({ ...newPlotline, descriptionEn: e.target.value })}
                  placeholder="Details on subplot conflict and how it builds..."
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddPlotlineOpen(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all font-bold"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-gold-600 to-amber-500 hover:opacity-90 text-white font-bold transition-all"
                >
                  {language === 'th' ? 'เพิ่มเส้นเรื่อง' : 'Create Plot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PLOTLINE MODAL --- */}
      {isEditPlotlineOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-obsidian-800 max-w-sm w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100">
            <h3 className="text-sm font-bold font-serif border-b border-slate-800/50 pb-2">
              {language === 'th' ? 'แก้ไขรายละเอียดเส้นเรื่อง' : 'Edit Story Plotline'}
            </h3>
            
            <form onSubmit={handleUpdatePlotlineSubmit} className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อเส้นเรื่องภาษาไทย' : 'Plotline Name (TH)'}</label>
                <input
                  type="text"
                  required
                  value={editPlotlineNameTh}
                  onChange={(e) => setEditPlotlineNameTh(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อเส้นเรื่องภาษาอังกฤษ' : 'Plotline Name (EN)'}</label>
                <input
                  type="text"
                  required
                  value={editPlotlineNameEn}
                  onChange={(e) => setEditPlotlineNameEn(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'แท็กสีประจำพล็อต' : 'Color Association'}</label>
                <select
                  value={editPlotlineColor}
                  onChange={(e) => setEditPlotlineColor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100 font-mono"
                >
                  {colorOptions.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'รายละเอียดเส้นเรื่องภาษาไทย' : 'Plot summary (TH)'}</label>
                <textarea
                  rows={3}
                  value={editPlotlineDescriptionTh}
                  onChange={(e) => setEditPlotlineDescriptionTh(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'รายละเอียดเส้นเรื่องภาษาอังกฤษ' : 'Plot summary (EN)'}</label>
                <textarea
                  rows={3}
                  value={editPlotlineDescriptionEn}
                  onChange={(e) => setEditPlotlineDescriptionEn(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditPlotlineOpen(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all font-bold"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-gold-600 to-amber-500 hover:opacity-90 text-white font-bold transition-all"
                >
                  {language === 'th' ? 'บันทึกแก้ไข' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CHARACTER MODAL --- */}
      {isAddCharOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-obsidian-800 max-w-md w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100">
            <h3 className="text-sm font-bold font-serif border-b border-slate-800/50 pb-2">
              {language === 'th' ? 'เพิ่มข้อมูลวิเคราะห์ตัวละคร' : 'Add Character Arc Profiler'}
            </h3>
            
            <form onSubmit={handleAddCharacter} className="space-y-3.5 text-xs text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตัวละคร (ไทย)' : 'Name (TH)'}</label>
                  <input
                    type="text"
                    required
                    value={newChar.nameTh}
                    onChange={(e) => setNewChar({ ...newChar, nameTh: e.target.value })}
                    placeholder="เช่น ลีโอ"
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตัวละคร (อังกฤษ)' : 'Name (EN)'}</label>
                  <input
                    type="text"
                    required
                    value={newChar.nameEn}
                    onChange={(e) => setNewChar({ ...newChar, nameEn: e.target.value })}
                    placeholder="e.g. Leo"
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'บทบาทตัวละคร (ไทย)' : 'Role (TH)'}</label>
                  <input
                    type="text"
                    value={newChar.roleTh}
                    onChange={(e) => setNewChar({ ...newChar, roleTh: e.target.value })}
                    placeholder="เช่น ผู้แนะนำ / สายลับติดต่อ"
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'บทบาทตัวละคร (อังกฤษ)' : 'Role (EN)'}</label>
                  <input
                    type="text"
                    value={newChar.roleEn}
                    onChange={(e) => setNewChar({ ...newChar, roleEn: e.target.value })}
                    placeholder="e.g. Mentor / Contact Agent"
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'เป้าหมายหลักภาษาไทย' : 'Goal & Motivation (TH)'}</label>
                <input
                  type="text"
                  value={newChar.goalTh}
                  onChange={(e) => setNewChar({ ...newChar, goalTh: e.target.value })}
                  placeholder="ต้องการส่งซองเอกสารหลักฐานให้ทันเวลา..."
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'เป้าหมายหลักภาษาอังกฤษ' : 'Goal & Motivation (EN)'}</label>
                <input
                  type="text"
                  value={newChar.goalEn}
                  onChange={(e) => setNewChar({ ...newChar, goalEn: e.target.value })}
                  placeholder="Wants to safely hand over database documents on time..."
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'อุปสรรคและปมขัดแย้ง (ไทย)' : 'Conflict & Obstacle (TH)'}</label>
                  <input
                    type="text"
                    value={newChar.conflictTh}
                    onChange={(e) => setNewChar({ ...newChar, conflictTh: e.target.value })}
                    placeholder="ถูกไล่ล่าโดยทางการเกลี้ยกล่อม"
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'อุปสรรคและปมขัดแย้ง (อังกฤษ)' : 'Conflict & Obstacle (EN)'}</label>
                  <input
                    type="text"
                    value={newChar.conflictEn}
                    onChange={(e) => setNewChar({ ...newChar, conflictEn: e.target.value })}
                    placeholder="Stalked by governmental enforcement agents"
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'พัฒนาการการเปลี่ยนแปลงของตัวละครภาษาไทย' : 'Development Growth Arc (TH)'}</label>
                <textarea
                  rows={2}
                  value={newChar.arcTh}
                  onChange={(e) => setNewChar({ ...newChar, arcTh: e.target.value })}
                  placeholder="จากคนขี้ขลาด เรียนรู้อาศัยความเชื่อใจกลายเป็นคนเสียสละสู้เพื่อความจริง"
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'พัฒนาการการเปลี่ยนแปลงของตัวละครภาษาอังกฤษ' : 'Development Growth Arc (EN)'}</label>
                <textarea
                  rows={2}
                  value={newChar.arcEn}
                  onChange={(e) => setNewChar({ ...newChar, arcEn: e.target.value })}
                  placeholder="From code nerd, learns to stand strong and fight for the ultimate truth"
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddCharOpen(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all font-bold"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-gold-600 to-amber-500 hover:opacity-90 text-white font-bold transition-all"
                >
                  {language === 'th' ? 'เพิ่มตัวละคร' : 'Save Character'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CHARACTER MODAL --- */}
      {isEditCharOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-xl border border-slate-200 dark:border-obsidian-800 max-w-md w-full space-y-4 animate-scaleIn text-slate-900 dark:text-slate-100">
            <h3 className="text-sm font-bold font-serif border-b border-slate-800/50 pb-2">
              {language === 'th' ? 'แก้ไขข้อมูลวิเคราะห์ตัวละคร' : 'Edit Character Arc'}
            </h3>
            
            <form onSubmit={handleUpdateCharacterSubmit} className="space-y-3.5 text-xs text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตัวละคร (ไทย)' : 'Name (TH)'}</label>
                  <input
                    type="text"
                    required
                    value={editCharNameTh}
                    onChange={(e) => setEditCharNameTh(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'ชื่อตัวละคร (อังกฤษ)' : 'Name (EN)'}</label>
                  <input
                    type="text"
                    required
                    value={editCharNameEn}
                    onChange={(e) => setEditCharNameEn(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'บทบาทตัวละคร (ไทย)' : 'Role (TH)'}</label>
                  <input
                    type="text"
                    value={editCharRoleTh}
                    onChange={(e) => setEditCharRoleTh(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'บทบาทตัวละคร (อังกฤษ)' : 'Role (EN)'}</label>
                  <input
                    type="text"
                    value={editCharRoleEn}
                    onChange={(e) => setEditCharRoleEn(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'เป้าหมายหลักภาษาไทย' : 'Goal & Motivation (TH)'}</label>
                <input
                  type="text"
                  value={editCharGoalTh}
                  onChange={(e) => setEditCharGoalTh(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'เป้าหมายหลักภาษาอังกฤษ' : 'Goal & Motivation (EN)'}</label>
                <input
                  type="text"
                  value={editCharGoalEn}
                  onChange={(e) => setEditCharGoalEn(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'อุปสรรคและปมขัดแย้ง (ไทย)' : 'Conflict & Obstacle (TH)'}</label>
                  <input
                    type="text"
                    value={editCharConflictTh}
                    onChange={(e) => setEditCharConflictTh(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'อุปสรรคและปมขัดแย้ง (อังกฤษ)' : 'Conflict & Obstacle (EN)'}</label>
                  <input
                    type="text"
                    value={editCharConflictEn}
                    onChange={(e) => setEditCharConflictEn(e.target.value)}
                    className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'พัฒนาการการเปลี่ยนแปลงของตัวละครภาษาไทย' : 'Development Growth Arc (TH)'}</label>
                <textarea
                  rows={2}
                  value={editCharArcTh}
                  onChange={(e) => setEditCharArcTh(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{language === 'th' ? 'พัฒนาการการเปลี่ยนแปลงของตัวละครภาษาอังกฤษ' : 'Development Growth Arc (EN)'}</label>
                <textarea
                  rows={2}
                  value={editCharArcEn}
                  onChange={(e) => setEditCharArcEn(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800/60 rounded p-2 focus:border-gold-500 focus:outline-none text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsEditCharOpen(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all font-bold"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-gold-600 to-amber-500 hover:opacity-90 text-white font-bold transition-all"
                >
                  {language === 'th' ? 'บันทึกแก้ไข' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
