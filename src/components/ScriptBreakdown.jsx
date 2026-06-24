import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Sparkles, 
  Clapperboard, 
  Printer, 
  FileText, 
  Tag
} from 'lucide-react';

const ELEMENT_CATEGORIES = [
  { id: 'cast_members', label: 'Cast Members', labelTh: 'นักแสดงหลัก', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20', dotColor: 'bg-purple-500' },
  { id: 'extras', label: 'Extras', labelTh: 'ตัวประกอบ', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/20', dotColor: 'bg-pink-500' },
  { id: 'props', label: 'Props', labelTh: 'อุปกรณ์ประกอบฉาก', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20', dotColor: 'bg-orange-500' },
  { id: 'set_dressing', label: 'Set Dressing', labelTh: 'การตกแต่งฉาก', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20', dotColor: 'bg-blue-500' },
  { id: 'costumes', label: 'Costumes', labelTh: 'เครื่องแต่งกาย', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20', dotColor: 'bg-amber-500' },
  { id: 'makeup_hair', label: 'Makeup & Hair', labelTh: 'แต่งหน้าทำผม', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 hover:bg-teal-500/20', dotColor: 'bg-teal-500' },
  { id: 'sound', label: 'Sound', labelTh: 'เสียงและเอฟเฟกต์', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20', dotColor: 'bg-violet-500' },
  { id: 'vfx', label: 'VFX', labelTh: 'วิชวลเอฟเฟกต์', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20', dotColor: 'bg-indigo-500' },
  { id: 'vehicles', label: 'Vehicles', labelTh: 'ยานพาหนะ', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20', dotColor: 'bg-emerald-500' },
  { id: 'stunts', label: 'Stunts', labelTh: 'สตันท์', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20', dotColor: 'bg-red-500' },
  { id: 'animals', label: 'Animals', labelTh: 'นักแสดงสัตว์', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20', dotColor: 'bg-green-500' },
  { id: 'other', label: 'Other', labelTh: 'อื่นๆ', color: 'bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20', dotColor: 'bg-slate-500' }
];

export default function ScriptBreakdown() {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();
  const { activeScenes: scenes, addScene, updateScene, deleteScene, scriptBlocks } = useProject();

  const [activeSubTab, setActiveSubTab] = useState('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntExt, setFilterIntExt] = useState('ALL');
  const [filterDayNight, setFilterDayNight] = useState('ALL');
  const [selectedSceneId, setSelectedSceneId] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [formSceneNum, setFormSceneNum] = useState('');
  const [formSetting, setFormSetting] = useState('');
  const [formIntExt, setFormIntExt] = useState('INT');
  const [formDayNight, setFormDayNight] = useState('DAY');
  const [formPages, setFormPages] = useState('1/8');
  const [formDescTh, setFormDescTh] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formCastTh, setFormCastTh] = useState('');
  const [formCastEn, setFormCastEn] = useState('');
  const [formLocTh, setFormLocTh] = useState('');
  const [formLocEn, setFormLocEn] = useState('');
  const [formStatus, setFormStatus] = useState('pending');

  const [popoverState, setPopoverState] = useState({ isOpen: false, id: null, blockId: null, start: null, end: null, name: '', qty: 1, category: 'props', coords: { x: 0, y: 0 } });
  const [sidebarAddCategory, setSidebarAddCategory] = useState(null);
  const [sidebarItemName, setSidebarItemName] = useState('');
  const [sidebarItemQty, setSidebarItemQty] = useState(1);

  useEffect(() => {
    if (scenes && scenes.length > 0 && !selectedSceneId) {
      const sorted = [...scenes].sort((a, b) => (parseFloat(a.scene_number) || 0) - (parseFloat(b.scene_number) || 0));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSceneId(sorted[0].id);
    }
  }, [scenes, selectedSceneId]);

  const activeScene = scenes.find(s => s.id === selectedSceneId) || scenes[0] || null;

  const blockTypes = {
    heading: { class: 'font-mono font-extrabold uppercase tracking-wider text-slate-800 dark:text-white pl-3 border-l-2 border-slate-500/50 mt-6 mb-3 text-left' },
    action: { class: 'font-mono text-slate-700 dark:text-slate-350 mt-3 mb-3 text-left leading-relaxed' },
    character: { class: 'font-mono font-bold text-gold-600 dark:text-gold-400 uppercase tracking-widest mt-4 mb-1 text-center' },
    parenthetical: { class: 'font-mono text-slate-500 dark:text-slate-400 italic mt-1 mb-1 text-center' },
    dialogue: { class: 'font-mono text-slate-800 dark:text-slate-200 mt-1.5 mb-2 mx-auto max-w-[85%] text-center' },
    transition: { class: 'font-mono font-bold text-amber-600 dark:text-amber-500 uppercase mt-4 mb-4 text-right pr-2' }
  };

  const resetForm = () => {
    setFormSceneNum(''); setFormSetting(''); setFormIntExt('INT'); setFormDayNight('DAY'); setFormPages('1/8');
    setFormDescTh(''); setFormDescEn(''); setFormCastTh(''); setFormCastEn(''); setFormLocTh(''); setFormLocEn(''); setFormStatus('pending');
    setEditingScene(null);
  };

  const handleAddClick = () => { resetForm(); setFormSceneNum(String(scenes.length + 1)); setIsModalOpen(true); };

  const handleEditClick = (scene, e) => {
    if (e) e.stopPropagation();
    setEditingScene(scene);
    setFormSceneNum(scene.scene_number || '');
    setFormSetting(scene.setting || '');
    setFormIntExt(scene.int_ext || 'INT');
    setFormDayNight(scene.day_night || 'DAY');
    setFormPages(scene.pages || '1/8');
    setFormDescTh(scene.description?.th || '');
    setFormDescEn(scene.description?.en || '');
    setFormCastTh(scene.cast?.th || '');
    setFormCastEn(scene.cast?.en || '');
    setFormLocTh(scene.location?.th || '');
    setFormLocEn(scene.location?.en || '');
    setFormStatus(scene.status || 'pending');
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (sceneId, e) => {
    if (e) e.stopPropagation();
    if (confirm(t('breakdown.deleteScene') + '?')) {
      await deleteScene(sceneId);
      if (selectedSceneId === sceneId) setSelectedSceneId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formSceneNum || !formSetting) return;
    const existingElements = editingScene?.tech_notes?.scene_elements || [];

    const sceneData = {
      scene_number: formSceneNum,
      setting: formSetting,
      int_ext: formIntExt,
      day_night: formDayNight,
      pages: formPages,
      description: { th: formDescTh || formDescEn, en: formDescEn || formDescTh },
      cast: { th: formCastTh, en: formCastEn },
      location: { th: formLocTh, en: formLocEn },
      tech_notes: {
        ...(editingScene?.tech_notes || {}),
        scene_elements: existingElements
      },
      status: formStatus
    };

    try {
      if (editingScene) await updateScene({ ...editingScene, ...sceneData });
      else await addScene(sceneData);
      setIsModalOpen(false);
      resetForm();
    } catch (err) { alert("Failed to save: " + err.message); }
  };

  const saveSceneElements = async (targetScene, updatedElements) => {
    const updatedScene = { ...targetScene, tech_notes: { ...(targetScene.tech_notes || {}), scene_elements: updatedElements } };
    await updateScene(updatedScene);
  };

  const getSceneBlocks = (sceneNum) => {
    let currentSceneNum = 0;
    const blocksForScene = [];
    for (const block of scriptBlocks || []) {
      if (block.type === 'heading') currentSceneNum += 1;
      if (String(currentSceneNum) === String(sceneNum)) blocksForScene.push(block);
    }
    return blocksForScene;
  };

  const handleTextSelection = (block) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const blockElement = document.getElementById(`block-viewer-${block.id}`);
    if (!blockElement) return;

    try {
      const preRange = document.createRange();
      preRange.selectNodeContents(blockElement);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      setPopoverState({
        isOpen: true,
        id: null,
        blockId: block.id,
        start: startOffset,
        end: startOffset + selection.toString().trim().length,
        name: selection.toString().trim(),
        qty: 1,
        category: 'props',
        coords: { x: Math.min(window.innerWidth - 300, rect.left + window.scrollX), y: rect.bottom + window.scrollY + 8 }
      });
    } catch (err) { console.warn(err); }
  };

  const handleTagClick = (tag, e) => {
    const rect = e.target.getBoundingClientRect();
    setPopoverState({ isOpen: true, id: tag.id, blockId: tag.blockId, start: tag.start, end: tag.end, name: tag.name, qty: tag.qty, category: tag.category, coords: { x: Math.min(window.innerWidth - 300, rect.left + window.scrollX), y: rect.bottom + window.scrollY + 8 } });
  };

  const handleSavePopoverTag = async () => {
    if (!activeScene) return;
    const currentElements = activeScene.tech_notes?.scene_elements || [];
    const updated = popoverState.id 
      ? currentElements.map(el => el.id === popoverState.id ? { ...el, name: popoverState.name, category: popoverState.category, qty: Number(popoverState.qty) } : el)
      : [...currentElements, { id: `tag-${Date.now()}`, blockId: popoverState.blockId, start: popoverState.start, end: popoverState.end, name: popoverState.name, category: popoverState.category, qty: Number(popoverState.qty) }];
    await saveSceneElements(activeScene, updated);
    setPopoverState({ ...popoverState, isOpen: false });
    window.getSelection()?.removeAllRanges();
  };

  const handleRemovePopoverTag = async () => {
    if (!activeScene || !popoverState.id) return;
    await saveSceneElements(activeScene, (activeScene.tech_notes?.scene_elements || []).filter(el => el.id !== popoverState.id));
    setPopoverState({ ...popoverState, isOpen: false });
  };

  const handleAddSidebarItem = async (e) => {
    e.preventDefault();
    if (!activeScene || !sidebarItemName.trim()) return;
    await saveSceneElements(activeScene, [...(activeScene.tech_notes?.scene_elements || []), { id: `manual-${Date.now()}`, name: sidebarItemName.trim(), category: sidebarAddCategory, qty: Number(sidebarItemQty) }]);
    setSidebarItemName(''); setSidebarItemQty(1); setSidebarAddCategory(null);
  };

  const handleDeleteTag = async (tagId) => {
    if (!activeScene) return;
    await saveSceneElements(activeScene, (activeScene.tech_notes?.scene_elements || []).filter(el => el.id !== tagId));
  };

  const renderHighlightText = (block, tags) => {
    const blockTags = (tags || []).filter(t => t.blockId === block.id).sort((a, b) => a.start - b.start);
    if (blockTags.length === 0) return block.text;
    const output = []; let lastOffset = 0;
    blockTags.forEach((tag) => {
      if (tag.start > lastOffset) output.push(block.text.substring(lastOffset, tag.start));
      const cat = ELEMENT_CATEGORIES.find(c => c.id === tag.category) || ELEMENT_CATEGORIES[11];
      output.push(<span key={tag.id} onClick={(e) => handleTagClick(tag, e)} className={`cursor-pointer px-1 py-0.5 rounded font-bold border text-xs inline-block ${cat.color}`}>{block.text.substring(tag.start, tag.end)}<span className="text-[9px] opacity-75 font-normal ml-0.5">({tag.qty})</span></span>);
      lastOffset = tag.end;
    });
    if (lastOffset < block.text.length) output.push(block.text.substring(lastOffset));
    return output;
  };

  const filteredScenes = scenes.filter(s => (s.scene_number?.toLowerCase().includes(searchTerm.toLowerCase()) || s.setting?.toLowerCase().includes(searchTerm.toLowerCase())) && (filterIntExt === 'ALL' || s.int_ext === filterIntExt) && (filterDayNight === 'ALL' || s.day_night === filterDayNight)).sort((a, b) => (parseFloat(a.scene_number) || 0) - (parseFloat(b.scene_number) || 0));
  const activeSceneBlocks = activeScene ? getSceneBlocks(activeScene.scene_number) : [];
  const activeSceneElements = activeScene?.tech_notes?.scene_elements || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-16 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-obsidian-850 pb-5 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Clapperboard className="text-gold-500" size={26} /> 
            <span>{t('nav.scriptBreakdown')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'th' 
              ? 'แยกองค์ประกอบบทละคร คัดกรองตัวละคร อุปกรณ์ประกอบฉาก และเทคนิคในแต่ละฉากอย่างละเอียด' 
              : 'Analyze script elements, tagging props, actors, stunts, and costumes per scene.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()} 
            className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              theme === 'dark' 
                ? 'bg-obsidian-900 border-obsidian-850 text-slate-200 hover:bg-obsidian-800' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Printer size={14} /> 
            <span>{language === 'th' ? 'พิมพ์รายงาน' : 'Print / Export'}</span>
          </button>
          {hasWriteAccess() && (
            <button 
              onClick={handleAddClick} 
              className="px-4 py-2 bg-gradient-to-r from-gold-600 to-amber-500 hover:shadow text-white font-bold text-xs rounded-lg transition-all active:scale-95 shadow-sm"
            >
              <Plus size={14} className="inline mr-1" /> {t('breakdown.addScene')}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-205/30 dark:border-obsidian-850 pb-px no-print">
        <button 
          onClick={() => setActiveSubTab('summary')} 
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'summary' 
              ? 'border-gold-500 text-gold-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <FileText size={14} /> 
          <span>Summary Sheet</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('tagging')} 
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'tagging' 
              ? 'border-gold-500 text-gold-500' 
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Tag size={14} /> 
          <span>Tagging Editor</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-500/5 dark:bg-obsidian-950/20 border border-slate-200/40 dark:border-obsidian-900/60 shadow-inner">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder={language === 'th' ? 'ค้นหาเลขฉาก หรือ รายละเอียดสถานที่...' : 'Search scene number or setting...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 text-slate-700 dark:text-slate-200 shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{language === 'th' ? 'ภายใน/ภายนอก:' : 'INT/EXT:'}</span>
            <select
              value={filterIntExt}
              onChange={(e) => setFilterIntExt(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-sm"
            >
              <option value="ALL" className="bg-obsidian-950">{language === 'th' ? 'ทั้งหมด' : 'All'}</option>
              <option value="INT" className="bg-obsidian-950">INT</option>
              <option value="EXT" className="bg-obsidian-950">EXT</option>
              <option value="INT/EXT" className="bg-obsidian-950">INT/EXT</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">{language === 'th' ? 'ช่วงเวลา:' : 'DAY/NIGHT:'}</span>
            <select
              value={filterDayNight}
              onChange={(e) => setFilterDayNight(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-obsidian-800 bg-white dark:bg-obsidian-950 text-slate-700 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-sm"
            >
              <option value="ALL" className="bg-obsidian-950">{language === 'th' ? 'ทั้งหมด' : 'All'}</option>
              <option value="DAY" className="bg-obsidian-950">DAY</option>
              <option value="NIGHT" className="bg-obsidian-950">NIGHT</option>
              <option value="DUSK" className="bg-obsidian-950">DUSK</option>
              <option value="DAWN" className="bg-obsidian-950">DAWN</option>
            </select>
          </div>
        </div>
      </div>

      {scenes.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl border border-dashed border-slate-350 dark:border-obsidian-800 max-w-xl mx-auto space-y-6 animate-fadeIn mt-8">
          <div className="w-16 h-16 rounded-full bg-gold-500/10 text-gold-500 flex items-center justify-center mx-auto">
            <Clapperboard size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-serif text-slate-800 dark:text-slate-105">
              {language === 'th' ? 'ยังไม่มีข้อมูลการแจกแจงบทถ่ายทำ' : 'No Script Breakdown Yet'}
            </h3>
            <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
              {language === 'th' 
                ? 'เริ่มแยกฉาก นำเข้านักแสดง อุปกรณ์ประกอบฉาก และเครื่องแต่งกาย เพื่อแจกแจงโครงสร้างคิวงานอย่างมืออาชีพ' 
                : 'Start splitting scenes, tagging actors, props, and costumes to structure your production schedule.'}
            </p>
          </div>
          {hasWriteAccess() && (
            <button
              onClick={handleAddClick}
              className="px-6 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Plus size={14} className="inline mr-1" /> {language === 'th' ? 'สร้างฉากแรก' : 'Create First Scene'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Scenes Sidebar List */}
          <div className="lg:col-span-1 glass-panel p-4 rounded-xl border border-slate-200/55 dark:border-obsidian-850/60 no-print space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-205/30 dark:border-obsidian-800 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                {language === 'th' ? 'รายการฉาก' : 'Scenes List'} ({filteredScenes.length})
              </span>
            </div>
            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredScenes.map(scene => {
                const isSelected = scene.id === selectedSceneId;
                const statusColor = scene.status === 'completed' 
                  ? 'bg-emerald-500' 
                  : scene.status === 'in_progress' 
                  ? 'bg-amber-500' 
                  : 'bg-slate-400';
                
                return (
                  <div 
                    key={scene.id} 
                    onClick={() => setSelectedSceneId(scene.id)} 
                    className={`group/scene p-3 rounded-xl border cursor-pointer transition-all shadow-xs ${
                      isSelected 
                        ? 'border-gold-500 bg-gold-500/5 dark:bg-gold-500/5 ring-1 ring-gold-500' 
                        : 'border-slate-200/60 dark:border-obsidian-800 bg-slate-500/5 dark:bg-obsidian-950/20 hover:border-slate-350 dark:hover:border-obsidian-750'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <span className="text-[10px] font-black text-gold-500 font-mono tracking-wider">
                        SCENE {scene.scene_number}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {scene.pages || '1/8'} PGS
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">
                      {scene.setting}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-2.5 pt-1.5 border-t border-slate-200/30 dark:border-slate-800/40">
                      <span>{scene.int_ext} • {scene.day_night}</span>
                      {hasWriteAccess() && (
                        <div className="flex items-center gap-1.5 opacity-0 group-hover/scene:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => handleEditClick(scene, e)}
                            className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-obsidian-800 text-slate-500 hover:text-white"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(scene.id, e)}
                            className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-500/10 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/20 bg-transparent transition-all cursor-pointer"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredScenes.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-8">
                  {language === 'th' ? 'ไม่พบฉากที่ตรงเงื่อนไข' : 'No scenes match filters.'}
                </p>
              )}
            </div>
          </div>

          {/* Details Content Area */}
          <div className="lg:col-span-3">
            {!activeScene ? (
              <div className="glass-panel p-16 text-center rounded-2xl border border-slate-200 dark:border-obsidian-850 text-slate-400 italic">
                {language === 'th' ? 'กรุณาเลือกฉากในแถบด้านข้างเพื่อดูรายละเอียดการแจกแจง' : 'Please select a scene from the list to view details.'}
              </div>
            ) : (
              <>
                {/* 1. Summary Subtab View */}
                {activeSubTab === 'summary' && (
                  <div className={`p-6 md:p-8 border rounded-2xl shadow-sm text-left ${
                    theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800/80' : 'bg-white border-slate-200'
                  }`}>
                    {/* Header Info Block */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/50 dark:border-obsidian-850 pb-5 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gold-500/10 text-gold-500 border border-gold-500/20 font-mono">
                            SCENE {activeScene.scene_number}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase border ${
                            activeScene.int_ext === 'INT' 
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {activeScene.int_ext}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-805/10 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/20 font-mono">
                            {activeScene.day_night}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black font-serif uppercase text-slate-900 dark:text-white mt-2">
                          {activeScene.setting}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <span className="font-bold">{language === 'th' ? 'สถานที่ถ่ายทำ:' : 'Location:'}</span>
                          <span className="text-slate-700 dark:text-slate-300">{activeScene.location?.[language] || activeScene.location?.en || '-'}</span>
                        </p>
                      </div>
                      <div className="flex flex-col md:items-end gap-1.5">
                        {/* Status Select Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-bold">{language === 'th' ? 'สถานะคิวฉาก:' : 'Scene Status:'}</span>
                          <select
                            disabled={!hasWriteAccess()}
                            value={activeScene.status || 'pending'}
                            onChange={async (e) => {
                              const val = e.target.value;
                              await updateScene({ ...activeScene, status: val });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                              activeScene.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
                                : activeScene.status === 'in_progress'
                                ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                            }`}
                          >
                            <option value="pending" className="bg-obsidian-950 text-slate-450">{language === 'th' ? 'รอดำเนินการ' : 'Pending'}</option>
                            <option value="in_progress" className="bg-obsidian-950 text-slate-450">{language === 'th' ? 'กำลังเตรียมการ' : 'In Progress'}</option>
                            <option value="completed" className="bg-obsidian-950 text-slate-450">{language === 'th' ? 'เสร็จสิ้น' : 'Completed'}</option>
                          </select>
                        </div>
                        <p className="text-xs text-slate-450 font-mono mt-0.5">
                          {language === 'th' ? 'จำนวนความยาว:' : 'Length:'} <span className="text-slate-900 dark:text-white font-bold">{activeScene.pages || '1/8'}</span> {language === 'th' ? 'หน้าบท' : 'pages'}
                        </p>
                      </div>
                    </div>

                    {/* Scene Description Card */}
                    {activeScene.description?.[language] && (
                      <div className="mt-5 p-4 rounded-xl bg-slate-500/5 dark:bg-obsidian-950/20 border border-slate-205/30 dark:border-obsidian-850 shadow-inner">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">
                          {language === 'th' ? 'เนื้อเรื่องย่อ / คำอธิบายฉาก (SCENE SYNOPSIS)' : 'SCENE SYNOPSIS'}
                        </h4>
                        <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-305 whitespace-pre-line font-serif">
                          {activeScene.description[language]}
                        </p>
                      </div>
                    )}

                    {/* Breakdown Element Categories Card Grid */}
                    <div className="mt-6 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-450 mb-3 flex items-center gap-1.5">
                        <Tag size={12} className="text-gold-500" />
                        <span>{language === 'th' ? 'องค์ประกอบการแจกแจงอุปกรณ์และนักแสดง (BREAKDOWN ELEMENTS)' : 'BREAKDOWN ELEMENTS'}</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {ELEMENT_CATEGORIES.map(category => {
                          const elements = activeSceneElements.filter(el => el.category === category.id);
                          if (elements.length === 0) return null;
                          return (
                            <div 
                              key={category.id} 
                              className="p-4 rounded-xl border bg-slate-500/5 dark:bg-obsidian-950/20 border-slate-200/50 dark:border-obsidian-850 hover:border-slate-300 dark:hover:border-obsidian-800 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex justify-between items-center mb-2.5 border-b border-slate-200/30 dark:border-obsidian-800/80 pb-1.5">
                                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${category.dotColor}`} />
                                    {language === 'th' ? category.labelTh : category.label}
                                  </span>
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-450 font-mono">
                                    {elements.length}
                                  </span>
                                </div>
                                <ul className="space-y-1.5">
                                  {elements.map(i => (
                                    <li key={i.id} className="text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                                      <span className="flex items-center gap-1.5">
                                        <span className="text-slate-400">•</span>
                                        {i.name}
                                      </span>
                                      {i.qty > 1 && (
                                        <span className="text-[9px] font-bold text-slate-450 font-mono bg-slate-500/10 px-1 py-0.2 rounded">
                                          x{i.qty}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {activeSceneElements.length === 0 && (
                        <div className="text-center py-12 rounded-xl bg-slate-500/5 dark:bg-obsidian-950/10 border border-dashed border-slate-200/80 dark:border-obsidian-850 text-slate-400 text-xs">
                          {language === 'th' 
                            ? 'ยังไม่มีการแท็กองค์ประกอบฉากนี้ เลือกแท็บ "Tagging Editor" เพื่อเริ่มแท็ก หรือพิมพ์เพิ่มจากเครื่องมือด้านข้าง' 
                            : 'No elements tagged in this scene yet. Go to the "Tagging Editor" tab or use the sidebar tools to begin.'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Tagging Editor Subtab View */}
                {activeSubTab === 'tagging' && (
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 text-left">
                    {/* Screenplay text editor box */}
                    <div className={`xl:col-span-3 p-6 md:p-8 border rounded-2xl min-h-[500px] relative shadow-sm ${
                      theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}>
                      <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-obsidian-850 pb-4 mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-gold-500 font-mono">
                          {language === 'th' ? 'คัดกรองบทภาพยนตร์ & แท็กองค์ประกอบ' : 'SCREENPLAY TEXT & TAGGING'}
                        </span>
                        <span className="text-[10px] text-slate-400 italic">
                          {language === 'th' ? 'ลากเมาส์คลุมคำในบทเพื่อแท็กนักแสดง/อุปกรณ์' : 'Select text to tag props or cast members'}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
                        {activeSceneBlocks.map(block => (
                          <div 
                            key={block.id} 
                            id={`block-viewer-${block.id}`} 
                            onMouseUp={() => handleTextSelection(block)} 
                            className={`p-1 select-text transition-all hover:bg-slate-500/5 rounded cursor-text ${blockTypes[block.type]?.class}`}
                          >
                            {renderHighlightText(block, activeSceneElements)}
                          </div>
                        ))}
                        {activeSceneBlocks.length === 0 && (
                          <div className="text-center py-24 text-slate-450 italic space-y-4">
                            <FileText size={40} className="mx-auto text-slate-400/30" />
                            <p className="text-xs">
                              {language === 'th' 
                                ? 'ไม่มีรายละเอียดโครงเนื้อเรื่องในฉากนี้ กรุณาระบุรายละเอียดบทภาพยนตร์ในเมนู "เขียนบทภาพยนตร์"' 
                                : 'No screenplay texts associated with this scene. Write screenplay scene headers and details in the Editor tab.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Tag Selection Popover floating card */}
                      {popoverState.isOpen && (
                        <div 
                          className={`absolute z-50 w-64 p-4 rounded-xl border shadow-2xl animate-fadeIn ${
                            theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-white border-slate-200'
                          }`}
                          style={{ left: `${popoverState.coords.x - 20}px`, top: `${popoverState.coords.y - 120}px` }}
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200/40 dark:border-obsidian-800 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gold-500 flex items-center gap-1">
                              <Tag size={10} />
                              <span>{popoverState.id ? (language === 'th' ? 'แก้ไขแท็ก' : 'Edit Tag') : (language === 'th' ? 'แท็กองค์ประกอบใหม่' : 'Tag Element')}</span>
                            </span>
                            <button 
                              onClick={() => setPopoverState({ ...popoverState, isOpen: false })} 
                              className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-500/10 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-black text-slate-450 uppercase">{language === 'th' ? 'ชื่ออุปกรณ์ / นักแสดง' : 'ELEMENT NAME'}</label>
                              <input 
                                value={popoverState.name} 
                                onChange={(e) => setPopoverState({ ...popoverState, name: e.target.value })} 
                                className="w-full border border-slate-200 dark:border-obsidian-800 p-2 rounded-lg bg-transparent text-slate-905 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold-500 font-bold" 
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-2 space-y-1">
                                <label className="block text-[9px] font-black text-slate-450 uppercase">{language === 'th' ? 'ประเภท' : 'CATEGORY'}</label>
                                <select 
                                  value={popoverState.category} 
                                  onChange={(e) => setPopoverState({ ...popoverState, category: e.target.value })} 
                                  className="w-full border border-slate-200 dark:border-obsidian-800 p-2 rounded-lg bg-slate-100 dark:bg-obsidian-900 text-slate-900 dark:text-slate-100 focus:outline-none text-[11px]"
                                >
                                  {ELEMENT_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-obsidian-950">{language === 'th' ? cat.labelTh : cat.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-1 space-y-1">
                                <label className="block text-[9px] font-black text-slate-450 uppercase">{language === 'th' ? 'จำนวน' : 'QTY'}</label>
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={popoverState.qty} 
                                  onChange={(e) => setPopoverState({ ...popoverState, qty: Number(e.target.value) })} 
                                  className="w-full border border-slate-200 dark:border-obsidian-800 p-2 rounded-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none text-center" 
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1.5">
                              {popoverState.id && (
                                <button 
                                  onClick={handleRemovePopoverTag} 
                                  className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 py-1.5 rounded-lg font-bold text-[10px] hover:bg-red-500/20 transition-all active:scale-95"
                                >
                                  {language === 'th' ? 'ลบออก' : 'Remove'}
                                </button>
                              )}
                              <button 
                                onClick={handleSavePopoverTag} 
                                className="flex-1 bg-gradient-to-r from-gold-600 to-amber-500 text-white py-1.5 rounded-lg font-bold text-[10px] shadow-sm hover:shadow transition-all active:scale-95"
                              >
                                {language === 'th' ? 'บันทึก' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tagged categories and quick elements list */}
                    <div className="xl:col-span-1 glass-panel p-4 rounded-xl border border-slate-200/50 dark:border-obsidian-850/60 space-y-4 shadow-sm">
                      <div className="text-[10px] font-black border-b border-slate-200/40 dark:border-obsidian-800 pb-2 text-slate-400 uppercase tracking-widest">
                        {language === 'th' ? 'หมวดหมู่อุปกรณ์ & นักแสดง' : 'BREAKDOWN CATEGORIES'}
                      </div>
                      
                      <div className="max-h-[500px] overflow-y-auto space-y-4 pr-0.5 scrollbar-thin">
                        {ELEMENT_CATEGORIES.map(cat => {
                          const catItems = activeSceneElements.filter(i => i.category === cat.id);
                          const isAdding = sidebarAddCategory === cat.id;

                          return (
                            <div key={cat.id} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`} />
                                  {language === 'th' ? cat.labelTh : cat.label}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.1 rounded-full font-bold">
                                    {catItems.length}
                                  </span>
                                  {hasWriteAccess() && (
                                    <button 
                                      onClick={() => setSidebarAddCategory(isAdding ? null : cat.id)} 
                                      className="text-gold-500 hover:text-gold-400 text-[10px] font-bold"
                                    >
                                      {isAdding ? (language === 'th' ? 'ยกเลิก' : 'Cancel') : '+ ' + (language === 'th' ? 'เพิ่ม' : 'Add')}
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {isAdding && (
                                <form onSubmit={handleAddSidebarItem} className="flex gap-1 border border-slate-200 dark:border-obsidian-800/80 p-1 rounded-lg bg-white dark:bg-obsidian-950 animate-fadeIn">
                                  <input 
                                    required 
                                    value={sidebarItemName} 
                                    onChange={(e) => setSidebarItemName(e.target.value)} 
                                    placeholder={language === 'th' ? 'ชื่ออุปกรณ์...' : 'Item name...'} 
                                    className="w-2/3 text-xs p-1 bg-transparent border-none focus:outline-none text-slate-905 dark:text-slate-100" 
                                  />
                                  <input 
                                    type="number" 
                                    min="1" 
                                    value={sidebarItemQty} 
                                    onChange={(e) => setSidebarItemQty(Number(e.target.value))} 
                                    className="w-1/4 text-xs p-1 bg-transparent text-center border-none focus:outline-none text-slate-905 dark:text-slate-100 font-mono" 
                                  />
                                  <button type="submit" className="px-2 bg-gold-500 hover:bg-gold-600 text-white text-[10px] font-bold rounded-md shadow-xs active:scale-95">
                                    {language === 'th' ? 'เพิ่ม' : 'Add'}
                                  </button>
                                </form>
                              )}
                              
                              <ul className="text-xs pl-3 text-slate-450 space-y-1.5 border-l border-slate-200/20 dark:border-obsidian-850/50">
                                {catItems.map(i => (
                                  <li key={i.id} className="flex justify-between items-center group/item text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                                    <span className="truncate flex items-center gap-1.5">
                                      <span>•</span>
                                      <span>{i.name}</span>
                                      {i.qty > 1 && <span className="text-[10px] font-bold text-slate-400 font-mono opacity-80">(x{i.qty})</span>}
                                    </span>
                                    {hasWriteAccess() && (
                                      <button 
                                        onClick={() => handleDeleteTag(i.id)} 
                                        className="text-slate-400 hover:text-red-500 p-0.5 rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
                                      >
                                        <X size={10} />
                                      </button>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. Add/Edit Scene Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs no-print animate-fadeIn">
          <div className={`w-full max-w-xl rounded-xl shadow-2xl border p-6 text-left ${theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-obsidian-805 mb-4">
              <h3 className="text-lg font-bold font-serif flex items-center gap-2">
                <Sparkles className="text-gold-500 animate-pulse" size={18} /> 
                <span>{editingScene ? (language === 'th' ? 'แก้ไขข้อมูลคิวฉาก' : 'Edit Scene Details') : (language === 'th' ? 'สร้างคิวฉากถ่ายทำใหม่' : 'Create Scene Schedule')}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-500/10">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-400">{language === 'th' ? 'ฉากที่ (Scene Number) *' : 'Scene Number *'}</label>
                  <input 
                    required 
                    placeholder="e.g. 1A" 
                    value={formSceneNum} 
                    onChange={e => setFormSceneNum(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">{language === 'th' ? 'รายละเอียดสถานที่ / เหตุการณ์ (Slugline) *' : 'Slugline / Setting *'}</label>
                  <input 
                    required 
                    placeholder="e.g. LIVING ROOM" 
                    value={formSetting} 
                    onChange={e => setFormSetting(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold-500" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-400">{language === 'th' ? 'ภายใน/ภายนอก' : 'INT / EXT'}</label>
                  <select 
                    value={formIntExt} 
                    onChange={e => setFormIntExt(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-slate-100 dark:bg-obsidian-900 text-slate-905 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="INT">INT</option>
                    <option value="EXT">EXT</option>
                    <option value="INT/EXT">INT/EXT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">{language === 'th' ? 'ช่วงเวลาถ่ายทำ' : 'DAY / NIGHT'}</label>
                  <select 
                    value={formDayNight} 
                    onChange={e => setFormDayNight(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-slate-100 dark:bg-obsidian-900 text-slate-905 dark:text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="DAY">DAY</option>
                    <option value="NIGHT">NIGHT</option>
                    <option value="DUSK">DUSK</option>
                    <option value="DAWN">DAWN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">{language === 'th' ? 'ความยาวบท (Pages)' : 'Length (Pages)'}</label>
                  <input 
                    placeholder="e.g. 5/8" 
                    value={formPages} 
                    onChange={e => setFormPages(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-400">{language === 'th' ? 'พิกัดสถานที่ถ่ายทำจริง' : 'Location (TH)'}</label>
                  <input 
                    placeholder="e.g. บ้านลาดพร้าว 101" 
                    value={formLocTh} 
                    onChange={e => setFormLocTh(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-400">{language === 'th' ? 'นักแสดงในฉาก' : 'Cast List (TH)'}</label>
                  <input 
                    placeholder="e.g. พลอย, ก้า" 
                    value={formCastTh} 
                    onChange={e => setFormCastTh(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold-500" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400">{language === 'th' ? 'คำอธิบายเหตุการณ์ในฉาก (Description) *' : 'Description *'}</label>
                <textarea 
                  required
                  placeholder={t('breakdown.scenePlaceholder')} 
                  rows="3" 
                  value={formDescTh} 
                  onChange={e => setFormDescTh(e.target.value)} 
                  className="w-full border border-slate-200 dark:border-obsidian-800 p-2.5 rounded-lg bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-gold-500 leading-relaxed" 
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-obsidian-800/80">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="border border-slate-200 dark:border-obsidian-800 px-4 py-2.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-500/10 transition-all active:scale-95"
                >
                  {t('breakdown.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-gold-600 to-amber-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  {t('breakdown.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
