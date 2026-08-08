import { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../api/client';

export default function CalendarStatus() {
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const { data } = await api.get('/api/calendar/status/');
        setConnected(data.connected);
      } catch {
        setConnected(null);
      }
    }

    loadStatus();
  }, []);

  function connectCalendar() {
    // This is intentionally a browser redirect. Google OAuth cannot be
    // completed through axios because the user must leave the React app.
    window.location.href = `${API_BASE_URL}/calendar/connect/`;
  }

  return (
    <button className="btn-secondary" onClick={connectCalendar} title="May require a backend Django session cookie for now.">
      {connected ? 'Calendar connected' : 'Connect calendar'}
    </button>
  );
}
