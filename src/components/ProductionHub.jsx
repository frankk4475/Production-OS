import { useState, useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Camera, 
  Volume2, 
  HardDrive, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  AlertCircle,
  FileText,
  CloudSun
} from 'lucide-react';

export default function ProductionHub() {
  const { productionReports, saveProductionReports, activeScenes } = useProject();
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  // Sub-tabs: 'camera', 'sound', 'dit', 'daily'
  const [activeSubTab, setActiveSubTab] = useState('camera');
  
  // Filter states
  const [filterScene, setFilterScene] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [cameraForm, setCameraForm] = useState({
    scene: '',
    take: '',
    roll: '',
    clipName: '',
    lens: '',
    aperture: '',
    iso: '800',
    shutter: '180°',
    kelvin: '5600K',
    filter: '',
    fps: '24',
    focus: '',
    height: '',
    tilt: '',
    soundRoll: '',
    status: 'Good',
    notes: ''
  });

  const [soundForm, setSoundForm] = useState({
    scene: '',
    take: '',
    roll: '',
    fileName: '',
    sampleRate: '48 kHz',
    bitDepth: '24-bit',
    syncStatus: 'Sync',
    track1: 'Mix L',
    track2: 'Mix R',
    track3: 'Boom',
    track4: 'Lav 1',
    track5: 'Lav 2',
    status: 'Good',
    notes: ''
  });

  const [ditForm, setDitForm] = useState({
    cardName: '',
    slot: 'A',
    size: '',
    fileFormat: 'ProRes 4444',
    aspectRatio: '1.85:1',
    lut: 'Rec709',
    backupA: false,
    backupB: false,
    checksum: 'Verified',
    notes: ''
  });

  const [dailyForm, setDailyForm] = useState({
    date: new Date().toISOString().split('T')[0],
    dayNum: '1',
    weather: 'Sunny',
    callTime: '06:00',
    firstShot: '08:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
    wrapTime: '18:00',
    rollsUsed: '',
    scenesShot: '',
    crewCount: '',
    generalNotes: ''
  });

  // Filtered reports
  const filteredReports = useMemo(() => {
    return productionReports.filter(r => {
      if (r.type !== activeSubTab) return false;
      
      // Filter by scene
      if (filterScene !== 'all') {
        if (activeSubTab === 'camera' || activeSubTab === 'sound') {
          if (r.scene !== filterScene) return false;
        }
      }

      // Filter by status
      if (filterStatus !== 'all') {
        if (activeSubTab === 'camera' || activeSubTab === 'sound') {
          if (r.status !== filterStatus) return false;
        } else if (activeSubTab === 'dit') {
          if (r.checksum !== filterStatus) return false;
        }
      }

      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (activeSubTab === 'camera') {
          return (
            r.roll?.toLowerCase().includes(term) ||
            r.clipName?.toLowerCase().includes(term) ||
            r.notes?.toLowerCase().includes(term) ||
            r.lens?.toLowerCase().includes(term) ||
            r.soundRoll?.toLowerCase().includes(term)
          );
        } else if (activeSubTab === 'sound') {
          return (
            r.roll?.toLowerCase().includes(term) ||
            r.fileName?.toLowerCase().includes(term) ||
            r.notes?.toLowerCase().includes(term) ||
            r.syncStatus?.toLowerCase().includes(term)
          );
        } else if (activeSubTab === 'dit') {
          return (
            r.cardName?.toLowerCase().includes(term) ||
            r.fileFormat?.toLowerCase().includes(term) ||
            r.lut?.toLowerCase().includes(term) ||
            r.notes?.toLowerCase().includes(term)
          );
        } else if (activeSubTab === 'daily') {
          return (
            r.weather?.toLowerCase().includes(term) ||
            r.generalNotes?.toLowerCase().includes(term) ||
            r.date?.includes(term)
          );
        }
      }

      return true;
    });
  }, [productionReports, activeSubTab, filterScene, filterStatus, searchTerm]);

  // Handle adding camera log
  const handleAddCamera = (e) => {
    e.preventDefault();
    if (!cameraForm.scene || !cameraForm.take) {
      alert(language === 'th' ? 'กรุณากรอกข้อมูลฉากและเทค' : 'Please fill in Scene and Take');
      return;
    }

    const newLog = {
      id: `cam-${Date.now()}`,
      type: 'camera',
      created_at: new Date().toISOString(),
      ...cameraForm
    };

    saveProductionReports([...productionReports, newLog]);
    setCameraForm(prev => {
      const currentTake = prev.take ? parseInt(prev.take) : 0;
      const nextTake = (currentTake + 1).toString();
      
      // Auto-increment clip name file name matching standard digital workflows (e.g. A001_C001 -> A001_C002)
      let nextClip = prev.clipName;
      if (prev.clipName && prev.clipName.match(/_C\d+/)) {
        nextClip = prev.clipName.replace(/_C(\d+)/, (match, p1) => {
          const num = parseInt(p1) + 1;
          return `_C${num.toString().padStart(3, '0')}`;
        });
      }

      return {
        ...prev,
        take: nextTake,
        clipName: nextClip,
        notes: ''
      };
    });
  };

  // Handle adding sound log
  const handleAddSound = (e) => {
    e.preventDefault();
    if (!soundForm.scene || !soundForm.take) {
      alert(language === 'th' ? 'กรุณากรอกข้อมูลฉากและเทค' : 'Please fill in Scene and Take');
      return;
    }

    const newLog = {
      id: `snd-${Date.now()}`,
      type: 'sound',
      created_at: new Date().toISOString(),
      ...soundForm
    };

    saveProductionReports([...productionReports, newLog]);
    setSoundForm(prev => {
      const currentTake = prev.take ? parseInt(prev.take) : 0;
      const nextTake = (currentTake + 1).toString();

      let nextFile = prev.fileName;
      if (prev.fileName && prev.fileName.match(/_T\d+/)) {
        nextFile = prev.fileName.replace(/_T(\d+)/, (match, p1) => {
          const num = parseInt(p1) + 1;
          return `_T${num.toString().padStart(3, '0')}`;
        });
      }

      return {
        ...prev,
        take: nextTake,
        fileName: nextFile,
        notes: ''
      };
    });
  };

  // Handle adding DIT/Media log
  const handleAddDit = (e) => {
    e.preventDefault();
    if (!ditForm.cardName) {
      alert(language === 'th' ? 'กรุณากรอกชื่อการ์ด' : 'Please fill in Card ID');
      return;
    }

    const newLog = {
      id: `dit-${Date.now()}`,
      type: 'dit',
      created_at: new Date().toISOString(),
      ...ditForm
    };

    saveProductionReports([...productionReports, newLog]);
    setDitForm({
      cardName: '',
      slot: 'A',
      size: '',
      fileFormat: 'ProRes 4444',
      aspectRatio: '1.85:1',
      lut: 'Rec709',
      backupA: false,
      backupB: false,
      checksum: 'Verified',
      notes: ''
    });
  };

  // Handle adding Daily log
  const handleAddDaily = (e) => {
    e.preventDefault();
    const newLog = {
      id: `day-${Date.now()}`,
      type: 'daily',
      created_at: new Date().toISOString(),
      ...dailyForm
    };

    saveProductionReports([...productionReports, newLog]);
  };

  // Handle delete log
  const handleDeleteLog = (id) => {
    if (window.confirm(language === 'th' ? 'ต้องการลบรายการนี้ใช่หรือไม่?' : 'Are you sure you want to delete this log?')) {
      const updated = productionReports.filter(r => r.id !== id);
      saveProductionReports(updated);
    }
  };

  // Export filtered logs to CSV
  const handleExportCsv = () => {
    if (filteredReports.length === 0) return;

    let headers = [];
    let rows = [];

    if (activeSubTab === 'camera') {
      headers = ['Scene', 'Take', 'Roll', 'Clip/File Name', 'Lens mm', 'Aperture', 'ISO', 'Shutter', 'Kelvin', 'Filter', 'FPS', 'Focus', 'Cam Height', 'Cam Tilt', 'Sound Roll Sync', 'Status', 'Notes', 'Created At'];
      rows = filteredReports.map(r => [
        r.scene, r.take, r.roll, r.clipName, r.lens, r.aperture, r.iso, r.shutter, r.kelvin, r.filter, r.fps, r.focus, r.height, r.tilt, r.soundRoll, r.status, r.notes, r.created_at
      ]);
    } else if (activeSubTab === 'sound') {
      headers = ['Scene', 'Take', 'Sound Roll', 'File Name', 'Sample Rate', 'Bit Depth', 'Type', 'Track 1', 'Track 2', 'Track 3', 'Track 4', 'Track 5', 'Status', 'Notes', 'Created At'];
      rows = filteredReports.map(r => [
        r.scene, r.take, r.roll, r.fileName, r.sampleRate, r.bitDepth, r.syncStatus, r.track1, r.track2, r.track3, r.track4, r.track5, r.status, r.notes, r.created_at
      ]);
    } else if (activeSubTab === 'dit') {
      headers = ['Card ID', 'Slot', 'Size GB', 'Format', 'Aspect Ratio', 'LUT', 'Backup A', 'Backup B', 'Checksum Status', 'Notes', 'Created At'];
      rows = filteredReports.map(r => [
        r.cardName, r.slot, r.size, r.fileFormat, r.aspectRatio, r.lut, r.backupA ? 'Yes' : 'No', r.backupB ? 'Yes' : 'No', r.checksum, r.notes, r.created_at
      ]);
    } else if (activeSubTab === 'daily') {
      headers = ['Date', 'Day #', 'Weather', 'Call Time', 'First Shot', 'Lunch Start', 'Lunch End', 'Wrap Time', 'Rolls Used', 'Scenes Shot', 'Crew Count', 'General Notes', 'Created At'];
      rows = filteredReports.map(r => [
        r.date, r.dayNum, r.weather, r.callTime, r.firstShot, r.lunchStart, r.lunchEnd, r.wrapTime, r.rollsUsed, r.scenesShot, r.crewCount, r.generalNotes, r.created_at
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `production_${activeSubTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const isDark = theme === 'dark';

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-obsidian-800/40 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-serif text-slate-100 dark:text-slate-100 flex items-center gap-3">
            <Camera className="text-gold-500" size={32} />
            {t('prod.hubTitle')}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-400 mt-1">
            {language === 'th' ? 'บันทึกความคืบหน้า รายงานกล้อง เสียง และข้อมูลดีไอทีหน้ากองถ่ายถ่ายทำ' : 'Log camera, audio, DIT, and production progress live on set'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className={`flex rounded-lg p-1 border overflow-x-auto ${isDark ? 'bg-obsidian-900/60 border-obsidian-800/40' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { id: 'camera', label: t('prod.cameraTab'), icon: Camera },
            { id: 'sound', label: t('prod.soundTab'), icon: Volume2 },
            { id: 'dit', label: t('prod.ditTab'), icon: HardDrive },
            { id: 'daily', label: t('prod.dailyTab'), icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setFilterScene('all');
                setFilterStatus('all');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? isDark 
                    ? 'bg-gold-500/20 border border-gold-500/30 text-gold-500' 
                    : 'bg-white shadow-sm border border-slate-200 text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Form Container */}
        <div className={`lg:col-span-1 border rounded-xl p-5 ${isDark ? 'bg-obsidian-900/40 border-obsidian-800/40' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-bold font-serif text-slate-100 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-gold-500" />
            {language === 'th' ? `เพิ่มบันทึก ${activeSubTab === 'camera' ? 'กล้อง' : activeSubTab === 'sound' ? 'เสียง' : activeSubTab === 'dit' ? 'ดีไอที' : 'รายงานประจำวัน'}` : `Add New ${activeSubTab.toUpperCase()} Log`}
          </h2>

          {/* Render Camera Form */}
          {activeSubTab === 'camera' && (
            <form onSubmit={handleAddCamera} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.sceneNum')} *</label>
                  <select
                    value={cameraForm.scene}
                    onChange={e => setCameraForm(prev => ({ ...prev, scene: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">-- Pick --</option>
                    {(activeScenes || []).map(sc => (
                      <option key={sc.id} value={sc.scene_number}>{sc.scene_number}</option>
                    ))}
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {cameraForm.scene === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Scene #"
                      onChange={e => setCameraForm(prev => ({ ...prev, scene: e.target.value }))}
                      className={`w-full text-sm rounded border p-2 mt-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.takeNum')} *</label>
                  <input
                    type="number"
                    placeholder="Take #"
                    value={cameraForm.take}
                    onChange={e => setCameraForm(prev => ({ ...prev, take: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.roll')}</label>
                  <input
                    type="text"
                    placeholder="e.g. A001"
                    value={cameraForm.roll}
                    onChange={e => setCameraForm(prev => ({ ...prev, roll: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.clipName')}</label>
                  <input
                    type="text"
                    placeholder="e.g. A001_C001"
                    value={cameraForm.clipName}
                    onChange={e => setCameraForm(prev => ({ ...prev, clipName: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.lens')}</label>
                  <input
                    type="text"
                    placeholder="50mm"
                    value={cameraForm.lens}
                    onChange={e => setCameraForm(prev => ({ ...prev, lens: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.aperture')}</label>
                  <input
                    type="text"
                    placeholder="T2.8"
                    value={cameraForm.aperture}
                    onChange={e => setCameraForm(prev => ({ ...prev, aperture: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.filter')}</label>
                  <input
                    type="text"
                    placeholder="ND 0.9"
                    value={cameraForm.filter}
                    onChange={e => setCameraForm(prev => ({ ...prev, filter: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ISO</label>
                  <input
                    type="text"
                    placeholder="800"
                    value={cameraForm.iso}
                    onChange={e => setCameraForm(prev => ({ ...prev, iso: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Shutter</label>
                  <input
                    type="text"
                    placeholder="180°"
                    value={cameraForm.shutter}
                    onChange={e => setCameraForm(prev => ({ ...prev, shutter: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.kelvin')}</label>
                  <input
                    type="text"
                    placeholder="5600K"
                    value={cameraForm.kelvin}
                    onChange={e => setCameraForm(prev => ({ ...prev, kelvin: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">FPS</label>
                  <input
                    type="text"
                    placeholder="24"
                    value={cameraForm.fps}
                    onChange={e => setCameraForm(prev => ({ ...prev, fps: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.focus')}</label>
                  <input
                    type="text"
                    placeholder="5ft"
                    value={cameraForm.focus}
                    onChange={e => setCameraForm(prev => ({ ...prev, focus: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.soundRoll')}</label>
                  <input
                    type="text"
                    placeholder="e.g. S001"
                    value={cameraForm.soundRoll}
                    onChange={e => setCameraForm(prev => ({ ...prev, soundRoll: e.target.value }))}
                    className={`w-full text-xs rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.height')}</label>
                  <input
                    type="text"
                    placeholder="e.g. 120cm"
                    value={cameraForm.height}
                    onChange={e => setCameraForm(prev => ({ ...prev, height: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.camera.tilt')}</label>
                  <input
                    type="text"
                    placeholder="e.g. -5°"
                    value={cameraForm.tilt}
                    onChange={e => setCameraForm(prev => ({ ...prev, tilt: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.status')}</label>
                <div className="flex gap-2">
                  {['Good', 'No Good', 'Keep', 'Waste'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCameraForm(prev => ({ ...prev, status: st }))}
                      className={`flex-1 text-xs py-2 rounded font-semibold transition-all border ${
                        cameraForm.status === st
                          ? st === 'Good'
                            ? 'bg-gold-500/20 border-gold-500 text-gold-500'
                            : st === 'No Good'
                              ? 'bg-red-500/20 border-red-500 text-red-500'
                              : st === 'Keep'
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                                : 'bg-slate-500/20 border-slate-500 text-slate-400'
                          : 'border-slate-800/40 text-slate-400'
                      }`}
                    >
                      {st === 'Good' ? t('prod.good') : st === 'No Good' ? t('prod.noGood') : st === 'Keep' ? t('prod.keep') : (language === 'th' ? 'เสียเปล่า (Waste)' : 'Waste')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.notes')}</label>
                <textarea
                  rows={2}
                  placeholder="..."
                  value={cameraForm.notes}
                  onChange={e => setCameraForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gold-500 text-slate-900 rounded py-2.5 font-bold text-sm hover:bg-gold-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {t('prod.saveLog')}
              </button>
            </form>
          )}

          {/* Render Sound Form */}
          {activeSubTab === 'sound' && (
            <form onSubmit={handleAddSound} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.sceneNum')} *</label>
                  <select
                    value={soundForm.scene}
                    onChange={e => setSoundForm(prev => ({ ...prev, scene: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="">-- Pick --</option>
                    {(activeScenes || []).map(sc => (
                      <option key={sc.id} value={sc.scene_number}>{sc.scene_number}</option>
                    ))}
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {soundForm.scene === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Scene #"
                      onChange={e => setSoundForm(prev => ({ ...prev, scene: e.target.value }))}
                      className={`w-full text-sm rounded border p-2 mt-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.takeNum')} *</label>
                  <input
                    type="number"
                    placeholder="Take #"
                    value={soundForm.take}
                    onChange={e => setSoundForm(prev => ({ ...prev, take: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.sound.roll')}</label>
                  <input
                    type="text"
                    placeholder="e.g. S001"
                    value={soundForm.roll}
                    onChange={e => setSoundForm(prev => ({ ...prev, roll: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.sound.syncStatus')}</label>
                  <select
                    value={soundForm.syncStatus}
                    onChange={e => setSoundForm(prev => ({ ...prev, syncStatus: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="Sync">{t('prod.sound.sync')}</option>
                    <option value="Wild">{t('prod.sound.wild')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.sound.fileName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Project_S01_T01.WAV"
                  value={soundForm.fileName}
                  onChange={e => setSoundForm(prev => ({ ...prev, fileName: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sample Rate</label>
                  <input
                    type="text"
                    value={soundForm.sampleRate}
                    onChange={e => setSoundForm(prev => ({ ...prev, sampleRate: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bit Depth</label>
                  <input
                    type="text"
                    value={soundForm.bitDepth}
                    onChange={e => setSoundForm(prev => ({ ...prev, bitDepth: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.sound.tracks')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Ch1 (e.g. Mix L)"
                    value={soundForm.track1}
                    onChange={e => setSoundForm(prev => ({ ...prev, track1: e.target.value }))}
                    className={`text-xs rounded border p-1.5 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <input
                    type="text"
                    placeholder="Ch2 (e.g. Mix R)"
                    value={soundForm.track2}
                    onChange={e => setSoundForm(prev => ({ ...prev, track2: e.target.value }))}
                    className={`text-xs rounded border p-1.5 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <input
                    type="text"
                    placeholder="Ch3 (e.g. Boom)"
                    value={soundForm.track3}
                    onChange={e => setSoundForm(prev => ({ ...prev, track3: e.target.value }))}
                    className={`text-xs rounded border p-1.5 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <input
                    type="text"
                    placeholder="Ch4 (e.g. Lav 1)"
                    value={soundForm.track4}
                    onChange={e => setSoundForm(prev => ({ ...prev, track4: e.target.value }))}
                    className={`text-xs rounded border p-1.5 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <input
                    type="text"
                    placeholder="Ch5 (e.g. Lav 2)"
                    value={soundForm.track5}
                    onChange={e => setSoundForm(prev => ({ ...prev, track5: e.target.value }))}
                    className={`text-xs rounded border p-1.5 col-span-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.status')}</label>
                <div className="flex gap-2">
                  {['Good', 'No Good', 'Keep'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSoundForm(prev => ({ ...prev, status: st }))}
                      className={`flex-1 text-xs py-2 rounded font-semibold transition-all border ${
                        soundForm.status === st
                          ? st === 'Good'
                            ? 'bg-gold-500/20 border-gold-500 text-gold-500'
                            : st === 'No Good'
                              ? 'bg-red-500/20 border-red-500 text-red-500'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                          : 'border-slate-800/40 text-slate-400'
                      }`}
                    >
                      {st === 'Good' ? t('prod.good') : st === 'No Good' ? t('prod.noGood') : t('prod.keep')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.notes')}</label>
                <textarea
                  rows={2}
                  placeholder="..."
                  value={soundForm.notes}
                  onChange={e => setSoundForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gold-500 text-slate-900 rounded py-2.5 font-bold text-sm hover:bg-gold-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {t('prod.saveLog')}
              </button>
            </form>
          )}

          {/* Render DIT/Media Form */}
          {activeSubTab === 'dit' && (
            <form onSubmit={handleAddDit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.dit.cardName')} *</label>
                  <input
                    type="text"
                    placeholder="e.g. SSD 56"
                    value={ditForm.cardName}
                    onChange={e => setDitForm(prev => ({ ...prev, cardName: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.dit.slot')}</label>
                  <select
                    value={ditForm.slot}
                    onChange={e => setDitForm(prev => ({ ...prev, slot: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="A">Slot A</option>
                    <option value="B">Slot B</option>
                    <option value="C">Slot C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.dit.size')}</label>
                  <input
                    type="number"
                    placeholder="e.g. 512"
                    value={ditForm.size}
                    onChange={e => setDitForm(prev => ({ ...prev, size: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.dit.fileFormat')}</label>
                  <input
                    type="text"
                    placeholder="e.g. ProRes 4444"
                    value={ditForm.fileFormat}
                    onChange={e => setDitForm(prev => ({ ...prev, fileFormat: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.dit.aspectRatio')}</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.85:1"
                    value={ditForm.aspectRatio}
                    onChange={e => setDitForm(prev => ({ ...prev, aspectRatio: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.dit.lut')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Rec709"
                    value={ditForm.lut}
                    onChange={e => setDitForm(prev => ({ ...prev, lut: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="space-y-2 border border-obsidian-800/40 p-3 rounded bg-obsidian-950/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ditForm.backupA}
                    onChange={e => setDitForm(prev => ({ ...prev, backupA: e.target.checked }))}
                    className="rounded text-gold-500 bg-obsidian-950 border-obsidian-800"
                  />
                  <span className="text-xs text-slate-300 font-semibold">{t('prod.dit.backupA')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ditForm.backupB}
                    onChange={e => setDitForm(prev => ({ ...prev, backupB: e.target.checked }))}
                    className="rounded text-gold-500 bg-obsidian-950 border-obsidian-800"
                  />
                  <span className="text-xs text-slate-300 font-semibold">{t('prod.dit.backupB')}</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.dit.checksum')}</label>
                <select
                  value={ditForm.checksum}
                  onChange={e => setDitForm(prev => ({ ...prev, checksum: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="Verified">{t('prod.dit.verified')}</option>
                  <option value="Not Verified">{t('prod.dit.notVerified')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.notes')}</label>
                <textarea
                  rows={2}
                  placeholder="..."
                  value={ditForm.notes}
                  onChange={e => setDitForm(prev => ({ ...prev, notes: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gold-500 text-slate-900 rounded py-2.5 font-bold text-sm hover:bg-gold-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {t('prod.saveLog')}
              </button>
            </form>
          )}

          {/* Render Daily Report Form */}
          {activeSubTab === 'daily' && (
            <form onSubmit={handleAddDaily} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.date')}</label>
                  <input
                    type="date"
                    value={dailyForm.date}
                    onChange={e => setDailyForm(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.dayNum')}</label>
                  <input
                    type="number"
                    value={dailyForm.dayNum}
                    onChange={e => setDailyForm(prev => ({ ...prev, dayNum: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.weather')}</label>
                <input
                  type="text"
                  placeholder="e.g. Sunny / Rainy / Cloud"
                  value={dailyForm.weather}
                  onChange={e => setDailyForm(prev => ({ ...prev, weather: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.callTime')}</label>
                  <input
                    type="text"
                    value={dailyForm.callTime}
                    onChange={e => setDailyForm(prev => ({ ...prev, callTime: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.firstShot')}</label>
                  <input
                    type="text"
                    value={dailyForm.firstShot}
                    onChange={e => setDailyForm(prev => ({ ...prev, firstShot: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.lunchStart')}</label>
                  <input
                    type="text"
                    value={dailyForm.lunchStart}
                    onChange={e => setDailyForm(prev => ({ ...prev, lunchStart: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.lunchEnd')}</label>
                  <input
                    type="text"
                    value={dailyForm.lunchEnd}
                    onChange={e => setDailyForm(prev => ({ ...prev, lunchEnd: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.wrapTime')}</label>
                  <input
                    type="text"
                    value={dailyForm.wrapTime}
                    onChange={e => setDailyForm(prev => ({ ...prev, wrapTime: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.crewCount')}</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={dailyForm.crewCount}
                    onChange={e => setDailyForm(prev => ({ ...prev, crewCount: e.target.value }))}
                    className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.rollsUsed')}</label>
                <input
                  type="text"
                  placeholder="e.g. A001, A002, S001"
                  value={dailyForm.rollsUsed}
                  onChange={e => setDailyForm(prev => ({ ...prev, rollsUsed: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.scenesShot')}</label>
                <input
                  type="text"
                  placeholder="e.g. Sc 4, Sc 5, Sc 9"
                  value={dailyForm.scenesShot}
                  onChange={e => setDailyForm(prev => ({ ...prev, scenesShot: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">{t('prod.daily.generalNotes')}</label>
                <textarea
                  rows={2}
                  placeholder="..."
                  value={dailyForm.generalNotes}
                  onChange={e => setDailyForm(prev => ({ ...prev, generalNotes: e.target.value }))}
                  className={`w-full text-sm rounded border p-2 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-200' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gold-500 text-slate-900 rounded py-2.5 font-bold text-sm hover:bg-gold-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {t('prod.saveLog')}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Log Sheet Data Table */}
        <div className={`lg:col-span-2 border rounded-xl p-5 flex flex-col justify-between ${isDark ? 'bg-obsidian-900/40 border-obsidian-800/40' : 'bg-white border-slate-200'}`}>
          <div className="space-y-4">
            
            {/* Header controls: Search & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold font-serif text-slate-100 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="text-gold-500" size={18} />
                {language === 'th' ? 'แผ่นบันทึกข้อมูลหน้าเซต (Log Sheet)' : 'Production Log Sheet'}
              </h2>
              
              {/* CSV Export Button */}
              {filteredReports.length > 0 && (
                <button
                  onClick={handleExportCsv}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded border transition-all ${
                    isDark
                      ? 'border-obsidian-800 hover:bg-obsidian-800 text-slate-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Download size={14} />
                  {t('prod.exportCsv')}
                </button>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded border ${isDark ? 'bg-obsidian-950 border-obsidian-800/80 text-slate-300' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              {/* Scene Filter (only for Camera and Sound) */}
              {(activeSubTab === 'camera' || activeSubTab === 'sound') && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{t('prod.filterScene')}:</span>
                  <select
                    value={filterScene}
                    onChange={e => setFilterScene(e.target.value)}
                    className={`text-xs rounded border p-1.5 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-300' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="all">{t('prod.allScenes')}</option>
                    {Array.from(new Set(productionReports.filter(r => r.type === activeSubTab).map(r => r.scene))).sort().map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{t('prod.filterStatus')}:</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className={`text-xs rounded border p-1.5 ${isDark ? 'bg-obsidian-950 border-obsidian-800 text-slate-300' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="all">{t('prod.allStatus')}</option>
                  {activeSubTab === 'dit' ? (
                    <>
                      <option value="Verified">{t('prod.dit.verified')}</option>
                      <option value="Not Verified">{t('prod.dit.notVerified')}</option>
                    </>
                  ) : (
                    <>
                      <option value="Good">{t('prod.good')}</option>
                      <option value="No Good">{t('prod.noGood')}</option>
                      <option value="Keep">{t('prod.keep')}</option>
                      {activeSubTab === 'camera' && <option value="Waste">{language === 'th' ? 'เสียเปล่า (Waste)' : 'Waste'}</option>}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* List/Table of items */}
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-obsidian-800/40 rounded-lg">
                <AlertCircle className="mx-auto text-slate-600 mb-2" size={24} />
                <span className="text-xs text-slate-500">
                  {language === 'th' ? 'ไม่มีรายการบันทึกที่ตรงตามเงื่อนไข' : 'No logs match the current filters'}
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto border border-obsidian-800/40 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  
                  {/* Camera Headers */}
                  {activeSubTab === 'camera' && (
                    <thead>
                      <tr className={`${isDark ? 'bg-obsidian-950/60 border-b border-obsidian-850' : 'bg-slate-50 border-b border-slate-200'} text-slate-400 font-semibold`}>
                        <th className="p-3">{t('prod.sceneNum')}</th>
                        <th className="p-3">{t('prod.takeNum')}</th>
                        <th className="p-3">{t('prod.camera.roll')}</th>
                        <th className="p-3">{t('prod.camera.clipName')}</th>
                        <th className="p-3">{t('prod.camera.lens')}</th>
                        <th className="p-3">{t('prod.camera.aperture')}</th>
                        <th className="p-3">ISO / Kel / Shut</th>
                        <th className="p-3">{t('prod.camera.filter')}</th>
                        <th className="p-3">{t('prod.camera.soundRoll')}</th>
                        <th className="p-3">{t('prod.status')}</th>
                        <th className="p-3">{t('prod.notes')}</th>
                        <th className="p-3 text-center">{t('breakdown.actions')}</th>
                      </tr>
                    </thead>
                  )}

                  {/* Sound Headers */}
                  {activeSubTab === 'sound' && (
                    <thead>
                      <tr className={`${isDark ? 'bg-obsidian-950/60 border-b border-obsidian-850' : 'bg-slate-50 border-b border-slate-200'} text-slate-400 font-semibold`}>
                        <th className="p-3">{t('prod.sceneNum')}</th>
                        <th className="p-3">{t('prod.takeNum')}</th>
                        <th className="p-3">{t('prod.sound.roll')}</th>
                        <th className="p-3">{t('prod.sound.syncStatus')}</th>
                        <th className="p-3">{t('prod.sound.fileName')}</th>
                        <th className="p-3">Format (SR/Bit)</th>
                        <th className="p-3">{t('prod.sound.tracks')}</th>
                        <th className="p-3">{t('prod.status')}</th>
                        <th className="p-3 text-center">{t('breakdown.actions')}</th>
                      </tr>
                    </thead>
                  )}

                  {/* DIT Headers */}
                  {activeSubTab === 'dit' && (
                    <thead>
                      <tr className={`${isDark ? 'bg-obsidian-950/60 border-b border-obsidian-850' : 'bg-slate-50 border-b border-slate-200'} text-slate-400 font-semibold`}>
                        <th className="p-3">{t('prod.dit.cardName')}</th>
                        <th className="p-3">{t('prod.dit.slot')}</th>
                        <th className="p-3">{t('prod.dit.size')}</th>
                        <th className="p-3">{t('prod.dit.fileFormat')}</th>
                        <th className="p-3">{t('prod.dit.aspectRatio')}</th>
                        <th className="p-3">{t('prod.dit.lut')}</th>
                        <th className="p-3">Backup (A/B)</th>
                        <th className="p-3">{t('prod.dit.checksum')}</th>
                        <th className="p-3">{t('prod.notes')}</th>
                        <th className="p-3 text-center">{t('breakdown.actions')}</th>
                      </tr>
                    </thead>
                  )}

                  {/* Daily Headers */}
                  {activeSubTab === 'daily' && (
                    <thead>
                      <tr className={`${isDark ? 'bg-obsidian-950/60 border-b border-obsidian-850' : 'bg-slate-50 border-b border-slate-200'} text-slate-400 font-semibold`}>
                        <th className="p-3">{t('prod.daily.date')}</th>
                        <th className="p-3">{t('prod.daily.dayNum')}</th>
                        <th className="p-3">{t('prod.daily.weather')}</th>
                        <th className="p-3">Times (Call / 1st / Lunch / Wrap)</th>
                        <th className="p-3">{t('prod.daily.scenesShot')}</th>
                        <th className="p-3">{t('prod.daily.rollsUsed')}</th>
                        <th className="p-3">{t('prod.daily.crewCount')}</th>
                        <th className="p-3 text-center">{t('breakdown.actions')}</th>
                      </tr>
                    </thead>
                  )}

                  {/* Table Bodies */}
                  <tbody>
                    
                    {/* Render Camera Logs */}
                    {activeSubTab === 'camera' && filteredReports.map(r => (
                      <tr key={r.id} className={`border-b ${isDark ? 'border-obsidian-850/60 hover:bg-obsidian-950/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-800'}`}>
                        <td className="p-3 font-semibold">{r.scene}</td>
                        <td className="p-3">{r.take}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{r.roll || '-'}</td>
                        <td className="p-3 font-mono text-[11px] text-gold-500 font-semibold">{r.clipName || '-'}</td>
                        <td className="p-3">{r.lens ? `${r.lens}mm` : '-'}</td>
                        <td className="p-3 font-mono">{r.aperture || '-'}</td>
                        <td className="p-3 text-[10px] text-slate-400">
                          {r.iso && `ISO ${r.iso}`} {r.kelvin && `/ ${r.kelvin}`} {r.shutter && `/ ${r.shutter}`}
                        </td>
                        <td className="p-3 text-slate-300">{r.filter || '-'}</td>
                        <td className="p-3 font-mono text-[11px] text-sky-400">{r.soundRoll || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'Good' 
                              ? 'bg-gold-500/10 border border-gold-500/20 text-gold-500' 
                              : r.status === 'No Good'
                                ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                                : r.status === 'Keep'
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                  : 'bg-slate-500/10 border border-slate-500/20 text-slate-400'
                          }`}>
                            {r.status === 'Good' ? t('prod.good') : r.status === 'No Good' ? t('prod.noGood') : r.status === 'Keep' ? t('prod.keep') : (language === 'th' ? 'เสียเปล่า (Waste)' : 'Waste')}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-400 truncate max-w-[120px]" title={r.notes}>{r.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteLog(r.id)}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Render Sound Logs */}
                    {activeSubTab === 'sound' && filteredReports.map(r => (
                      <tr key={r.id} className={`border-b ${isDark ? 'border-obsidian-850/60 hover:bg-obsidian-950/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-800'}`}>
                        <td className="p-3 font-semibold">{r.scene}</td>
                        <td className="p-3">{r.take}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">{r.roll || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.syncStatus === 'Sync' 
                              ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                          }`}>
                            {r.syncStatus === 'Sync' ? t('prod.sound.sync') : t('prod.sound.wild')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400 truncate max-w-[120px]" title={r.fileName}>{r.fileName || '-'}</td>
                        <td className="p-3 text-[10px] text-slate-400">{r.sampleRate} / {r.bitDepth}</td>
                        <td className="p-3 text-[10px] text-slate-400">
                          {r.track1 && `Ch1: ${r.track1}`}
                          {r.track2 && ` | Ch2: ${r.track2}`}
                          {r.track3 && ` | Ch3: ${r.track3}`}
                          {r.track4 && ` | Ch4: ${r.track4}`}
                          {r.track5 && ` | Ch5: ${r.track5}`}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'Good' 
                              ? 'bg-gold-500/10 border border-gold-500/20 text-gold-500' 
                              : r.status === 'No Good'
                                ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                          }`}>
                            {r.status === 'Good' ? t('prod.good') : r.status === 'No Good' ? t('prod.noGood') : t('prod.keep')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteLog(r.id)}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Render DIT Logs */}
                    {activeSubTab === 'dit' && filteredReports.map(r => (
                      <tr key={r.id} className={`border-b ${isDark ? 'border-obsidian-850/60 hover:bg-obsidian-950/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-800'}`}>
                        <td className="p-3 font-semibold font-mono text-[11px]">{r.cardName}</td>
                        <td className="p-3 text-center">{r.slot}</td>
                        <td className="p-3">{r.size ? `${r.size} GB` : '-'}</td>
                        <td className="p-3 font-mono text-slate-400">{r.fileFormat || '-'}</td>
                        <td className="p-3 font-mono text-slate-450">{r.aspectRatio || '-'}</td>
                        <td className="p-3 text-gold-500 font-semibold">{r.lut || '-'}</td>
                        <td className="p-3 text-[10px]">
                          <span className="text-slate-400">A: </span>
                          <span className={r.backupA ? 'text-gold-500 font-bold mr-2' : 'text-slate-600 mr-2'}>
                            {r.backupA ? '✓' : '✗'}
                          </span>
                          <span className="text-slate-400">B: </span>
                          <span className={r.backupB ? 'text-emerald-500 font-bold' : 'text-slate-600'}>
                            {r.backupB ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.checksum === 'Verified' 
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' 
                              : 'bg-red-500/10 border border-red-500/20 text-red-500'
                          }`}>
                            {r.checksum === 'Verified' ? t('prod.dit.verified') : t('prod.dit.notVerified')}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-400 truncate max-w-[120px]" title={r.notes}>{r.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteLog(r.id)}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Render Daily Production Logs */}
                    {activeSubTab === 'daily' && filteredReports.map(r => (
                      <tr key={r.id} className={`border-b ${isDark ? 'border-obsidian-850/60 hover:bg-obsidian-950/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-800'}`}>
                        <td className="p-3 font-semibold">{r.date}</td>
                        <td className="p-3 text-center">Day {r.dayNum}</td>
                        <td className="p-3 flex items-center gap-1">
                          <CloudSun size={12} className="text-gold-500" />
                          {r.weather}
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">
                          Call: {r.callTime} | 1st: {r.firstShot} | Lunch: {r.lunchStart}-{r.lunchEnd} | Wrap: {r.wrapTime}
                        </td>
                        <td className="p-3 font-semibold text-gold-500">{r.scenesShot || '-'}</td>
                        <td className="p-3 font-mono text-[10px] text-slate-400">{r.rollsUsed || '-'}</td>
                        <td className="p-3 text-center">{r.crewCount || '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteLog(r.id)}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick instructions or summary */}
          <div className="border-t border-obsidian-850/45 pt-4 mt-6 text-[10px] text-slate-500 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <span>
              {language === 'th' 
                ? 'หมายเหตุ: สามารถพิมพ์หน้าจอนี้ผ่านปุ่มพิมพ์เบราว์เซอร์เพื่อบันทึกเป็นรายงาน PDF ได้ทันที'
                : 'Note: You can print this page using your browser print tool (Ctrl/Cmd + P) to generate a PDF report.'}
            </span>
            <span className="font-semibold text-slate-400">
              {language === 'th' ? `รวมทั้งหมด: ${filteredReports.length} รายการ` : `Total Logs: ${filteredReports.length}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
