import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PrivyProvider } from './components/PrivyProvider.tsx'

createRoot(document.getElementById("root")!).render(
  <PrivyProvider>
    <App />
  </PrivyProvider>
);
