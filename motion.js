'use strict';

// Progressive enhancement: the page remains native on touch and reduced motion.
(() => {
  const html = document.documentElement;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.querySelector('#film-dialog');
  const effectsOn = () => !html.classList.contains('motion-paused') && !reducedMotion.matches;
  const desktopOn = () => effectsOn() && finePointer.matches && innerWidth > 620 && !dialog.open;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<i></i>';
  document.body.append(progress);

  const cursor = document.createElement('div');
  cursor.id = 'mise-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor-core"></span><span class="cursor-orbit"><span class="cursor-glyph"></span><span class="cursor-word"></span></span>';
  document.body.append(cursor);
  const core = cursor.querySelector('.cursor-core');
  const orbit = cursor.querySelector('.cursor-orbit');
  const glyph = cursor.querySelector('.cursor-glyph');
  const word = cursor.querySelector('.cursor-word');
  let pointerX = 0, pointerY = 0, orbitX = 0, orbitY = 0;
  let cursorFrame = 0, pointerSeen = false, cursorMode = '', magneticArrow = null;

  function resetMagnet() {
    if (magneticArrow) magneticArrow.style.translate = '';
    magneticArrow = null;
  }
  function hideCursor() {
    html.classList.remove('cursor-active');
    cursor.classList.remove('is-visible', 'is-down');
    pointerSeen = false;
    cancelAnimationFrame(cursorFrame);
    cursorFrame = 0;
    resetMagnet();
  }
  function setCursorMode(mode) {
    if (mode === cursorMode) return;
    cursorMode = mode;
    cursor.dataset.mode = mode;
    glyph.textContent = mode === 'watch' ? '▶' : mode === 'drag' ? '↔' : mode === 'link' ? '↗' : '';
    word.textContent = mode === 'watch' ? 'WATCH' : mode === 'drag' ? 'DRAG' : '';
  }
  function renderCursor() {
    orbitX += (pointerX - orbitX) * 0.23;
    orbitY += (pointerY - orbitY) * 0.23;
    core.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
    orbit.style.transform = `translate3d(${orbitX}px,${orbitY}px,0)`;
    cursorFrame = Math.abs(pointerX - orbitX) + Math.abs(pointerY - orbitY) > 0.1
      ? requestAnimationFrame(renderCursor) : 0;
  }
  function describePointer(target) {
    if (!(target instanceof Element) || !desktopOn() || target.closest('input,textarea,select,[contenteditable="true"],dialog')) {
      hideCursor();
      return false;
    }
    const mode = target.closest('.film-open') ? 'watch'
      : target.closest('a,button,summary,label') ? 'link'
      : target.closest('#service-gallery') ? 'drag' : 'default';
    setCursorMode(mode);
    html.classList.add('cursor-active');
    cursor.classList.add('is-visible');
    return true;
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !describePointer(event.target)) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerSeen) { orbitX = pointerX; orbitY = pointerY; pointerSeen = true; }
    if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
    const button = event.target.closest('.pill,.nav-request');
    const arrow = button?.querySelector(':scope > span');
    if (arrow !== magneticArrow) resetMagnet();
    if (arrow) {
      magneticArrow = arrow;
      const rect = button.getBoundingClientRect();
      arrow.style.translate = `${clamp((pointerX - rect.left - rect.width / 2) * 0.1, -7, 7)}px ${clamp((pointerY - rect.top - rect.height / 2) * 0.15, -4, 4)}px`;
    }
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') cursor.classList.add('is-down');
  }, { passive: true });
  document.addEventListener('pointerup', () => cursor.classList.remove('is-down'), { passive: true });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hideCursor(); }, { passive: true });
  window.addEventListener('blur', hideCursor);
  document.addEventListener('keydown', event => { if (event.key === 'Tab') hideCursor(); });

  // Smooth wheel input without a transformed page, so anchors, sticky elements,
  // keyboard navigation, text selection and the native scrollbar keep working.
  let wheelFrame = 0, wheelTarget = scrollY, wheelTime = 0;
  function stopWheel() {
    cancelAnimationFrame(wheelFrame);
    wheelFrame = 0;
    wheelTarget = scrollY;
    html.classList.remove('wheel-easing');
  }
  function wheelTick(time) {
    if (!desktopOn()) { stopWheel(); return; }
    const maximum = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    wheelTarget = clamp(wheelTarget, 0, maximum);
    const elapsed = Math.min(34, time - wheelTime || 16.7);
    wheelTime = time;
    const current = scrollY;
    const gap = wheelTarget - current;
    const step = gap * (1 - Math.exp(-elapsed / 78));
    const next = current + Math.sign(step) * Math.min(Math.abs(gap), Math.max(1, Math.abs(step)));
    if (Math.abs(gap) < 2) {
      window.scrollTo({ top: wheelTarget, behavior: 'instant' });
      stopWheel();
      return;
    }
    window.scrollTo({ top: next, behavior: 'instant' });
    wheelFrame = requestAnimationFrame(wheelTick);
  }
  function hasLocalScroll(target, delta) {
    for (let element = target; element && element !== document.body; element = element.parentElement) {
      const overflow = getComputedStyle(element).overflowY;
      if (/(auto|scroll)/.test(overflow) && element.scrollHeight > element.clientHeight + 1) {
        if ((delta > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1) ||
            (delta < 0 && element.scrollTop > 0)) return true;
      }
    }
    return false;
  }
  window.addEventListener('wheel', event => {
    if (!desktopOn() || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented || !event.cancelable ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY ||
        event.target.closest('input,textarea,select,[contenteditable="true"],dialog') ||
        hasLocalScroll(event.target, event.deltaY)) { stopWheel(); return; }
    const maximum = Math.max(0, html.scrollHeight - innerHeight);
    const delta = event.deltaY * (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? innerHeight * 0.85 : 1);
    if ((scrollY <= 0 && delta < 0) || (scrollY >= maximum - 1 && delta > 0)) return;
    event.preventDefault();
    if (!wheelFrame) wheelTarget = scrollY;
    wheelTarget = clamp(wheelTarget + clamp(delta, -innerHeight * 0.9, innerHeight * 0.9), 0, maximum);
    html.classList.add('wheel-easing');
    if (!wheelFrame) { wheelTime = performance.now(); wheelFrame = requestAnimationFrame(wheelTick); }
  }, { passive: false });
  document.addEventListener('pointerdown', stopWheel, { passive: true, capture: true });
  document.addEventListener('keydown', stopWheel, { capture: true });
  window.addEventListener('hashchange', stopWheel);

  const layers = [...document.querySelectorAll('.service-photo img,.collage-main,.collage-small')];
  layers.forEach(layer => layer.classList.add('motion-layer'));
  const note = document.querySelector('.care-note');
  let scrollFrame = 0;
  function renderScroll() {
    scrollFrame = 0;
    const distance = Math.max(1, html.scrollHeight - innerHeight);
    const position = clamp(scrollY / distance, 0, 1);
    progress.firstElementChild.style.transform = `scaleX(${position})`;
    cursor.style.setProperty('--orbit-turn', `${position * 360}deg`);
    const canParallax = effectsOn() && finePointer.matches && innerWidth > 850;
    for (const layer of layers) {
      if (!canParallax) { layer.style.setProperty('--drift', '0px'); continue; }
      const frame = layer.closest('.service-photo,.details-collage');
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > innerHeight + 100) continue;
      const ratio = clamp((innerHeight / 2 - (rect.top + rect.height / 2)) / innerHeight, -1, 1);
      const depth = layer.classList.contains('collage-small') ? -24 : 20;
      layer.style.setProperty('--drift', `${ratio * depth}px`);
    }
    if (note) note.style.setProperty('--seal-turn', `${canParallax ? clamp(scrollY / 90 - 9, -9, 9) : -7}deg`);
    if (pointerSeen && desktopOn()) describePointer(document.elementFromPoint(pointerX, pointerY));
  }
  function queueScroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll); }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', () => { hideCursor(); stopWheel(); queueScroll(); }, { passive: true });
  const resizer = new ResizeObserver(queueScroll);
  resizer.observe(document.body);
  function syncEffects() { hideCursor(); stopWheel(); queueScroll(); }
  document.addEventListener('mise:motion', syncEffects);
  finePointer.addEventListener('change', syncEffects);
  reducedMotion.addEventListener('change', syncEffects);
  new MutationObserver(syncEffects).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  document.addEventListener('visibilitychange', () => { if (document.hidden) syncEffects(); });
  renderScroll();
})();
