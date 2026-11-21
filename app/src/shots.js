// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows one exported cover alone, full-frame; ?shot=export renders the PNG
// offscreen and reports its byte size (verifies the export path headlessly).
// window.__shotReady is set once painted. Query params: size, layout, grade,
// caption, kicker, photo (samples/<photo>.jpg).
import { drawCover, SIZES } from './cover.js';

export async function runShot(shot, query, load) {
  const caption = query.get('caption') ?? 'Sunset Heist';
  const kicker = query.get('kicker') ?? 'Bentara · Vice City';
  const photo = query.get('photo') ?? 'pier';
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = SIZES[query.get('size') ?? '1920x1080'] ?? SIZES['1920x1080'];
    const canvas = document.getElementById('cover');
    canvas.width = size[0];
    canvas.height = size[1];
    await load(`samples/${photo}.jpg`, caption, kicker, query);
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    return;
  }
  if (shot === 'export') {
    const size = SIZES[query.get('size') ?? '1920x1080'] ?? SIZES['1920x1080'];
    await load(`samples/${photo}.jpg`, caption, kicker, query);
    const blob = await window.__bentara.exportPNG();
    window.__exportBytes = blob.size;
    document.getElementById('status').textContent = `EXPORT_OK ${blob.size} bytes ${size[0]}x${size[1]}`;
    window.__shotReady = true;
    return;
  }
  // editor (default shot): the normal editor, sample photo loaded.
  await load(`samples/${photo}.jpg`, caption, kicker, query);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
