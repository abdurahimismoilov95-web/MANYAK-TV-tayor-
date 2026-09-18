import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary 
      title="MANYAK TV'da xatolik yuz berdi"
      onReset={() => window.location.reload()}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
