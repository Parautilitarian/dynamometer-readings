/* Stylised anatomical body (front & back) as inline SVG with muscle regions.
 * ViewBox 260 x 600. Subject's midline is x = 130.
 * Front view: subject's RIGHT appears on the viewer's LEFT.
 * Back view:  subject's RIGHT appears on the viewer's RIGHT.
 *
 * Muscle shapes are drawn on the viewer's left (x < 130) and mirrored
 * with scale(-1,1) so both sides share one path.
 */
window.BODY = (function () {
  'use strict';

  const W = 260;

  const LEFT_HALF = [
    ['M', 130, 10],
    ['C', 112, 10, 97, 25, 97, 46],
    ['C', 97, 63, 108, 77, 118, 80],
    ['L', 118, 93],
    ['C', 102, 96, 88, 99, 78, 105],
    ['C', 66, 111, 59, 123, 58, 138],
    ['L', 46, 210],
    ['L', 38, 298],
    ['C', 33, 316, 33, 336, 38, 352],
    ['C', 43, 362, 55, 360, 58, 350],
    ['L', 58, 298],
    ['L', 70, 210],
    ['C', 76, 172, 80, 152, 82, 136],
    ['C', 86, 166, 90, 200, 92, 232],
    ['C', 88, 256, 84, 276, 84, 296],
    ['C', 82, 340, 86, 385, 90, 425],
    ['C', 92, 465, 94, 505, 98, 545],
    ['C', 95, 560, 92, 574, 100, 578],
    ['L', 124, 578],
    ['L', 122, 545],
    ['C', 124, 505, 124, 465, 122, 425],
    ['C', 126, 385, 130, 340, 130, 300],
  ];

  function mirrorX(x) { return W - x; }

  function buildSilhouettePath() {
    const parts = [];
    for (const seg of LEFT_HALF) {
      parts.push(seg[0] + seg.slice(1).join(' '));
    }
    for (let i = LEFT_HALF.length - 1; i >= 1; i--) {
      const seg = LEFT_HALF[i];
      const prev = LEFT_HALF[i - 1];
      const startX = prev[prev.length - 2], startY = prev[prev.length - 1];
      if (seg[0] === 'L') {
        parts.push('L' + mirrorX(startX) + ' ' + startY);
      } else if (seg[0] === 'C') {
        parts.push('C' + [mirrorX(seg[3]), seg[4], mirrorX(seg[1]), seg[2], mirrorX(startX), startY].join(' '));
      }
    }
    parts.push('Z');
    return parts.join(' ');
  }

  /* Muscle outlines (viewer's left). lx/ly = label anchor. */
  const REGIONS = [
    // ---- Front ----
    { actions: ['shoulder_flex', 'shoulder_abd'], view: 'front', name: 'Deltoid',
      d: 'M 66 100 C 54 108 50 124 54 144 C 60 150 72 146 80 136 C 82 120 78 104 66 100 Z',
      lx: 66, ly: 126 },
    { actions: ['shoulder_ir'], view: 'front', name: 'Pectoral / anterior shoulder',
      d: 'M 86 112 C 98 106 118 108 126 118 L 126 150 C 114 156 96 152 84 140 C 82 128 82 118 86 112 Z',
      lx: 104, ly: 128 },
    { actions: ['elbow_flex'], view: 'front', name: 'Biceps',
      d: 'M 58 148 C 50 162 48 182 50 202 C 56 210 70 208 74 194 C 76 172 70 154 64 146 Z',
      lx: 60, ly: 176 },
    { actions: ['grip'], view: 'front', name: 'Forearm flexors',
      d: 'M 50 212 C 42 236 38 264 40 290 C 48 298 60 292 62 276 C 64 248 58 224 54 210 Z',
      lx: 50, ly: 252 },
    { actions: ['grip'], view: 'front', name: 'Hand',
      d: 'M 38 300 C 32 320 34 346 46 354 C 56 352 62 338 58 318 L 56 300 Z',
      lx: 46, ly: 328 },
    { actions: ['hip_flex'], view: 'front', name: 'Hip flexors',
      d: 'M 96 276 C 88 286 90 308 100 320 C 112 324 124 316 126 302 L 126 278 C 114 272 104 270 96 276 Z',
      lx: 110, ly: 296 },
    { actions: ['knee_ext'], view: 'front', name: 'Quadriceps',
      d: 'M 90 328 C 82 352 84 392 90 418 C 100 428 118 424 122 406 C 124 368 122 340 118 322 C 108 316 96 318 90 328 Z',
      lx: 104, ly: 372 },
    { actions: ['ankle_df'], view: 'front', name: 'Tibialis anterior',
      d: 'M 98 432 C 92 464 96 508 102 540 C 110 546 118 536 118 518 C 116 478 112 448 110 432 C 106 426 102 426 98 432 Z',
      lx: 108, ly: 488 },
    // ---- Back ----
    { actions: ['shoulder_ext'], view: 'back', name: 'Posterior deltoid / lats',
      d: 'M 66 100 C 54 108 50 124 54 144 C 62 152 76 148 84 138 C 86 122 80 104 66 100 Z M 84 138 C 86 168 88 200 90 228 C 98 232 110 220 114 196 C 112 168 102 148 90 136 Z',
      lx: 72, ly: 128 },
    { actions: ['shoulder_er'], view: 'back', name: 'Rotator cuff (infraspinatus)',
      d: 'M 90 118 C 98 112 118 116 124 128 L 124 156 C 112 164 98 160 88 148 C 86 136 86 124 90 118 Z',
      lx: 106, ly: 136 },
    { actions: ['elbow_ext'], view: 'back', name: 'Triceps',
      d: 'M 58 148 C 50 162 48 182 50 202 C 56 210 70 208 74 194 C 76 172 70 154 64 146 Z',
      lx: 60, ly: 176 },
    { actions: ['wrist_ext'], view: 'back', name: 'Wrist extensors',
      d: 'M 50 212 C 42 236 38 264 40 290 C 48 298 60 292 62 276 C 64 248 58 224 54 210 Z',
      lx: 50, ly: 252 },
    { actions: ['hip_abd'], view: 'back', name: 'Gluteus medius',
      d: 'M 86 268 C 80 276 82 294 92 302 C 104 306 116 298 118 286 C 116 272 104 264 94 264 Z',
      lx: 98, ly: 284 },
    { actions: ['hip_er', 'hip_ir'], view: 'back', name: 'Deep hip rotators',
      d: 'M 102 300 C 96 308 98 324 108 330 C 118 332 126 324 126 312 L 124 300 C 116 296 108 296 102 300 Z',
      lx: 114, ly: 316 },
    { actions: ['knee_flex'], view: 'back', name: 'Hamstrings',
      d: 'M 90 332 C 82 356 84 396 90 422 C 100 430 118 426 122 408 C 124 370 122 342 118 326 C 108 320 96 322 90 332 Z',
      lx: 104, ly: 376 },
    { actions: ['ankle_pf'], view: 'back', name: 'Calf (gastrocnemius / soleus)',
      d: 'M 96 430 C 88 456 90 500 98 536 C 108 544 120 534 120 514 C 118 476 114 448 110 430 C 106 424 100 424 96 430 Z',
      lx: 106, ly: 484 },
  ];

  const SIL_PATH = buildSilhouettePath();

  const GUIDE_FRONT = `
    <path class="guide" d="M130 118 L130 292"/>
    <path class="guide" d="M118 112 C 122 128 126 132 130 132 C 134 132 138 128 142 112"/>
  `;
  const GUIDE_BACK = `
    <path class="guide" d="M130 96 L130 268"/>
    <path class="guide" d="M118 112 C 124 120 126 128 130 128 C 134 128 136 120 142 112"/>
  `;

  function render(view) {
    const regions = REGIONS.filter(r => r.view === view);
    const leftIsSubject = view === 'front' ? 'R' : 'L';
    const rightIsSubject = view === 'front' ? 'L' : 'R';

    let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 600" role="img" aria-label="${view} view of body">`;
    out += `<path class="silhouette" d="${SIL_PATH}"/>`;
    out += view === 'front' ? GUIDE_FRONT : GUIDE_BACK;

    for (const r of regions) {
      const acts = r.actions.join(',');
      const base = `class="region none" data-actions="${acts}" data-name="${r.name}"`;
      out += `<g ${base} data-side="${leftIsSubject}"><path d="${r.d}"/></g>`;
      out += `<g ${base} data-side="${rightIsSubject}" transform="translate(${W} 0) scale(-1 1)"><path d="${r.d}"/></g>`;
      out += `<text class="m-label" data-actions="${acts}" data-side="${leftIsSubject}" x="${r.lx}" y="${r.ly}"></text>`;
      out += `<text class="m-label" data-actions="${acts}" data-side="${rightIsSubject}" x="${mirrorX(r.lx)}" y="${r.ly}"></text>`;
    }

    out += `<text class="side-label" x="36" y="596">${leftIsSubject}</text>`;
    out += `<text class="side-label" x="${W - 42}" y="596">${rightIsSubject}</text>`;
    out += '</svg>';
    return out;
  }

  return { render, REGIONS };
})();
