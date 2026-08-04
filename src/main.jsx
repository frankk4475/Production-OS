import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
} catch (err) {
  console.error("Critical rendering error in main.jsx:", err);
  var root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="min-height:100vh;background:#090d16;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;font-family:sans-serif;text-align:center;">' +
      '<div style="width:64px;height:64px;border-radius:16px;background:rgba(204,164,59,0.1);border:1px solid rgba(204,164,59,0.3);color:#cca43b;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 1rem auto;">🎬</div>' +
      '<h1 style="font-size:1.5rem;font-weight:800;margin-bottom:0.5rem;color:#ffffff;">เกิดข้อผิดพลาดในการโหลดระบบ</h1>' +
      '<p style="font-size:0.875rem;color:#94a3b8;max-width:400px;margin-bottom:1.5rem;">' + err.toString() + '</p>' +
      '<div style="display:flex;gap:12px;">' +
      '<button onclick="window.location.hash=\'#/dashboard\';window.location.reload(true)" style="padding:10px 20px;background:#cca43b;color:#090d16;font-weight:900;border:none;border-radius:12px;cursor:pointer;">↻ รีโหลดระบบ & ไปที่ Dashboard</button>' +
      '<button onclick="localStorage.clear();sessionStorage.clear();window.location.hash=\'#/dashboard\';window.location.reload(true)" style="padding:10px 20px;background:#1e293b;color:#e2e8f0;font-weight:700;border:none;border-radius:12px;cursor:pointer;">ล้างข้อมูลแคช</button>' +
      '</div>' +
      '</div>';
  }
}
