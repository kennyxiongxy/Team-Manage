import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global error handler to catch unhandled errors
window.addEventListener('error', (event) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;background:#020617;color:#F8FAFC;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;font-family:system-ui,sans-serif">
        <h1 style="color:#EF4444;font-size:20px;margin-bottom:12px">应用加载失败</h1>
        <pre style="background:#1E293B;padding:16px;border-radius:8px;max-width:800px;font-size:13px;color:#94A3B8;white-space:pre-wrap;word-break:break-all">
          ${event.message || event.error?.message || '未知错误'}
          ${event.error?.stack ? '\n\n' + event.error.stack : ''}
        </pre>
        <button onclick="localStorage.clear();location.reload()" style="margin-top:16px;padding:10px 24px;background:#06B6D4;color:#020617;border:none;border-radius:8px;cursor:pointer;font-weight:600">
          清除缓存并刷新
        </button>
      </div>
    `;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}
