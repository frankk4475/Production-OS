// API Service Layer simulating production backend operations
// Uses localStorage as a persistent database and adds mock network latency (200ms)

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Get data from local storage
const getDbData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
};

// Helper: Write data to local storage
const setDbData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
};

const STORAGE_KEYS = {
  PROJECTS: 'prod_api_projects',
  CREW: 'prod_api_crew',
  SCENES: 'prod_api_scenes',
  EVENTS: 'prod_api_events',
  SHOT_LIST: 'prod_api_shot_list',
  COMPLETED_TASKS: 'prod_api_completed_tasks',
  SCRIPTS: 'prod_api_scripts',
  STORY_OUTLINE: 'prod_api_story_outline'
};

export const api = {
  // ================= PROJECT API =================
  async getProjects() {
    await delay();
    return getDbData(STORAGE_KEYS.PROJECTS);
  },

  async createProject(projectData) {
    await delay();
    const projects = getDbData(STORAGE_KEYS.PROJECTS);
    const newProject = {
      id: `proj-${Date.now()}`,
      title: projectData.title || { th: '', en: '' },
      status: projectData.status || 'pre-prod',
      director: projectData.director || { th: '', en: '' },
      producer: projectData.producer || { th: '', en: '' },
      client: projectData.client || '-',
      current_weather: projectData.current_weather || 'Sunny',
      weather_detail: projectData.weather_detail || '',
      start_date: projectData.start_date || new Date().toISOString().split('T')[0],
      deadline: projectData.deadline || '',
      total_budget: projectData.total_budget || '฿0',
      completion_percentage: Number(projectData.completion_percentage) || 0,
      created_at: new Date().toISOString()
    };
    projects.push(newProject);
    setDbData(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  },

  async updateProject(updatedProject) {
    await delay();
    const projects = getDbData(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === updatedProject.id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updatedProject };
      setDbData(STORAGE_KEYS.PROJECTS, projects);
      return projects[index];
    }
    throw new Error('Project not found');
  },

  async deleteProject(projectId) {
    await delay();
    
    // 1. Delete project
    const projects = getDbData(STORAGE_KEYS.PROJECTS);
    const filteredProjects = projects.filter(p => p.id !== projectId);
    setDbData(STORAGE_KEYS.PROJECTS, filteredProjects);

    // 2. Cascade deletes for scenes
    const scenes = getDbData(STORAGE_KEYS.SCENES);
    const filteredScenes = scenes.filter(s => s.project_id !== projectId);
    setDbData(STORAGE_KEYS.SCENES, filteredScenes);

    // 3. Cascade deletes for events
    const events = getDbData(STORAGE_KEYS.EVENTS);
    const filteredEvents = events.filter(e => e.project_id !== projectId);
    setDbData(STORAGE_KEYS.EVENTS, filteredEvents);

    // 4. Cascade deletes for shot list
    const shotList = getDbData(STORAGE_KEYS.SHOT_LIST);
    const filteredShotList = shotList.filter(s => s.project_id !== projectId);
    setDbData(STORAGE_KEYS.SHOT_LIST, filteredShotList);

    // 5. Cascade deletes for tasks
    const tasks = getDbData(STORAGE_KEYS.COMPLETED_TASKS, {});
    const updatedTasks = { ...tasks };
    Object.keys(updatedTasks).forEach(k => {
      if (k.startsWith(`${projectId}-`)) {
        delete updatedTasks[k];
      }
    });
    setDbData(STORAGE_KEYS.COMPLETED_TASKS, updatedTasks);

    // 6. Cascade deletes for story outlines
    const outlines = getDbData(STORAGE_KEYS.STORY_OUTLINE, {});
    const updatedOutlines = { ...outlines };
    delete updatedOutlines[projectId];
    setDbData(STORAGE_KEYS.STORY_OUTLINE, updatedOutlines);

    return true;
  },

  // ================= CREW API =================
  async getCrew() {
    await delay();
    return getDbData(STORAGE_KEYS.CREW);
  },

  async createCrewMember(crewData) {
    await delay();
    const crew = getDbData(STORAGE_KEYS.CREW);
    const newMember = {
      id: `crew-${Date.now()}`,
      name: crewData.name || { th: '', en: '' },
      role: crewData.role || '',
      role_th: crewData.role_th || '',
      email: crewData.email || '',
      phone: crewData.phone || '',
      booked_dates: crewData.booked_dates || [],
      tasks: crewData.tasks || { th: [], en: [] }
    };
    crew.push(newMember);
    setDbData(STORAGE_KEYS.CREW, crew);
    return newMember;
  },

  async updateCrewMember(updatedMember) {
    await delay();
    const crew = getDbData(STORAGE_KEYS.CREW);
    const index = crew.findIndex(c => c.id === updatedMember.id);
    if (index !== -1) {
      crew[index] = { ...crew[index], ...updatedMember };
      setDbData(STORAGE_KEYS.CREW, crew);
      return crew[index];
    }
    throw new Error('Crew member not found');
  },

  async deleteCrewMember(crewId) {
    await delay();
    const crew = getDbData(STORAGE_KEYS.CREW);
    const filteredCrew = crew.filter(c => c.id !== crewId);
    setDbData(STORAGE_KEYS.CREW, filteredCrew);

    // Remove crew assignment from events
    const events = getDbData(STORAGE_KEYS.EVENTS);
    const updatedEvents = events.map(e => {
      if (e.crew_assigned && e.crew_assigned.includes(crewId)) {
        return {
          ...e,
          crew_assigned: e.crew_assigned.filter(id => id !== crewId)
        };
      }
      return e;
    });
    setDbData(STORAGE_KEYS.EVENTS, updatedEvents);

    return true;
  },

  // ================= SCENE BREAKDOWN API =================
  async getScenes(projectId) {
    await delay();
    const scenes = getDbData(STORAGE_KEYS.SCENES);
    return scenes.filter(s => s.project_id === projectId);
  },

  async createScene(sceneData) {
    await delay();
    const scenes = getDbData(STORAGE_KEYS.SCENES);
    const newScene = {
      id: `scene-${Date.now()}`,
      project_id: sceneData.project_id,
      scene_number: sceneData.scene_number || '',
      setting: sceneData.setting || '',
      int_ext: sceneData.int_ext || 'INT',
      day_night: sceneData.day_night || 'DAY',
      description: sceneData.description || { th: '', en: '' },
      cast: sceneData.cast || { th: '', en: '' },
      location: sceneData.location || { th: '', en: '' },
      props: sceneData.props || { th: '', en: '' },
      wardrobe: sceneData.wardrobe || { th: '', en: '' },
      tech_notes: sceneData.tech_notes || { th: '', en: '' },
      status: sceneData.status || 'pending' // pending, shooting, completed
    };
    scenes.push(newScene);
    setDbData(STORAGE_KEYS.SCENES, scenes);
    return newScene;
  },

  async updateScene(updatedScene) {
    await delay();
    const scenes = getDbData(STORAGE_KEYS.SCENES);
    const index = scenes.findIndex(s => s.id === updatedScene.id);
    if (index !== -1) {
      scenes[index] = { ...scenes[index], ...updatedScene };
      setDbData(STORAGE_KEYS.SCENES, scenes);
      return scenes[index];
    }
    throw new Error('Scene not found');
  },

  async deleteScene(sceneId) {
    await delay();
    const scenes = getDbData(STORAGE_KEYS.SCENES);
    const filteredScenes = scenes.filter(s => s.id !== sceneId);
    setDbData(STORAGE_KEYS.SCENES, filteredScenes);
    return true;
  },

  // ================= EVENTS / CALENDAR API =================
  async getEvents(projectId) {
    await delay();
    const events = getDbData(STORAGE_KEYS.EVENTS);
    return events.filter(e => e.project_id === projectId);
  },

  async saveEvents(projectId, projectEvents) {
    await delay();
    const globalEvents = getDbData(STORAGE_KEYS.EVENTS);
    const remaining = globalEvents.filter(e => e.project_id !== projectId);
    const updatedNew = projectEvents.map(e => ({ 
      ...e, 
      project_id: projectId,
      id: e.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    setDbData(STORAGE_KEYS.EVENTS, [...remaining, ...updatedNew]);
    return updatedNew;
  },

  // ================= SHOT LIST API =================
  async getShotList(projectId) {
    await delay();
    const shots = getDbData(STORAGE_KEYS.SHOT_LIST);
    return shots.filter(s => s.project_id === projectId);
  },

  async saveShotList(projectId, projectShots) {
    await delay();
    const globalShots = getDbData(STORAGE_KEYS.SHOT_LIST);
    const remaining = globalShots.filter(s => s.project_id !== projectId);
    const updatedNew = projectShots.map(s => ({ 
      ...s, 
      project_id: projectId
    }));
    setDbData(STORAGE_KEYS.SHOT_LIST, [...remaining, ...updatedNew]);
    return updatedNew;
  },

  // ================= COMPLETED TASKS API =================
  async getCompletedTasks(projectId) {
    await delay();
    const allTasks = getDbData(STORAGE_KEYS.COMPLETED_TASKS, {});
    const projectTasks = {};
    Object.keys(allTasks).forEach(k => {
      if (k.startsWith(`${projectId}-`)) {
        const cleanKey = k.substring(projectId.length + 1);
        projectTasks[cleanKey] = allTasks[k];
      }
    });
    return projectTasks;
  },

  async saveCompletedTasks(projectId, projectTasks) {
    await delay();
    const allTasks = getDbData(STORAGE_KEYS.COMPLETED_TASKS, {});
    
    // Clean old keys for this project
    Object.keys(allTasks).forEach(k => {
      if (k.startsWith(`${projectId}-`)) {
        delete allTasks[k];
      }
    });

    // Add new ones
    Object.keys(projectTasks).forEach(k => {
      allTasks[`${projectId}-${k}`] = projectTasks[k];
    });

    setDbData(STORAGE_KEYS.COMPLETED_TASKS, allTasks);
    return projectTasks;
  },

  // ================= CONFLICT CHECKER API =================
  // Checks if a crew member has any bookings or event assignments on a specific date across ALL projects
  async checkCrewConflict(crewId, dateStr, excludeProjectId = null) {
    await delay();
    
    // 1. Check if dates are in the crew member's profile
    const crew = getDbData(STORAGE_KEYS.CREW);
    const member = crew.find(c => c.id === crewId);
    if (member && member.booked_dates && member.booked_dates.includes(dateStr)) {
      return {
        hasConflict: true,
        reason: 'profile_booking',
        messageTh: `มีการบล็อกวันทำงานนี้ไว้ในโปรไฟล์ส่วนตัว (${dateStr})`,
        messageEn: `This date is blocked in their personal profile (${dateStr})`
      };
    }

    // 2. Query all active events across all projects in the database
    const events = getDbData(STORAGE_KEYS.EVENTS);
    const conflictingEvent = events.find(e => {
      // Must be the same date
      if (e.date !== dateStr) return false;
      // Must have the crew member assigned
      if (!e.crew_assigned || !e.crew_assigned.includes(crewId)) return false;
      // Optional: Exclude current project if editing
      if (excludeProjectId && e.project_id === excludeProjectId) return false;
      return true;
    });

    if (conflictingEvent) {
      // Find project details to provide a rich description
      const projects = getDbData(STORAGE_KEYS.PROJECTS);
      const project = projects.find(p => p.id === conflictingEvent.project_id);
      const projectTitle = project ? project.title : { th: 'โปรเจกต์อื่น', en: 'Another Project' };
      const eventTitle = conflictingEvent.title || { th: 'งานนัดหมาย', en: 'Booking' };

      return {
        hasConflict: true,
        reason: 'event_collision',
        project_id: conflictingEvent.project_id,
        project_title: projectTitle,
        event_title: eventTitle,
        scene_number: conflictingEvent.scene_number || null,
        messageTh: `ชนคิวกับโปรเจกต์ "${projectTitle.th}" ในกิจกรรม "${eventTitle.th}" วันที่ ${dateStr}`,
        messageEn: `Double-booked with project "${projectTitle.en}" on event "${eventTitle.en}" on ${dateStr}`
      };
    }

    return { hasConflict: false };
  },

  // ================= SCREENPLAY EDITOR API =================
  async getScript(projectId) {
    await delay();
    const scripts = getDbData(STORAGE_KEYS.SCRIPTS, {});
    return scripts[projectId] || [];
  },

  async saveScript(projectId, blocks) {
    await delay();
    const scripts = getDbData(STORAGE_KEYS.SCRIPTS, {});
    scripts[projectId] = blocks;
    setDbData(STORAGE_KEYS.SCRIPTS, scripts);
    
    // Auto-sync script to script breakdown scenes
    await this.syncScriptToBreakdown(projectId, blocks);
    
    return blocks;
  },

  async syncScriptToBreakdown(projectId, blocks) {
    // 1. Parse screenplay blocks into scene chunks
    const parsedScenes = [];
    let currentScene = null;
    let sceneIndex = 0;

    const parseHeading = (text) => {
      const clean = text.trim();
      let int_ext = 'INT';
      if (/^EXT\b/i.test(clean)) int_ext = 'EXT';
      else if (/^INT\/EXT\b/i.test(clean) || /^I\/E\b/i.test(clean)) int_ext = 'INT/EXT';
      else if (/^EXT\/INT\b/i.test(clean)) int_ext = 'INT/EXT';

      let remaining = clean.replace(/^(INT\/EXT|EXT\/INT|INT|EXT|I\/E)\.?\s*/i, '').trim();
      const dashIndex = remaining.lastIndexOf('-');
      let setting = remaining;
      let day_night = 'DAY';

      if (dashIndex !== -1) {
        setting = remaining.substring(0, dashIndex).trim();
        day_night = remaining.substring(dashIndex + 1).trim().toUpperCase();
      }

      return { int_ext, setting, day_night };
    };

    blocks.forEach((block) => {
      if (block.type === 'heading') {
        // Save previous scene
        if (currentScene) {
          parsedScenes.push(currentScene);
        }
        
        sceneIndex += 1;
        const { int_ext, setting, day_night } = parseHeading(block.text);
        
        currentScene = {
          scene_number: String(sceneIndex),
          setting: setting || 'UNNAMED SCENE',
          int_ext,
          day_night,
          description_blocks: [],
          character_blocks: new Set()
        };
      } else if (currentScene) {
        if (block.type === 'action') {
          currentScene.description_blocks.push(block.text.trim());
        } else if (block.type === 'character') {
          const charName = block.text.trim().toUpperCase();
          if (charName) {
            currentScene.character_blocks.add(charName);
          }
        }
      }
    });

    if (currentScene) {
      parsedScenes.push(currentScene);
    }

    // 2. Fetch existing scenes
    const allScenes = getDbData(STORAGE_KEYS.SCENES);
    const otherProjectScenes = allScenes.filter(s => s.project_id !== projectId);
    const existingProjectScenes = allScenes.filter(s => s.project_id === projectId);

    // 3. Merge parsed scenes with existing breakdown metadata
    const finalProjectScenes = parsedScenes.map((parsed) => {
      const match = existingProjectScenes.find(s => s.scene_number === parsed.scene_number);
      
      const descText = parsed.description_blocks.join(' ');
      const castText = Array.from(parsed.character_blocks).join(', ');

      if (match) {
        return {
          ...match,
          setting: parsed.setting,
          int_ext: parsed.int_ext,
          day_night: parsed.day_night,
          description: {
            th: descText || match.description.th || '',
            en: descText || match.description.en || ''
          },
          cast: {
            th: castText || match.cast.th || '',
            en: castText || match.cast.en || ''
          }
        };
      } else {
        return {
          id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          project_id: projectId,
          scene_number: parsed.scene_number,
          setting: parsed.setting,
          int_ext: parsed.int_ext,
          day_night: parsed.day_night,
          description: { th: descText, en: descText },
          cast: { th: castText, en: castText },
          location: { th: '', en: '' },
          props: { th: '', en: '' },
          wardrobe: { th: '', en: '' },
          tech_notes: { th: '', en: '' },
          status: 'pending'
        };
      }
    });

    // 4. Save merged scenes
    setDbData(STORAGE_KEYS.SCENES, [...otherProjectScenes, ...finalProjectScenes]);
  },

  // ================= STORY PLANNER / OUTLINE API =================
  async getStoryOutline(projectId) {
    await delay();
    const outlines = getDbData(STORAGE_KEYS.STORY_OUTLINE, {});
    return outlines[projectId] || {
      plotlines: [
        { 
          id: 'p1', 
          name: { th: 'เส้นเรื่องหลัก (A-Plot)', en: 'Main Plot (A-Plot)' }, 
          color: '#ef4444', 
          description: { th: 'การเดินทางและเป้าหมายหลักของตัวละครเอก', en: 'The main journey and goal of the protagonist.' } 
        },
        { 
          id: 'p2', 
          name: { th: 'เส้นเรื่องรอง (B-Plot)', en: 'Subplot B' }, 
          color: '#3b82f6', 
          description: { th: 'ความสัมพันธ์หรือความขัดแย้งรองที่เกื้อหนุนเนื้อเรื่องหลัก', en: 'The relationship or secondary conflict supporting the main plot.' } 
        }
      ],
      characters: [
        { 
          id: 'c1', 
          name: { th: 'แนท', en: 'Nat' }, 
          role: { th: 'ตัวเอก (Protagonist)', en: 'Protagonist' }, 
          goal: { th: 'ส่งมอบซองเอกสารข้อมูลสำคัญอย่างปลอดภัย', en: 'Deliver the envelope containing critical data safely.' }, 
          conflict: { th: 'ถูกสะกดรอยตามและตามล่าโดยกลุ่มกองกำลังมืด', en: 'Being followed and hunted by dark corporate forces.' }, 
          arc: { th: 'จากเด็กสาวที่ขี้ขลาดและหวาดกลัว เรียนรู้ที่จะเผชิญหน้าและกลายเป็นคนกล้าหาญ', en: 'From a fearful and timid girl, she learns to stand her ground and becomes courageous.' } 
        },
        { 
          id: 'c2', 
          name: { th: 'ลีโอ', en: 'Leo' }, 
          role: { th: 'ผู้แนะนำ/ผู้ติดต่อ (Mentor)', en: 'Mentor / Contact' }, 
          goal: { th: 'ช่วยปกป้องแนทและกู้คืนฐานข้อมูลลับของบริษัท', en: 'Protect Nat and retrieve the company\'s secret database.' }, 
          conflict: { th: 'ถูกจับตามองโดยทางการและมีแผลในใจจากอดีต', en: 'Watched closely by authorities and haunted by past failures.' }, 
          arc: { th: 'การยอมเสียสละตนเองเพื่อไถ่บาปในอดีตและช่วยให้แนทรอดพ้น', en: 'Sacrificing himself to redeem his past and ensure Nat\'s safety.' } 
        }
      ],
      beats: [
        { 
          id: 'b1', 
          title: { th: 'ปูเรื่องราว (Setup)', en: 'The Setup' }, 
          act: 'Act I', 
          plotlineId: 'p1', 
          description: { th: 'แนะนำให้รู้จัก แนท หญิงสาวที่กำลังรอคอยสายลับอย่างลนลานอยู่ในร้านกาแฟท่ามกลางพายุฝน', en: 'Introduce Nat, a nervous girl waiting for her contact in a rain-slicked coffee shop.' }, 
          sceneTarget: '1-3' 
        },
        { 
          id: 'b2', 
          title: { th: 'การส่งมอบเอกสาร (Handover)', en: 'The Handover' }, 
          act: 'Act I', 
          plotlineId: 'p1', 
          description: { th: 'ลีโอมาถึงร้านกาแฟเพื่อรับซองข้อมูลจากแนท เขาเตือนเธอว่าตอนนี้พวกเขากำลังถูกตามล่าอยู่', en: 'Leo arrives at the café to receive the data envelope from Nat. He warns her that they are being watched.' }, 
          sceneTarget: '4-7' 
        },
        { 
          id: 'b3', 
          title: { th: 'การหลบหนีและรถต้องสงสัย (Shadowed Exit)', en: 'Shadowed Exit' }, 
          act: 'Act I', 
          plotlineId: 'p2', 
          description: { th: 'ลีโอเดินแยกตัวออกไปทางตรอกด้านหลังร้าน ทันใดนั้นมีรถเก๋งซีดานสีดำปริศนาแล่นสะกดรอยตามเขาไป', en: 'Leo leaves through the back alley. Suddenly, a mysterious black sedan follows him into the dark.' }, 
          sceneTarget: '8-10' 
        }
      ]
    };
  },

  async saveStoryOutline(projectId, outlineData) {
    await delay();
    const outlines = getDbData(STORAGE_KEYS.STORY_OUTLINE, {});
    outlines[projectId] = outlineData;
    setDbData(STORAGE_KEYS.STORY_OUTLINE, outlines);
    return outlineData;
  }
};
