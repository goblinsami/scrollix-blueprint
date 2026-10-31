import { createProgressSmoother } from './progressSmoother';
import { createDefaultProject, mountBlueprint, validateBlueprintProject } from '../index';
import type { ArtPreset, BlueprintProject, BlueprintRuntime } from '../index';
import type { BlueprintState } from '../contracts/ports';

const presetNames: Record<ArtPreset, string> = {
  paper: 'Paper',
  'inverted-blueprint': 'Inverted Blueprint',
  'material-study': 'Material Study',
};

/** DOM host only: input and scroll feed the runtime's single normalized progress. */
export async function mountPlayground(app: HTMLElement): Promise<() => void> {
  let project: BlueprintProject = validateBlueprintProject(createDefaultProject());
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  app.innerHTML = `
    <section class="journey" data-testid="journey" aria-label="Recorrido Blueprint">
      <div class="studio-shell">
        <header class="masthead">
          <a class="wordmark" href="#" aria-label="Scrollix Blueprint, inicio">scrollix<span class="wordmark-mark" aria-hidden="true">↗</span></a>
          <span class="masthead-note">A study in space &amp; motion</span>
          <span class="local-label"><i aria-hidden="true"></i> Local playground</span>
        </header>
        <div class="project-heading">
          <div><p class="eyebrow">Blueprint / Experimental architecture</p><h1>From line to space<span aria-hidden="true">.</span></h1></div>
          <div class="project-reference"><span>Concept house — 001</span><span>12 × 18 m / 216 m²</span></div>
        </div>
        <div class="workspace">
          <div class="blueprint-viewport" data-testid="blueprint-viewport" role="region" aria-label="Vista arquitectónica" data-progress="0" data-phase="draw" data-scene-ready="false" data-render-count="0">
            <div class="viewport-caption"><span>Fig. 01 / Spatial sequence</span><span class="phase-indicator" data-testid="phase-label">01 — Draw</span></div>
            <div class="scene-placeholder" data-testid="scene-placeholder"><span class="placeholder-symbol" aria-hidden="true">⌑</span><h2>El espacio empieza con una línea.</h2><p>Runtime preparado. La escena se conectará en el siguiente hito.</p></div>
            <div class="viewport-footer"><span class="coordinate-label">X / Z &nbsp; · &nbsp; Metres</span><span class="motion-note" hidden>Movimiento reducido</span><span class="scroll-hint">Scroll to explore <span aria-hidden="true">↓</span></span></div>
          </div>
          <div class="control-desk" aria-label="Controles del playground">
            <div class="progress-control">
              <div class="control-heading"><label for="progress">Progreso</label><output for="progress" id="progress-value">0.0<span>%</span></output></div>
              <input id="progress" type="range" min="0" max="100" step="0.1" value="0" aria-describedby="progress-help">
              <p id="progress-help">Desplázate o arrastra para recorrer el proyecto.</p>
            </div>
            <div class="preset-control"><label for="preset">Preset</label><select id="preset"><option value="paper">Paper</option><option value="inverted-blueprint">Inverted Blueprint</option><option value="material-study">Material Study</option></select></div>
            <nav class="phase-navigation" aria-label="Fases del recorrido"><span class="control-label">Explorar</span><div><button type="button" data-stage="start" aria-label="Inicio">↺</button><button type="button" data-stage="draw">Draw</button><button type="button" data-stage="extrude">Extrude</button><button type="button" data-stage="reveal">Reveal</button></div></nav>
          </div>
        </div>
        <div class="studio-footer"><span>Scrollix Blueprint <span aria-hidden="true">/</span> <span data-testid="preset-name">Paper</span></span><span>01 — 03 <span class="footer-detail">/ Architecture in progress</span></span></div>
        <p class="runtime-error" role="alert" hidden></p>
      </div>
    </section>
    <section class="journey-end" id="journey-end" aria-label="Fin del recorrido"><span class="eyebrow">End of study / 001</span><h2>Every space starts<br>with an idea.</h2><p>Fin del recorrido. Puedes volver a explorar desplazándote hacia arriba.</p><a href="#" class="back-to-start">Volver al inicio <span aria-hidden="true">↑</span></a></section>
  `;
  // The template above is static. All project-provided values below use textContent.
  const element = <T extends HTMLElement>(selector: string): T => {
    const result = app.querySelector<T>(selector);
    if (!result) throw new Error('Missing playground element: ' + selector);
    return result;
  };
  const journey = element<HTMLElement>('.journey');
  const shell = element<HTMLElement>('.studio-shell');
  const viewport = element<HTMLElement>('.blueprint-viewport');
  const slider = element<HTMLInputElement>('#progress');
  const output = element<HTMLOutputElement>('#progress-value');
  const preset = element<HTMLSelectElement>('#preset');
  const error = element<HTMLParagraphElement>('.runtime-error');
  const placeholder = element<HTMLElement>('.scene-placeholder');
  const phaseLabel = element<HTMLElement>('.phase-indicator');
  const presetName = element<HTMLElement>('[data-testid="preset-name"]');
  let runtime: BlueprintRuntime | undefined;
  let unsubscribe: (() => void) | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let projectRevision = 0;
  let disposed = false;
  const phaseNames = { draw: '01 — Draw', extrude: '02 — Extrude', reveal: '03 — Reveal' };
  const setTheme = (value: ArtPreset) => { shell.dataset.preset = value; presetName.textContent = presetNames[value]; };
  setTheme(project.art.preset);

  const updateState = (state: BlueprintState) => {
    output.textContent = (state.progress * 100).toFixed(1) + '%';
    phaseLabel.textContent = phaseNames[state.phase];
    viewport.dataset.progress = String(state.progress);
    viewport.dataset.phase = state.phase;
    viewport.dataset.sceneReady = String(state.sceneReady);
    viewport.dataset.disposed = String(state.disposed);
    viewport.dataset.draw = String(state.draw);
    viewport.dataset.extrude = String(state.extrude);
    viewport.dataset.reveal = String(state.reveal);
    viewport.dataset.renderCount = String(state.diagnostics?.renderCount ?? 0);
    viewport.dataset.renderedProgress = String(state.diagnostics?.renderedProgress ?? -1);
    viewport.dataset.lineSegmentsVisible = String(state.diagnostics?.lineSegmentsVisible ?? 0);
    viewport.dataset.lineSegmentsTotal = String(state.diagnostics?.lineSegmentsTotal ?? 0);
    viewport.dataset.wallHeight = String(state.diagnostics?.wallHeight ?? 0);
    if (state.diagnostics) {
      viewport.dataset.cameraPosition = state.diagnostics.cameraPosition.join(',');
      viewport.dataset.cameraLookAt = state.diagnostics.cameraLookAt.join(',');
      viewport.dataset.cameraProfile = state.diagnostics.cameraProfile;
      viewport.dataset.cameraElevation = String(state.diagnostics.cameraElevation);
      viewport.dataset.geometries = String(state.diagnostics.geometries);
      viewport.dataset.materials = String(state.diagnostics.materials);
      viewport.dataset.textures = String(state.diagnostics.textures);
    }
    placeholder.hidden = state.sceneReady;
    for (const button of Array.from(app.querySelectorAll<HTMLButtonElement>('[data-stage]'))) {
      const active = button.dataset.stage === state.phase;
      button.setAttribute('aria-current', active ? 'step' : 'false');
    }
  };
  const scrollMetrics = () => ({
    top: journey.getBoundingClientRect().top + window.scrollY,
    distance: Math.max(1, journey.offsetHeight - shell.offsetHeight),
  });
  const progressSmoother = createProgressSmoother(value => runtime?.setProgress(value), {
    now: () => performance.now(),
    requestFrame: callback => requestAnimationFrame(callback),
    cancelFrame: id => cancelAnimationFrame(id),
  });
  let scrollFrame = 0;
  const readScroll = (immediate = false) => {
    if (!runtime || disposed) return;
    const { top, distance } = scrollMetrics();
    const progress = Math.min(1, Math.max(0, (window.scrollY - top) / distance));
    viewport.dataset.scrollDistance = String(distance);
    viewport.dataset.scrollProgress = String(progress);
    viewport.dataset.targetProgress = String(progress);
    // Keep range input attached to real scroll, not to a lagging render value.
    slider.value = String(progress * 100);
    progressSmoother.setTarget(progress, immediate);
  };
  const goTo = (progress: number) => {
    if (!runtime || disposed) return;
    const { top, distance } = scrollMetrics();
    // The browser quantizes scroll positions to device pixels. Read that real
    // position immediately so controls and later scroll events sample one value.
    window.scrollTo({ top: top + progress * distance, behavior: 'instant' });
    readScroll(true);
  };
  const resize = () => {
    if (!runtime || disposed) return;
    const bounds = viewport.getBoundingClientRect();
    runtime.resize(Math.max(1, bounds.width), Math.max(1, bounds.height), window.devicePixelRatio || 1);
    readScroll(true);
  };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateMotion = () => {
    progressSmoother.setReducedMotion(motion.matches || project.accessibility.reducedMotion === 'always');
    shell.dataset.reducedMotion = String(motion.matches);
    element<HTMLElement>('.motion-note').hidden = !motion.matches;
  };
  updateMotion();
  motion.addEventListener('change', () => {
    updateMotion();
    void runtime?.updateProject(project).catch(cause => { error.textContent = String(cause); error.hidden = false; });
  }, { signal });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(scrollFrame);
    progressSmoother.dispose();
    lifecycle.abort();
    resizeObserver?.disconnect();
    unsubscribe?.();
    runtime?.dispose();
  };
  window.addEventListener('pagehide', dispose, { signal });
  try {
    runtime = await mountBlueprint(viewport, project);
    if (disposed) { runtime.dispose(); return dispose; }
    unsubscribe = runtime.subscribe(updateState);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(viewport);
    window.addEventListener('scroll', () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; readScroll(); });
    }, { passive: true, signal });
    window.addEventListener('resize', resize, { passive: true, signal });
    slider.addEventListener('input', () => goTo(Number(slider.value) / 100), { signal });
    for (const button of Array.from(app.querySelectorAll<HTMLButtonElement>('[data-stage]'))) {
      button.addEventListener('click', () => {
        const stage = button.dataset.stage;
        goTo(stage === 'draw' ? project.timeline.drawEnd * 0.5 : stage === 'extrude' ? (project.timeline.drawEnd + project.timeline.extrudeEnd) / 2 : stage === 'reveal' ? 1 : 0);
      }, { signal });
    }
    for (const link of Array.from(app.querySelectorAll<HTMLAnchorElement>('a[href="#"]'))) {
      link.addEventListener('click', event => { event.preventDefault(); goTo(0); }, { signal });
    }
    preset.addEventListener('change', async () => {
      const revision = ++projectRevision;
      try {
        const next = validateBlueprintProject({ ...project, art: { preset: preset.value } });
        await runtime!.updateProject(next);
        if (revision !== projectRevision || disposed) return;
        project = next;
        setTheme(project.art.preset);
        error.hidden = true;
      } catch (cause) {
        if (revision !== projectRevision || disposed) return;
        preset.value = project.art.preset;
        error.textContent = cause instanceof Error ? cause.message : 'No se pudo actualizar el proyecto.';
        error.hidden = false;
      }
    }, { signal });
    resize();
  } catch (cause) {
    placeholder.querySelector('h2')!.textContent = 'La vista no está disponible.';
    placeholder.querySelector('p')!.textContent = 'El playground sigue disponible. Revisa el error antes de volver a intentarlo.';
    error.textContent = cause instanceof Error ? cause.message : 'No se pudo iniciar el runtime.';
    error.hidden = false;
  }
  return dispose;
}
