// Everything the editor can change about a cover, in one place: the
// export sizes, the panel arrangements, the colour washes, the lettering,
// and the per-panel photo placement. The drawing code only reads this
// state, so any editor action is just "change the state, repaint".

/** The three post sizes the PNG export offers. */
export const SIZES = {
  square: { width: 1080, height: 1080, label: 'Square' },
  portrait: { width: 1080, height: 1350, label: 'Portrait' },
  wide: { width: 1920, height: 1080, label: 'Wide' },
};

/** The three arrangements, and how many panels each one shows. */
export const LAYOUTS = {
  poster: { panels: 3, label: 'Poster' },
  split: { panels: 2, label: 'Split' },
  single: { panels: 1, label: 'Single' },
};

/** Colour washes painted over the photos, as a top and a bottom colour. */
export const GRADES = {
  sunset: { top: '#ff7a3d', bottom: '#c2185b', label: 'Sunset' },
  neon: { top: '#ff2fb3', bottom: '#00e5ff', label: 'Neon' },
  vice: { top: '#7b2ff7', bottom: '#00d1a7', label: 'Vice' },
  none: { top: null, bottom: null, label: 'No grade' },
};

/** The caption letterings, as CSS font stacks. */
export const CAPTION_FONTS = {
  Anton: '"Anton", sans-serif',
  'Archivo Black': '"Archivo Black", sans-serif',
  'Bebas Neue': '"Bebas Neue", sans-serif',
};

/** The five caption colours the editor offers. */
export const CAPTION_COLORS = ['#ffffff', '#ffe259', '#ff5e8a', '#7df9ff', '#111111'];

/**
 * A brand-new cover: poster of three panels, portrait size, sunset wash,
 * the default caption, and three empty photo slots waiting to be filled.
 */
export function defaultState() {
  return {
    layout: 'poster',
    size: 'portrait',
    grade: 'sunset',
    caption: 'SUNSET HEIST',
    tagline: 'VICE CITY',
    captionFont: 'Anton',
    captionColor: '#ffffff',
    captionPlace: 'bottom',
    captionScale: 1,
    frame: true,
    sun: true,
    photos: [null, null, null],
    panels: [
      { slot: 0, zoom: 1, dx: 0, dy: 0 },
      { slot: 1, zoom: 1, dx: 0, dy: 0 },
      { slot: 2, zoom: 1, dx: 0, dy: 0 },
    ],
    selectedPanel: 0,
  };
}

// Panel geometry, as fractions of the canvas. Poster and split keep the
// bottom 16% for the caption band; single fills the whole canvas and the
// caption floats over the photo instead, so it has no band. A wide split
// puts its two panels side by side; a tall one stacks them.
const GEOMETRY = {
  single: {
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    band: null,
  },
  split: {
    panels: [
      { x: 0, y: 0, w: 1, h: 0.42 },
      { x: 0, y: 0.42, w: 1, h: 0.42 },
    ],
    band: { x: 0, y: 0.84, w: 1, h: 0.16 },
  },
  'split-wide': {
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.84 },
      { x: 0.5, y: 0, w: 0.5, h: 0.84 },
    ],
    band: { x: 0, y: 0.84, w: 1, h: 0.16 },
  },
  poster: {
    panels: [
      { x: 0, y: 0, w: 1, h: 0.52 },
      { x: 0, y: 0.52, w: 0.5, h: 0.32 },
      { x: 0.5, y: 0.52, w: 0.5, h: 0.32 },
    ],
    band: { x: 0, y: 0.84, w: 1, h: 0.16 },
  },
};

/** Panel rectangles and the caption band for a layout and size. */
export function layoutRects(layout, size) {
  if (layout === 'split' && size === 'wide') return GEOMETRY['split-wide'];
  return GEOMETRY[layout] ?? GEOMETRY.poster;
}
