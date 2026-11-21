// BENTARA Cover Studio — wires the editor: photos in, panels assigned, caption typed,
// live preview, one-click PNG export in 1080x1080, 1080x1350 or 1920x1080.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, layoutRects, SIZES, LAYOUTS, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const strip = document.getElementById('strip');

const state = {
  photos: [],
  panels: [],
  layout: 'vice',
  grade: 'sunset',
  size: '1920x1080',
  caption: 'SUNSET HEIST',
  kicker: 'BENTARA · VICE CITY',
  captionSize: 1,
  captionPos: 'bottom',
};
let selected = 0; // selected panel index
let activePhoto = 0; // photo the next click assigns

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function ensurePanels() {
  while (state.panels.length < panelCount()) {
    state.panels.push({ photo: state.photos.length > 1 ? state.panels.length % state.photos.length : 0, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = panelCount();
  if (selected >= panelCount()) selected = 0;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function previewSize() {
  const [w, h] = SIZES[state.size];
  const maxW = 680;
  const scale = Math.min(1, maxW / w);
  return [Math.round(w * scale), Math.round(h * scale)];
}

function syncOptionButtons() {
  document.querySelectorAll('[data-layout]').forEach((x) => x.classList.toggle('on', x.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((x) => x.classList.toggle('on', x.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('on', x.dataset.size === state.size));
}

// Portrait photos hold faces near the top: favour the top of the frame so a
// wide panel never crops a face off. Applied to the defaults and shot scenes.
function tuneCrops() {
  state.panels.forEach((p, i) => {
    const img = state.photos[p.photo];
    if (!img) return;
    if (img.naturalHeight > img.naturalWidth) {
      p.oy = i === 0 ? 0.75 : 0.5;
      if (i === 0) p.zoom = Math.max(p.zoom || 1, 1.05);
    }
  });
}

function redraw() {
  ensurePanels();
  syncOptionButtons();
  const [w, h] = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  syncPanelControls();
}

function syncPanelControls() {
  const slot = state.panels[selected] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
  document.getElementById('panelLabel').textContent = `Panel ${selected + 1} of ${panelCount()}`;
  document.getElementById('zoom').value = slot.zoom;
  document.getElementById('panX').value = slot.ox;
  document.getElementById('panY').value = slot.oy;
  document.getElementById('zoomVal').textContent = `${Math.round(slot.zoom * 100)}%`;
  document.querySelectorAll('#strip .thumb').forEach((el, i) => {
    el.classList.toggle('active', i === slot.photo);
  });
}

function addPhotos(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  Promise.all(list.map((f) => loadImage(URL.createObjectURL(f)))).then((imgs) => {
    const start = state.photos.length;
    state.photos.push(...imgs);
    imgs.forEach((img, k) => addThumb(img, start + k));
    if (state.photos.length === imgs.length) {
      // First photos ever: fill every panel from them.
      state.panels = [];
      ensurePanels();
    }
    activePhoto = state.photos.length - 1;
    redraw();
    status.textContent = `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded — click a panel, then a photo, to place it.`;
  });
}

function addThumb(img, index) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'thumb';
  b.title = `Photo ${index + 1} — click to place in the selected panel, double-click to fill all panels`;
  const t = document.createElement('canvas');
  const s = Math.min(1, 96 / Math.max(img.naturalWidth, img.naturalHeight));
  t.width = Math.max(1, Math.round(img.naturalWidth * s));
  t.height = Math.max(1, Math.round(img.naturalHeight * s));
  t.getContext('2d').drawImage(img, 0, 0, t.width, t.height);
  b.appendChild(t);
  b.addEventListener('click', () => {
    activePhoto = index;
    state.panels[selected].photo = index;
    redraw();
  });
  b.addEventListener('dblclick', () => {
    state.panels.forEach((p) => { p.photo = index; });
    redraw();
    status.textContent = `All panels filled with photo ${index + 1}.`;
  });
  strip.appendChild(b);
}

// --- Controls ---------------------------------------------------------------
document.getElementById('photos').addEventListener('change', (e) => {
  addPhotos(e.target.files);
  e.target.value = '';
});

document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('kicker').addEventListener('input', (e) => {
  state.kicker = e.target.value;
  redraw();
});
document.getElementById('captionSize').addEventListener('input', (e) => {
  state.captionSize = Number(e.target.value);
  document.getElementById('captionSizeVal').textContent = `${Math.round(state.captionSize * 100)}%`;
  redraw();
});
document.getElementById('captionPos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});

document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((x) => x.classList.toggle('on', x === b));
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => {
    state.grade = b.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((x) => x.classList.toggle('on', x === b));
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => {
    state.size = b.dataset.size;
    document.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('on', x === b));
    redraw();
  });
});

document.getElementById('fillAll').addEventListener('click', () => {
  state.panels.forEach((p) => { p.photo = activePhoto; });
  redraw();
  status.textContent = `All panels filled with photo ${activePhoto + 1}.`;
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selected].zoom = Number(e.target.value);
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  state.panels[selected].ox = Number(e.target.value);
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  state.panels[selected].oy = Number(e.target.value);
  redraw();
});

// --- Panel picking: click to select, drag to pan, wheel to zoom -------------
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  // Hit-test against the panel rects (same math as cover.js, display size).
  const { area, panels } = layoutRects(state.layout, canvas.width, canvas.height, state.captionPos);
  const fx = x / canvas.width;
  const fy = y / canvas.height;
  const hit = panels.findIndex((p) => {
    const px = area.x + p.x * area.w;
    const py = area.y + p.y * area.h;
    return fx >= px && fx <= px + p.w * area.w && fy >= py && fy <= py + p.h * area.h;
  });
  if (hit >= 0) {
    selected = hit;
    drag = { x: e.clientX, y: e.clientY, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const slot = state.panels[selected];
  slot.ox = Math.max(-1, Math.min(1, drag.ox + ((e.clientX - drag.x) / r.width) * 2));
  slot.oy = Math.max(-1, Math.min(1, drag.oy + ((e.clientY - drag.y) / r.height) * 2));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.panels[selected];
  slot.zoom = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.1 : 0.9)));
  redraw();
}, { passive: false });

// --- Export -----------------------------------------------------------------
export function exportPNG() {
  return new Promise((resolve) => {
    const [w, h] = SIZES[state.size];
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, state);
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}

document.getElementById('export').addEventListener('click', async () => {
  status.textContent = 'Rendering PNG…';
  const blob = await exportPNG();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bentara-cover-${state.size}.png`;
  a.click();
  status.textContent = `Saved bentara-cover-${state.size}.png (${(blob.size / 1024).toFixed(0)} KiB) — post it.`;
});

// Test/debug hook (also used by ?shot=export).
window.__bentara = { state, exportPNG, redraw };

// --- Boot: auto-load the two sample photos so the editor opens with a cover --
async function boot() {
  const params = new URLSearchParams(location.search);
  if (params.get('shot')) {
    await runShot(params.get('shot'), params, async (sample, text, kicker, query) => {
      if (query.get('layout')) state.layout = query.get('layout');
      if (query.get('grade')) state.grade = query.get('grade');
      if (query.get('size')) state.size = query.get('size');
      if (query.get('captionPos')) state.captionPos = query.get('captionPos');
      if (kicker) state.kicker = kicker;
      try {
        await document.fonts.load('700 100px "Big Shoulders"');
        await document.fonts.load('700 20px "Work Sans"');
      } catch { /* system fallback fonts still render */ }
      const img = await loadImage(sample);
      state.photos = [img];
      try {
        const other = await loadImage(`samples/${params.get('photo') === 'pier' ? 'boulevard' : 'pier'}.jpg`);
        state.photos.push(other);
      } catch { /* one photo is enough */ }
      state.caption = text;
      state.panels = [];
      ensurePanels();
      tuneCrops();
      // In cover shots the canvas size is the export size; redraw keeps it.
      if (params.get('shot') === 'cover') {
        drawCover(canvas, state);
        syncPanelControls();
      } else {
        redraw();
      }
    });
    return;
  }
  try {
    await document.fonts.load('700 100px "Big Shoulders"');
    await document.fonts.load('700 20px "Work Sans"');
  } catch { /* system fallback fonts still render */ }
  try {
    const [pier, boulevard] = await Promise.all([
      loadImage('samples/pier.jpg'),
      loadImage('samples/boulevard.jpg'),
    ]);
    state.photos = [pier, boulevard];
    addThumb(pier, 0);
    addThumb(boulevard, 1);
    state.panels = [
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.15, ox: 0, oy: -0.2 },
      { photo: 1, zoom: 1.1, ox: 0.2, oy: 0 },
      { photo: 0, zoom: 1.2, ox: 0, oy: 0.1 },
      { photo: 1, zoom: 1, ox: -0.15, oy: 0 },
    ];
    tuneCrops();
  } catch {
    status.textContent = 'Sample photos could not load — add your own photos to begin.';
  }
  redraw();
}
boot();
