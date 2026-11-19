// Connects the page: photos in, caption typed, panels dragged, PNG out.
// A `?shot=` query builds a fixed scene for a screenshot instead.
import { drawCover, exportSize } from './cover.js';
import { CAPTION_FONTS, LAYOUTS, SIZES, defaultState, layoutRects } from './state.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();

/** Loads an image from a URL, resolving once it is ready to draw. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Repaints the preview at the export size, outlining the selected panel. */
export function redraw() {
  paint(true);
}

/** Repaints the cover exactly as the PNG export writes it: no outline. */
export function redrawClean() {
  paint(false);
}

function paint(highlight) {
  const size = exportSize(state);
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  drawCover(canvas, state, { highlight });
  syncControls();
}

/** Writes the state back into every control on the page. */
export function syncControls() {
  markPressed('#layout-choices', 'data-layout', state.layout);
  markPressed('#size-choices', 'data-size', state.size);
  markPressed('#grade-choices', 'data-grade', state.grade);
  markPressed('#color-choices', 'data-color', state.captionColor);
  const panelCount = LAYOUTS[state.layout].panels;
  if (state.selectedPanel >= panelCount) state.selectedPanel = 0;
  document.querySelectorAll('#panel-select option').forEach((option) => {
    option.disabled = Number(option.value) >= panelCount;
  });
  document.getElementById('panel-select').value = String(state.selectedPanel);
  const panel = state.panels[state.selectedPanel];
  document.getElementById('panel-slot').value = String(panel.slot);
  document.getElementById('panel-zoom').value = String(Math.round(panel.zoom * 100));
  document.getElementById('zoom-value').textContent = `${Math.round(panel.zoom * 100)}%`;
  document.getElementById('caption-size-value').textContent = `${Math.round(state.captionScale * 100)}%`;
  state.photos.forEach((photo, i) => {
    document.querySelector(`#slot-${i} span`).classList.toggle('filled', photo !== null);
  });
}

function markPressed(container, attribute, value) {
  document.querySelectorAll(`${container} [${attribute}]`).forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset[attribute.slice(5)] === value));
  });
}

function say(message) {
  status.textContent = message;
}

/** Puts an image into a photo slot, then repaints. */
export function setSlotPhoto(slot, photo, label) {
  state.photos[slot] = photo;
  say(label ? `Photo ${slot + 1} loaded: ${label}` : `Photo ${slot + 1} cleared`);
  redraw();
}

async function loadSample(slot, name) {
  try {
    const photo = await loadImage(`samples/${name}.jpg`);
    setSlotPhoto(slot, photo, `sample ${name}`);
  } catch {
    say(`Sample ${name} did not load`);
  }
}

/** One handler for a group of choice buttons that set one state field. */
function bindChoices(selector, apply) {
  document.querySelectorAll(selector).forEach((button) => {
    button.addEventListener('click', () => {
      apply(button);
      redraw();
    });
  });
}

// Photo slots: upload, sample, clear.
document.querySelectorAll('input[type=file][data-slot]').forEach((input) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (!file) return;
    const slot = Number(input.dataset.slot);
    try {
      const photo = await loadImage(URL.createObjectURL(file));
      setSlotPhoto(slot, photo, file.name);
    } catch {
      say(`${file.name} is not a readable image`);
    }
    input.value = '';
  });
});
document.querySelectorAll('[data-sample]').forEach((button) => {
  button.addEventListener('click', () => loadSample(Number(button.dataset.sample), button.dataset.photo));
});
document.querySelectorAll('[data-clear]').forEach((button) => {
  button.addEventListener('click', () => setSlotPhoto(Number(button.dataset.clear), null));
});

// Layout, size, grade and caption colour.
bindChoices('#layout-choices [data-layout]', (button) => { state.layout = button.dataset.layout; });
bindChoices('#size-choices [data-size]', (button) => { state.size = button.dataset.size; });
bindChoices('#grade-choices [data-grade]', (button) => { state.grade = button.dataset.grade; });
bindChoices('#color-choices [data-color]', (button) => { state.captionColor = button.dataset.color; });

// The selected panel: which panel, which photo it shows, its zoom.
document.getElementById('panel-select').addEventListener('change', (event) => {
  state.selectedPanel = Number(event.target.value);
  redraw();
});
document.getElementById('panel-slot').addEventListener('change', (event) => {
  state.panels[state.selectedPanel].slot = Number(event.target.value);
  redraw();
});
document.getElementById('panel-zoom').addEventListener('input', (event) => {
  state.panels[state.selectedPanel].zoom = Number(event.target.value) / 100;
  redraw();
});
document.getElementById('panel-centre').addEventListener('click', () => {
  const panel = state.panels[state.selectedPanel];
  panel.zoom = 1;
  panel.dx = 0;
  panel.dy = 0;
  redraw();
});

// Caption: the words, the tagline, the lettering, the size, frame and sun.
document.getElementById('caption').addEventListener('input', (event) => {
  state.caption = event.target.value;
  redraw();
});
document.getElementById('tagline').addEventListener('input', (event) => {
  state.tagline = event.target.value;
  redraw();
});
document.getElementById('caption-font').addEventListener('change', (event) => {
  state.captionFont = event.target.value;
  redraw();
});
document.getElementById('caption-size').addEventListener('input', (event) => {
  state.captionScale = Number(event.target.value) / 100;
  redraw();
});
document.getElementById('frame').addEventListener('change', (event) => {
  state.frame = event.target.checked;
  redraw();
});
document.getElementById('sun').addEventListener('change', (event) => {
  state.sun = event.target.checked;
  redraw();
});

// Drag a panel in the preview to move its photo inside the panel.
let drag = null;
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = (clientX - box.left) / box.width;
  const y = (clientY - box.top) / box.height;
  const rects = layoutRects(state.layout, state.size);
  const index = rects.panels.findIndex((rect) => x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h);
  return { index, x, y };
}
canvas.addEventListener('pointerdown', (event) => {
  const hit = panelAt(event.clientX, event.clientY);
  if (hit.index < 0) return;
  state.selectedPanel = hit.index;
  drag = { panel: hit.index, x: hit.x, y: hit.y };
  canvas.setPointerCapture(event.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const hit = panelAt(event.clientX, event.clientY);
  const rects = layoutRects(state.layout, state.size);
  const rect = rects.panels[drag.panel];
  const panel = state.panels[drag.panel];
  panel.dx += (hit.x - drag.x) / rect.w;
  panel.dy += (hit.y - drag.y) / rect.h;
  panel.dx = Math.max(-1, Math.min(1, panel.dx));
  panel.dy = Math.max(-1, Math.min(1, panel.dy));
  drag = { panel: drag.panel, x: hit.x, y: hit.y };
  redraw();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});

/** Writes the preview canvas out as a PNG download at the chosen size. */
export function exportCover() {
  const size = exportSize(state);
  const name = `vice-cover-${size.width}x${size.height}.png`;
  redrawClean(); // The PNG is the cover itself: no selection outline in it.
  canvas.toBlob((blob) => {
    if (!blob) {
      say('Export failed: the canvas could not make a PNG');
      redraw();
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    say(`Saved ${name}`);
    redraw(); // Back to the editor preview, outline and all.
  }, 'image/png');
}
document.getElementById('export').addEventListener('click', exportCover);

// Warm up the caption fonts so the first preview already has them.
document.fonts.load('400 100px "Anton"').catch(() => {});
document.fonts.load('400 100px "Archivo Black"').catch(() => {});
document.fonts.load('400 100px "Bebas Neue"').catch(() => {});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    state,
    loadImage,
    setSlotPhoto,
    redraw,
    redrawClean,
    exportCover,
    setCaption: (text) => {
      state.caption = text;
      document.getElementById('caption').value = text;
    },
    setTagline: (text) => {
      state.tagline = text;
      document.getElementById('tagline').value = text;
    },
  });
} else {
  redraw();
}
