// BENTARA Cover Studio — "Vice Heat" render engine.
// One imagined light source across every panel: golden highlights, violet shadows,
// a sunset that runs orange into magenta into purple, neon cyan and hot pink only as
// accents. Limited palette, hairline gaps, one hero, one caption band, one neon rule.
// Nothing overlaps, nothing falls off the page: every rect is inset from the canvas
// edge and the caption is always fitted to its band.

export const SIZES = {
  '1920x1080': [1920, 1080],
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
};

export const GRADES = {
  sunset: { label: 'Sunset', filter: 'saturate(1.28) contrast(1.08) brightness(1.02)', warm: 0.20, cool: 0.10 },
  neon: { label: 'Neon', filter: 'saturate(1.5) contrast(1.12) brightness(1.0)', warm: 0.10, cool: 0.22 },
  golden: { label: 'Golden Hour', filter: 'saturate(1.18) sepia(0.28) contrast(1.05)', warm: 0.26, cool: 0.0 },
  noir: { label: 'Noir', filter: 'grayscale(0.9) contrast(1.28) brightness(0.98)', warm: 0.0, cool: 0.14 },
};

export const LAYOUTS = {
  vice: { label: 'Vice Grid · 6 panels', panels: 6 },
  hero: { label: 'Hero Pop · 3 panels', panels: 3 },
  strip: { label: 'Sunset Strip · 5 panels', panels: 5 },
};

// Panel rects as fractions of the panel area (the canvas minus the caption band).
// Returns { band: {x,y,w,h}, area: {x,y,w,h}, panels: [{x,y,w,h}] } in fractions of the canvas.
export function layoutRects(layout, w, h, captionPos) {
  const capH = w >= h ? 0.20 : (w === h ? 0.17 : 0.14);
  const band = captionPos === 'top'
    ? { x: 0, y: 0, w: 1, h: capH }
    : { x: 0, y: 1 - capH, w: 1, h: capH };
  const area = captionPos === 'top'
    ? { x: 0, y: capH, w: 1, h: 1 - capH }
    : { x: 0, y: 0, w: 1, h: 1 - capH };
  let panels;
  if (layout === 'hero') {
    panels = [
      { x: 0, y: 0, w: 0.68, h: 1 },
      { x: 0.68, y: 0, w: 0.32, h: 0.5 },
      { x: 0.68, y: 0.5, w: 0.32, h: 0.5 },
    ];
  } else if (layout === 'strip') {
    panels = [
      { x: 0, y: 0, w: 1, h: 0.60 },
      { x: 0, y: 0.60, w: 0.25, h: 0.40 },
      { x: 0.25, y: 0.60, w: 0.25, h: 0.40 },
      { x: 0.50, y: 0.60, w: 0.25, h: 0.40 },
      { x: 0.75, y: 0.60, w: 0.25, h: 0.40 },
    ];
  } else {
    panels = [
      { x: 0, y: 0, w: 0.60, h: 0.70 },
      { x: 0.60, y: 0, w: 0.40, h: 0.35 },
      { x: 0.60, y: 0.35, w: 0.40, h: 0.35 },
      { x: 0, y: 0.70, w: 0.34, h: 0.30 },
      { x: 0.34, y: 0.70, w: 0.33, h: 0.30 },
      { x: 0.67, y: 0.70, w: 0.33, h: 0.30 },
    ];
  }
  return { band, area, panels };
}

function fitFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `700 ${size}px "Big Shoulders", "Arial Narrow", sans-serif`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `700 ${size}px "Big Shoulders", "Arial Narrow", sans-serif`;
  }
  return size;
}

/** Draws the full cover onto `canvas` at its own pixel size, from `state`. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const { band, area, panels } = layoutRects(state.layout, W, H, state.captionPos);
  const gap = Math.max(4, Math.round(W * 0.006));
  const px = (f) => f * W;
  const py = (f) => f * H;

  // Dusk-violet ground.
  ctx.fillStyle = '#1b1035';
  ctx.fillRect(0, 0, W, H);

  // Panels.
  panels.forEach((p, i) => {
    const x = px(area.x + p.x * area.w) + gap / 2;
    const y = py(area.y + p.y * area.h) + gap / 2;
    const w = px(p.w * area.w) - gap;
    const h = py(p.h * area.h) - gap;
    const slot = state.panels[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = state.photos[slot.photo];
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    if (img) {
      const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * (slot.zoom || 1);
      const dw = img.naturalWidth * base;
      const dh = img.naturalHeight * base;
      const maxX = Math.max(0, (dw - w) / 2);
      const maxY = Math.max(0, (dh - h) / 2);
      const dx = x + (w - dw) / 2 + (slot.ox || 0) * maxX;
      const dy = y + (h - dh) / 2 + (slot.oy || 0) * maxY;
      ctx.filter = grade.filter;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.filter = 'none';
    } else {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#3a1c5e');
      g.addColorStop(1, '#241040');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,243,224,0.55)';
      ctx.font = `700 ${Math.round(h * 0.16)}px "Work Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+ PHOTO', x + w / 2, y + h / 2);
    }
    // Warm wash rising from the foot of each panel, one light source.
    const wash = ctx.createLinearGradient(0, y + h * 0.45, 0, y + h);
    wash.addColorStop(0, 'rgba(255,122,61,0)');
    wash.addColorStop(1, `rgba(255,46,136,${0.16 + grade.warm * 0.25})`);
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    // Crisp hairline edge.
    ctx.strokeStyle = 'rgba(255,243,224,0.16)';
    ctx.lineWidth = Math.max(1, W * 0.001);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  });

  // One sunset grade across the whole panel area (overlay light, never muddy).
  const ax = px(area.x);
  const ay = py(area.y);
  const aw = px(area.w);
  const ah = py(area.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(ax, ay, aw, ah);
  ctx.clip();
  const sun = ctx.createLinearGradient(ax, ay, ax + aw * 0.4, ay + ah);
  sun.addColorStop(0, `rgba(255,170,80,${0.10 + grade.warm * 0.35})`);
  sun.addColorStop(0.55, `rgba(255,122,61,${0.05 + grade.warm * 0.2})`);
  sun.addColorStop(1, `rgba(255,46,136,${0.08 + grade.warm * 0.3})`);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = sun;
  ctx.fillRect(ax, ay, aw, ah);
  if (grade.cool > 0) {
    const cool = ctx.createLinearGradient(ax + aw, ay, ax, ay + ah);
    cool.addColorStop(0, `rgba(46,230,255,${grade.cool * 0.5})`);
    cool.addColorStop(1, 'rgba(46,230,255,0)');
    ctx.fillStyle = cool;
    ctx.fillRect(ax, ay, aw, ah);
  }
  ctx.globalCompositeOperation = 'source-over';
  // Gentle vignette: dusk closing in at the corners.
  const vig = ctx.createRadialGradient(
    ax + aw / 2, ay + ah / 2, Math.min(aw, ah) * 0.42,
    ax + aw / 2, ay + ah / 2, Math.max(aw, ah) * 0.75,
  );
  vig.addColorStop(0, 'rgba(20,8,40,0)');
  vig.addColorStop(1, 'rgba(20,8,40,0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(ax, ay, aw, ah);
  ctx.restore();

  // Neon rule between panels and caption band.
  const ruleY = state.captionPos === 'top' ? py(band.y + band.h) : py(band.y);
  const rule = ctx.createLinearGradient(0, ruleY, W, ruleY);
  rule.addColorStop(0, '#2ee6ff');
  rule.addColorStop(0.5, '#ff2e88');
  rule.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = rule;
  ctx.fillRect(0, ruleY - Math.max(2, H * 0.002), W, Math.max(3, H * 0.004));

  // Caption band: deep violet, title + kicker, breathing room on all sides.
  const bx = px(band.x);
  const by = py(band.y);
  const bw = px(band.w);
  const bh = py(band.h);
  const bandGrad = ctx.createLinearGradient(0, by, 0, by + bh);
  bandGrad.addColorStop(0, '#221240');
  bandGrad.addColorStop(1, '#160a2e');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(bx, by, bw, bh);

  const padX = bw * 0.045;
  const kicker = (state.kicker || '').trim().toUpperCase();
  const title = (state.caption || '').trim().toUpperCase();
  const sizeScale = state.captionSize || 1;
  if (kicker) {
    const ks = Math.max(10, bh * 0.13);
    ctx.font = `700 ${ks}px "Work Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#2ee6ff';
    // Letterspaced by hand: canvas has no letter-spacing everywhere, so draw spaced.
    const spaced = kicker.split('').join('  ');
    ctx.fillText(spaced, bx + padX, by + bh * 0.24);
  }
  if (title) {
    const startSize = bh * 0.58 * sizeScale;
    const size = fitFont(ctx, title, bw - padX * 2, startSize);
    const grad = ctx.createLinearGradient(0, by + bh * 0.32, 0, by + bh * 0.94);
    grad.addColorStop(0, '#fff3e0');
    grad.addColorStop(0.55, '#ffb26b');
    grad.addColorStop(1, '#ff7a3d');
    ctx.font = `700 ${size}px "Big Shoulders", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#160a2e';
    ctx.lineWidth = Math.max(2, size * 0.06);
    ctx.shadowColor = 'rgba(255,46,136,0.45)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.03;
    const ty = by + bh * 0.92;
    ctx.strokeText(title, bx + padX, ty);
    ctx.fillStyle = grad;
    ctx.fillText(title, bx + padX, ty);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}
