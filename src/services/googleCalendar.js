// Google Calendar API REST Client Service

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
].join(' ');

export const DEFAULT_CLIENT_ID = '1032663921544-kubng0781om5m1tgmek155m8tjsk8e55.apps.googleusercontent.com';

export const googleCalendar = {
  // Helper to extract OAuth tokens from redirect URL hash
  parseHashParams(hashStr) {
    const hash = hashStr || window.location.hash;
    if (!hash) return null;
    
    // Check if the hash contains OAuth parameters
    // Format is #/tab-name&access_token=... or #access_token=...
    const params = new URLSearchParams(hash.replace(/^#\/?/, '').replace(/^[a-zA-Z0-9-]+&/, ''));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    
    if (accessToken) {
      return {
        accessToken,
        expiresAt: Date.now() + Number(expiresIn || 3600) * 1000
      };
    }
    return null;
  },

  // Generate Google OAuth Authorization URL
  getAuthUrl(clientId, redirectUri, state = '') {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: GOOGLE_SCOPES,
      state: state,
      prompt: 'consent'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  // Fetch lists of user's calendars
  async fetchCalendars(accessToken) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Failed to fetch Google Calendars');
    }
    
    const data = await response.json();
    return data.items || [];
  },

  // Helper to format Date for Google Calendar (All-day event needs YYYY-MM-DD end date to be next day)
  formatDateRange(dateStr) {
    const dateObj = new Date(dateStr);
    const startStr = dateStr;
    let endStr = dateStr;
    if (!isNaN(dateObj.getTime())) {
      const nextDate = new Date(dateObj);
      nextDate.setDate(nextDate.getDate() + 1);
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextDate.getDate()).padStart(2, '0');
      endStr = `${year}-${month}-${day}`;
    }
    return { start: startStr, end: endStr };
  },

  // Sync / Create event in Google Calendar
  async createEvent(accessToken, calendarId, eventData) {
    const { start, end } = this.formatDateRange(eventData.date);
    
    const body = {
      summary: eventData.title,
      location: eventData.location || '',
      description: eventData.description || '',
      start: {
        date: start
      },
      end: {
        date: end
      },
      reminders: {
        useDefault: true
      }
    };

    if (eventData.attendees && eventData.attendees.length > 0) {
      body.attendees = eventData.attendees.map(email => ({ email }));
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Failed to create Google Calendar event');
    }

    return await response.json();
  },

  // Update existing Google Calendar event
  async updateEvent(accessToken, calendarId, googleEventId, eventData) {
    const { start, end } = this.formatDateRange(eventData.date);

    const body = {
      summary: eventData.title,
      location: eventData.location || '',
      description: eventData.description || '',
      start: {
        date: start
      },
      end: {
        date: end
      }
    };

    if (eventData.attendees && eventData.attendees.length > 0) {
      body.attendees = eventData.attendees.map(email => ({ email }));
    } else {
      body.attendees = []; // Clear attendees if none
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}?sendUpdates=all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Failed to update Google Calendar event');
    }

    return await response.json();
  },

  // Delete Google Calendar event
  async deleteEvent(accessToken, calendarId, googleEventId) {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}?sendUpdates=all`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok && response.status !== 404) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Failed to delete Google Calendar event');
    }

    return true;
  }
};
