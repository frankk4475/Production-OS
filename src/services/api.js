import { supabase, isSupabaseConfigured } from './supabaseClient';

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

// LocalStorage Helper: Get data
const getDbData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
};

// LocalStorage Helper: Write data
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
  STORY_OUTLINE: 'prod_api_story_outline',
  USERS: 'prod_api_users'
};

export const api = {
  // ================= PROJECT API =================
  async getProjects() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase error fetching projects, falling back:', error);
        return getDbData(STORAGE_KEYS.PROJECTS);
      }
      return data || [];
    } else {
      await delay();
      return getDbData(STORAGE_KEYS.PROJECTS);
    }
  },

  async createProject(projectData) {
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

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await delay();
      const projects = getDbData(STORAGE_KEYS.PROJECTS);
      projects.push(newProject);
      setDbData(STORAGE_KEYS.PROJECTS, projects);
      return newProject;
    }
  },

  async updateProject(updatedProject) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('projects')
        .update({
          title: updatedProject.title,
          status: updatedProject.status,
          director: updatedProject.director,
          producer: updatedProject.producer,
          client: updatedProject.client,
          current_weather: updatedProject.current_weather,
          weather_detail: updatedProject.weather_detail,
          start_date: updatedProject.start_date,
          deadline: updatedProject.deadline,
          total_budget: updatedProject.total_budget,
          completion_percentage: Number(updatedProject.completion_percentage)
        })
        .eq('id', updatedProject.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await delay();
      const projects = getDbData(STORAGE_KEYS.PROJECTS);
      const index = projects.findIndex(p => p.id === updatedProject.id);
      if (index !== -1) {
        projects[index] = { ...projects[index], ...updatedProject };
        setDbData(STORAGE_KEYS.PROJECTS, projects);
        return projects[index];
      }
      throw new Error('Project not found');
    }
  },

  async deleteProject(projectId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
      return true;
    } else {
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
    }
  },

  // ================= CREW API =================
  async getCrew() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('crew')
        .select('*');
      if (error) {
        console.error('Supabase error fetching crew, falling back:', error);
        return getDbData(STORAGE_KEYS.CREW);
      }
      return data || [];
    } else {
      await delay();
      return getDbData(STORAGE_KEYS.CREW);
    }
  },

  async createCrewMember(crewData) {
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

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('crew')
        .insert([newMember])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await delay();
      const crew = getDbData(STORAGE_KEYS.CREW);
      crew.push(newMember);
      setDbData(STORAGE_KEYS.CREW, crew);
      return newMember;
    }
  },

  async updateCrewMember(updatedMember) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('crew')
        .update({
          name: updatedMember.name,
          role: updatedMember.role,
          role_th: updatedMember.role_th,
          email: updatedMember.email,
          phone: updatedMember.phone,
          booked_dates: updatedMember.booked_dates,
          tasks: updatedMember.tasks
        })
        .eq('id', updatedMember.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await delay();
      const crew = getDbData(STORAGE_KEYS.CREW);
      const index = crew.findIndex(c => c.id === updatedMember.id);
      if (index !== -1) {
        crew[index] = { ...crew[index], ...updatedMember };
        setDbData(STORAGE_KEYS.CREW, crew);
        return crew[index];
      }
      throw new Error('Crew member not found');
    }
  },

  async deleteCrewMember(crewId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('crew')
        .delete()
        .eq('id', crewId);
      if (error) throw error;
      return true;
    } else {
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
    }
  },

  // ================= SCENE BREAKDOWN API =================
  async getScenes(projectId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('project_id', projectId)
        .order('scene_number', { ascending: true });
      if (error) {
        console.error('Supabase error fetching scenes, falling back:', error);
        return getDbData(STORAGE_KEYS.SCENES).filter(s => s.project_id === projectId);
      }
      return data || [];
    } else {
      await delay();
      const scenes = getDbData(STORAGE_KEYS.SCENES);
      return scenes.filter(s => s.project_id === projectId);
    }
  },

  async createScene(sceneData) {
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
      status: sceneData.status || 'pending'
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('scenes')
        .insert([newScene])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await delay();
      const scenes = getDbData(STORAGE_KEYS.SCENES);
      scenes.push(newScene);
      setDbData(STORAGE_KEYS.SCENES, scenes);
      return newScene;
    }
  },

  async updateScene(updatedScene) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('scenes')
        .update({
          scene_number: updatedScene.scene_number,
          setting: updatedScene.setting,
          int_ext: updatedScene.int_ext,
          day_night: updatedScene.day_night,
          description: updatedScene.description,
          cast: updatedScene.cast,
          location: updatedScene.location,
          props: updatedScene.props,
          wardrobe: updatedScene.wardrobe,
          tech_notes: updatedScene.tech_notes,
          status: updatedScene.status
        })
        .eq('id', updatedScene.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await delay();
      const scenes = getDbData(STORAGE_KEYS.SCENES);
      const index = scenes.findIndex(s => s.id === updatedScene.id);
      if (index !== -1) {
        scenes[index] = { ...scenes[index], ...updatedScene };
        setDbData(STORAGE_KEYS.SCENES, scenes);
        return scenes[index];
      }
      throw new Error('Scene not found');
    }
  },

  async deleteScene(sceneId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('scenes')
        .delete()
        .eq('id', sceneId);
      if (error) throw error;
      return true;
    } else {
      await delay();
      const scenes = getDbData(STORAGE_KEYS.SCENES);
      const filteredScenes = scenes.filter(s => s.id !== sceneId);
      setDbData(STORAGE_KEYS.SCENES, filteredScenes);
      return true;
    }
  },

  // ================= EVENTS / CALENDAR API =================
  async getEvents(projectId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('project_id', projectId);
      if (error) {
        console.error('Supabase error fetching events, falling back:', error);
        return getDbData(STORAGE_KEYS.EVENTS).filter(e => e.project_id === projectId);
      }
      return data || [];
    } else {
      await delay();
      const events = getDbData(STORAGE_KEYS.EVENTS);
      return events.filter(e => e.project_id === projectId);
    }
  },

  async saveEvents(projectId, projectEvents) {
    if (isSupabaseConfigured) {
      // Delete old events for this project
      const { error: delError } = await supabase
        .from('events')
        .delete()
        .eq('project_id', projectId);
      if (delError) throw delError;

      const updatedNew = projectEvents.map(e => ({ 
        id: e.id && !e.id.startsWith('temp-') ? e.id : `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        title: e.title || { th: '', en: '' },
        date: e.date,
        time: e.time || '',
        location: e.location || { th: '', en: '' },
        scene_number: e.scene_number || '',
        crew_assigned: e.crew_assigned || [],
        notes: e.notes || { th: '', en: '' }
      }));

      if (updatedNew.length > 0) {
        const { error: insError } = await supabase
          .from('events')
          .insert(updatedNew);
        if (insError) throw insError;
      }
      return updatedNew;
    } else {
      await delay();
      const globalEvents = getDbData(STORAGE_KEYS.EVENTS);
      const remaining = globalEvents.filter(e => e.project_id !== projectId);
      const updatedNew = projectEvents.map(e => ({ 
        ...e, 
        project_id: projectId,
        id: e.id && !e.id.startsWith('temp-') ? e.id : `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      setDbData(STORAGE_KEYS.EVENTS, [...remaining, ...updatedNew]);
      return updatedNew;
    }
  },

  // ================= SHOT LIST API =================
  async getShotList(projectId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('shot_list')
        .select('*')
        .eq('project_id', projectId);
      if (error) {
        console.error('Supabase error fetching shotlist, falling back:', error);
        return getDbData(STORAGE_KEYS.SHOT_LIST).filter(s => s.project_id === projectId);
      }
      return data || [];
    } else {
      await delay();
      const shots = getDbData(STORAGE_KEYS.SHOT_LIST);
      return shots.filter(s => s.project_id === projectId);
    }
  },

  async saveShotList(projectId, projectShots) {
    if (isSupabaseConfigured) {
      const { error: delError } = await supabase
        .from('shot_list')
        .delete()
        .eq('project_id', projectId);
      if (delError) throw delError;

      const updatedNew = projectShots.map(s => ({
        id: s.id || `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projectId,
        scene_id: s.scene_id || null,
        shot_number: s.shot_number || '',
        size: s.size || '',
        angle: s.angle || '',
        movement: s.movement || '',
        equipment: s.equipment || '',
        description: s.description || { th: '', en: '' },
        cast_assigned: s.cast_assigned || []
      }));

      if (updatedNew.length > 0) {
        const { error: insError } = await supabase
          .from('shot_list')
          .insert(updatedNew);
        if (insError) throw insError;
      }
      return updatedNew;
    } else {
      await delay();
      const globalShots = getDbData(STORAGE_KEYS.SHOT_LIST);
      const remaining = globalShots.filter(s => s.project_id !== projectId);
      const updatedNew = projectShots.map(s => ({ 
        ...s, 
        project_id: projectId,
        id: s.id || `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      setDbData(STORAGE_KEYS.SHOT_LIST, [...remaining, ...updatedNew]);
      return updatedNew;
    }
  },

  // ================= COMPLETED TASKS API =================
  async getCompletedTasks(projectId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('completed_tasks')
        .select('*')
        .eq('project_id', projectId);
      if (error) {
        console.error('Supabase error fetching tasks, falling back:', error);
        return getDbData(STORAGE_KEYS.COMPLETED_TASKS, {});
      }
      const projectTasks = {};
      if (data) {
        data.forEach(row => {
          projectTasks[row.task_key] = row.value;
        });
      }
      return projectTasks;
    } else {
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
    }
  },

  async saveCompletedTasks(projectId, projectTasks) {
    if (isSupabaseConfigured) {
      const { error: delError } = await supabase
        .from('completed_tasks')
        .delete()
        .eq('project_id', projectId);
      if (delError) throw delError;

      const rows = Object.keys(projectTasks).map(k => ({
        project_id: projectId,
        task_key: k,
        value: !!projectTasks[k]
      }));

      if (rows.length > 0) {
        const { error: insError } = await supabase
          .from('completed_tasks')
          .insert(rows);
        if (insError) throw insError;
      }
      return projectTasks;
    } else {
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
    }
  },

  // ================= CONFLICT CHECKER API =================
  async checkCrewConflict(crewId, dateStr, excludeProjectId = null) {
    if (isSupabaseConfigured) {
      // 1. Check profile booked_dates
      const { data: crewMember, error: crewError } = await supabase
        .from('crew')
        .select('booked_dates')
        .eq('id', crewId)
        .single();
      
      if (!crewError && crewMember && crewMember.booked_dates && crewMember.booked_dates.includes(dateStr)) {
        return {
          hasConflict: true,
          reason: 'profile_booking',
          messageTh: `มีการบล็อกวันทำงานนี้ไว้ในโปรไฟล์ส่วนตัว (${dateStr})`,
          messageEn: `This date is blocked in their personal profile (${dateStr})`
        };
      }

      // 2. Check collision in events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('date', dateStr);

      if (!eventsError && events) {
        const conflictingEvent = events.find(e => {
          if (!e.crew_assigned || !e.crew_assigned.includes(crewId)) return false;
          if (excludeProjectId && e.project_id === excludeProjectId) return false;
          return true;
        });

        if (conflictingEvent) {
          const { data: project } = await supabase
            .from('projects')
            .select('*')
            .eq('id', conflictingEvent.project_id)
            .single();

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
      }
      return { hasConflict: false };
    } else {
      await delay();
      
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

      const events = getDbData(STORAGE_KEYS.EVENTS);
      const conflictingEvent = events.find(e => {
        if (e.date !== dateStr) return false;
        if (!e.crew_assigned || !e.crew_assigned.includes(crewId)) return false;
        if (excludeProjectId && e.project_id === excludeProjectId) return false;
        return true;
      });

      if (conflictingEvent) {
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
    }
  },

  // ================= SCREENPLAY EDITOR API =================
  async getScript(projectId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('scripts')
        .select('blocks')
        .eq('project_id', projectId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is code for no rows returned, which is normal for new projects
          console.error('Supabase error fetching script, falling back:', error);
        }
        const localScripts = getDbData(STORAGE_KEYS.SCRIPTS, {});
        return localScripts[projectId] || [];
      }
      return data ? data.blocks : [];
    } else {
      await delay();
      const scripts = getDbData(STORAGE_KEYS.SCRIPTS, {});
      return scripts[projectId] || [];
    }
  },

  async saveScript(projectId, blocks) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('scripts')
        .upsert({ project_id: projectId, blocks })
        .select()
        .single();
      if (error) throw error;
      
      // Auto-sync script to script breakdown scenes
      await this.syncScriptToBreakdown(projectId, blocks);
      return blocks;
    } else {
      await delay();
      const scripts = getDbData(STORAGE_KEYS.SCRIPTS, {});
      scripts[projectId] = blocks;
      setDbData(STORAGE_KEYS.SCRIPTS, scripts);
      
      // Auto-sync script to script breakdown scenes
      await this.syncScriptToBreakdown(projectId, blocks);
      return blocks;
    }
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

    if (isSupabaseConfigured) {
      // Fetch existing scenes
      const { data: existingProjectScenes } = await supabase
        .from('scenes')
        .select('*')
        .eq('project_id', projectId);

      const finalProjectScenes = parsedScenes.map((parsed) => {
        const match = existingProjectScenes?.find(s => s.scene_number === parsed.scene_number);
        const descText = parsed.description_blocks.join(' ');
        const castText = Array.from(parsed.character_blocks).join(', ');

        if (match) {
          return {
            id: match.id,
            project_id: projectId,
            scene_number: parsed.scene_number,
            setting: parsed.setting,
            int_ext: parsed.int_ext,
            day_night: parsed.day_night,
            description: {
              th: descText || match.description?.th || '',
              en: descText || match.description?.en || ''
            },
            cast: {
              th: castText || match.cast?.th || '',
              en: castText || match.cast?.en || ''
            },
            location: match.location || { th: '', en: '' },
            props: match.props || { th: '', en: '' },
            wardrobe: match.wardrobe || { th: '', en: '' },
            tech_notes: match.tech_notes || { th: '', en: '' },
            status: match.status || 'pending'
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

      // Upsert scenes to Supabase
      if (finalProjectScenes.length > 0) {
        const { error: upsertError } = await supabase
          .from('scenes')
          .upsert(finalProjectScenes);
        if (upsertError) console.error('Failed to sync scenes to Supabase:', upsertError);
      }
    } else {
      const allScenes = getDbData(STORAGE_KEYS.SCENES);
      const otherProjectScenes = allScenes.filter(s => s.project_id !== projectId);
      const existingProjectScenes = allScenes.filter(s => s.project_id === projectId);

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

      setDbData(STORAGE_KEYS.SCENES, [...otherProjectScenes, ...finalProjectScenes]);
    }
  },

  // ================= STORY PLANNER / OUTLINE API =================
  async getStoryOutline(projectId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('story_outlines')
        .select('*')
        .eq('project_id', projectId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Supabase error fetching outline, falling back:', error);
        }
        const outlines = getDbData(STORAGE_KEYS.STORY_OUTLINE, {});
        return outlines[projectId] || this.getDefaultStoryOutline();
      }
      return data || this.getDefaultStoryOutline();
    } else {
      await delay();
      const outlines = getDbData(STORAGE_KEYS.STORY_OUTLINE, {});
      return outlines[projectId] || this.getDefaultStoryOutline();
    }
  },

  async saveStoryOutline(projectId, outlineData) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('story_outlines')
        .upsert({
          project_id: projectId,
          plotlines: outlineData.plotlines,
          characters: outlineData.characters,
          beats: outlineData.beats
        })
        .select()
        .single();
      if (error) throw error;
      return outlineData;
    } else {
      await delay();
      const outlines = getDbData(STORAGE_KEYS.STORY_OUTLINE, {});
      outlines[projectId] = outlineData;
      setDbData(STORAGE_KEYS.STORY_OUTLINE, outlines);
      return outlineData;
    }
  },

  getDefaultStoryOutline() {
    return {
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

  // ================= SYSTEM USERS API =================
  async getUsers() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase error fetching users, falling back:', error);
        return getDbData(STORAGE_KEYS.USERS, []);
      }
      return data || [];
    } else {
      await delay();
      return getDbData(STORAGE_KEYS.USERS, []);
    }
  },

  async createUser(name, email, password, role) {
    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      password,
      role,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      await delay();
      const users = getDbData(STORAGE_KEYS.USERS, []);
      users.push(newUser);
      setDbData(STORAGE_KEYS.USERS, users);
      return newUser;
    }
  },

  async deleteUser(userId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      return true;
    } else {
      await delay();
      const users = getDbData(STORAGE_KEYS.USERS, []);
      const filtered = users.filter(u => u.id !== userId);
      setDbData(STORAGE_KEYS.USERS, filtered);
      return true;
    }
  },

  async importAllData(importedData) {
    if (isSupabaseConfigured) {
      // 1. Delete all current data in the correct foreign key order
      await supabase.from('completed_tasks').delete().neq('project_id', '');
      await supabase.from('scripts').delete().neq('project_id', '');
      await supabase.from('story_outlines').delete().neq('project_id', '');
      await supabase.from('shot_list').delete().neq('project_id', '');
      await supabase.from('events').delete().neq('project_id', '');
      await supabase.from('scenes').delete().neq('project_id', '');
      await supabase.from('projects').delete().neq('id', '');
      await supabase.from('crew').delete().neq('id', '');

      // 2. Insert Projects
      if (importedData.projects && importedData.projects.length > 0) {
        const { error } = await supabase.from('projects').insert(importedData.projects);
        if (error) throw error;
      }

      // 3. Insert Crew
      if (importedData.crew && importedData.crew.length > 0) {
        const { error } = await supabase.from('crew').insert(importedData.crew);
        if (error) throw error;
      }

      // 4. Insert Scenes
      if (importedData.scenes && importedData.scenes.length > 0) {
        const { error } = await supabase.from('scenes').insert(importedData.scenes);
        if (error) throw error;
      }

      // 5. Insert Events
      if (importedData.events && importedData.events.length > 0) {
        const { error } = await supabase.from('events').insert(importedData.events);
        if (error) throw error;
      }

      // 6. Insert Shot List
      if (importedData.shotList && importedData.shotList.length > 0) {
        const mappedShots = importedData.shotList.map(s => ({
          id: s.id || `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          project_id: s.project_id,
          scene_id: s.scene_id || null,
          shot_number: s.shot_number || '',
          size: s.size || '',
          angle: s.angle || '',
          movement: s.movement || '',
          equipment: s.equipment || '',
          description: s.description || { th: '', en: '' },
          cast_assigned: s.cast_assigned || []
        }));
        const { error } = await supabase.from('shot_list').insert(mappedShots);
        if (error) throw error;
      }

      // 7. Insert Completed Tasks
      if (importedData.completedTasks) {
        const taskRows = [];
        Object.keys(importedData.completedTasks).forEach(fullKey => {
          const matchProj = importedData.projects?.find(p => fullKey.startsWith(`${p.id}-`));
          if (matchProj) {
            const projectId = matchProj.id;
            const taskKey = fullKey.substring(projectId.length + 1);
            taskRows.push({
              project_id: projectId,
              task_key: taskKey,
              value: !!importedData.completedTasks[fullKey]
            });
          }
        });
        if (taskRows.length > 0) {
          const { error } = await supabase.from('completed_tasks').insert(taskRows);
          if (error) throw error;
        }
      }

      // 8. Insert Scripts
      if (importedData.scripts) {
        const scriptRows = [];
        Object.keys(importedData.scripts).forEach(projId => {
          scriptRows.push({
            project_id: projId,
            blocks: importedData.scripts[projId]
          });
        });
        if (scriptRows.length > 0) {
          const { error } = await supabase.from('scripts').insert(scriptRows);
          if (error) throw error;
        }
      }

      // 9. Insert Story Outlines
      if (importedData.storyOutline) {
        const outlineRows = [];
        Object.keys(importedData.storyOutline).forEach(projId => {
          const outline = importedData.storyOutline[projId];
          outlineRows.push({
            project_id: projId,
            plotlines: outline.plotlines || [],
            characters: outline.characters || [],
            beats: outline.beats || []
          });
        });
        if (outlineRows.length > 0) {
          const { error } = await supabase.from('story_outlines').insert(outlineRows);
          if (error) throw error;
        }
      }
      return true;
    } else {
      await delay();
      if (importedData.projects) localStorage.setItem('prod_api_projects', JSON.stringify(importedData.projects));
      if (importedData.crew) localStorage.setItem('prod_api_crew', JSON.stringify(importedData.crew));
      if (importedData.scenes) localStorage.setItem('prod_api_scenes', JSON.stringify(importedData.scenes));
      if (importedData.events) localStorage.setItem('prod_api_events', JSON.stringify(importedData.events));
      if (importedData.shotList) localStorage.setItem('prod_api_shot_list', JSON.stringify(importedData.shotList));
      if (importedData.completedTasks) localStorage.setItem('prod_api_completed_tasks', JSON.stringify(importedData.completedTasks));
      if (importedData.scripts) localStorage.setItem('prod_api_scripts', JSON.stringify(importedData.scripts));
      if (importedData.storyOutline) localStorage.setItem('prod_api_story_outline', JSON.stringify(importedData.storyOutline));
      return true;
    }
  },

  async resetAllData() {
    if (isSupabaseConfigured) {
      await supabase.from('completed_tasks').delete().neq('project_id', '');
      await supabase.from('scripts').delete().neq('project_id', '');
      await supabase.from('story_outlines').delete().neq('project_id', '');
      await supabase.from('shot_list').delete().neq('project_id', '');
      await supabase.from('events').delete().neq('project_id', '');
      await supabase.from('scenes').delete().neq('project_id', '');
      await supabase.from('projects').delete().neq('id', '');
      await supabase.from('crew').delete().neq('id', '');
      return true;
    } else {
      await delay();
      localStorage.removeItem('prod_api_projects');
      localStorage.removeItem('prod_api_crew');
      localStorage.removeItem('prod_api_scenes');
      localStorage.removeItem('prod_api_events');
      localStorage.removeItem('prod_api_shot_list');
      localStorage.removeItem('prod_api_completed_tasks');
      localStorage.removeItem('prod_api_scripts');
      localStorage.removeItem('prod_api_story_outline');
      localStorage.removeItem('prod_current_project_id');
      return true;
    }
  }
};
