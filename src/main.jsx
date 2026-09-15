import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './store/StoreContext';
import { initAnalytics } from './lib/analytics';
import './styles.css';

// Fire and forget: the app renders whether or not a key is configured.
initAnalytics();

// No StrictMode: its intentional double-invocation of effects would fire every
// analytics event twice in development, which makes the event stream misleading.
createRoot(document.getElementById('root')).render(
  // HashRouter keeps deep links working on any static host, with no rewrites.
  <HashRouter>
    <StoreProvider>
      <App />
    </StoreProvider>
  </HashRouter>,
);
