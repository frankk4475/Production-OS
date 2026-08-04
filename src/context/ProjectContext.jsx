/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { googleCalendar } from '../services/googleCalendar';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { RotateCcw, X } from 'lucide-react';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { user } = useAuth();
  const getProjectKey = useCallback((baseKey) => user?.id ? `${baseKey}_${user.id}` : baseKey, [user]);

  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('');
  const [scenes, setScenes] = useState([]);
  const [crew, setCrew] = useState([]);
  const [events, setEvents] = useState([]);
  const [shotList, setShotList] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [scriptBlocks, setScriptBlocks] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [storyOutline, setStoryOutline] = useState({
    plotlines: [],
    characters: [],
    beats: [],
    logline: { th: '', en: '' },
    tone: { th: '', en: '' },
    theme: { th: '', en: '' },
    genre: { th: '', en: '' },
    writer: { th: '', en: '' },
    contact: { th: '', en: '' }
  });
  const [productionReports, setProductionReports] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global Undo / Redo Restoration System
  const [undoStack, setUndoStack] = useState([]);
  const [activeUndoToast, setActiveUndoToast] = useState(null);

  const undoStackRef = useRef(undoStack);
  useEffect(() => {
    undoStackRef.current = undoStack;
  }, [undoStack]);

  const pushUndoAction = useCallback((label, restoreFn) => {
    const actionId = `undo-${Date.now()}-${Math.random()}`;
    const undoItem = { id: actionId, label, restoreFn };

    setUndoStack(prev => [...prev, undoItem]);
    setActiveUndoToast(undoItem);
  }, []);

  const performUndo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const lastAction = prev[prev.length - 1];
      if (lastAction && typeof lastAction.restoreFn === 'function') {
        try {
          lastAction.restoreFn();
          setActiveUndoToast({
            id: `restored-${Date.now()}`,
            label: `✅ กู้คืนข้อมูลสำเร็จ: ${lastAction.label}`,
            isRestoredNotice: true
          });
          setTimeout(() => setActiveUndoToast(null), 3500);
        } catch (err) {
          console.error("Undo restoration failed:", err);
        }
      }
      return prev.slice(0, -1);
    });
  }, []);

  // Auto-expire active toast after 60 seconds (1 minute window)
  useEffect(() => {
    if (!activeUndoToast || activeUndoToast.isRestoredNotice) return;
    const timer = setTimeout(() => {
      setActiveUndoToast(null);
    }, 60000);
    return () => clearTimeout(timer);
  }, [activeUndoToast]);

  // Global Keyboard listener for Ctrl+Z or Cmd+Z (supports English, Thai keyboard layouts, Windows Ctrl and Mac Cmd)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl or Meta (Cmd on Mac)
      const isModifier = e.ctrlKey || e.metaKey;
      
      // Check for Z key across physical key code (KeyZ), character ('z', 'Z', 'ผ'), or keyCode (90)
      const isZKey = e.code === 'KeyZ' || 
                     (e.key && (e.key.toLowerCase() === 'z' || e.key === 'ผ')) || 
                     e.keyCode === 90;

      if (isModifier && isZKey && !e.shiftKey && !e.altKey) {
        const currentStack = undoStackRef.current || [];
        if (currentStack.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          performUndo();
        }
      }
    };

    // Use capture phase (true) so we intercept Ctrl+Z / Cmd+Z before any other event handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [performUndo]);

  // 1. Initial Load: Projects and Crew
  useEffect(() => {
    const initLoad = async () => {
      try {
        setIsLoading(true);
        const projectsData = await api.getProjects();
        const crewData = await api.getCrew();
        
        setProjects(projectsData);
        setCrew(crewData);

        // Pick current project
        const currentProjKey = getProjectKey('prod_current_project_id');
        const savedProjId = localStorage.getItem(currentProjKey) || localStorage.getItem('prod_current_project_id');
        if (savedProjId && projectsData.some(p => p.id === savedProjId)) {
          setCurrentProjectId(savedProjId);
        } else if (projectsData.length > 0) {
          setCurrentProjectId(projectsData[0].id);
        } else {
          setCurrentProjectId('');
        }
      } catch (err) {
        console.error("Initial load failed:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    initLoad();
  }, [user?.id, getProjectKey]);

  // 2. Fetch Project-specific Data when currentProjectId changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!currentProjectId) {
        setScenes([]);
        setEvents([]);
        setShotList([]);
        setCompletedTasks({});
        setScriptBlocks([]);
        setStoryOutline({
          plotlines: [],
          characters: [],
          beats: [],
          logline: { th: '', en: '' },
          tone: { th: '', en: '' },
          theme: { th: '', en: '' },
          genre: { th: '', en: '' },
          writer: { th: '', en: '' },
          contact: { th: '', en: '' }
        });
        setProductionReports([]);
        return;
      }

      try {
        setIsLoading(true);
        localStorage.setItem(getProjectKey('prod_current_project_id'), currentProjectId);

        const [scenesData, eventsData, shotListData, tasksData, scriptData, outlineData, reportsData] = await Promise.all([
          api.getScenes(currentProjectId),
          api.getEvents(currentProjectId),
          api.getShotList(currentProjectId),
          api.getCompletedTasks(currentProjectId),
          api.getScript(currentProjectId),
          api.getStoryOutline(currentProjectId),
          api.getProductionReports(currentProjectId)
        ]);

        setScenes(scenesData);
        setEvents(eventsData);
        setShotList(shotListData);
        setCompletedTasks(tasksData);
        setScriptBlocks(scriptData || []);
        setStoryOutline(outlineData || {
          plotlines: [],
          characters: [],
          beats: [],
          logline: { th: '', en: '' },
          tone: { th: '', en: '' },
          theme: { th: '', en: '' },
          genre: { th: '', en: '' },
          writer: { th: '', en: '' },
          contact: { th: '', en: '' }
        });
        setProductionReports(reportsData || []);
      } catch (err) {
        console.error("Failed to load project details:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjectData();
  }, [currentProjectId, getProjectKey]);

  // Real-time Database Updates and Presence Collaboration System
  useEffect(() => {
    if (!currentProjectId || !isSupabaseConfigured) return;

    // 1. Subscribe to Postgres Database Changes for Realtime Collaboration
    const dbChannel = supabase
      .channel(`project-db-changes-${currentProjectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scripts', filter: `project_id=eq.${currentProjectId}` },
        async (payload) => {
          console.log('Realtime Script Update:', payload);
          const data = await api.getScript(currentProjectId);
          setScriptBlocks(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenes', filter: `project_id=eq.${currentProjectId}` },
        async (payload) => {
          console.log('Realtime Scenes Update:', payload);
          const data = await api.getScenes(currentProjectId);
          setScenes(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `project_id=eq.${currentProjectId}` },
        async (payload) => {
          console.log('Realtime Events Update:', payload);
          const data = await api.getEvents(currentProjectId);
          setEvents(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'story_outlines', filter: `project_id=eq.${currentProjectId}` },
        async (payload) => {
          console.log('Realtime Story Outline Update:', payload);
          const data = await api.getStoryOutline(currentProjectId);
          setStoryOutline(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shot_list', filter: `project_id=eq.${currentProjectId}` },
        async (payload) => {
          console.log('Realtime Shot List Update:', payload);
          const data = await api.getShotList(currentProjectId);
          setShotList(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'completed_tasks', filter: `project_id=eq.${currentProjectId}` },
        async (payload) => {
          console.log('Realtime Completed Tasks Update:', payload);
          const data = await api.getCompletedTasks(currentProjectId);
          setCompletedTasks(data);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'production_reports', filter: `project_id=eq.${currentProjectId}` },
        async (payload) => {
          console.log('Realtime Production Reports Update:', payload);
          const data = await api.getProductionReports(currentProjectId);
          setProductionReports(data);
        }
      )
      .subscribe();

    // 2. Track Collaborators Presence on this Project
    const presenceChannel = supabase.channel(`presence-${currentProjectId}`);
    const currentLanguage = localStorage.getItem('language') || 'th';
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeUsersList = [];
        Object.keys(state).forEach(key => {
          state[key].forEach(presence => {
            // Deduplicate online users by user_id to prevent duplicates
            if (!activeUsersList.some(u => u.user_id === presence.user_id)) {
              activeUsersList.push(presence);
            }
          });
        });
        setOnlineUsers(activeUsersList);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user?.id || 'anonymous-' + Math.random().toString(36).substring(2, 9),
            name: user?.email ? user.email.split('@')[0] : (currentLanguage === 'th' ? 'ผู้ใช้นิรนาม' : 'Anonymous'),
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentProjectId, user?.id, user?.email]);

  // Derived current active project
  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  // Actions
  const switchProject = (projectId) => {
    if (projects.some(p => p.id === projectId) || projectId === '') {
      setCurrentProjectId(projectId);
    }
  };

  const handleAddProject = async (newProjData) => {
    try {
      setIsLoading(true);
      const newProj = await api.createProject(newProjData);
      setProjects(prev => [...prev, newProj]);
      setCurrentProjectId(newProj.id);
      return newProj;
    } catch (err) {
      console.error("Failed to add project:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (updatedProj) => {
    try {
      setIsLoading(true);
      const result = await api.updateProject(updatedProj);
      setProjects(prev => prev.map(p => p.id === result.id ? result : p));
      return result;
    } catch (err) {
      console.error("Failed to update project:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projId) => {
    try {
      setIsLoading(true);
      await api.deleteProject(projId);
      const remaining = projects.filter(p => p.id !== projId);
      setProjects(remaining);
      
      if (currentProjectId === projId) {
        if (remaining.length > 0) {
          setCurrentProjectId(remaining[0].id);
        } else {
          setCurrentProjectId('');
        }
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Weather Manager
  const setWeather = async (newWeather, weatherDetail = '') => {
    if (!currentProject) return;
    try {
      const updated = { ...currentProject, current_weather: newWeather, weather_detail: weatherDetail };
      await handleUpdateProject(updated);
    } catch (err) {
      console.error("Failed to set weather:", err);
    }
  };

  // Scenes CRUD
  const addScene = async (sceneData) => {
    try {
      setIsLoading(true);
      const newScene = await api.createScene({ ...sceneData, project_id: currentProjectId });
      setScenes(prev => [...prev, newScene]);
      return newScene;
    } catch (err) {
      console.error("Failed to create scene:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateScene = async (sceneData) => {
    try {
      setIsLoading(true);
      const updated = await api.updateScene(sceneData);
      setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
      return updated;
    } catch (err) {
      console.error("Failed to update scene:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateScenes = async (scenesList) => {
    try {
      setIsLoading(true);
      const updated = await api.updateScenes(scenesList);
      setScenes(prev => {
        const remaining = prev.filter(s => !updated.some(u => u.id === s.id));
        return [...remaining, ...updated].sort((a, b) => {
          const orderA = a.tech_notes?.scheduling?.order !== undefined ? a.tech_notes.scheduling.order : parseFloat(a.scene_number) || 0;
          const orderB = b.tech_notes?.scheduling?.order !== undefined ? b.tech_notes.scheduling.order : parseFloat(b.scene_number) || 0;
          return orderA - orderB;
        });
      });
      return updated;
    } catch (err) {
      console.error("Failed to update scenes:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const recalculatePageLengths = async () => {
    if (!currentProjectId || !scriptBlocks || scriptBlocks.length === 0) {
      const isTh = localStorage.getItem('language') !== 'en';
      alert(isTh ? 'ไม่มีข้อมูลบทเรียนหรือบทภาพยนตร์ในฉาก' : 'No screenplay blocks found to calculate.');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.saveScript(currentProjectId, scriptBlocks, false);
      const updatedScenes = await api.getScenes(currentProjectId);
      setScenes(updatedScenes);
      const isTh = localStorage.getItem('language') !== 'en';
      alert(isTh ? 'คำนวณความยาวหน้าบทของทุกฉากเสร็จเรียบร้อยแล้ว!' : 'Recalculated all scene page lengths successfully!');
    } catch (err) {
      console.error(err);
      alert("Failed to recalculate: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteScene = async (sceneId) => {
    try {
      setIsLoading(true);
      await api.deleteScene(sceneId);
      setScenes(prev => prev.filter(s => s.id !== sceneId));
    } catch (err) {
      console.error("Failed to delete scene:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Crew CRUD
  const addCrewMember = async (crewData) => {
    try {
      setIsLoading(true);
      const newMember = await api.createCrewMember(crewData);
      setCrew(prev => [...prev, newMember]);
      return newMember;
    } catch (err) {
      console.error("Failed to add crew member:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCrewMember = async (crewData) => {
    try {
      setIsLoading(true);
      const updated = await api.updateCrewMember(crewData);
      setCrew(prev => prev.map(c => c.id === updated.id ? updated : c));
      return updated;
    } catch (err) {
      console.error("Failed to update crew member:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCrewMember = async (crewId) => {
    try {
      setIsLoading(true);
      await api.deleteCrewMember(crewId);
      setCrew(prev => prev.filter(c => c.id !== crewId));
      
      // Reload events to reflect removed assignments
      if (currentProjectId) {
        const eventsData = await api.getEvents(currentProjectId);
        setEvents(eventsData);
      }
    } catch (err) {
      console.error("Failed to delete crew member:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Events CRUD
  const saveEvents = async (projectEvents) => {
    if (!currentProjectId) return;
    try {
      setIsLoading(true);
      const saved = await api.saveEvents(currentProjectId, projectEvents);
      setEvents(saved);

      // Perform background Google Calendar sync if connected
      const token = localStorage.getItem(getProjectKey('google_project_access_token'));
      const calId = localStorage.getItem(getProjectKey('google_project_calendar_id'));
      const expiresAt = localStorage.getItem(getProjectKey('google_project_token_expires_at'));
      
      if (token && calId && expiresAt && Number(expiresAt) > Date.now()) {
        (async () => {
          try {
            const syncedEvents = JSON.parse(localStorage.getItem(`synced_google_events_${calId}`) || '{}');
            
            // 1. Sync active events
            for (const evt of saved) {
              const attendeesEmails = (evt.crew_assigned || []).map(crewId => {
                const cInfo = crew.find(c => c.id === crewId);
                return cInfo?.email !== '-' ? cInfo?.email : null;
              }).filter(email => !!email);

              const eventData = {
                title: evt.title?.th || evt.title?.en || 'Event',
                date: evt.date,
                location: evt.location?.th || evt.location?.en || '',
                description: `Project Event\nTime: ${evt.time || ''}\nScene: ${evt.scene_number || 'N/A'}`,
                attendees: attendeesEmails
              };

              const googleEventId = syncedEvents[evt.id];
              if (googleEventId) {
                try {
                  await googleCalendar.updateEvent(token, calId, googleEventId, eventData);
                } catch {
                  const res = await googleCalendar.createEvent(token, calId, eventData);
                  syncedEvents[evt.id] = res.id;
                }
              } else {
                const res = await googleCalendar.createEvent(token, calId, eventData);
                syncedEvents[evt.id] = res.id;
              }
            }
            
            // 2. Delete removed events
            const activeIds = saved.map(e => e.id);
            for (const oldId of Object.keys(syncedEvents)) {
              if (!activeIds.includes(oldId)) {
                const googleEventId = syncedEvents[oldId];
                try {
                  await googleCalendar.deleteEvent(token, calId, googleEventId);
                  delete syncedEvents[oldId];
                } catch (err) {
                  console.error("Failed to delete event from Google Calendar:", err);
                }
              }
            }

            localStorage.setItem(`synced_google_events_${calId}`, JSON.stringify(syncedEvents));
          } catch (syncErr) {
            console.error("Background Google Calendar sync failed:", syncErr);
          }
        })();
      }

      return saved;
    } catch (err) {
      console.error("Failed to save events:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Shot List CRUD
  const saveShotList = async (projectShots) => {
    if (!currentProjectId) return;
    // 1. Instantly update React state so UI updates with ZERO lag
    setShotList(projectShots);
    try {
      const saved = await api.saveShotList(currentProjectId, projectShots);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setShotList(saved);
      }
      return saved;
    } catch (err) {
      console.error("Failed to save shot list:", err);
    }
  };

  // Completed Tasks CRUD
  const saveCompletedTasks = async (projectTasks) => {
    if (!currentProjectId) return;
    const oldTasks = { ...completedTasks };
    // Optimistically update the UI immediately
    setCompletedTasks(projectTasks);
    try {
      const saved = await api.saveCompletedTasks(currentProjectId, projectTasks);
      setCompletedTasks(saved);
      return saved;
    } catch (err) {
      // Revert to old tasks on database error
      setCompletedTasks(oldTasks);
      console.error("Failed to save completed tasks:", err);
      setError(err.message);
      throw err;
    }
  };

  // Database Backup Actions
  const handleExportDatabase = () => {
    const dataObj = {
      projects: localStorage.getItem('prod_api_projects') ? JSON.parse(localStorage.getItem('prod_api_projects')) : [],
      crew: localStorage.getItem('prod_api_crew') ? JSON.parse(localStorage.getItem('prod_api_crew')) : [],
      scenes: localStorage.getItem('prod_api_scenes') ? JSON.parse(localStorage.getItem('prod_api_scenes')) : [],
      events: localStorage.getItem('prod_api_events') ? JSON.parse(localStorage.getItem('prod_api_events')) : [],
      shotList: localStorage.getItem('prod_api_shot_list') ? JSON.parse(localStorage.getItem('prod_api_shot_list')) : [],
      completedTasks: localStorage.getItem('prod_api_completed_tasks') ? JSON.parse(localStorage.getItem('prod_api_completed_tasks')) : {},
      scripts: localStorage.getItem('prod_api_scripts') ? JSON.parse(localStorage.getItem('prod_api_scripts')) : {},
      storyOutline: localStorage.getItem('prod_api_story_outline') ? JSON.parse(localStorage.getItem('prod_api_story_outline')) : {},
      productionReports: localStorage.getItem('prod_api_production_reports') ? JSON.parse(localStorage.getItem('prod_api_production_reports')) : {},
      exportVersion: 'production-6.0',
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dataObj, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `production_os_database_v6_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportDatabase = async (importedData) => {
    try {
      setIsLoading(true);
      await api.importAllData(importedData);
      // Reload window to trigger initial load from DB
      window.location.reload();
    } catch (err) {
      alert('Failed to parse database file: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Are you sure you want to reset all data? This will erase all custom projects and entries.')) {
      try {
        setIsLoading(true);
        await api.resetAllData();
        window.location.reload();
      } catch (err) {
        alert("Failed to reset database: " + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const saveScriptBlocks = async (blocks, skipSyncBreakdown = false) => {
    if (!currentProjectId) return;
    try {
      const saved = await api.saveScript(currentProjectId, blocks, skipSyncBreakdown);
      setScriptBlocks(saved);
      
      // Reload scenes asynchronously in the background to prevent blocking UI
      if (!skipSyncBreakdown) {
        api.getScenes(currentProjectId).then(scenesData => {
          setScenes(scenesData);
        }).catch(err => {
          console.error("Failed to refresh scenes in background:", err);
        });
      }
      
      return saved;
    } catch (err) {
      console.error("Failed to save script:", err);
      setError(err.message);
      throw err;
    }
  };

  const saveStoryOutline = async (newOutline) => {
    if (!currentProjectId) return;
    try {
      setIsLoading(true);
      const saved = await api.saveStoryOutline(currentProjectId, newOutline);
      setStoryOutline(saved);
      return saved;
    } catch (err) {
      console.error("Failed to save story outline:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const saveProductionReports = async (reports) => {
    if (!currentProjectId) return;
    try {
      setIsLoading(true);
      const saved = await api.saveProductionReports(currentProjectId, reports);
      setProductionReports(saved);
      return saved;
    } catch (err) {
      console.error("Failed to save production reports:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProjectId,
      currentProject,
      activeScenes: scenes,
      activeCrew: crew, // Crew is global across the studio
      activeEvents: events,
      activeShotList: shotList,
      activeCompletedTasks: completedTasks,
      weather: currentProject?.current_weather || 'Sunny',
      scriptBlocks,
      onlineUsers,
      saveScriptBlocks,
      storyOutline,
      saveStoryOutline,
      productionReports,
      saveProductionReports,
      isLoading,
      error,
      setProjects,
      setCurrentProjectId,
      switchProject,
      setWeather,
      handleAddProject,
      handleDeleteProject,
      updateProject: handleUpdateProject,
      
      // Scene actions
      addScene,
      updateScene,
      updateScenes,
      recalculatePageLengths,
      deleteScene,

      // Crew actions
      addCrewMember,
      updateCrewMember,
      deleteCrewMember,

      // State setters adapted as async saves
      setScenes: async (newScenesOrFn) => {
        const computed = typeof newScenesOrFn === 'function' ? newScenesOrFn(scenes) : newScenesOrFn;
        try {
          setIsLoading(true);
          const updatedNew = computed.map(s => ({ ...s, project_id: currentProjectId }));
          await api.updateScenes(updatedNew);
          setScenes(updatedNew);
        } catch (err) {
          console.error("Failed to set scenes:", err);
        } finally {
          setIsLoading(false);
        }
      },
      setCrew: async (newCrewOrFn) => {
        const computed = typeof newCrewOrFn === 'function' ? newCrewOrFn(crew) : newCrewOrFn;
        try {
          setIsLoading(true);
          localStorage.setItem('prod_api_crew', JSON.stringify(computed));
          setCrew(computed);
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      },
      setEvents: saveEvents,
      setShotList: saveShotList,
      setCompletedTasks: saveCompletedTasks,
      
      refreshCrew: async () => {
        try {
          setIsLoading(true);
          const crewData = await api.getCrew();
          setCrew(crewData);
        } catch (err) {
          console.error("Failed to refresh crew:", err);
        } finally {
          setIsLoading(false);
        }
      },
      
      exportDatabase: handleExportDatabase,
      importDatabase: handleImportDatabase,
      resetDatabase: handleResetDatabase,

      // Undo / Redo System
      pushUndoAction,
      performUndo,
      hasUndoActions: undoStack.length > 0
    }}>
      {children}

      {/* GLOBAL UNDO & RESTORATION TOAST BANNER */}
      {activeUndoToast && (
        <div className="fixed bottom-6 right-6 md:right-10 z-[99999] animate-fadeIn no-print">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-obsidian-950/95 border border-gold-500/50 text-slate-100 shadow-2xl backdrop-blur-md font-sans text-xs">
            <div className="flex items-center gap-2">
              {!activeUndoToast.isRestoredNotice && (
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-ping" />
              )}
              <span className="font-bold text-gold-400">{activeUndoToast.label}</span>
            </div>

            {!activeUndoToast.isRestoredNotice && (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-800">
                <button
                  type="button"
                  onClick={performUndo}
                  className="px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <RotateCcw size={14} />
                  <span>กู้คืน (Ctrl+Z)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveUndoToast(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
