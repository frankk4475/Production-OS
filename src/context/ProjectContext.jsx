import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState('');
  const [scenes, setScenes] = useState([]);
  const [crew, setCrew] = useState([]);
  const [events, setEvents] = useState([]);
  const [shotList, setShotList] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [scriptBlocks, setScriptBlocks] = useState([]);
  const [storyOutline, setStoryOutline] = useState({ plotlines: [], characters: [], beats: [] });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const savedProjId = localStorage.getItem('prod_current_project_id');
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
  }, []);

  // 2. Fetch Project-specific Data when currentProjectId changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!currentProjectId) {
        setScenes([]);
        setEvents([]);
        setShotList([]);
        setCompletedTasks({});
        setScriptBlocks([]);
        setStoryOutline({ plotlines: [], characters: [], beats: [] });
        return;
      }

      try {
        setIsLoading(true);
        localStorage.setItem('prod_current_project_id', currentProjectId);

        const [scenesData, eventsData, shotListData, tasksData, scriptData, outlineData] = await Promise.all([
          api.getScenes(currentProjectId),
          api.getEvents(currentProjectId),
          api.getShotList(currentProjectId),
          api.getCompletedTasks(currentProjectId),
          api.getScript(currentProjectId),
          api.getStoryOutline(currentProjectId)
        ]);

        setScenes(scenesData);
        setEvents(eventsData);
        setShotList(shotListData);
        setCompletedTasks(tasksData);
        setScriptBlocks(scriptData || []);
        setStoryOutline(outlineData || { plotlines: [], characters: [], beats: [] });
      } catch (err) {
        console.error("Failed to load project details:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjectData();
  }, [currentProjectId]);

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
    try {
      setIsLoading(true);
      const saved = await api.saveShotList(currentProjectId, projectShots);
      setShotList(saved);
      return saved;
    } catch (err) {
      console.error("Failed to save shot list:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Completed Tasks CRUD
  const saveCompletedTasks = async (projectTasks) => {
    if (!currentProjectId) return;
    try {
      setIsLoading(true);
      const saved = await api.saveCompletedTasks(currentProjectId, projectTasks);
      setCompletedTasks(saved);
      return saved;
    } catch (err) {
      console.error("Failed to save completed tasks:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
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

  const saveScriptBlocks = async (blocks) => {
    if (!currentProjectId) return;
    try {
      setIsLoading(true);
      const saved = await api.saveScript(currentProjectId, blocks);
      setScriptBlocks(saved);
      
      // Reload scenes because saving script updates the breakdown scenes!
      const scenesData = await api.getScenes(currentProjectId);
      setScenes(scenesData);
      
      return saved;
    } catch (err) {
      console.error("Failed to save script:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
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
      saveScriptBlocks,
      storyOutline,
      saveStoryOutline,
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
      deleteScene,

      // Crew actions
      addCrewMember,
      updateCrewMember,
      deleteCrewMember,

      // State setters adapted as async saves
      setScenes: async (newScenesOrFn) => {
        const computed = typeof newScenesOrFn === 'function' ? newScenesOrFn(scenes) : newScenesOrFn;
        // In this case, we update individual scenes or save them. Since Fns are used in components,
        // we can implement a bulk save or individual actions. To prevent breakages, let's allow bulk scene saving:
        try {
          setIsLoading(true);
          // Save scenes to global list
          const globalScenes = localStorage.getItem('prod_api_scenes') ? JSON.parse(localStorage.getItem('prod_api_scenes')) : [];
          const remaining = globalScenes.filter(s => s.project_id !== currentProjectId);
          const updatedNew = computed.map(s => ({ ...s, project_id: currentProjectId }));
          localStorage.setItem('prod_api_scenes', JSON.stringify([...remaining, ...updatedNew]));
          setScenes(updatedNew);
        } catch (err) {
          console.error(err);
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
      resetDatabase: handleResetDatabase
    }}>
      {children}
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
