import React from 'react';
import { 
  Film, 
  BookOpen, 
  PenTool, 
  Layers, 
  Video, 
  ImageIcon, 
  Calendar, 
  Users, 
  FileText, 
  Clapperboard, 
  FolderKanban,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PIPELINE_STAGES = [
  {
    id: 'development',
    name: { th: '1. เตรียมบท & โครงเรื่อง', en: '1. Development & Script' },
    icon: BookOpen,
    tabs: ['storyOutline', 'script', 'breakdown'],
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    nextTab: 'shotlist',
    nextLabel: { th: 'ถัดไป: วางแผนภาพ & ช็อต', en: 'Next: Visuals & Shots' }
  },
  {
    id: 'visuals',
    name: { th: '2. วางแผนภาพ & ช็อต', en: '2. Shot List & Storyboards' },
    icon: Video,
    tabs: ['shotlist', 'storyboard'],
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    nextTab: 'shootingSchedule',
    nextLabel: { th: 'ถัดไป: วางตารางคิวถ่าย', en: 'Next: Stripboard Schedule' }
  },
  {
    id: 'scheduling',
    name: { th: '3. จัดตารางคิว & ทีมงาน', en: '3. Scheduling & Crew' },
    icon: Calendar,
    tabs: ['shootingSchedule', 'calendar', 'crew'],
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    nextTab: 'production',
    nextLabel: { th: 'ถัดไป: บันทึกหน้าเซตถ่ายจริง', en: 'Next: On-Set Production' }
  },
  {
    id: 'onset',
    name: { th: '4. ถ่ายทำจริง & เอกสารกอง', en: '4. On-Set & Production Vault' },
    icon: Clapperboard,
    tabs: ['callsheets', 'production', 'docs'],
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
    nextTab: 'dashboard',
    nextLabel: { th: 'กลับสู่: ศูนย์ควบคุมหลัก', en: 'Back to: Control Center' }
  }
];

export default function PipelineBanner({ currentTab, onNavigate }) {
  const { language } = useLanguage();

  if (currentTab === 'dashboard' || currentTab === 'personal') {
    return null; // Skip top banner on main dashboard/personal view to save space
  }

  const currentStageIndex = PIPELINE_STAGES.findIndex(stage => stage.tabs.includes(currentTab));
  const currentStage = PIPELINE_STAGES[currentStageIndex] || PIPELINE_STAGES[0];

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-obsidian-900 via-obsidian-900/90 to-obsidian-950 border border-obsidian-800/80 p-4 shadow-xl backdrop-blur-md transition-all">
      {/* Top row: Stage Flow Tracker */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-obsidian-800/60 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gold-500/10 text-gold-500 border border-gold-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gold-400">
              {language === 'th' ? 'กระบวนการผลิตภาพยนตร์สากล' : 'Film Production Pipeline'}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              {language === 'th' ? 'ขั้นตอนทำงานภาพยนตร์แบบไร้รอยต่อ' : 'Industry Standard Studio Workflow'}
            </p>
          </div>
        </div>

        {/* Next Step Shortcut Button */}
        {currentStage.nextTab && onNavigate && (
          <button
            onClick={() => onNavigate(currentStage.nextTab)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 hover:text-gold-300 border border-gold-500/30 text-xs font-bold transition-all cursor-pointer group"
          >
            <span>{currentStage.nextLabel[language]}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>

      {/* Stage Steps Visual Progress Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isActive = stage.tabs.includes(currentTab);
          const isPassed = currentStageIndex > idx;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                isActive
                  ? `bg-gradient-to-r ${stage.color} shadow-lg ring-1 ring-amber-500/30 font-bold`
                  : isPassed
                  ? 'bg-obsidian-800/30 border-obsidian-800 text-slate-400'
                  : 'bg-obsidian-950/40 border-obsidian-900 text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-slate-900/80' : 'bg-obsidian-900'}`}>
                <StageIcon size={14} className={isActive ? 'text-gold-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'} />
              </div>
              <span className="truncate flex-1">{stage.name[language]}</span>
              {isPassed && <span className="text-emerald-400 font-bold text-[10px]">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
