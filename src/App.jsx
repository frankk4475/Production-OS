import React, { useState, useEffect } from 'react';
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
import ShootingSchedule from './components/ShootingSchedule';
import ProductionHub from './components/ProductionHub';
import PipelineBanner from './components/PipelineBanner';

// Top-Level Error Boundary Component to prevent white screen crashes anywhere in the app
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Production OS Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-3xl font-bold">
              🎬
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">ระบบ Production OS ตรวจพบข้อผิดพลาดการทำงาน</h2>
              <p className="text-xs text-slate-400">
                ระบบได้ปกป้องข้อมูลของคุณไม่ให้สูญหาย กดปุ่มด้านล่างเพื่อกลับเข้าสู่หน้าแผงควบคุมตามปกติ
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-red-400 text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '#/dashboard';
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 font-black text-xs hover:bg-gold-400 transition-all cursor-pointer shadow-lg"
              >
                ↻ รีโหลดระบบ & ไปที่ Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.hash = '#/login';
                  window.location.reload();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-all cursor-pointer"
              >
                ล้างข้อมูลแคช
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { user, isCrewOrTalent } = useAuth();
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
      ? ['personal', 'callsheets', 'calendar'] 
      : ['dashboard', 'storyOutline', 'script', 'breakdown', 'shotlist', 'storyboard', 'shootingSchedule', 'calendar', 'crew', 'docs', 'production', 'callsheets'];
    return allowed.includes(hash) ? hash : (isCrewOrTalent() ? 'personal' : 'dashboard');
  });
  const [tabParams, setTabParams] = useState(null);

  const crewOrTalent = isCrewOrTalent();

  // Sync hash routing with currentTab and authentication rules
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      const allowed = crewOrTalent 
        ? ['personal', 'callsheets', 'calendar'] 
        : ['dashboard', 'storyOutline', 'script', 'breakdown', 'shotlist', 'storyboard', 'shootingSchedule', 'calendar', 'crew', 'docs', 'production', 'callsheets'];
      
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
      case 'shootingSchedule':
        return (
          <ShootingSchedule key={currentProjectId} />
        );
      case 'calendar':
        return (
          <MasterCalendar
            events={activeEvents}
            crew={activeCrew}
            setCurrentTab={handleSetTab}
            setTabParams={setTabParams}
            setEvents={setEvents}
          />
        );
      case 'crew':
        return (
          <CrewPortal
            key="crew-portal-global"
            crew={activeCrew}
            setCrew={setCrew}
            events={activeEvents}
            setEvents={setEvents}
            completedTasks={activeCompletedTasks}
            setCompletedTasks={setCompletedTasks}
          />
        );
      case 'personal': {
        const myCrewMember = (activeCrew || []).find(c => c.email?.toLowerCase() === user?.email?.toLowerCase());
        const personalKey = myCrewMember?.id || 'none';
        return (
          <CrewPortal
            key={personalKey}
            crew={activeCrew}
            setCrew={setCrew}
            events={activeEvents}
            setEvents={setEvents}
            completedTasks={activeCompletedTasks}
            setCompletedTasks={setCompletedTasks}
            lockedCrewId={personalKey}
          />
        );
      }
      case 'docs':
        return (
          <DocumentsHub
            key={currentProjectId}
            scenes={activeScenes}
            crew={activeCrew}
            weather={weather}
            initialSceneNum={tabParams?.sceneNum}
            shotList={activeShotList}
            setShotList={setShotList}
            events={activeEvents}
            setEvents={setEvents}
          />
        );
      case 'shotlist':
        return (
          <DocumentsHub
            key={currentProjectId}
            scenes={activeScenes}
            crew={activeCrew}
            weather={weather}
            initialSceneNum={tabParams?.sceneNum}
            shotList={activeShotList}
            setShotList={setShotList}
            lockedTab="shotlist"
            events={activeEvents}
            setEvents={setEvents}
          />
        );
      case 'storyboard':
        return (
          <DocumentsHub
            key={currentProjectId}
            scenes={activeScenes}
            crew={activeCrew}
            weather={weather}
            initialSceneNum={tabParams?.sceneNum}
            shotList={activeShotList}
            setShotList={setShotList}
            lockedTab="storyboard"
            events={activeEvents}
            setEvents={setEvents}
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
            events={activeEvents}
            setEvents={setEvents}
          />
        );
      case 'production':
        return (
          <ProductionHub key={currentProjectId} />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  if (!user) {
    return <LoginPage />;
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
      <PipelineBanner currentTab={currentTab} onNavigate={handleSetTab} />
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ProjectProvider>
              <MainApp />
            </ProjectProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
