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
  RefreshCw
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
    saveScriptBlocks,
    isLoading
  } = useProject();

  const [blocks, setBlocks] = useState([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState(null);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const blockRefs = useRef([]);

  // Load project script blocks when loaded from context
  useEffect(() => {
    if (scriptBlocks && scriptBlocks.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlocks(scriptBlocks);
    } else {
      setBlocks([
        { id: `b-${Date.now()}-1`, type: 'heading', text: 'INT. NEW SCENE - DAY' },
        { id: `b-${Date.now()}-2`, type: 'action', text: 'Write screenplay action here...' }
      ]);
    }
  }, [scriptBlocks]);

  // Sync refs array size
  useEffect(() => {
    blockRefs.current = blockRefs.current.slice(0, blocks.length);
  }, [blocks]);

  // Screenplay format definitions
  const blockTypes = {
    heading: { label: 'Scene Heading', class: 'font-mono text-xs md:text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-white pl-4 border-l-4 border-slate-500 mt-6 mb-3', align: 'text-left' },
    action: { label: 'Action / Narrative', class: 'font-mono text-xs md:text-sm text-slate-700 dark:text-slate-300 mt-3 mb-3', align: 'text-left' },
    character: { label: 'Character', class: 'font-mono text-xs md:text-sm font-bold text-gold-600 dark:text-gold-400 uppercase tracking-widest mt-4 mb-1 text-center', align: 'text-center' },
    parenthetical: { label: 'Parenthetical', class: 'font-mono text-xs md:text-sm text-slate-500 dark:text-slate-400 italic mt-1 mb-1 text-center', align: 'text-center' },
    dialogue: { label: 'Dialogue', class: 'font-mono text-xs md:text-sm text-slate-800 dark:text-slate-200 mt-1.5 mb-2 mx-auto max-w-[80%] md:max-w-[60%] text-center', align: 'text-center font-medium' },
    transition: { label: 'Transition', class: 'font-mono text-xs md:text-sm font-bold text-amber-600 dark:text-amber-500 uppercase mt-4 mb-4 text-right pr-4 border-r-4 border-amber-500', align: 'text-right' }
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
    setBlocks(newBlocks);
  };

  // Block type changes via mouse click dropdown
  const setBlockType = (index, type) => {
    const newBlocks = [...blocks];
    newBlocks[index].type = type;
    if (type === 'character') {
      newBlocks[index].text = newBlocks[index].text.toUpperCase();
    }
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

    setBlocks(newBlocks);
    setTimeout(() => {
      if (blockRefs.current[targetIndex]) {
        blockRefs.current[targetIndex].focus();
      }
    }, 50);
  };

  // Save & Sync Action
  const handleSaveAndSync = async () => {
    if (!project) return;
    try {
      await saveScriptBlocks(blocks);
      setIsSavedSuccessfully(true);
      setTimeout(() => {
        setIsSavedSuccessfully(false);
      }, 3000);
    } catch (err) {
      alert("Failed to sync script: " + err.message);
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
      
      {/* Editor Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-obsidian-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-serif tracking-tight flex items-center gap-2">
            <FileEdit size={24} className="text-gold-500 animate-pulse" />
            <span>{language === 'th' ? 'ระบบเขียนบทภาพยนตร์' : 'Studio Screenplay Editor'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            StudioBinder-inspired screenplay format & dynamic breakdown syncing
          </p>
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

          {hasWriteAccess() && (
            <button
              onClick={handleSaveAndSync}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-gold-600 to-amber-500 text-white shadow-sm hover:shadow-md transition-all shrink-0 active:scale-[0.98]"
            >
              {isSavedSuccessfully ? (
                <>
                  <CheckCircle size={14} className="animate-scaleIn" />
                  <span>{language === 'th' ? 'บันทึกและซิงค์แล้ว!' : 'Saved & Synced!'}</span>
                </>
              ) : isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{language === 'th' ? 'กำลังซิงค์...' : 'Syncing...'}</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{language === 'th' ? 'บันทึกและซิงค์บท' : 'Save & Sync to Breakdown'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Guide Panel */}
      {showKeyboardGuide && (
        <div className="glass-panel p-4 rounded-xl border border-gold-500/20 text-xs space-y-3 animate-fadeIn no-print">
          <h3 className="font-bold text-gold-500 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>Screenplay Formatter Shortcuts (WGA Standard)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-400 leading-relaxed font-mono">
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">Enter</kbd> : Add logical next element</p>
            </div>
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">Tab</kbd> : Cycle format styles</p>
            </div>
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">Backspace</kbd> : Delete empty line</p>
            </div>
            <div>
              <p><kbd className="bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">↑ / ↓</kbd> : Navigate lines</p>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Grid: Side breakdown stats & Main Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SIDE PANEL: Breakdown Sync Status */}
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className="glass-panel p-5 rounded-xl border border-slate-200 dark:border-obsidian-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-obsidian-800">
              <RefreshCw size={15} className="text-gold-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Breakdown Sync Status
              </h2>
            </div>

            {/* Scenes detected count */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Scenes Detected:</span>
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
                    Write scene header e.g. INT. COFFEE SHOP - DAY
                  </p>
                )}
              </div>
            </div>

            {/* Characters detected */}
            <div className="space-y-1 border-t border-slate-200 dark:border-obsidian-800 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Characters Found:</span>
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
                    No character lines found.
                  </p>
                )}
              </div>
            </div>

            {/* Sync Alert info */}
            <div className="p-3 rounded-lg bg-gold-500/5 border border-gold-500/10 text-[10px] text-slate-400 leading-relaxed space-y-1">
              <p className="font-bold text-gold-500 flex items-center gap-1">
                <CheckCircle size={10} />
                <span>How Breakdown Sync Works</span>
              </p>
              <p>Saving your script translates headings into Breakdown scenes. Action lines become descriptions, and characters are auto-mapped as cast members.</p>
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
              {project?.title?.[language] || 'STUDIO SCREENPLAY'} — PROJECT VIEW
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
                          title="Change format type"
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

                      {/* Delete Line */}
                      <button
                        onClick={() => deleteBlock(idx)}
                        disabled={blocks.length <= 1}
                        className="p-1 rounded bg-obsidian-900 border border-obsidian-800 hover:bg-red-500 hover:text-white text-slate-400 transition-colors disabled:opacity-50"
                        title="Delete line"
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
                          {typeStyle.label} format • Press Tab to change type
                        </div>
                      )}
                      
                      <textarea
                        ref={el => blockRefs.current[idx] = el}
                        value={block.text}
                        onChange={(e) => handleTextChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onFocus={() => setActiveBlockIndex(idx)}
                        onBlur={() => setActiveBlockIndex(null)}
                        rows={1}
                        placeholder={
                          block.type === 'heading' 
                            ? 'INT. PLACE - DAY' 
                            : block.type === 'character' 
                              ? 'CHARACTER NAME' 
                              : block.type === 'parenthetical'
                                ? '(delivery details)'
                                : block.type === 'dialogue'
                                  ? 'Write dialogue lines...'
                                  : block.type === 'transition'
                                    ? 'FADE OUT.'
                                    : 'Describe the scene action...'
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Quick Add:</span>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'heading')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                + Scene Heading
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'action')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                + Action
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'character')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                + Character
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'parenthetical')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                + Parenthetical
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'dialogue')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                + Dialogue
              </button>
              <button 
                onClick={() => insertBlock(blocks.length - 1, 'transition')}
                className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold font-mono transition-all"
              >
                + Transition
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
