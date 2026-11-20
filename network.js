(() => {
  const canvas = document.querySelector('.network canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const layers = [4, 7, 6, 3].map((count, layer) =>
    Array.from({ length: count }, (_, index) => {
      const angle = index * 2 * Math.PI / count;
      const radius = layer === 1 || layer === 2 ? 0.78 : 0.56;
      return {
        x: (layer - 1.5) * 1.12,
        y: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
      };
    })
  );

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let pointerTilt = 0;
  let width = 1;
  let height = 1;

  function dot(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const angle = 0.20 + Math.sin(elapsed / 3400) * 0.23 + pointerTilt;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const scale = Math.min(width / 4.35, height / 2.25);
    const projected = layers.map(layer => layer.map(point => {
      const x = point.x * cos + point.z * sin;
      const depth = point.z * cos - point.x * sin;
      const perspective = 5 / (5 - depth);
      return {
        x: width / 2 + x * scale * perspective,
        y: height / 2 + (point.y + depth * 0.19) * scale * perspective,
        depth,
        radius: Math.max(3, Math.min(7, scale * 0.07)) * perspective,
      };
    }));

    const stage = (elapsed / 1050) % 4;
    for (let layer = 0; layer < projected.length - 1; layer++) {
      const progress = stage - layer;
      projected[layer].forEach((from, index) => {
        projected[layer + 1].forEach((to, nextIndex) => {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = 'rgba(169, 223, 190, 0.23)';
          ctx.stroke();

          if (progress > 0 && progress < 1 && (index + nextIndex) % 3 === 0) {
            dot(from.x + (to.x - from.x) * progress,
                from.y + (to.y - from.y) * progress, 2.7, '#f9db86');
          }
        });
      });
    }

    projected.flatMap((layer, index) => layer.map(point => ({ ...point, layer: index })))
      .sort((a, b) => a.depth - b.depth)
      .forEach(point => {
        const active = Math.abs(stage - point.layer) < 0.24;
        dot(point.x, point.y, point.radius + 4, active ? '#f9db8640' : '#9bddb429');
        dot(point.x, point.y, point.radius, active ? '#ffe9aa' : '#a9dfbe');
        dot(point.x - point.radius / 4, point.y - point.radius / 4,
            point.radius / 3, '#fff8e7');
      });
  }

  function tick(now) {
    frame = 0;
    if (previous) elapsed += Math.min(now - previous, 50);
    previous = now;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function updatePlayback() {
    if (!preference.matches && visible) {
      if (!frame) frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      pointerTilt = 0;
      draw();
    }
  }

  new ResizeObserver(() => {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }).observe(canvas);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }).observe(canvas);

  preference.addEventListener('change', updatePlayback);

  canvas.addEventListener('pointermove', event => {
    if (!event.isPrimary || preference.matches) return;
    const bounds = canvas.getBoundingClientRect();
    const position = (event.clientX - bounds.left) / bounds.width;
    pointerTilt = (Math.max(0, Math.min(1, position)) - 0.5) * 0.65;
  });
  for (const event of ['pointerleave', 'pointerup', 'pointercancel']) {
    canvas.addEventListener(event, () => { pointerTilt = 0; });
  }

  updatePlayback();
})();
