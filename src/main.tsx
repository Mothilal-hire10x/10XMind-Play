import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"
import mixpanel from "mixpanel-browser";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

// Initialize Mixpanel
mixpanel.init("ffe20995c14485dc0ffabea85f8bf3b6", {
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
  autocapture: true,
  record_sessions_percent: 100,
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
   </ErrorBoundary>
)
