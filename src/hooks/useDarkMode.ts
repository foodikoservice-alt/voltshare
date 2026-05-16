import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem('volt_theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('volt_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = () => setDark(d => !d);

  return { dark, toggle };
}
