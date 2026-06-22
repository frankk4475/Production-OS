import { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScriptBreakdown from './components/ScriptBreakdown';
import MasterCalendar from './components/MasterCalendar';
import CrewPortal from './components/CrewPortal';
import DocumentsHub from './components/DocumentsHub';
import LoginPage from './components/LoginPage';
import ScriptEditor from './components/ScriptEditor';
import StoryPlanner from './components/StoryPlanner';

function MainApp() {
  const { user, login, isCrewOrTalent } = useAuth();
  const {
    projects,
    currentProjectId,
    currentProject,
    activeScenes,
    activeCrew,
    activeEvents,
    activeShotList,
    activeCompletedTasks,
    weather,
    setWeather,
    setProjects,
    setCurrentProjectId,
    setScenes,
    setCrew,
    setEvents,
    setShotList,
    setCompletedTasks,
    exportDatabase,
    importDatabase,
    resetDatabase,
    updateProject,
    handleDeleteProject
  } = useProject();

  // Navigation State synced with URL Hash
  const [currentTab, setCurrentTab] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    const allowed = isCrewOrTalent() 
      ? ['personal', 'callsheets'] 
      : ['dashboard', 'storyOutline', 'script', 'breakdown', 'calendar', 'crew', 'docs'];
    return allowed.includes(hash) ? hash : (isCrewOrTalent() ? 'personal' : 'dashboard');
  });
  const [tabParams, setTabParams] = useState(null);

  const crewOrTalent = isCrewOrTalent();

  // Sync hash routing with currentTab and authentication rules
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      const allowed = crewOrTalent 
        ? ['personal', 'callsheets'] 
        : ['dashboard', 'storyOutline', 'script', 'breakdown', 'calendar', 'crew', 'docs'];
      
      const savedUser = localStorage.getItem('prod_user');
      if (!savedUser) {
        if (window.location.hash !== '#/login') {
          window.location.hash = '#/login';
        }
        setCurrentTab('login');
      } else {
        if (hash === 'login' || !allowed.includes(hash)) {
          const defaultTab = crewOrTalent ? 'personal' : 'dashboard';
          window.location.hash = `#/${defaultTab}`;
          setCurrentTab(defaultTab);
        } else {
          setCurrentTab(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, crewOrTalent]);

  const handleSetTab = (tab) => {
    if (tab !== 'docs') setTabParams(null);
    window.location.hash = `#/${tab}`;
  };

  const handleLogin = (userData) => {
    login(userData.email, userData.role, userData.name);
  };

  // Tab rendering helper
  const renderContent = () => {
    switch (currentTab) {
      case 'storyOutline':
        return (
          <StoryPlanner key={currentProjectId} />
        );
      case 'dashboard':
        return (
          <Dashboard
            project={currentProject}
            setProject={updateProject}
            projects={projects}
            onDeleteProject={handleDeleteProject}
            scenes={activeScenes}
            crew={activeCrew}
            events={activeEvents}
            weather={weather}
            setWeather={setWeather}
            setCurrentTab={handleSetTab}
            onExportData={exportDatabase}
            onImportData={importDatabase}
            onResetData={resetDatabase}
          />
        );
      case 'script':
        return (
          <ScriptEditor key={currentProjectId} />
        );
      case 'breakdown':
        return (
          <ScriptBreakdown 
            scenes={activeScenes} 
            setScenes={setScenes} 
          />
        );
      case 'calendar':
        return (
          <MasterCalendar
            events={activeEvents}
            crew={activeCrew}
            setCurrentTab={handleSetTab}
            setTabParams={setTabParams}
          />
        );
      case 'crew':
        return (
          <CrewPortal
            crew={activeCrew}
            setCrew={setCrew}
            events={activeEvents}
            setEvents={setEvents}
            completedTasks={activeCompletedTasks}
            setCompletedTasks={setCompletedTasks}
          />
        );
      case 'personal':
        return (
          <CrewPortal
            crew={activeCrew}
            setCrew={setCrew}
            events={activeEvents}
            setEvents={setEvents}
            completedTasks={activeCompletedTasks}
            setCompletedTasks={setCompletedTasks}
            lockedCrewId={user?.id}
          />
        );
      case 'docs':
        return (
          <DocumentsHub
            scenes={activeScenes}
            crew={activeCrew}
            weather={weather}
            initialSceneNum={tabParams?.sceneNum}
            shotList={activeShotList}
            setShotList={setShotList}
          />
        );
      case 'callsheets':
        return (
          <DocumentsHub
            scenes={activeScenes}
            crew={activeCrew}
            weather={weather}
            initialSceneNum={tabParams?.sceneNum}
            shotList={activeShotList}
            setShotList={setShotList}
            lockedTab="callsheet"
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout 
      currentTab={currentTab} 
      setCurrentTab={handleSetTab} 
      project={currentProject}
      projects={projects}
      setProjects={setProjects}
      currentProjectId={currentProjectId}
      setCurrentProjectId={setCurrentProjectId}
    >
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProjectProvider>
            <MainApp />
          </ProjectProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
