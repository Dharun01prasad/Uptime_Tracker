import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
function App() {
  return (
    <main>
      <h1>UptimeTracker</h1>
      <p>Monitor availability. Understand incidents.</p>
      <p>The dashboard will be added in a later milestone.</p>
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
