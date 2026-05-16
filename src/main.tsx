import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize dark mode BEFORE React renders to prevent flash
const savedTheme = localStorage.getItem('volt_theme');
if (savedTheme === 'dark' || !savedTheme) {
  // Default to dark mode if no preference saved
  document.documentElement.classList.add('dark');
  if (!savedTheme) localStorage.setItem('volt_theme', 'dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
