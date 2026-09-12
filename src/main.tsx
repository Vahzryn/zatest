import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global safety net for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Zapixal Unhandled Promise Rejection:', event.reason);
  window.dispatchEvent(
    new CustomEvent('zapixal-unhandled-rejection', {
      detail: {
        reason: event.reason,
        message: event.reason instanceof Error ? event.reason.message : String(event.reason),
      },
    })
  );
});

const container = document.getElementById('root')!;

const appElement = (
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

const embedded = (() => {
  const el = document.getElementById('seo-data-payload');
  if (el) {
    try {
      return JSON.parse(el.textContent || '');
    } catch {
      return null;
    }
  }
  return null;
})();

const currentPath = (() => {
  if (typeof window !== 'undefined') {
    const rawPath = window.location.pathname || '/';
    return rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
  }
  return '/';
})();

const hasSSRContent = 
  !!embedded && 
  (embedded.path === currentPath || embedded.isNotFound) && 
  container.children.length > 0;

if (hasSSRContent) {
  hydrateRoot(container, appElement);
} else {
  createRoot(container).render(appElement);
}
