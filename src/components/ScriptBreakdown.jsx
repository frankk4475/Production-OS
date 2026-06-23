import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Info,
  Clapperboard,
  Loader2,
  Printer,
  FileText,
  Tag,
  Minus,
  Check
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
  const { currentProject: project, activeScenes: scenes, addScene, updateScene, deleteScene, isLoading, scriptBlocks } = useProject();

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
      setSelectedSceneId(sorted[0].id);
    }
  }, [scenes, selectedSceneId]);

  const activeScene = scenes.find(s => s.id === selectedSceneId) || scenes[0] || null;

  const blockTypes = {
    heading: { class: 'font-mono font-extrabold uppercase tracking-wider text-slate-805 dark:text-white pl-4 border-l-4 border-slate-500 mt-6 mb-3 text-left' },
    action: { class: 'font-mono text-slate-700 dark:text-slate-350 mt-3 mb-3 text-left leading-relaxed' },
    character: { class: 'font-mono font-bold text-gold-600 dark:text-gold-400 uppercase tracking-widest mt-4 mb-1 text-center' },
    parenthetical: { class: 'font-mono text-slate-500 dark:text-slate-400 italic mt-1 mb-1 text-center' },
    dialogue: { class: 'font-mono text-slate-800 dark:text-slate-200 mt-1.5 mb-2 mx-auto max-w-[85%] text-center' },
    transition: { class: 'font-mono font-bold text-amber-600 dark:text-amber-500 uppercase mt-4 mb-4 text-right pr-4 border-r-4 border-amber-500' }
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

  const handleTextSelection = (block, e) => {
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
    <div className="space-y-6 animate-fadeIn pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200/30 dark:border-obsidian-850 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Clapperboard className="text-gold-500" /> 
            <span>{t('nav.scriptBreakdown')}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className={`p-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'bg-obsidian-900 border-obsidian-850' : 'bg-white border-slate-200'}`}><Printer size={14} /> Print</button>
          {hasWriteAccess() && (
            <button onClick={handleAddClick} className="px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs rounded-lg shadow-sm">+ {t('breakdown.addScene')}</button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200/30 dark:border-obsidian-850 pb-px no-print">
        <button onClick={() => setActiveSubTab('summary')} className={`pb-3 text-sm font-bold border-b-2 ${activeSubTab === 'summary' ? 'border-gold-500 text-gold-500' : 'border-transparent text-slate-400'}`}><FileText size={16} /> Summary Sheet</button>
        <button onClick={() => setActiveSubTab('tagging')} className={`pb-3 text-sm font-bold border-b-2 ${activeSubTab === 'tagging' ? 'border-gold-500 text-gold-500' : 'border-transparent text-slate-400'}`}><Tag size={16} /> Tagging Editor</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 glass-panel p-4 rounded-xl border no-print">
          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {filteredScenes.map(scene => (
              <div key={scene.id} onClick={() => setSelectedSceneId(scene.id)} className={`p-2.5 rounded-lg border cursor-pointer ${scene.id === selectedSceneId ? 'ring-2 ring-gold-500' : ''}`}>
                <div className="text-[10px] font-black text-gold-500">SCENE {scene.scene_number} ({scene.pages || '1/8'} pgs)</div>
                <div className="text-xs font-bold truncate">{scene.setting}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeSubTab === 'summary' && activeScene && (
            <div className={`p-8 border rounded-2xl text-left ${theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-2xl font-black font-serif uppercase">{activeScene.setting}</h2>
                  <p className="text-xs text-slate-400 mt-1">Location: {activeScene.location?.[language] || activeScene.location?.en || '-'}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-black text-gold-500">{activeScene.int_ext} / {activeScene.day_night}</span>
                  <p className="text-xs text-slate-400 font-mono mt-1">Length: {activeScene.pages || '1/8'} pgs</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {ELEMENT_CATEGORIES.map(category => {
                  const elements = activeSceneElements.filter(el => el.category === category.id);
                  if (elements.length === 0) return null;
                  return (
                    <div key={category.id} className="p-4 rounded-xl border bg-slate-50 dark:bg-obsidian-950/20 border-slate-200/50 dark:border-obsidian-850">
                      <div className="text-xs font-extrabold mb-2 border-b pb-1 text-slate-500 uppercase">{language === 'th' ? category.labelTh : category.label}</div>
                      <ul className="text-xs space-y-1">
                        {elements.map(i => <li key={i.id}>• {i.name} {i.qty > 1 && `(x${i.qty})`}</li>)}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === 'tagging' && activeScene && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 text-left">
              <div className="xl:col-span-3 p-8 border rounded-2xl min-h-[500px] relative">
                {activeSceneBlocks.map(block => (
                  <div key={block.id} id={`block-viewer-${block.id}`} onMouseUp={(e) => handleTextSelection(block, e)} className={`p-1 ${blockTypes[block.type]?.class}`}>
                    {renderHighlightText(block, activeSceneElements)}
                  </div>
                ))}
                {activeSceneBlocks.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-10 text-center">No script text. Write screenplay headers in the Editor.</p>
                )}

                {popoverState.isOpen && (
                  <div 
                    className={`absolute z-50 w-64 p-4 rounded-xl border shadow-2xl ${theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-white border-slate-200'}`}
                    style={{ left: `${popoverState.coords.x - 20}px`, top: `${popoverState.coords.y - 120}px` }}
                  >
                    <div className="flex justify-between items-center pb-1 border-b mb-2">
                      <span className="text-[10px] font-bold text-gold-500">Tag Element</span>
                      <button onClick={() => setPopoverState({ ...popoverState, isOpen: false })} className="text-slate-400">X</button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <input value={popoverState.name} onChange={(e) => setPopoverState({ ...popoverState, name: e.target.value })} className="w-full border p-1 rounded bg-transparent" />
                      <div className="flex gap-2">
                        <select value={popoverState.category} onChange={(e) => setPopoverState({ ...popoverState, category: e.target.value })} className="w-2/3 border p-1 rounded bg-obsidian-900 text-white">
                          {ELEMENT_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                        </select>
                        <input type="number" min="1" value={popoverState.qty} onChange={(e) => setPopoverState({ ...popoverState, qty: Number(e.target.value) })} className="w-1/3 border p-1 rounded bg-transparent" />
                      </div>
                      <div className="flex gap-2">
                        {popoverState.id && <button onClick={handleRemovePopoverTag} className="flex-1 bg-red-600/20 text-red-500 py-1 rounded">Remove</button>}
                        <button onClick={handleSavePopoverTag} className="flex-1 bg-gold-500 text-white py-1 rounded">Save</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="xl:col-span-1 glass-panel p-4 rounded-xl border space-y-4">
                <div className="text-xs font-bold border-b pb-1 text-slate-400">ELEMENT CATEGORIES</div>
                {ELEMENT_CATEGORIES.map(cat => {
                  const catItems = activeSceneElements.filter(i => i.category === cat.id);
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{cat.label} ({catItems.length})</span>
                        <button onClick={() => setSidebarAddCategory(cat.id)} className="text-gold-500 text-[10px]">+ Add</button>
                      </div>
                      {sidebarAddCategory === cat.id && (
                        <form onSubmit={handleAddSidebarItem} className="flex gap-1 border p-1 rounded">
                          <input required value={sidebarItemName} onChange={(e) => setSidebarItemName(e.target.value)} placeholder="Item..." className="w-2/3 text-xs p-1" />
                          <button type="submit" className="w-1/3 bg-gold-500 text-white text-[10px] rounded">Add</button>
                        </form>
                      )}
                      <ul className="text-xs pl-2 text-slate-450 space-y-1">
                        {catItems.map(i => (
                          <li key={i.id} className="flex justify-between items-center">
                            <span>• {i.name} {i.qty > 1 && `(x${i.qty})`}</span>
                            <button onClick={() => handleDeleteTag(i.id)} className="text-slate-405 hover:text-red-500">x</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs no-print">
          <div className={`w-full max-w-xl rounded-xl shadow-2xl border p-6 text-left ${theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-lg font-bold font-serif mb-4 flex items-center gap-2"><Sparkles className="text-gold-500" /> {editingScene ? 'Edit Scene' : 'Add Scene'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Scene Number" value={formSceneNum} onChange={e => setFormSceneNum(e.target.value)} className="w-full border p-2 rounded bg-transparent text-slate-900 dark:text-slate-100" />
                <input required placeholder="Slugline / Setting" value={formSetting} onChange={e => setFormSetting(e.target.value)} className="w-full border p-2 rounded bg-transparent text-slate-900 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <select value={formIntExt} onChange={e => setFormIntExt(e.target.value)} className="border p-2 rounded bg-slate-100 dark:bg-obsidian-900 text-slate-900 dark:text-slate-100">
                  <option value="INT">INT</option>
                  <option value="EXT">EXT</option>
                  <option value="INT/EXT">INT/EXT</option>
                </select>
                <select value={formDayNight} onChange={e => setFormDayNight(e.target.value)} className="border p-2 rounded bg-slate-100 dark:bg-obsidian-900 text-slate-900 dark:text-slate-100">
                  <option value="DAY">DAY</option>
                  <option value="NIGHT">NIGHT</option>
                  <option value="DUSK">DUSK</option>
                  <option value="DAWN">DAWN</option>
                </select>
                <input placeholder="Pages (e.g. 5/8)" value={formPages} onChange={e => setFormPages(e.target.value)} className="border p-2 rounded bg-transparent text-slate-905 dark:text-slate-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Location (TH)" value={formLocTh} onChange={e => setFormLocTh(e.target.value)} className="border p-2 rounded bg-transparent text-slate-900 dark:text-slate-100" />
                <input placeholder="Cast (TH)" value={formCastTh} onChange={e => setFormCastTh(e.target.value)} className="border p-2 rounded bg-transparent text-slate-900 dark:text-slate-100" />
              </div>
              <textarea placeholder="Description" rows="3" value={formDescTh} onChange={e => setFormDescTh(e.target.value)} className="w-full border p-2 rounded bg-transparent text-slate-900 dark:text-slate-100" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="border px-4 py-2 rounded text-slate-900 dark:text-slate-100">Cancel</button>
                <button type="submit" className="bg-gold-500 text-white px-5 py-2 rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
