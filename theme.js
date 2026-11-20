(() => {
  const storageKey = 'portfolio-theme';
  const root = document.documentElement;

  try {
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      root.dataset.theme = savedTheme;
    }
  } catch {
    // The switch still works when browser storage is unavailable.
  }

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('.theme-toggle');
    const updateLabel = () => {
      button.textContent = root.dataset.theme === 'dark' ? 'Light mode' : 'Dark mode';
    };

    button.addEventListener('click', () => {
      const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = theme;
      updateLabel();
      try {
        localStorage.setItem(storageKey, theme);
      } catch {
        // Keep the selected theme for this page.
      }
    });

    updateLabel();
    button.hidden = false;
  });
})();
