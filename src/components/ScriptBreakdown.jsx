import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';

export default function ScriptBreakdown() {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();
  
  const {
    activeScenes: scenes,
    addScene,
    updateScene,
    deleteScene,
    isLoading
  } = useProject();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntExt, setFilterIntExt] = useState('ALL');
  const [filterDayNight, setFilterDayNight] = useState('ALL');

  // Expanded Rows State
  const [expandedSceneId, setExpandedSceneId] = useState(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState(null);

  // Form Fields State
  const [formSceneNum, setFormSceneNum] = useState('');
  const [formSetting, setFormSetting] = useState('');
  const [formIntExt, setFormIntExt] = useState('INT');
  const [formDayNight, setFormDayNight] = useState('DAY');
  const [formDescTh, setFormDescTh] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formCastTh, setFormCastTh] = useState('');
  const [formCastEn, setFormCastEn] = useState('');
  const [formLocTh, setFormLocTh] = useState('');
  const [formLocEn, setFormLocEn] = useState('');
  const [formPropsTh, setFormPropsTh] = useState('');
  const [formPropsEn, setFormPropsEn] = useState('');
  const [formWardrobeTh, setFormWardrobeTh] = useState('');
  const [formWardrobeEn, setFormWardrobeEn] = useState('');
  const [formTechTh, setFormTechTh] = useState('');
  const [formTechEn, setFormTechEn] = useState('');
  const [formStatus, setFormStatus] = useState('pending');

  // Reset form helper
  const resetForm = () => {
    setFormSceneNum('');
    setFormSetting('');
    setFormIntExt('INT');
    setFormDayNight('DAY');
    setFormDescTh('');
    setFormDescEn('');
    setFormCastTh('');
    setFormCastEn('');
    setFormLocTh('');
    setFormLocEn('');
    setFormPropsTh('');
    setFormPropsEn('');
    setFormWardrobeTh('');
    setFormWardrobeEn('');
    setFormTechTh('');
    setFormTechEn('');
    setFormStatus('pending');
    setEditingScene(null);
  };

  // Open modal for adding
  const handleAddClick = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditClick = (scene, e) => {
    e.stopPropagation();
    setEditingScene(scene);
    setFormSceneNum(scene.scene_number || '');
    setFormSetting(scene.setting || '');
    setFormIntExt(scene.int_ext || 'INT');
    setFormDayNight(scene.day_night || 'DAY');
    setFormDescTh(scene.description?.th || '');
    setFormDescEn(scene.description?.en || '');
    setFormCastTh(scene.cast?.th || '');
    setFormCastEn(scene.cast?.en || '');
    setFormLocTh(scene.location?.th || '');
    setFormLocEn(scene.location?.en || '');
    setFormPropsTh(scene.props?.th || '');
    setFormPropsEn(scene.props?.en || '');
    setFormWardrobeTh(scene.wardrobe?.th || '');
    setFormWardrobeEn(scene.wardrobe?.en || '');
    setFormTechTh(scene.tech_notes?.th || '');
    setFormTechEn(scene.tech_notes?.en || '');
    setFormStatus(scene.status || 'pending');
    setIsModalOpen(true);
  };

  // Handle delete scene
  const handleDeleteClick = async (sceneId, e) => {
    e.stopPropagation();
    if (confirm(t('breakdown.deleteScene') + '?')) {
      try {
        await deleteScene(sceneId);
      } catch (err) {
        alert("Failed to delete scene: " + err.message);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formSceneNum || !formSetting) return;

    const sceneData = {
      scene_number: formSceneNum,
      setting: formSetting,
      int_ext: formIntExt,
      day_night: formDayNight,
      description: {
        th: formDescTh || formDescEn,
        en: formDescEn || formDescTh
      },
      cast: {
        th: formCastTh || formCastEn,
        en: formCastEn || formCastTh
      },
      location: {
        th: formLocTh || formLocEn,
        en: formLocEn || formLocTh
      },
      props: {
        th: formPropsTh || formPropsEn,
        en: formPropsEn || formPropsTh
      },
      wardrobe: {
        th: formWardrobeTh || formWardrobeEn,
        en: formWardrobeEn || formWardrobeTh
      },
      tech_notes: {
        th: formTechTh || formTechEn,
        en: formTechEn || formTechTh
      },
      status: formStatus
    };

    try {
      if (editingScene) {
        await updateScene({ ...editingScene, ...sceneData });
      } else {
        await addScene(sceneData);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Failed to save scene: " + err.message);
    }
  };

  const toggleRow = (sceneId) => {
    setExpandedSceneId(prev => (prev === sceneId ? null : sceneId));
  };

  // Filter scenes based on search & selectors
  const filteredScenes = scenes.filter((scene) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (scene.scene_number || '').toLowerCase().includes(searchLower) ||
      (scene.setting || '').toLowerCase().includes(searchLower) ||
      (scene.description?.th || '').toLowerCase().includes(searchLower) ||
      (scene.description?.en || '').toLowerCase().includes(searchLower) ||
      (scene.location?.th || '').toLowerCase().includes(searchLower) ||
      (scene.location?.en || '').toLowerCase().includes(searchLower) ||
      (scene.cast?.th || '').toLowerCase().includes(searchLower) ||
      (scene.cast?.en || '').toLowerCase().includes(searchLower);

    const matchesIntExt = filterIntExt === 'ALL' || scene.int_ext === filterIntExt;
    const matchesDayNight = filterDayNight === 'ALL' || scene.day_night === filterDayNight;

    return matchesSearch && matchesIntExt && matchesDayNight;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/30 dark:border-obsidian-850 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <Clapperboard className="text-gold-500" />
            <span>{t('nav.scriptBreakdown')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'th' ? 'ระบุอุปกรณ์ นักแสดง โลเคชั่น และบันทึกทางเทคนิคของแต่ละช็อต' : 'Define props, cast, settings, and technical requirements per scene'}
          </p>
        </div>
        {hasWriteAccess() && (
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-98"
          >
            <Plus size={16} />
            <span>{t('breakdown.addScene')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('common.search')}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
              theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <SlidersHorizontal size={14} />
            <span>{t('common.filter')}:</span>
          </div>

          {/* INT / EXT filter */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200/50 dark:border-obsidian-850">
            {['ALL', 'INT', 'EXT'].map(type => (
              <button
                key={type}
                onClick={() => setFilterIntExt(type)}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  filterIntExt === type
                    ? 'bg-gold-500/15 text-gold-500 font-extrabold'
                    : theme === 'dark'
                      ? 'bg-obsidian-900 text-slate-450 hover:bg-obsidian-800'
                      : 'bg-white text-slate-650 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* DAY / NIGHT filter */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200/50 dark:border-obsidian-850">
            {['ALL', 'DAY', 'NIGHT'].map(time => (
              <button
                key={time}
                onClick={() => setFilterDayNight(time)}
                className={`px-3 py-1.5 text-xs font-bold transition-all ${
                  filterDayNight === time
                    ? 'bg-gold-500/15 text-gold-500 font-extrabold'
                    : theme === 'dark'
                      ? 'bg-obsidian-900 text-slate-450 hover:bg-obsidian-800'
                      : 'bg-white text-slate-650 hover:bg-slate-50'
                }`}
              >
                {time === 'ALL' ? 'ALL' : (time === 'DAY' ? 'DAY ☀️' : 'NIGHT 🌙')}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Loading state */}
      {isLoading && scenes.length === 0 ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold-500" />
          <p className="text-xs text-slate-400 font-medium">
            {language === 'th' ? 'กำลังโหลดรายละเอียดบทถ่ายทำ...' : 'Loading script breakdown...'}
          </p>
        </div>
      ) : scenes.length === 0 ? (
        // Empty State UI
        <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-xl mx-auto border border-dashed border-slate-350 dark:border-obsidian-800">
          <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
            <Clapperboard size={32} />
          </div>
          <h3 className="text-lg font-bold font-serif">{language === 'th' ? 'ยังไม่มีฉากถ่ายทำในบทภาพยนตร์' : 'No Scenes in Breakdown'}</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            {language === 'th' 
              ? 'เริ่มต้นแจกแจงฉากของคุณ ระบุพิกัดสถานที่ถ่ายทำ ตัวละครที่เข้ากล้อง เสื้อผ้า พร็อพ และบันทึกรายละเอียดทางเทคนิคของกล้องและแสงไฟ' 
              : 'Add your first scene breakdown to list props, cast members, wardrobes, camera specs, and location notes.'}
          </p>
          {hasWriteAccess() && (
            <button
              onClick={handleAddClick}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              + {t('breakdown.addScene')}
            </button>
          )}
        </div>
      ) : (
        /* Scenes Table */
        <div className="glass-panel rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'bg-obsidian-900/50 border-obsidian-800/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <th className="py-3.5 px-4 w-20">{t('breakdown.sceneNum')}</th>
                  <th className="py-3.5 px-4 w-28">Type</th>
                  <th className="py-3.5 px-4">{t('breakdown.sceneTitle')}</th>
                  <th className="py-3.5 px-4">{t('breakdown.location')}</th>
                  <th className="py-3.5 px-4">{t('breakdown.cast')}</th>
                  <th className="py-3.5 px-4 w-24">Status</th>
                  <th className="py-3.5 px-4 text-right no-print">{t('breakdown.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-obsidian-800/40">
                {filteredScenes.map((scene) => {
                  const isExpanded = expandedSceneId === scene.id;
                  return (
                    <React.Fragment key={scene.id}>
                      <tr 
                        onClick={() => toggleRow(scene.id)}
                        className={`hover:bg-slate-100/30 dark:hover:bg-obsidian-800/20 transition-all cursor-pointer ${
                          isExpanded ? 'bg-slate-100/20 dark:bg-obsidian-800/10' : ''
                        }`}
                      >
                        <td className="py-4 px-4 font-mono font-bold text-gold-500">
                          {scene.scene_number}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              scene.int_ext === 'INT' 
                                ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {scene.int_ext}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              scene.day_night === 'DAY'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                            }`}>
                              {scene.day_night}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-sm">
                          {scene.setting}
                        </td>
                        <td className="py-4 px-4 text-xs">
                          {scene.location?.[language] || scene.location?.en || '-'}
                        </td>
                        <td className="py-4 px-4 text-xs font-medium text-slate-400">
                          {scene.cast?.[language] || scene.cast?.en || '-'}
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            scene.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : scene.status === 'shooting'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {scene.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right no-print" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {hasWriteAccess() && (
                              <>
                                <button
                                  onClick={(e) => handleEditClick(scene, e)}
                                  className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors ${
                                    theme === 'dark' ? 'text-slate-400 hover:text-gold-500' : 'text-slate-600 hover:text-gold-600'
                                  }`}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteClick(scene.id, e)}
                                  className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors ${
                                    theme === 'dark' ? 'text-slate-400 hover:text-red-500' : 'text-slate-600 hover:text-red-600'
                                  }`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => toggleRow(scene.id)}
                              className="p-1 text-slate-400 hover:text-slate-200"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Scene Details */}
                      {isExpanded && (
                        <tr className="bg-slate-100/10 dark:bg-obsidian-900/20">
                          <td colSpan="7" className="p-4 border-t dark:border-obsidian-800/40">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs animate-slideDown">
                              
                              {/* Description and Cast */}
                              <div className="space-y-3">
                                <div>
                                  <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Info size={12} className="text-gold-500" />
                                    <span>{t('breakdown.sceneTitle')}</span>
                                  </p>
                                  <p className="text-slate-300 text-sm leading-relaxed">{scene.description?.[language] || scene.description?.en || ''}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('breakdown.cast')}</p>
                                  <p className="font-medium text-slate-200">{scene.cast?.[language] || scene.cast?.en || '-'}</p>
                                </div>
                              </div>

                              {/* Props & Wardrobe */}
                              <div className="space-y-3">
                                <div>
                                  <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('breakdown.props')}</p>
                                  <p className="text-slate-300 leading-relaxed">{scene.props?.[language] || scene.props?.en || '-'}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('breakdown.wardrobe')}</p>
                                  <p className="text-slate-300 leading-relaxed">{scene.wardrobe?.[language] || scene.wardrobe?.en || '-'}</p>
                                </div>
                              </div>

                              {/* Technical Notes */}
                              <div>
                                <p className="font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('breakdown.techNotes')}</p>
                                <div className={`p-3 rounded-lg border leading-relaxed ${
                                  theme === 'dark' 
                                    ? 'bg-obsidian-950/60 border-obsidian-800/40 text-slate-300' 
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}>
                                  {scene.tech_notes?.[language] || scene.tech_notes?.en || '-'}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Breakdown Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col ${
            theme === 'dark' ? 'bg-obsidian-900 border-obsidian-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-inherit flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <Sparkles size={18} className="text-gold-500" />
                <span>{editingScene ? t('breakdown.editSceneTitle') : t('breakdown.formTitle')}</span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-obsidian-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Scene Number & Setting & Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.sceneNum')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSceneNum}
                    onChange={(e) => setFormSceneNum(e.target.value)}
                    placeholder="e.g. 1, 2A, 14"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {language === 'th' ? 'สลักหัวฉาก (Slugline / Setting)' : 'Slugline / Setting'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSetting}
                    onChange={(e) => setFormSetting(e.target.value)}
                    placeholder="e.g. INT. COFFEE SHOP - NIGHT"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {language === 'th' ? 'สถานะฉาก' : 'Scene Status'}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <option value="pending">{language === 'th' ? 'รอถ่ายทำ (Pending)' : 'Pending'}</option>
                    <option value="shooting">{language === 'th' ? 'กำลังถ่ายทำ (Shooting)' : 'Shooting'}</option>
                    <option value="completed">{language === 'th' ? 'ถ่ายเสร็จแล้ว (Completed)' : 'Completed'}</option>
                  </select>
                </div>
              </div>

              {/* INT/EXT and DAY/NIGHT */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.intExt')}
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-obsidian-850">
                    {['INT', 'EXT'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormIntExt(type)}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${
                          formIntExt === type
                            ? 'bg-gold-500/15 text-gold-500 font-extrabold'
                            : theme === 'dark' ? 'bg-obsidian-950 text-slate-400 hover:bg-obsidian-800' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.dayNight')}
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-obsidian-850">
                    {['DAY', 'NIGHT'].map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormDayNight(time)}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${
                          formDayNight === time
                            ? 'bg-gold-500/15 text-gold-500 font-extrabold'
                            : theme === 'dark' ? 'bg-obsidian-950 text-slate-400 hover:bg-obsidian-800' : 'bg-slate-50 text-slate-650 hover:bg-slate-100'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description TH & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {language === 'th' ? 'คำอธิบายฉาก (ภาษาไทย)' : 'Description (Thai version)'}
                  </label>
                  <textarea
                    rows="3"
                    value={formDescTh}
                    onChange={(e) => setFormDescTh(e.target.value)}
                    placeholder={t('breakdown.scenePlaceholder')}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Description (English version) *
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Describe actions or events in English..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Cast & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.cast')} (TH / EN)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formCastTh}
                      onChange={(e) => setFormCastTh(e.target.value)}
                      placeholder="โบว์, นก"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                    <input
                      type="text"
                      value={formCastEn}
                      onChange={(e) => setFormCastEn(e.target.value)}
                      placeholder="Bow, Nok"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.location')} (TH / EN)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formLocTh}
                      onChange={(e) => setFormLocTh(e.target.value)}
                      placeholder="ร้านกาแฟบีทีเอส"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                    <input
                      type="text"
                      value={formLocEn}
                      onChange={(e) => setFormLocEn(e.target.value)}
                      placeholder="Skytrain Café"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Props & Wardrobe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.props')} (TH / EN)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formPropsTh}
                      onChange={(e) => setFormPropsTh(e.target.value)}
                      placeholder="กระเป๋าเป้สีแดง"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                    <input
                      type="text"
                      value={formPropsEn}
                      onChange={(e) => setFormPropsEn(e.target.value)}
                      placeholder="Red backpack"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.wardrobe')} (TH / EN)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formWardrobeTh}
                      onChange={(e) => setFormWardrobeTh(e.target.value)}
                      placeholder="เสื้อกันหนาวหนังดำ"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                    <input
                      type="text"
                      value={formWardrobeEn}
                      onChange={(e) => setFormWardrobeEn(e.target.value)}
                      placeholder="Black leather jacket"
                      className={`w-1/2 px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Technical Notes (TH / EN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t('breakdown.techNotes')} (ภาษาไทย)
                  </label>
                  <input
                    type="text"
                    value={formTechTh}
                    onChange={(e) => setFormTechTh(e.target.value)}
                    placeholder="กล้องมือถือวิ่งตามตัวแสดง..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Technical Notes (English)
                  </label>
                  <input
                    type="text"
                    value={formTechEn}
                    onChange={(e) => setFormTechEn(e.target.value)}
                    placeholder="Handheld tracking shots, prime lens..."
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-100' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-inherit shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
                    theme === 'dark'
                      ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-400 hover:text-slate-100'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {t('breakdown.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-gold-600 to-amber-500 hover:from-gold-500 hover:to-amber-400 text-white shadow-md transition-all"
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
