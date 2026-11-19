// Fixed scenes for the screenshots: `?shot=cover` shows the exported
// cover on its own, `?shot=editor` shows the app with photos loaded.
// Knobs in the query: photo, photo2, photo3 (sample names), caption,
// tagline, layout, size, grade, font, color, zoom, pan.
// `window.__shotReady` is set once the scene has been painted.
export async function runShot(shot, query, app) {
  const { state } = app;
  if (shot === 'cover') document.body.classList.add('shot-cover');

  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('size')) state.size = query.get('size');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('font')) {
    state.captionFont = query.get('font');
    const fontSelect = document.getElementById('caption-font');
    if (fontSelect) fontSelect.value = query.get('font');
  }
  if (query.get('color')) state.captionColor = query.get('color');
  app.setCaption(query.get('caption') ?? 'SUNSET HEIST');
  app.setTagline(query.get('tagline') ?? 'VICE CITY');

  const names = [
    query.get('photo') ?? 'pier',
    query.get('photo2') ?? 'boulevard',
    query.get('photo3') ?? 'pier',
  ];
  for (let slot = 0; slot < 3; slot += 1) {
    try {
      const photo = await app.loadImage(`samples/${names[slot]}.jpg`);
      app.setSlotPhoto(slot, photo, `sample ${names[slot]}`);
    } catch {
      // A missing sample leaves that panel on its dusk placeholder.
    }
  }
  // Each panel shows its own slot, where the layout has that many panels.
  state.panels[0].slot = 0;
  state.panels[1].slot = 1;
  state.panels[2].slot = 2;
  if (query.get('zoom')) state.panels[0].zoom = Number(query.get('zoom'));
  if (query.get('pan')) state.panels[0].dx = Number(query.get('pan'));

  await document.fonts.ready;
  // A cover scene is the exported cover itself: no selection outline.
  if (shot === 'cover') app.redrawClean();
  else app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
