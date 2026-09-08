/* =============================================================================
   bodymap.js — muscle-load heat map
   -----------------------------------------------------------------------------
   The signature element of the product: an anatomical front/back figure whose
   muscle groups warm from grey to ember in proportion to the work you logged.

   Accessibility contract (this is a chart, so it needs a text equivalent —
   WCAG 2.2 SC 1.1.1):
   • <svg role="img"> with an <title> naming the view.
   • Each muscle carries its own <title> with the localised name and load band,
     so pointer and screen-reader users can inspect individual groups.
   • renderLoadSummary() emits a plain-language sentence used both as the
     visually-hidden description and, when data is thin, as visible copy.
   Geometry is authored once in a 200x420 user-space viewBox and scales fluidly.
   ========================================================================== */

import { MUSCLES, loc } from './data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX = '0 0 200 420';

/* Silhouette: non-muscle scaffolding drawn underneath (head, joints, hands,
   feet, pelvis). Kept deliberately plain so the heat is the only signal. */
const SILHOUETTE = [
  ['ellipse', { cx: 100, cy: 30, rx: 19, ry: 23 }],          // head
  ['rect', { x: 90, y: 48, width: 20, height: 18, rx: 7 }],  // neck
  ['rect', { x: 71, y: 74, width: 58, height: 116, rx: 20 }],// torso block
  ['rect', { x: 74, y: 180, width: 52, height: 40, rx: 16 }],// pelvis
  ['rect', { x: 46, y: 96, width: 18, height: 96, rx: 9 }],  // left arm
  ['rect', { x: 136, y: 96, width: 18, height: 96, rx: 9 }], // right arm
  ['ellipse', { cx: 55, cy: 202, rx: 9, ry: 13 }],           // left hand
  ['ellipse', { cx: 145, cy: 202, rx: 9, ry: 13 }],          // right hand
  ['rect', { x: 70, y: 208, width: 28, height: 180, rx: 14 }],// left leg
  ['rect', { x: 102, y: 208, width: 28, height: 180, rx: 14 }],// right leg
  ['ellipse', { cx: 84, cy: 398, rx: 10, ry: 13 }],          // left foot
  ['ellipse', { cx: 116, cy: 398, rx: 10, ry: 13 }],         // right foot
];

const FRONT = [
  ['traps', 'path', { d: 'M80,62 L100,55 L100,73 L84,78 Z' }],
  ['traps', 'path', { d: 'M120,62 L100,55 L100,73 L116,78 Z' }],
  ['shoulders', 'ellipse', { cx: 63, cy: 90, rx: 15, ry: 18 }],
  ['shoulders', 'ellipse', { cx: 137, cy: 90, rx: 15, ry: 18 }],
  ['chest', 'rect', { x: 77, y: 80, width: 21, height: 30, rx: 9 }],
  ['chest', 'rect', { x: 102, y: 80, width: 21, height: 30, rx: 9 }],
  ['biceps', 'ellipse', { cx: 55, cy: 126, rx: 11, ry: 21 }],
  ['biceps', 'ellipse', { cx: 145, cy: 126, rx: 11, ry: 21 }],
  ['forearms', 'ellipse', { cx: 55, cy: 172, rx: 10, ry: 24 }],
  ['forearms', 'ellipse', { cx: 145, cy: 172, rx: 10, ry: 24 }],
  ['abs', 'rect', { x: 83, y: 116, width: 16, height: 18, rx: 5 }],
  ['abs', 'rect', { x: 101, y: 116, width: 16, height: 18, rx: 5 }],
  ['abs', 'rect', { x: 83, y: 137, width: 16, height: 18, rx: 5 }],
  ['abs', 'rect', { x: 101, y: 137, width: 16, height: 18, rx: 5 }],
  ['abs', 'rect', { x: 83, y: 158, width: 16, height: 18, rx: 5 }],
  ['abs', 'rect', { x: 101, y: 158, width: 16, height: 18, rx: 5 }],
  ['obliques', 'path', { d: 'M78,118 q-5,28 3,54 l7,-5 q-6,-24 -3,-47 Z' }],
  ['obliques', 'path', { d: 'M122,118 q5,28 -3,54 l-7,-5 q6,-24 3,-47 Z' }],
  ['quads', 'ellipse', { cx: 84, cy: 254, rx: 15, ry: 44 }],
  ['quads', 'ellipse', { cx: 116, cy: 254, rx: 15, ry: 44 }],
  ['calves', 'ellipse', { cx: 84, cy: 344, rx: 11, ry: 28 }],
  ['calves', 'ellipse', { cx: 116, cy: 344, rx: 11, ry: 28 }],
];

const BACK = [
  ['traps', 'path', { d: 'M82,60 L100,53 L118,60 L112,98 L100,106 L88,98 Z' }],
  ['shoulders', 'ellipse', { cx: 63, cy: 90, rx: 15, ry: 18 }],
  ['shoulders', 'ellipse', { cx: 137, cy: 90, rx: 15, ry: 18 }],
  ['lats', 'path', { d: 'M76,96 C70,122 72,150 86,170 L97,148 L97,100 Z' }],
  ['lats', 'path', { d: 'M124,96 C130,122 128,150 114,170 L103,148 L103,100 Z' }],
  ['triceps', 'ellipse', { cx: 55, cy: 126, rx: 11, ry: 21 }],
  ['triceps', 'ellipse', { cx: 145, cy: 126, rx: 11, ry: 21 }],
  ['forearms', 'ellipse', { cx: 55, cy: 172, rx: 10, ry: 24 }],
  ['forearms', 'ellipse', { cx: 145, cy: 172, rx: 10, ry: 24 }],
  ['lowerback', 'path', { d: 'M86,158 L114,158 L110,188 L90,188 Z' }],
  ['glutes', 'ellipse', { cx: 87, cy: 205, rx: 15, ry: 18 }],
  ['glutes', 'ellipse', { cx: 113, cy: 205, rx: 15, ry: 18 }],
  ['hamstrings', 'ellipse', { cx: 84, cy: 262, rx: 15, ry: 40 }],
  ['hamstrings', 'ellipse', { cx: 116, cy: 262, rx: 15, ry: 40 }],
  ['calves', 'ellipse', { cx: 84, cy: 344, rx: 11, ry: 28 }],
  ['calves', 'ellipse', { cx: 116, cy: 344, rx: 11, ry: 28 }],
];

/** 0..1 load -> one of five discrete heat bands. Bands, not a continuous
    gradient, because discrete steps are far easier to read at phone size. */
export function heatStep(v) {
  if (!v) return 0;
  if (v <= 0.25) return 1;
  if (v <= 0.5) return 2;
  if (v <= 0.75) return 3;
  return 4;
}

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

function buildFigure(shapes, load, lang, viewLabel) {
  const svg = el('svg', { viewBox: VIEWBOX, xmlns: SVG_NS, role: 'img', 'aria-label': viewLabel });

  const base = el('g', { 'aria-hidden': 'true' });
  SILHOUETTE.forEach(([tag, attrs]) => {
    const s = el(tag, attrs);
    s.style.fill = 'var(--bg-elev-2)';
    s.style.stroke = 'var(--line)';
    s.style.strokeWidth = '1';
    base.appendChild(s);
  });
  svg.appendChild(base);

  const muscles = el('g', {});
  shapes.forEach(([muscle, tag, attrs]) => {
    const shape = el(tag, attrs);
    const value = load[muscle] || 0;
    shape.setAttribute('class', 'muscle');
    shape.dataset.muscle = muscle;
    shape.style.fill = `var(--heat-${heatStep(value)})`;
    const title = el('title', {});
    title.textContent = `${loc(MUSCLES[muscle], lang)} — ${Math.round(value * 100)}%`;
    shape.appendChild(title);
    muscles.appendChild(shape);
  });
  svg.appendChild(muscles);
  return svg;
}

/**
 * Render both views into a container.
 * @param {HTMLElement} host
 * @param {Record<string, number>} load  muscle id -> 0..1
 * @param {string} lang
 * @param {{front:string, back:string}} labels
 */
export function renderBodyMap(host, load, lang, labels) {
  host.textContent = '';
  const front = document.createElement('figure');
  front.style.margin = '0';
  front.appendChild(buildFigure(FRONT, load, lang, labels.front));
  const back = document.createElement('figure');
  back.style.margin = '0';
  back.appendChild(buildFigure(BACK, load, lang, labels.back));
  host.append(front, back);
}

/** Plain-language equivalent of the chart, for assistive technology. */
export function renderLoadSummary(load, lang, emptyText) {
  const ranked = Object.entries(load).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!ranked.length) return emptyText;
  return ranked.map(([m, v]) => `${loc(MUSCLES[m], lang)} ${Math.round(v * 100)}%`).join(' · ');
}
