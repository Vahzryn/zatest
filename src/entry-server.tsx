import React, { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SeoRouteData } from './lib/seoEngine';

export async function renderApp(path: string, seoData?: SeoRouteData): Promise<string> {
  const html = renderToString(
    <StrictMode>
      <ErrorBoundary>
        <App initialPath={path} initialSeoData={seoData} />
      </ErrorBoundary>
    </StrictMode>
  );
  return html;
}
