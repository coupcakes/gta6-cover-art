// Paints the cover onto a canvas: photo panels with a colour wash, the
// caption band (or the floating caption for a single photo), and the
// poster frame. Nothing here comes from any game — the sun, the band and
// the lettering are all drawn from scratch with canvas paths.

import { GRADES, SIZES, layoutRects } from './state.js';

/**
 * Paints the whole cover from `state`. With `options.highlight` the
 * selected panel gets a pink outline — the editor's doing, never the
 * exported PNG's.
 */
export function drawCover(canvas, state, options = {}) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const rects = layoutRects(state.layout, state.size);
  const gap = Math.max(4, Math.round(w * 0.006));

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  rects.panels.forEach((rect, i) => {
    const panel = state.panels[i] ?? { slot: 0, zoom: 1, dx: 0, dy: 0 };
    const box = {
      x: rect.x * w + gap / 2,
      y: rect.y * h + gap / 2,
      w: rect.w * w - gap,
      h: rect.h * h - gap,
    };
    paintPanel(ctx, state.photos[panel.slot] ?? null, box, panel, state.grade);
    if (options.highlight && i === state.selectedPanel) {
      ctx.save();
      ctx.strokeStyle = '#ff2fb3';
      ctx.lineWidth = Math.max(3, w * 0.004);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.restore();
    }
  });

  if (rects.band) {
    const band = {
      x: rects.band.x * w + gap / 2,
      y: rects.band.y * h + gap / 2,
      w: rects.band.w * w - gap,
      h: rects.band.h * h - gap,
    };
    paintBand(ctx, band, state);
  } else {
    paintOverlay(ctx, w, h, state);
  }

  if (state.frame) {
    ctx.save();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    ctx.restore();
  }
}

/**
 * One panel: the photo fitted to the box, moved by its zoom and pan, then
 * the colour wash on top. An empty slot gets a dusk gradient instead.
 */
export function paintPanel(ctx, photo, box, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  if (photo) {
    const fit = Math.max(box.w / photo.naturalWidth, box.h / photo.naturalHeight);
    const scale = fit * panel.zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const cx = box.x + box.w / 2 + panel.dx * box.w;
    const cy = box.y + box.h / 2 + panel.dy * box.h;
    ctx.filter = 'saturate(1.18) contrast(1.06)';
    ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
    ctx.filter = 'none';
  } else {
    paintEmpty(ctx, box);
  }
  paintWash(ctx, box, grade);
  ctx.restore();
}

/** An empty panel: a dusk sky with a low sun, so the cover still looks done. */
export function paintEmpty(ctx, box) {
  const sky = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.55, '#c2185b');
  sky.addColorStop(1, '#ff7a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  paintSun(ctx, box.x + box.w / 2, box.y + box.h * 0.62, box.h * 0.2, '#ffd166', '#ff5e8a');
}

/**
 * The colour wash: faint at the top of the panel, strong at the foot, so
 * the photo keeps its detail where it matters and the grade still reads.
 */
export function paintWash(ctx, box, gradeName) {
  const grade = GRADES[gradeName] ?? GRADES.none;
  if (!grade.top) return;
  const wash = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  wash.addColorStop(0, rgba(grade.top, 0.05));
  wash.addColorStop(0.55, rgba(grade.top, 0.16));
  wash.addColorStop(1, rgba(grade.bottom, 0.42));
  ctx.fillStyle = wash;
  ctx.fillRect(box.x, box.y, box.w, box.h);
}

/** The plum caption band: tagline, big caption, and a small sun at the end. */
export function paintBand(ctx, band, state) {
  const ground = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  ground.addColorStop(0, '#241040');
  ground.addColorStop(1, '#12081f');
  ctx.fillStyle = ground;
  ctx.fillRect(band.x, band.y, band.w, band.h);

  const pad = band.h * 0.14;
  const left = band.x + pad;
  const width = band.w - pad * 2 - (state.sun ? band.h * 1.1 : 0);

  const tagline = state.tagline.trim().toUpperCase();
  if (tagline) {
    const tagSize = Math.max(10, band.h * 0.13);
    ctx.font = `400 ${tagSize}px "Archivo Black", sans-serif`;
    ctx.fillStyle = '#ff7ad9';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(tagline, left, band.y + pad + tagSize);
  }

  const caption = state.caption.trim().toUpperCase();
  if (caption) {
    fitCaption(ctx, caption, left, band.y + pad + band.h * 0.16, width, band.h - pad * 2 - band.h * 0.16, state);
  }

  if (state.sun) {
    paintSun(ctx, band.x + band.w - pad - band.h * 0.32, band.y + band.h * 0.52, band.h * 0.32, '#ffd166', '#ff2fb3');
  }
}

/** Single layout: tagline and caption over the photo's foot, on a shade. */
export function paintOverlay(ctx, w, h, state) {
  const shade = ctx.createLinearGradient(0, h * 0.55, 0, h);
  shade.addColorStop(0, 'rgba(10, 4, 20, 0)');
  shade.addColorStop(1, 'rgba(10, 4, 20, 0.78)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  if (state.captionPlace === 'top') {
    const topShade = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    topShade.addColorStop(0, 'rgba(10, 4, 20, 0.78)');
    topShade.addColorStop(1, 'rgba(10, 4, 20, 0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, w, h);
  }
  if (state.sun) {
    paintSun(ctx, w * 0.86, h * 0.13, Math.min(w, h) * 0.07, '#ffd166', '#ff2fb3');
  }
  const caption = state.caption.trim().toUpperCase();
  const tagline = state.tagline.trim().toUpperCase();
  const margin = w * 0.06;
  const y = state.captionPlace === 'top' ? h * 0.05 : h * 0.86;
  if (tagline) {
    const tagSize = Math.max(12, h * 0.022);
    ctx.font = `400 ${tagSize}px "Archivo Black", sans-serif`;
    ctx.fillStyle = '#ff7ad9';
    ctx.textAlign = 'center';
    ctx.fillText(tagline, w / 2, y + tagSize);
  }
  if (caption) {
    fitCaption(ctx, caption, margin, y + h * 0.035, w - margin * 2, h * 0.09, state, 'center');
  }
}

/**
 * The big caption, shrunk step by step until it fits its box, with a dark
 * outline so it reads over any photo.
 */
export function fitCaption(ctx, text, x, y, maxWidth, maxHeight, state, align = 'left') {
  const family = state.captionFont === 'Archivo Black'
    ? '"Archivo Black", sans-serif'
    : state.captionFont === 'Bebas Neue'
      ? '"Bebas Neue", sans-serif'
      : '"Anton", sans-serif';
  let size = maxHeight * 0.92 * state.captionScale;
  ctx.font = `400 ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `400 ${size}px ${family}`;
  }
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  const drawX = align === 'center' ? x + maxWidth / 2 : x;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 4, 20, 0.85)';
  ctx.lineWidth = Math.max(2, size * 0.08);
  ctx.strokeText(text, drawX, y + size * 0.92);
  ctx.fillStyle = state.captionColor;
  ctx.fillText(text, drawX, y + size * 0.92);
}

/**
 * A synthwave sun — a disc with horizontal slats cut through its lower
 * half. It is drawn on a scratch canvas first, so the slats erase only
 * the sun and never the photo or band underneath.
 */
export function paintSun(ctx, cx, cy, radius, topColor, bottomColor) {
  const off = document.createElement('canvas');
  const r = Math.max(2, Math.ceil(radius));
  off.width = r * 2 + 2;
  off.height = r * 2 + 2;
  const octx = off.getContext('2d');
  const sun = octx.createLinearGradient(0, 0, 0, off.height);
  sun.addColorStop(0, topColor);
  sun.addColorStop(1, bottomColor);
  octx.fillStyle = sun;
  octx.beginPath();
  octx.arc(r + 1, r + 1, r, 0, Math.PI * 2);
  octx.fill();
  octx.globalCompositeOperation = 'destination-out';
  const slats = 4;
  for (let i = 0; i < slats; i += 1) {
    const sy = r + 1 + r * (0.05 + i * 0.22);
    const sh = r * (0.05 + i * 0.02);
    octx.fillRect(0, sy, off.width, sh);
  }
  ctx.drawImage(off, cx - r - 1, cy - r - 1);
}

/** A '#rrggbb' colour with an alpha, as an rgba() string. */
export function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The export pixel size for a state, from SIZES. */
export function exportSize(state) {
  return SIZES[state.size] ?? SIZES.portrait;
}
