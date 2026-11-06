/* Main application: inputs -> normative comparison -> body map + table */
(function () {
  'use strict';

  const { ACTIONS, B97, A96, NL14, M17, D14 } = window.NORMS;
  const G = 9.80665;             // N per kgf
  const LB_TO_N = 4.4482216;
  const STORAGE_KEY = 'hhd-norms-v1';

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const state = {
    sex: 'M', age: null, weight: null, weightUnit: 'kg', dominant: 'R', forceUnit: 'N',
    readings: {},          // actionId -> { L: number|null, R: number|null }
  };

  const $ = (sel) => document.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Maths helpers
  // ------------------------------------------------------------------
  function normCdf(z) {
    // Abramowitz & Stegun 7.1.26 approximation of erf
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const x = Math.abs(z) / Math.SQRT2;
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    const p = 0.5 * (1 + y);
    return z >= 0 ? p : 1 - p;
  }
  function fmt(n, d = 1) { return (n === null || n === undefined || isNaN(n)) ? '–' : Number(n).toFixed(d); }
  function toNewtons(value, unit) {
    if (unit === 'kg') return value * G;
    if (unit === 'lb') return value * LB_TO_N;
    return value;
  }
  function bodyWeightN() {
    if (!state.weight) return null;
    return state.weightUnit === 'lb' ? state.weight * LB_TO_N : state.weight * G;
  }
  function decadeFor(age) {
    if (age < 20) return null;
    const a = Math.min(age, 79);
    const lo = Math.floor(a / 10) * 10;
    return `${lo}-${lo + 9}`;
  }
  function rating(z) {
    if (z === null || z === undefined || isNaN(z)) return 'none';
    if (z >= 1) return 'strong';
    if (z >= -1) return 'typical';
    if (z >= -2) return 'below';
    return 'weak';
  }
  const RATING_LABEL = { strong: 'Strong', typical: 'Typical', below: 'Below average', weak: 'Weak', none: 'No reference' };
  const PRED_SRC = { B97: 'Bohannon 1997', A96: 'Andrews 1996', NL14: 'Douma 2014' };

  // ------------------------------------------------------------------
  // Reference lookup
  // ------------------------------------------------------------------
  /** Linear interpolation of Dodds grip row at exact age */
  function dodds(sex, age) {
    const tbl = D14[sex];
    const ages = Object.keys(tbl).map(Number).sort((a, b) => a - b);
    const a = Math.max(ages[0], Math.min(ages[ages.length - 1], age));
    let lo = ages[0], hi = ages[ages.length - 1];
    for (let i = 0; i < ages.length - 1; i++) {
      if (a >= ages[i] && a <= ages[i + 1]) { lo = ages[i]; hi = ages[i + 1]; break; }
    }
    const f = hi === lo ? 0 : (a - lo) / (hi - lo);
    const row = tbl[lo].map((v, i) => v + f * (tbl[hi][i] - v));
    return { mean: row[5], sd: row[6], centiles: row.slice(0, 5), extrapolated: age < ages[0] || age > ages[ages.length - 1] };
  }

  /**
   * Pick the best available reference for an action.
   * sideKey: 'D' (dominant) or 'N' (non-dominant)
   * Returns { source, citation, unit: 'pct'|'N'|'kg', mean, sd, extrapolated, note, label }
   */
  function pickReference(actionId, sex, age, sideKey) {
    if (age === null || isNaN(age)) return null;
    const idx = sideKey === 'D' ? 2 : 0;

    // 1) Bohannon 1997 (% BW, 20-79)
    if (B97[sex][actionId] && age >= 20) {
      const dec = decadeFor(age);
      const row = B97[sex][actionId][dec];
      if (row) {
        return { source: 'B97', citation: B97.citation, unit: 'pct', mean: row[idx], sd: row[idx + 1],
          extrapolated: age > 79, note: (B97.notes[actionId] || ''), label: `Bohannon 1997 · ${sex === 'M' ? 'men' : 'women'} ${dec}${age > 79 ? ' (extrapolated)' : ''} · ${sideKey === 'D' ? 'dominant' : 'non-dominant'}` };
      }
    }
    // 2) Andrews 1996 (% BW, 50-79)
    if (A96[sex][actionId] && age >= 50) {
      const dec = decadeFor(age);
      const row = A96[sex][actionId][dec];
      if (row) {
        return { source: 'A96', citation: A96.citation, unit: 'pct', mean: row[idx], sd: row[idx + 1],
          extrapolated: age > 79, note: (A96.notes[actionId] || ''), label: `Andrews 1996 · ${sex === 'M' ? 'men' : 'women'} ${dec}${age > 79 ? ' (extrapolated)' : ''} · ${sideKey === 'D' ? 'dominant' : 'non-dominant'}` };
      }
    }
    // 3) Douma 2014 (% BW, 20-59) — fills knee flexion under age 50
    if (NL14[sex][actionId] && age >= 20 && age < 50) {
      const dec = decadeFor(age);
      const row = NL14[sex][actionId][dec];
      if (row) {
        return { source: 'NL14', citation: NL14.citation, unit: 'pct', mean: row[idx], sd: row[idx + 1],
          extrapolated: false, note: [NL14.notes[actionId], NL14.notes._all].filter(Boolean).join(' '),
          label: `Douma 2014 · ${sex === 'M' ? 'men' : 'women'} ${dec} · ${sideKey === 'D' ? 'dominant' : 'non-dominant'}` };
      }
    }
    // 4) Dodds 2014 grip (kg, 5-90)
    if (actionId === 'grip' && age >= 5) {
      const d = dodds(sex, age);
      return { source: 'D14', citation: D14.citation, unit: 'kg', mean: d.mean, sd: d.sd, centiles: d.centiles,
        extrapolated: d.extrapolated, note: D14.notes._all, label: `Dodds 2014 · ${sex === 'M' ? 'men' : 'women'} age ${Math.min(age, 90)}${d.extrapolated ? ' (extrapolated)' : ''}` };
    }
    // 5) 1000 Norms Project (absolute N, 3-101)
    if (M17[sex][actionId] && age >= 3) {
      const band = M17.bands.find(b => age >= b.min && age <= b.max);
      if (band) {
        const row = M17[sex][actionId][band.key];
        return { source: 'M17', citation: M17.citation, unit: 'N', mean: row[0], sd: row[1], extrapolated: false,
          note: [M17.notes[actionId], M17.notes._all].filter(Boolean).join(' '), label: `1000 Norms 2017 · ${sex === 'M' ? 'males' : 'females'} ${band.key} y · dominant limb` };
      }
    }
    return null;
  }

  /** Regression-predicted force (N) for sex/age/weight if available. */
  function predictedForce(actionId, sex, age, weightN, sideKey, side) {
    if (age === null || !weightN) return null;
    if (B97.regression[actionId] && age >= 20 && age <= 79) {
      const S = sex === 'F' ? 1 : 0;
      const c = B97.regression[actionId][sideKey];
      const val = c[0] + c[1] * S + c[2] * age + c[3] * weightN;
      return { value: val, source: 'B97', uncertain: B97.regression[actionId].uncertain === sideKey };
    }
    if (A96.regression[actionId] && age >= 50 && age <= 79) {
      const S = sex === 'F' ? 1 : 0;
      const c = A96.regression[actionId][sideKey];
      const val = c[0] + c[1] * S + c[2] * age + c[3] * weightN;
      return { value: val, source: 'A96' };
    }
    if (NL14.regression[actionId] && age >= 20 && age < 50) {
      const eq = NL14.regression[actionId];
      const c = eq[side];
      const S = sex === 'M' ? 1 : 0;
      const Wkg = weightN / G;
      const H = sex === 'M' ? eq.heightM : eq.heightF;
      const val = c[0] + c[1] * S + c[2] * age + c[3] * Wkg + c[4] * H;
      return { value: val, source: 'NL14', heightAssumed: H };
    }
    return null;
  }

  // ------------------------------------------------------------------
  // Evaluate all readings
  // ------------------------------------------------------------------
  function evaluate() {
    const results = [];   // one per action-side with a reading
    const bwN = bodyWeightN();
    for (const a of ACTIONS) {
      const r = state.readings[a.id] || {};
      for (const side of ['L', 'R']) {
        const raw = r[side];
        if (raw === null || raw === undefined || raw === '' || isNaN(raw)) continue;
        const forceN = toNewtons(Number(raw), state.forceUnit);
        const pct = bwN ? forceN / bwN * 100 : null;
        const sideKey = side === state.dominant ? 'D' : 'N';
        const ref = pickReference(a.id, state.sex, state.age, sideKey);
        let z = null, pctile = null, compared = null;
        if (ref) {
          if (ref.unit === 'pct') compared = pct;
          else if (ref.unit === 'kg') compared = forceN / G;
          else compared = forceN;
          if (compared !== null) {
            z = (compared - ref.mean) / ref.sd;
            pctile = normCdf(z) * 100;
          }
        }
        const pred = predictedForce(a.id, state.sex, state.age, bwN, sideKey, side);
        results.push({
          action: a, side, sideKey, forceN, pct, ref, compared, z, pctile, rating: rating(z),
          predicted: pred, pctPredicted: pred ? forceN / pred.value * 100 : null,
        });
      }
    }
    return results;
  }

  // ------------------------------------------------------------------
  // Rendering: reading inputs
  // ------------------------------------------------------------------
  function renderInputs() {
    const host = byId('readingGroups');
    host.innerHTML = '';
    for (const region of [['upper', 'Upper limb'], ['lower', 'Lower limb']]) {
      const [key, title] = region;
      const g = document.createElement('div');
      g.className = 'group';
      g.innerHTML = `<h3>${title}</h3>
        <table class="rtable"><thead><tr><th>Action</th><th></th><th>Left</th><th></th><th>Right</th></tr></thead><tbody></tbody></table>`;
      const tb = g.querySelector('tbody');
      for (const a of ACTIONS.filter(x => x.region === key)) {
        const tr = document.createElement('tr');
        tr.dataset.action = a.id;
        tr.innerHTML = `
          <td class="name">${a.label}<span class="info" title="${a.muscles}\n\n${a.protocol}">i</span><small>${a.muscles}</small></td>
          <td class="pill-cell"><span class="pill" data-pill="${a.id}-L"></span></td>
          <td><input type="number" min="0" step="0.1" inputmode="decimal" data-action="${a.id}" data-side="L" aria-label="${a.label} left"></td>
          <td class="pill-cell"><span class="pill" data-pill="${a.id}-R"></span></td>
          <td><input type="number" min="0" step="0.1" inputmode="decimal" data-action="${a.id}" data-side="R" aria-label="${a.label} right"></td>`;
        tb.appendChild(tr);
      }
      host.appendChild(g);
    }
    host.addEventListener('input', (e) => {
      const el = e.target;
      if (!el.matches('input[data-action]')) return;
      const id = el.dataset.action, side = el.dataset.side;
      state.readings[id] = state.readings[id] || { L: null, R: null };
      state.readings[id][side] = el.value === '' ? null : Number(el.value);
      update();
    });
  }

  function syncInputsFromState() {
    byId('sex').value = state.sex;
    byId('age').value = state.age ?? '';
    byId('weight').value = state.weight ?? '';
    byId('weightUnit').value = state.weightUnit;
    byId('dominant').value = state.dominant;
    byId('forceUnit').value = state.forceUnit;
    document.querySelectorAll('input[data-action]').forEach(el => {
      const v = state.readings[el.dataset.action]?.[el.dataset.side];
      el.value = (v === null || v === undefined) ? '' : v;
    });
  }

  // ------------------------------------------------------------------
  // Rendering: body map
  // ------------------------------------------------------------------
  const RANK = { none: -1, strong: 0, typical: 1, below: 2, weak: 3 };

  function renderBody(results) {
    const bySide = {};   // `${actionId}-${side}` -> result
    for (const r of results) bySide[`${r.action.id}-${r.side}`] = r;

    document.querySelectorAll('.region').forEach(g => {
      const actions = g.dataset.actions.split(',');
      const side = g.dataset.side;
      let worst = 'none';
      for (const id of actions) {
        const r = bySide[`${id}-${side}`];
        if (r && RANK[r.rating] > RANK[worst]) worst = r.rating;
      }
      g.setAttribute('class', `region ${worst}`);
    });

    document.querySelectorAll('.m-label').forEach(t => {
      const actions = t.dataset.actions.split(',');
      const side = t.dataset.side;
      const sideKey = side === state.dominant ? 'D' : 'N';
      let text = '';
      let muted = true;
      for (const id of actions) {
        const r = bySide[`${id}-${side}`];
        if (r && r.pctile !== null) {
          text = Math.round(r.pctile) + '';
          muted = false;
          break;
        }
      }
      if (!text && state.age !== null) {
        for (const id of actions) {
          const ref = pickReference(id, state.sex, state.age, sideKey);
          if (ref && ref.unit === 'pct') { text = Math.round(ref.mean) + '%'; break; }
          if (ref && ref.unit === 'kg') { text = fmt(ref.mean, 0) + 'kg'; break; }
          if (ref && ref.unit === 'N') { text = fmt(ref.mean, 0) + 'N'; break; }
        }
      }
      t.textContent = text;
      t.classList.toggle('muted', muted);
    });

    document.querySelectorAll('.pill[data-pill]').forEach(p => {
      const r = bySide[p.dataset.pill];
      p.className = 'pill' + (r ? ' ' + r.rating : '');
      p.title = r ? `${RATING_LABEL[r.rating]}${r.z !== null ? ` (z ${fmt(r.z, 2)}, ${fmt(r.pctile, 0)}th pct)` : ''}` : '';
    });
  }

  function unitLabel(unit) {
    if (unit === 'pct') return '% BW';
    if (unit === 'kg') return 'kg';
    return 'N';
  }

  function renderExpected() {
    const host = byId('expectedGrid');
    if (!host) return;
    if (state.age === null || isNaN(state.age)) {
      host.innerHTML = '<p class="hint">Enter age (and weight, for % body-weight norms) to see typical values.</p>';
      return;
    }
    const cards = [];
    for (const a of ACTIONS) {
      const refD = pickReference(a.id, state.sex, state.age, 'D');
      const refN = pickReference(a.id, state.sex, state.age, 'N');
      if (!refD && !refN) continue;
      const ref = refD || refN;
      const same = refD && refN && refD.mean === refN.mean && refD.sd === refN.sd;
      let val;
      if (same || !refN || !refD) {
        val = `${fmt(ref.mean, 1)} ± ${fmt(ref.sd, 1)} ${unitLabel(ref.unit)}`;
      } else {
        val = `Dom ${fmt(refD.mean, 1)} ± ${fmt(refD.sd, 1)} · non-dom ${fmt(refN.mean, 1)} ± ${fmt(refN.sd, 1)} ${unitLabel(ref.unit)}`;
      }
      const bwN = bodyWeightN();
      let abs = '';
      if (ref.unit === 'pct' && bwN) {
        abs = ` · ≈ ${fmt(ref.mean / 100 * bwN, 0)} N at your weight`;
      }
      cards.push(`<div class="exp-card"><b>${a.label}</b><div class="exp-val">${val}${abs}</div><div class="exp-meta">${ref.label}</div></div>`);
    }
    host.innerHTML = cards.length ? cards.join('') : '<p class="hint">No published HHD reference for this age.</p>';
  }

  function setupBodyInteractions() {
    const tip = byId('tooltip');
    const show = (g, x, y) => {
      const actions = g.dataset.actions.split(',');
      const side = g.dataset.side;
      const results = evaluate();
      const rows = actions.map(id => {
        const a = ACTIONS.find(x => x.id === id);
        const r = results.find(x => x.action.id === id && x.side === side);
        if (!r) return `<div class="tt-row"><span>${a.label}</span><span>—</span></div>`;
        const txt = r.z === null ? `${fmt(r.pct, 0)}% BW · no ref` : `${fmt(r.pct, 0)}% BW · ${fmt(r.pctile, 0)}th pct · ${RATING_LABEL[r.rating]}`;
        return `<div class="tt-row"><span>${a.label}</span><span>${txt}</span></div>`;
      }).join('');
      tip.innerHTML = `<b>${g.dataset.name}</b> — ${side === 'L' ? 'left' : 'right'}${rows}`;
      tip.hidden = false;
      const pad = 14;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      let left = x + pad, top = y + pad;
      if (left + w > window.innerWidth - 8) left = x - w - pad;
      if (top + h > window.innerHeight - 8) top = y - h - pad;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    };
    for (const host of [byId('bodyFront'), byId('bodyBack')]) {
      host.addEventListener('mousemove', (e) => {
        const g = e.target.closest('.region');
        if (g) show(g, e.clientX, e.clientY); else tip.hidden = true;
      });
      host.addEventListener('mouseleave', () => { tip.hidden = true; });
      host.addEventListener('click', (e) => {
        const g = e.target.closest('.region');
        if (!g) return;
        const first = g.dataset.actions.split(',')[0];
        const input = document.querySelector(`input[data-action="${first}"][data-side="${g.dataset.side}"]`);
        if (input) { input.focus(); input.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      });
    }
  }

  // ------------------------------------------------------------------
  // Rendering: results table + banner
  // ------------------------------------------------------------------
  function renderTable(results) {
    const tb = $('#resultsTable tbody');
    tb.innerHTML = '';
    byId('noResults').hidden = results.length > 0;
    for (const r of results) {
      const tr = document.createElement('tr');
      const refTxt = r.ref
        ? `${fmt(r.ref.mean, 1)} ± ${fmt(r.ref.sd, 1)} ${r.ref.unit === 'pct' ? '% BW' : r.ref.unit}`
        : '<span class="flag">none for this age</span>';
      const srcTxt = r.ref ? `<span title="${(r.ref.citation + (r.ref.note ? '\n' + r.ref.note : '')).replace(/"/g, '&quot;')}">${r.ref.label}${r.ref.note ? ' ⚠' : ''}</span>` : '–';
      const predTxt = r.predicted
        ? `${fmt(r.pctPredicted, 0)}% <span class="flag" title="Predicted ${fmt(r.predicted.value, 0)} N from the ${PRED_SRC[r.predicted.source] || r.predicted.source} regression${r.predicted.uncertain ? ' (coefficient misprinted in source; approximate)' : ''}${r.predicted.heightAssumed ? ` (height assumed ${fmt(r.predicted.heightAssumed, 0)} cm)` : ''}">(${fmt(r.predicted.value, 0)} N${r.predicted.uncertain ? '*' : ''})</span>`
        : '–';
      const readingTxt = state.forceUnit === 'N' ? `${fmt(r.forceN, 0)} N` : `${fmt(r.forceN, 0)} N <span class="flag">(${fmt(state.forceUnit === 'kg' ? r.forceN / G : r.forceN / LB_TO_N, 1)} ${state.forceUnit})</span>`;
      tr.innerHTML = `
        <td>${r.action.label}</td>
        <td>${r.side === 'L' ? 'Left' : 'Right'} <span class="flag">${r.sideKey === 'D' ? 'dom' : 'non-dom'}</span></td>
        <td class="num">${readingTxt}</td>
        <td class="num">${fmt(r.pct, 1)}</td>
        <td class="num">${refTxt}</td>
        <td class="num">${fmt(r.z, 2)}</td>
        <td class="num">${r.pctile === null ? '–' : ordinal(Math.round(r.pctile))}</td>
        <td><span class="rating ${r.rating}">${RATING_LABEL[r.rating]}</span></td>
        <td class="num">${predTxt}</td>
        <td>${srcTxt}</td>`;
      tb.appendChild(tr);
    }
  }
  function ordinal(n) {
    n = Math.max(1, Math.min(99, n));
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function renderBanner() {
    const b = byId('statusBanner');
    const msgs = [];
    if (state.age === null || isNaN(state.age)) msgs.push('Enter your age to select reference values.');
    if (!state.weight) msgs.push('Enter your body weight to normalise readings (% body weight).');
    if (state.age !== null && state.age >= 80) msgs.push('Age 80+: body-weight-normalised norms stop at 79; the 70–79 decade is used and marked extrapolated.');
    if (state.age !== null && state.age < 20 && state.age >= 3) msgs.push('Under 20: only the 1000 Norms Project (absolute force) covers this age; results are not weight-normalised.');
    b.hidden = msgs.length === 0;
    b.textContent = msgs.join(' ');
  }

  // ------------------------------------------------------------------
  // Protocol table in Methods
  // ------------------------------------------------------------------
  function renderProtocol() {
    const tb = $('#protocolTable tbody');
    tb.innerHTML = ACTIONS.map(a => `<tr><td>${a.label}</td><td>${a.muscles}</td><td>${a.protocol}</td></tr>`).join('');
  }

  // ------------------------------------------------------------------
  // Persistence
  // ------------------------------------------------------------------
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (s && typeof s === 'object') Object.assign(state, s);
    } catch (_) { /* ignore */ }
  }

  // ------------------------------------------------------------------
  // Update cycle
  // ------------------------------------------------------------------
  function update() {
    const results = evaluate();
    renderBanner();
    renderBody(results);
    renderExpected();
    renderTable(results);
    save();
  }

  function bindAbout() {
    byId('sex').addEventListener('change', e => { state.sex = e.target.value; update(); });
    byId('age').addEventListener('input', e => { state.age = e.target.value === '' ? null : Number(e.target.value); update(); });
    byId('weight').addEventListener('input', e => { state.weight = e.target.value === '' ? null : Number(e.target.value); update(); });
    byId('weightUnit').addEventListener('change', e => { state.weightUnit = e.target.value; update(); });
    byId('dominant').addEventListener('change', e => { state.dominant = e.target.value; update(); });
    byId('forceUnit').addEventListener('change', e => { state.forceUnit = e.target.value; update(); });

    byId('btnClear').addEventListener('click', () => {
      state.readings = {}; state.age = null; state.weight = null;
      syncInputsFromState(); update();
    });
    byId('btnExample').addEventListener('click', () => {
      Object.assign(state, { sex: 'M', age: 45, weight: 80, weightUnit: 'kg', dominant: 'R', forceUnit: 'N' });
      // Example: a 45-year-old man, 80 kg (785 N). Mostly typical, weak left knee extension, strong grip.
      state.readings = {
        grip: { L: 440, R: 480 },
        wrist_ext: { L: 160, R: 175 },
        elbow_flex: { L: 250, R: 265 },
        elbow_ext: { L: 190, R: 200 },
        shoulder_flex: { L: null, R: null },
        shoulder_ext: { L: 360, R: 380 },
        shoulder_abd: { L: 215, R: 230 },
        shoulder_er: { L: 150, R: 165 },
        shoulder_ir: { L: 170, R: 185 },
        hip_flex: { L: 170, R: 180 },
        hip_abd: { L: 290, R: 300 },
        hip_er: { L: 150, R: 160 },
        hip_ir: { L: 190, R: 200 },
        knee_ext: { L: 360, R: 540 },
        knee_flex: { L: 200, R: 270 },
        ankle_df: { L: 330, R: 345 },
        ankle_pf: { L: 300, R: 320 },
      };
      syncInputsFromState(); update();
    });
  }

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  function init() {
    byId('bodyFront').innerHTML = window.BODY.render('front');
    byId('bodyBack').innerHTML = window.BODY.render('back');
    renderInputs();
    renderProtocol();
    load();
    syncInputsFromState();
    bindAbout();
    setupBodyInteractions();
    update();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
