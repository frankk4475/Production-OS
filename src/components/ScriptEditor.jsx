import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  FileText, 
  Sparkles, 
  Save, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  CheckCircle,
  HelpCircle,
  Menu,
  FileEdit,
  RefreshCw,
  Printer
} from 'lucide-react';

const DEMO_SCRIPT = [
  { id: 'b1', type: 'heading', text: 'INT. COFFEE SHOP - DAY' },
  { id: 'b2', type: 'action', text: 'Rain lashes against the window of the dimly lit café. A neon SIGN flickers on and off: "BREW & BIND".' },
  { id: 'b3', type: 'action', text: 'NAT (20s) sits at the corner table, nervously sipping a lukewarm Americano. She clutches a manila envelope.' },
  { id: 'b4', type: 'character', text: 'NAT' },
  { id: 'b5', type: 'parenthetical', text: 'whispering to herself' },
  { id: 'b6', type: 'dialogue', text: "He's late. He's never late unless something is wrong." },
  { id: 'b7', type: 'action', text: 'The bell above the door JINGLES. LEO (30s) enters, shaking his wet umbrella. He looks around, spots Nat, and walks over.' },
  { id: 'b8', type: 'character', text: 'LEO' },
  { id: 'b9', type: 'dialogue', text: "Sorry. The rain is causing gridlock. Do you have it?" },
  { id: 'b10', type: 'character', text: 'NAT' },
  { id: 'b11', type: 'action', text: 'Nat pushes the envelope across the table. Leo takes it and slides it into his jacket.' },
  { id: 'b12', type: 'dialogue', text: "Be careful. They are watching us." },
  { id: 'b13', type: 'heading', text: 'EXT. STREET - NIGHT' },
  { id: 'b14', type: 'action', text: 'Leo steps out of the coffee shop into the pouring rain. A dark black SEDAN is parked across the street, headlights off.' },
  { id: 'b15', type: 'action', text: 'He pulls his hood up and walks quickly down the alleyway.' }
];

export default function ScriptEditor() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { hasWriteAccess } = useAuth();
  
  const {
    currentProject: project,
    scriptBlocks,
    onlineUsers,
    saveScriptBlocks,
    isLoading
  } = useProject();

  const [blocks, setBlocks] = useState([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState(null);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  
  const localChangeRef = useRef(false);
  const blockRefs = useRef([]);

  // Load project script blocks when loaded from context
  useEffect(() => {
    if (scriptBlocks && scriptBlocks.length > 0) {
      localChangeRef.current = false;
      setBlocks(prevBlocks => {
        if (prevBlocks.length === 0 || activeBlockIndex === null) {
          return scriptBlocks;
        }
        
        const activeBlockId = prevBlocks[activeBlockIndex]?.id;
        
        return scriptBlocks.map(newBlock => {
          if (newBlock.id === activeBlockId) {
            return {
              ...newBlock,
              text: prevBlocks[activeBlockIndex].text,
              type: prevBlocks[activeBlockIndex].type
            };
          }
          return newBlock;
        });
      });
    } else {
      localChangeRef.current = false;
      setBlocks([
        { id: `b-${Date.now()}-1`, type: 'heading', text: 'INT. NEW SCENE - DAY' },
        { id: `b-${Date.now()}-2`, type: 'action', text: 'Write screenplay action here...' }
      ]);
    }
  }, [scriptBlocks, activeBlockIndex]);

  // Debounced Auto-save System
  useEffect(() => {
    if (!localChangeRef.current) return;
    
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await saveScriptBlocks(blocks);
        localChangeRef.current = false;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSaveStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [blocks]);

  // Sync refs array size
  useEffect(() => {
    blockRefs.current = blockRefs.current.slice(0, blocks.length);
  }, [blocks]);

  // Screenplay format definitions
  const blockTypes = {
    heading: { label: language === 'th' ? 'หัวข้อฉาก (Scene Heading)' : 'Scene Heading', class: 'font-mono text-xs md:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white pl-3 border-l-2 border-slate-500/50 mt-6 mb-3', align: 'text-left' },
    action: { label: language === 'th' ? 'เหตุการณ์ / บทบรรยาย' : 'Action / Narrative', class: 'font-mono text-xs md:text-sm text-slate-700 dark:text-slate-300 mt-3 mb-3', align: 'text-left' },
    character: { label: language === 'th' ? 'ตัวละคร (Character)' : 'Character', class: 'font-mono text-xs md:text-sm font-bold text-gold-600 dark:text-gold-400 uppercase tracking-widest mt-4 mb-1 text-center', align: 'text-center' },
    parenthetical: { label: language === 'th' ? 'อารมณ์/ท่าทาง (Parenthetical)' : 'Parenthetical', class: 'font-mono text-xs md:text-sm text-slate-500 dark:text-slate-400 italic mt-1 mb-1 text-center', align: 'text-center' },
    dialogue: { label: language === 'th' ? 'บทสนทนา (Dialogue)' : 'Dialogue', class: 'font-mono text-xs md:text-sm text-slate-800 dark:text-slate-200 mt-1.5 mb-2 mx-auto max-w-[80%] md:max-w-[60%] text-center', align: 'text-center font-medium' },
    transition: { label: language === 'th' ? 'มุมกล้อง/คำเชื่อม (Transition)' : 'Transition', class: 'font-mono text-xs md:text-sm font-bold text-amber-600 dark:text-amber-500 uppercase mt-4 mb-4 text-right pr-2', align: 'text-right' }
  };

  // Keyboard navigation & element cycling
  const handleKeyDown = (e, index) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle types: heading -> action -> character -> parenthetical -> dialogue -> transition -> heading
      const types = Object.keys(blockTypes);
      const currentTypeIndex = types.indexOf(blocks[index].type);
      const nextType = types[(currentTypeIndex + 1) % types.length];
      
      const newBlocks = [...blocks];
      newBlocks[index].type = nextType;
      
      // Auto-format constraints (e.g. character names uppercase)
      if (nextType === 'character') {
        newBlocks[index].text = newBlocks[index].text.toUpperCase();
      }

      localChangeRef.current = true;
      setBlocks(newBlocks);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Decide next logical block type
      const currentType = blocks[index].type;
      let nextType = 'action';
      if (currentType === 'character') nextType = 'dialogue';
      else if (currentType === 'parenthetical') nextType = 'dialogue';
      else if (currentType === 'dialogue') {
        // If Enter on blank dialogue, go to Action; if dialogue is filled, go to Character
        nextType = blocks[index].text.trim() === '' ? 'action' : 'character';
      } else if (currentType === 'heading') nextType = 'action';

      const newBlock = {
        id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: nextType,
        text: ''
      };

      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      localChangeRef.current = true;
      setBlocks(newBlocks);

      // Focus the newly added block in the next render cycle
      setTimeout(() => {
        if (blockRefs.current[index + 1]) {
          blockRefs.current[index + 1].focus();
        }
      }, 50);
    }

    if (e.key === 'Backspace' && blocks[index].text === '' && blocks.length > 1) {
      e.preventDefault();
      const newBlocks = blocks.filter((_, i) => i !== index);
      localChangeRef.current = true;
      setBlocks(newBlocks);

      // Focus previous block
      const targetIndex = index > 0 ? index - 1 : 0;
      setTimeout(() => {
        if (blockRefs.current[targetIndex]) {
          blockRefs.current[targetIndex].focus();
        }
      }, 50);
    }

    // Arrow navigation
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      blockRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowDown' && index < blocks.length - 1) {
      e.preventDefault();
      blockRefs.current[index + 1].focus();
    }
  };

  // Text changes handler
  const handleTextChange = (index, value) => {
    const newBlocks = [...blocks];
    newBlocks[index].text = blocks[index].type === 'character' ? value.toUpperCase() : value;
    localChangeRef.current = true;
    setBlocks(newBlocks);
  };

  // Block type changes via mouse click dropdown
  const setBlockType = (index, type) => {
    const newBlocks = [...blocks];
    newBlocks[index].type = type;
    if (type === 'character') {
      newBlocks[index].text = newBlocks[index].text.toUpperCase();
    }
    localChangeRef.current = true;
    setBlocks(newBlocks);
  };

  // Insert block
  const insertBlock = (index, type) => {
    const newBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type || 'action',
      text: ''
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    localChangeRef.current = true;
    setBlocks(newBlocks);

    setTimeout(() => {
      if (blockRefs.current[index + 1]) {
        blockRefs.current[index + 1].focus();
      }
    }, 50);
  };

  // Delete block
  const deleteBlock = (index) => {
    if (blocks.length <= 1) return;
    const newBlocks = blocks.filter((_, i) => i !== index);
    localChangeRef.current = true;
    setBlocks(newBlocks);
    
    const targetIndex = index > 0 ? index - 1 : 0;
    setTimeout(() => {
      if (blockRefs.current[targetIndex]) {
        blockRefs.current[targetIndex].focus();
      }
    }, 50);
  };

  // Shift block order
  const moveBlock = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    localChangeRef.current = true;
    setBlocks(newBlocks);
    setTimeout(() => {
      if (blockRefs.current[targetIndex]) {
        blockRefs.current[targetIndex].focus();
      }
    }, 50);
  };

  // Immediate save on input blur
  const handleBlur = async () => {
    setActiveBlockIndex(null);
    if (!localChangeRef.current) return;
    
    try {
      setSaveStatus('saving');
      await saveScriptBlocks(blocks);
      localChangeRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error("Auto-save on blur failed:", err);
      setSaveStatus('error');
    }
  };

  // Save & Sync Action (Manual Trigger fallback)
  const handleSaveAndSync = async () => {
    if (!project) return;
    try {
      setSaveStatus('saving');
      await saveScriptBlocks(blocks);
      localChangeRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      alert(language === 'th' ? "ไม่สามารถบันทึกและซิงค์บทภาพยนตร์ได้: " + err.message : "Failed to sync script: " + err.message);
    }
  };

  // Load StudioBinder style demo script
  const handleLoadDemo = () => {
    if (window.confirm(language === 'th' ? "คุณต้องการโหลดบทภาพยนตร์ตัวอย่างใช่หรือไม่? การกระทำนี้จะเขียนทับเนื้อหาปัจจุบัน" : "Are you sure you want to load the demo script? This will overwrite your current editing script.")) {
      setBlocks(DEMO_SCRIPT);
    }
  };

  // Dynamic Scene Detector logic (Live sync panel)
  const getDetectedScenes = () => {
    const scenesList = [];
    let idx = 0;
    blocks.forEach((b) => {
      if (b.type === 'heading' && b.text.trim()) {
        idx += 1;
        scenesList.push({
          num: idx,
          heading: b.text
        });
      }
    });
    return scenesList;
  };

  // Dynamic Characters list
  const getDetectedCharacters = () => {
    const charsSet = new Set();
    blocks.forEach((b) => {
      if (b.type === 'character' && b.text.trim()) {
        charsSet.add(b.text.trim().toUpperCase());
      }
    });
    return Array.from(charsSet);
  };

  const detectedScenes = getDetectedScenes();
  const detectedCharacters = getDetectedCharacters();

  if (!project) {
    return (
      <div className="glass-panel p-12 text-center rounded-xl space-y-4 max-w-xl mx-auto border border-dashed border-slate-350 dark:border-obsidian-800 animate-fadeIn">
        <div className="inline-flex p-3 rounded-full bg-gold-500/10 text-gold-500">
          <FileText size={32} />
        </div>
        <h3 className="text-lg font-bold font-serif">{language === 'th' ? 'กรุณาเลือกหรือสร้างโครงการก่อนเพื่อเขียนบทภาพยนตร์' : 'No Project Selected'}</h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          {language === 'th' 
            ? 'บทภาพยนตร์จะต้องอิงเข้ากับข้อมูลการผลิตในแต่ละโครงการหลักเป็นหลัก' 
            : 'Please select an existing project or create a new one to access the screenplay editor.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      
      {/* Print-only Screenplay Mode */}
      <div className="hidden print:block w-full text-black font-mono text-xs md:text-sm leading-relaxed mx-auto max-w-4xl" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
        {/* Header / Title details */}
        <div className="text-center pb-8 mb-8 border-b border-black uppercase tracking-widest text-xs font-bold">
          {project?.title?.[language] || (language === 'th' ? 'บทภาพยนตร์' : 'SCREENPLAY')} — {language === 'th' ? 'มุมมองโครงการ' : 'PROJECT VIEW'}
        </div>

        <div className="space-y-4">
          {blocks.map((block) => {
            let blockStyle = { fontFamily: "'Courier New', Courier, monospace" };
            switch (block.type) {
              case 'heading':
                blockStyle = {
                  ...blockStyle,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  marginTop: '2rem',
                  marginBottom: '1rem',
                  textAlign: 'left'
                };
                break;
              case 'action':
                blockStyle = {
                  ...blockStyle,
                  textAlign: 'left',
                  marginTop: '1rem',
                  marginBottom: '1rem'
                };
                break;
              case 'character':
                blockStyle = {
                  ...blockStyle,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                  marginLeft: '37.5%',
                  marginTop: '1.5rem',
                  marginBottom: '0.25rem'
                };
                break;
              case 'parenthetical':
                blockStyle = {
                  ...blockStyle,
                  fontStyle: 'italic',
                  textAlign: 'left',
                  marginLeft: '25%',
                  width: '50%',
                  marginTop: '0.25rem',
                  marginBottom: '0.25rem'
                };
                break;
              case 'dialogue':
                blockStyle = {
                  ...blockStyle,
                  textAlign: 'left',
                  marginLeft: '20%',
                  width: '60%',
                  marginTop: '0.25rem',
                  marginBottom: '0.5rem'
                };
                break;
              case 'transition':
                blockStyle = {
                  ...blockStyle,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  textAlign: 'right',
                  marginTop: '1.5rem',
                  marginBottom: '1.5rem'
                };
                break;
              default:
                break;
            }

            return (
              <div 
                key={block.id} 
                style={blockStyle} 
                className="whitespace-pre-wrap break-inside-avoid"
              >
                {block.type === 'character' ? block.text.toUpperCase() : block.text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-obsidian-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <FileEdit size={24} className="text-gold-500 animate-pulse" />
            <span>{language === 'th' ? 'ระบบเขียนบทภาพยนตร์' : 'Studio Screenplay Editor'}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <p className="text-xs text-slate-400">
              {language === 'th' 
                ? 'รูปแบบบทภาพยนตร์มาตรฐานสากล พร้อมระบบซิงก์ข้อมูลการแจกแจงบทถ่ายทำอัตโนมัติ' 
                : 'StudioBinder-inspired screenplay format & dynamic breakdown syncing'}
            </p>
            
            {/* Real-time Indicator */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0 select-none animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{language === 'th' ? 'เรียลไทม์' : 'Real-time'}</span>
            </div>

            {/* Online Collaborators */}
            {onlineUsers && onlineUsers.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <span className="text-[10px] text-slate-400 font-bold">
                  ● {onlineUsers.length} {language === 'th' ? 'คนกำลังใช้งาน' : 'Online'}
                </span>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {onlineUsers.map((collab) => (
                    <div 
                      key={collab.user_id}
                      className="w-5 h-5 rounded-full bg-gradient-to-tr from-gold-600 to-amber-500 border border-white dark:border-obsidian-950 flex items-center justify-center text-[8px] font-black text-white cursor-help shadow-xs"
                      title={`${collab.name} (Online since ${new Date(collab.online_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`}
                    >
                      {collab.name.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowKeyboardGuide(!showKeyboardGuide)}
            className={`p-2 rounded-lg border transition-all text-xs font-bold flex items-center gap-1.5 ${
              showKeyboardGuide 
                ? 'bg-slate-800 border-slate-700 text-gold-500' 
                : theme === 'dark' ? 'bg-obsidian-950 border-obsidian-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle size={15} />
            <span>{language === 'th' ? 'วิธีใช้คีย์บอร์ด' : 'Keys Guide'}</span>
          </button>
          
          <button
            onClick={handleLoadDemo}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              theme === 'dark' ? 'bg-obsidian-900 hover:bg-obsidian-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Play size={13} className="text-emerald-500 fill-emerald-500" />
            <span>{language === 'th' ? 'โหลดบทตัวอย่าง' : 'Load Demo Script'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              theme === 'dark' ? 'bg-obsidian-900 hover:bg-obsidian-800 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Printer size={13} />
            <span>{language === 'th' ? 'พิมพ์บทภาพยนตร์ / PDF' : 'Print Script / PDF'}</span>
          </button>

          {hasWriteAccess() && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-obsidian-800 bg-slate-50 dark:bg-obsidian-950/40 text-xs font-semibold shrink-0 select-none">
              {saveStatus === 'saving' || isLoading ? (
                <span className="flex items-center gap-1.5 text-amber-500 animate-pulse">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{language === 'th' ? 'กำลังบันทึกอัตโนมัติ...' : 'Auto-saving...'}</span>
                </span>
              ) : saveStatus === 'error' ? (
                <span className="flex items-center gap-1.5 text-red-500">
                  <X size={14} className="stroke-[3px]" />
                  <span>{language === 'th' ? 'บันทึกไม่สำเร็จ!' : 'Save failed!'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle size={14} />
                  <span>{language === 'th' ? 'บันทึกบทอัตโนมัติแล้ว' : 'Saved automatically'}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Guide Panel */}
      {showKeyboardGuide && (
        <div className="glass-panel p-4 rounded-xl border border-gold-500/20 text-xs space-y-3 animate-fadeIn no-print">
          <h3 className="font-bold text-gold-500 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>{language === 'th' ? 'ปุ่มลัดการจัดรูปแบบบทภาพยนตร์ (มาตรฐาน WGA)' : 'Screenplay Formatter Shortcuts (WGA Standard)'}</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-400 leading-relaxed font-mono">
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">Enter</kbd> : {language === 'th' ? 'เพิ่มแถวถัดไปอัตโนมัติ' : 'Add logical next element'}</p>
            </div>
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">Tab</kbd> : {language === 'th' ? 'เปลี่ยนรูปแบบย่อหน้า' : 'Cycle format styles'}</p>
            </div>
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">Backspace</kbd> : {language === 'th' ? 'ลบแถวว่าง' : 'Delete empty line'}</p>
            </div>
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">↑ / ↓</kbd> : {language === 'th' ? 'เลื่อนขึ้น / ลง' : 'Navigate lines'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Grid: Side breakdown stats & Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start no-print">
        
        {/* SIDE PANEL: Breakdown Sync Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-obsidian-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-obsidian-800">
              <RefreshCw size={15} className="text-gold-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === 'th' ? 'สถานะการซิงก์แจกแจงบท' : 'Breakdown Sync Status'}
              </h2>
            </div>

            {/* Scenes detected count */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{language === 'th' ? 'ฉากที่ตรวจพบ:' : 'Scenes Detected:'}</span>
                <span className="font-bold text-gold-500 font-mono text-sm">{detectedScenes.length}</span>
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 mt-2">
                {detectedScenes.map(s => (
                  <div key={s.num} className="p-2 rounded bg-obsidian-950/40 border border-obsidian-850/50 text-[10px] truncate font-mono">
                    <span className="text-gold-500 font-bold mr-1">SCENE {s.num}:</span>
                    <span className="text-slate-300 font-semibold text-slate-700 dark:text-slate-300">{s.heading}</span>
                  </div>
                ))}
                {detectedScenes.length === 0 && (
                  <p className="text-[10px] text-slate-500 italic text-center py-2">
                    {language === 'th' ? 'พิมพ์หัวข้อฉาก เช่น INT. COFFEE SHOP - DAY' : 'Write scene header e.g. INT. COFFEE SHOP - DAY'}
                  </p>
                )}
              </div>
            </div>

            {/* Characters detected */}
            <div className="space-y-1 border-t border-slate-200 dark:border-obsidian-800 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{language === 'th' ? 'ตัวละครที่พบ:' : 'Characters Found:'}</span>
                <span className="font-bold text-amber-500 font-mono text-sm">{detectedCharacters.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {detectedCharacters.map(char => (
                  <span key={char} className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    👤 {char}
                  </span>
                ))}
                {detectedCharacters.length === 0 && (
                  <p className="text-[10px] text-slate-500 italic text-center py-1 w-full">
                    {language === 'th' ? 'ไม่พบข้อมูลบทสนทนาตัวละคร' : 'No character lines found.'}
                  </p>
                )}
              </div>
            </div>

            {/* Sync Alert info */}
            <div className="p-3 rounded-lg bg-gold-500/5 border border-gold-500/10 text-[10px] text-slate-400 leading-relaxed space-y-1">
              <p className="font-bold text-gold-500 flex items-center gap-1">
                <CheckCircle size={10} />
                <span>{language === 'th' ? 'การซิงก์ข้อมูลทำงานอย่างไร?' : 'How Breakdown Sync Works'}</span>
              </p>
              <p>
                {language === 'th' 
                  ? 'เมื่อคุณบันทึกบท หัวข้อฉากจะถูกนำไปสร้างเป็นฉากถ่ายทำในหน้าแจกแจงบทโดยอัตโนมัติ ส่วนเนื้อความบรรยายจะกลายเป็นคำอธิบาย และตัวละครจะถูกสร้างเป็นรายชื่อนักแสดงในฉากนั้นทันที' 
                  : 'Saving your script translates headings into Breakdown scenes. Action lines become descriptions, and characters are auto-mapped as cast members.'}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN PANEL: The Virtual Script Page */}
        <div className="lg:col-span-3">
          
          <div className={`p-6 md:p-12 min-h-[700px] border shadow-2xl rounded-2xl transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-obsidian-900/60 border-obsidian-800/80 shadow-black/80 shadow-slate-900' 
              : 'bg-white border-slate-200'
          }`}>
            
            {/* Screenplay virtual title marker (Optional visual header) */}
            <div className="text-center font-mono opacity-25 uppercase tracking-widest text-[10px] border-b pb-4 mb-8">
              {project?.title?.[language] || (language === 'th' ? 'บทภาพยนตร์' : 'STUDIO SCREENPLAY')} — {language === 'th' ? 'มุมมองโครงการ' : 'PROJECT VIEW'}
            </div>

            {/* Screenplay block lists */}
            <div className="space-y-1 font-mono">
              {blocks.map((block, idx) => {
                const typeStyle = blockTypes[block.type] || blockTypes.action;
                const isActive = activeBlockIndex === idx;

                return (
                  <div 
                    key={block.id}
                    className={`group relative flex items-start gap-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-gold-500/5 dark:bg-gold-500/5 ring-1 ring-gold-500/20' 
                        : 'hover:bg-slate-100/10 dark:hover:bg-obsidian-850/5'
                    }`}
                  >
                    
                    {/* Hover Formatting Controls & Drag markers */}
                    <div className="absolute -left-12 top-1.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                      
                      {/* Element Type Icon indicator (Clickable select menu) */}
                      <div className="relative group/menu">
                        <span 
                          className="p-1 rounded bg-obsidian-900 border border-obsidian-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer block"
                          title={language === 'th' ? 'เปลี่ยนรูปแบบแถว' : 'Change format type'}
                        >
                          <Menu size={12} />
                        </span>
                        
                        {/* Dropdown element selector */}
                        <div className="absolute left-0 mt-1 hidden group-hover/menu:block bg-obsidian-900 border border-obsidian-800 rounded-lg shadow-xl py-1 w-44 z-30 font-sans">
                          {Object.entries(blockTypes).map(([key, value]) => (
                            <button
                              key={key}
                              onClick={() => setBlockType(idx, key)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gold-500 hover:text-white transition-colors flex justify-between ${
                                block.type === key ? 'text-gold-500 font-bold' : 'text-slate-300'
                              }`}
                            >
                              <span>{value.label}</span>
                              <span className="text-[9px] opacity-50 font-mono font-normal">
                                {key === 'heading' ? 'H' : key === 'action' ? 'A' : key === 'character' ? 'C' : key === 'parenthetical' ? 'P' : key === 'dialogue' ? 'D' : 'T'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteBlock(idx)}
                        disabled={blocks.length <= 1}
                        className="p-1 rounded bg-obsidian-900 border border-obsidian-850 hover:bg-red-950/40 hover:text-red-400 text-slate-400 transition-colors disabled:opacity-50"
                        title={language === 'th' ? 'ลบแถวนี้' : 'Delete line'}
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Swap Up */}
                      <button
                        onClick={() => moveBlock(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-obsidian-900 border border-obsidian-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <ArrowUp size={12} />
                      </button>

                      {/* Swap Down */}
                      <button
                        onClick={() => moveBlock(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        className="p-1 rounded bg-obsidian-900 border border-obsidian-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    {/* Text Field Editor Element */}
                    <div className="flex-1">
                      {/* Element Tag helper (e.g. Dialogue indicator label for visuals) */}
                      {isActive && (
                        <div className="text-[9px] font-sans font-bold text-gold-500 uppercase tracking-widest pl-4 select-none mb-0.5 no-print">
                          {language === 'th' 
                            ? `รูปแบบ: ${typeStyle.label} • กด Tab เพื่อสลับรูปแบบ` 
                            : `${typeStyle.label} format • Press Tab to change type`}
                        </div>
                      )}
                      
                      <textarea
                        ref={el => blockRefs.current[idx] = el}
                        value={block.text}
                        onChange={(e) => handleTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onFocus={() => setActiveBlockIndex(idx)}
                        onBlur={handleBlur}
                        rows={1}
                        placeholder={
                          block.type === 'heading' 
                            ? (language === 'th' ? 'ภายใน. สถานที่ - กลางวัน (เช่น INT. COFFEE SHOP - DAY)' : 'INT. PLACE - DAY')
                            : block.type === 'character' 
                              ? (language === 'th' ? 'ชื่อตัวละคร' : 'CHARACTER NAME')
                              : block.type === 'parenthetical'
                                ? (language === 'th' ? '(รายละเอียดการแสดงอารมณ์น้ำเสียง)' : '(delivery details)')
                                : block.type === 'dialogue'
                                  ? (language === 'th' ? 'พิมพ์บทสนทนาตรงนี้...' : 'Write dialogue lines...')
                                  : block.type === 'transition'
                                    ? (language === 'th' ? 'ตัดฉากไปยัง (เช่น FADE OUT.)' : 'FADE OUT.')
                                    : (language === 'th' ? 'พิมพ์บทบรรยายการเคลื่อนไหวหรือเหตุการณ์...' : 'Describe the scene action...')
                        }
                        className={`w-full bg-transparent border-0 outline-none focus:ring-0 resize-none font-mono text-xs md:text-sm leading-relaxed p-1 tracking-normal focus:bg-slate-100/5 dark:focus:bg-obsidian-950/20 rounded ${
                          typeStyle.class
                        } ${typeStyle.align} text-slate-900 dark:text-slate-100`}
                        style={{
                          height: 'auto',
                          minHeight: '2rem',
                          fontFamily: "'Courier New', Courier, monospace border-none focus:outline-none"
                        }}
                      />
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Quick append formatting tools at the very bottom (No Print) */}
            <div className="mt-8 border-t border-slate-200 dark:border-obsidian-800 pt-6 flex flex-wrap gap-2.5 items-center justify-center no-print">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">{language === 'th' ? 'เพิ่มแถวอย่างเร็ว:' : 'Quick Add:'}</span>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'heading')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                {language === 'th' ? '+ เพิ่มหัวข้อฉาก' : '+ Scene Heading'}
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'action')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                {language === 'th' ? '+ เพิ่มบทบรรยาย' : '+ Action'}
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'character')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                {language === 'th' ? '+ เพิ่มตัวละคร' : '+ Character'}
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'parenthetical')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                {language === 'th' ? '+ เพิ่มวงเล็บอารมณ์' : '+ Parenthetical'}
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'dialogue')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                {language === 'th' ? '+ เพิ่มบทสนทนา' : '+ Dialogue'}
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'transition')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                {language === 'th' ? '+ เพิ่มคำเชื่อมฉาก' : '+ Transition'}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
