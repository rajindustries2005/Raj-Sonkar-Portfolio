document.querySelectorAll('[data-motion-panel]').forEach((panel) => {
  const scene = panel.querySelector('.process-scene');
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

  function resetTilt() {
    scene.style.removeProperty('--tilt-x');
    scene.style.removeProperty('--tilt-y');
  }

  function tilt(event, bounds) {
    if (!event.isPrimary || motionPreference.matches || panel.dataset.motion !== 'playing') return;

    const clamp = (value) => Math.max(-1, Math.min(1, value));
    const x = clamp(2 * (event.clientX - bounds.left) / bounds.width - 1);
    const y = clamp(2 * (event.clientY - bounds.top) / bounds.height - 1);
    scene.style.setProperty('--tilt-x', `${-y * 22}deg`);
    scene.style.setProperty('--tilt-y', `${x * 28}deg`);
  }

  panel.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'touch') tilt(event, panel.getBoundingClientRect());
  });
  panel.addEventListener('pointerleave', resetTilt);
  scene.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') tilt(event, scene.getBoundingClientRect());
  });
  scene.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') tilt(event, scene.getBoundingClientRect());
  });
  scene.addEventListener('pointerup', resetTilt);
  scene.addEventListener('pointercancel', resetTilt);
  motionPreference.addEventListener('change', resetTilt);

  panel.dataset.motion = 'playing';
});
