import { useState } from 'react';
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
  Bookmark
} from 'lucide-react';

export default function DocumentsHub({ scenes, crew, weather, initialSceneNum, shotList, setShotList, lockedTab }) {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();

  // Sub-tabs: 'callsheet' | 'shotlist' | 'storyboard'
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return lockedTab || 'callsheet';
  });

  // Call Sheet State
  const [selectedSceneNum, setSelectedSceneNum] = useState(initialSceneNum || (scenes[0]?.scene_number || '1'));
  
  // Dynamic Shot List State
  const [newShotNum, setNewShotNum] = useState('');
  const [newShotFraming, setNewShotFraming] = useState('MCU');
  const [newShotLens, setNewShotLens] = useState('50mm');
  const [newShotMove, setNewShotMove] = useState('Static');
  const [newShotDescTh, setNewShotDescTh] = useState('');
  const [newShotDescEn, setNewShotDescEn] = useState('');

  // Selected Scene resolver
  const activeScene = scenes.find(s => s.scene_number === selectedSceneNum) || scenes[0];

  // Resolve crew for departments
  const dp = crew.find(c => c.role.includes('Director of Photography'));
  const art = crew.find(c => c.role.includes('Production Designer'));
  const gaffer = crew.find(c => c.role.includes('Gaffer'));

  // Handle PDF Print
  const handlePrint = () => {
    window.print();
  };

  // Add new shot to list
  const handleAddShot = (e) => {
    e.preventDefault();
    if (!newShotNum || !newShotDescEn) return;

    const newShot = {
      shotNum: newShotNum,
      type: newShotFraming,
      lens: newShotLens,
      movement: newShotMove,
      equipment: newShotMove === 'Static' ? 'Tripod' : 'Dolly / Gimbal',
      description: {
        th: newShotDescTh || newShotDescEn,
        en: newShotDescEn || newShotDescTh
      }
    };

    setShotList(prev => [...prev, newShot]);
    setNewShotNum('');
    setNewShotDescTh('');
    setNewShotDescEn('');
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

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white shadow-sm hover:shadow-md transition-all"
          >
            <Printer size={14} />
            <span>{t('docs.generatePdf')}</span>
          </button>
        </div>
      </div>

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
            {/* Scene selector and Print options (No Print) */}
            <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Select Scene:</span>
                <select
                  value={selectedSceneNum}
                  onChange={(e) => setSelectedSceneNum(e.target.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                    theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {scenes.map(s => (
                    <option key={s.id} value={s.scene_number}>Scene {s.scene_number} - {s.setting}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CALL SHEET TEMPLATE BODY (Ready for PDF Print) */}
            <div className={`p-8 md:p-12 rounded-xl border glass-panel shadow-md space-y-8 print-container ${
              theme === 'dark' ? 'border-obsidian-800' : 'border-slate-200 bg-white'
            }`}>
              
              {/* Header metadata */}
              <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gold-500 tracking-widest uppercase">Production Document</p>
                  <h2 className="text-2xl font-serif font-black tracking-tight">{t('docs.callSheetHeader')}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Scene {activeScene?.scene_number} | Setting: {activeScene?.setting}</p>
                </div>
                <div className="text-right font-mono text-xs space-y-0.5">
                  <p><span className="text-slate-400">Date:</span> {new Date().toISOString().split('T')[0]}</p>
                  <p><span className="text-slate-400">Weather:</span> {weather} ({weatherWarnings[weather] ? 'Risk Checked' : 'Clear'})</p>
                </div>
              </div>

              {/* Key Schedule Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border-r border-slate-200 dark:border-obsidian-800 pr-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.crewCallTime')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5 text-gold-500">07:00 AM</p>
                </div>
                <div className="border-r border-slate-200 dark:border-obsidian-800 pr-4 pl-0 md:pl-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.shootingCall')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5">08:30 AM</p>
                </div>
                <div className="border-r border-slate-200 dark:border-obsidian-800 pr-4 pl-0 md:pl-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.lunchTime')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5 text-slate-400">12:30 PM</p>
                </div>
                <div className="pl-0 md:pl-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{t('docs.wrapTime')}</p>
                  <p className="text-xl font-extrabold font-mono mt-0.5">06:00 PM</p>
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
                  <p className="mt-1 leading-relaxed">{weatherWarnings[weather][language]}</p>
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
                <p className="text-slate-400">📍 {activeScene?.location?.[language] || 'TBD'} | GPS: 13.7563° N, 100.5018° E</p>
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-block mt-1 font-semibold text-gold-500 hover:underline no-print"
                >
                  Open Google Maps Navigation →
                </a>
              </div>

              {/* Shoot Scene Specific details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider border-b pb-1">
                  Scene Specific Breakdown Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold mb-1">SCENE DESCRIPTION</p>
                    <p className="leading-relaxed font-medium">{activeScene?.description?.[language] || 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold mb-1">CAST & TALENT</p>
                    <p className="leading-relaxed font-medium">{activeScene?.cast?.[language] || 'TBD'}</p>
                  </div>
                </div>
              </div>

              {/* Department Tech Requirements */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider border-b pb-1">
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
                    <p className="leading-relaxed text-slate-300 dark:text-slate-300 text-slate-700">
                      {activeScene?.tech_notes?.[language] || 'TBD'}
                    </p>
                  </div>

                  {/* Art Department */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Clapperboard size={12} />
                      <span>ART & PROPS (Designer: {art?.name?.[language] || art?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-300 dark:text-slate-300 text-slate-700">
                      Required props: <span className="font-semibold text-white dark:text-white text-slate-900">{activeScene?.props?.[language] || 'TBD'}</span>. Wardrobe notes: {activeScene?.wardrobe?.[language] || 'TBD'}.
                    </p>
                  </div>

                  {/* Electric / Lights */}
                  <div className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'bg-obsidian-950/40 border-obsidian-800/40' : 'bg-slate-50/50 border-slate-100'
                  }`}>
                    <p className="font-bold text-gold-500 flex items-center gap-1.5 mb-2">
                      <Wrench size={12} />
                      <span>LIGHTING & ELECTRIC (Gaffer: {gaffer?.name?.[language] || gaffer?.name?.en || 'TBD'})</span>
                    </p>
                    <p className="leading-relaxed text-slate-300 dark:text-slate-300 text-slate-700">
                      Refer to camera setup guidelines. Ensure 220V distro feeds are routed exterior to coffee shop if shooting outdoors.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )
      )}

      {/* SHOT LIST VIEW */}
      {activeSubTab === 'shotlist' && (
        <div className="space-y-6">
          {/* Add Shot Form (No Print) */}
          {hasWriteAccess() && (
            <div className="glass-panel p-5 rounded-xl space-y-4 no-print">
              <h2 className="text-sm font-bold font-serif flex items-center gap-1.5">
                <Plus size={16} className="text-gold-500" />
                <span>Add Camera Shot</span>
              </h2>

              <form onSubmit={handleAddShot} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Shot # *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1D"
                    value={newShotNum}
                    onChange={(e) => setNewShotNum(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Framing / Size</label>
                  <select
                    value={newShotFraming}
                    onChange={(e) => setNewShotFraming(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
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
                    placeholder="e.g. 85mm prime"
                    value={newShotLens}
                    onChange={(e) => setNewShotLens(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Movement</label>
                  <input
                    type="text"
                    placeholder="e.g. Dolly Push"
                    value={newShotMove}
                    onChange={(e) => setNewShotMove(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 ${
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
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
                      theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
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
                        theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white hover:from-gold-500 shadow-sm shrink-0"
                  >
                    Add Shot
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Shot List Table */}
          <div className="glass-panel rounded-xl overflow-hidden shadow-sm print-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs font-bold uppercase tracking-wider ${
                    theme === 'dark' ? 'bg-obsidian-900/50 border-obsidian-800/40 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-3.5 px-4 w-20">{t('docs.shotNum')}</th>
                    <th className="py-3.5 px-4">{t('docs.framing')}</th>
                    <th className="py-3.5 px-4">{t('docs.lens')}</th>
                    <th className="py-3.5 px-4">{t('docs.movement')}</th>
                    <th className="py-3.5 px-4">{t('docs.equipment')}</th>
                    <th className="py-3.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-obsidian-800/40 text-xs">
                  {shotList.map((shot, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/20 dark:hover:bg-obsidian-850/10">
                      <td className="py-3.5 px-4 font-mono font-bold text-gold-500">{shot.shotNum}</td>
                      <td className="py-3.5 px-4 font-semibold">{shot.type}</td>
                      <td className="py-3.5 px-4 font-mono">{shot.lens}</td>
                      <td className="py-3.5 px-4">{shot.movement}</td>
                      <td className="py-3.5 px-4 text-slate-400">{shot.equipment}</td>
                      <td className="py-3.5 px-4 text-slate-300 dark:text-slate-300 text-slate-700 font-medium">
                        {shot.description[language]}
                      </td>
                    </tr>
                  ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-container animate-fadeIn">
            {[1, 2, 3].map((slot) => (
              <div 
                key={slot} 
                className={`rounded-xl border overflow-hidden glass-panel flex flex-col group ${
                  theme === 'dark' ? 'border-obsidian-800 bg-obsidian-900/40' : 'border-slate-200'
                }`}
              >
                {/* Simulated Storyboard Sketch using CSS Graphics */}
                <div className="h-48 relative bg-slate-950 flex items-center justify-center overflow-hidden border-b border-inherit">
                  {/* Visual grid sketch placeholder */}
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                  
                  {/* Simulated frame drawings */}
                  <div className="relative text-center space-y-2 z-10 p-4">
                    <div className="w-20 h-10 border border-slate-600 rounded mx-auto flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      {slot === 1 ? '50mm' : slot === 2 ? '24mm' : '85mm'}
                    </div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Sketch Frame {slot}</p>
                    <p className="text-[9px] text-slate-500 italic">Scene {selectedSceneNum} Storyboard</p>
                  </div>
                </div>

                {/* Storyboard caption info */}
                <div className="p-4 flex-1 space-y-2">
                  <span className="text-[10px] font-bold text-gold-500 font-mono">SHOT {selectedSceneNum}.{slot}</span>
                  <p className="text-xs font-semibold">
                    {slot === 1 
                      ? language === 'th' ? "ช็อตกว้างแสดงสภาพแวดล้อมร้านกาแฟ" : "Wide shot establishing coffee shop atmosphere"
                      : slot === 2 
                        ? language === 'th' ? "โคลสอัพตัวละครสองคนกระซิบกระซาบกัน" : "Medium close-up of characters whispering"
                        : language === 'th' ? "มาโครถ่ายที่ซองเอกสารสำคัญบนโต๊ะ" : "Macro shot on secret manila envelope"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
