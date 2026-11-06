/* =====================================================================
 * Normative reference data for hand-held dynamometry (HHD)
 * =====================================================================
 * All values transcribed from the published tables of the cited papers.
 *
 * Sources
 *  B97  Bohannon RW. Reference values for extremity muscle strength obtained by
 *       hand-held dynamometry from adults aged 20 to 79 years.
 *       Arch Phys Med Rehabil 1997;78:26-32.  (n=231; Ametek Accuforce II; make test)
 *       Tables 7 & 8: mean (SD) force as % body weight by sex, decade, side.
 *       Table 6: regression equations (Newtons) on sex, age, weight (N).
 *
 *  A96  Andrews AW, Thomas MW, Bohannon RW. Normative values for isometric muscle
 *       force measurements obtained with hand-held dynamometers.
 *       Phys Ther 1996;76:248-259.  (n=156, ages 50-79; Chatillon CSD400C; make test)
 *       Table 6: mean (SD) force as % body weight by sex, decade, side.
 *       Table 5: regression equations (Newtons) on sex, weight (N), age.
 *
 *  M17  McKay MJ, Baldwin JN, Ferreira P, et al. Normative reference values for
 *       strength and flexibility of 1,000 children and adults.
 *       Neurology 2017;88:36-43.  (1000 Norms Project, ages 3-101; Citec CT 3001)
 *       Table 1: mean (SD) force in Newtons (NOT body-weight normalised) by sex and
 *       age band (3-9, 10-19, 20-59, 60+). Dominant limb only.
 *
 *  D14  Dodds RM, Syddall HE, Cooper R, et al. Grip strength across the life course:
 *       normative data from twelve British studies. PLoS ONE 2014;9:e113637.
 *       Table 2: centiles and mean (SD) grip strength (kg), ages 5-90, by sex.
 *
 * Units: pct = % of body weight (force N / body weight N * 100)
 *        N   = Newtons
 *        kg  = kilograms-force (grip)
 * Side keys: N = non-dominant, D = dominant
 * ===================================================================== */

window.NORMS = (function () {
  'use strict';

  // ---------------------------------------------------------------
  // Muscle actions that can be measured with a hand-held dynamometer
  // ---------------------------------------------------------------
  const ACTIONS = [
    // ---------- Upper limb ----------
    { id: 'grip', label: 'Hand grip', region: 'upper', muscles: 'Finger/wrist flexors (forearm)',
      protocol: 'Seated, shoulder adducted, elbow 90°, forearm neutral. Jamar-style grip dynamometer, handle position 2. Squeeze maximally ~3 s.' },
    { id: 'wrist_ext', label: 'Wrist extension', region: 'upper', muscles: 'Wrist extensors (ECRL/ECRB/ECU)',
      protocol: 'Elbow 90°, wrist neutral, fingers relaxed. Dynamometer just proximal to metacarpophalangeal joints (dorsum). Stabilise distal forearm.' },
    { id: 'elbow_flex', label: 'Elbow flexion', region: 'upper', muscles: 'Biceps brachii, brachialis',
      protocol: 'Shoulder neutral, elbow 90°, forearm supinated. Dynamometer just proximal to wrist (volar). Stabilise shoulder/arm.' },
    { id: 'elbow_ext', label: 'Elbow extension', region: 'upper', muscles: 'Triceps brachii',
      protocol: 'Shoulder neutral, elbow 90°, forearm neutral. Dynamometer just proximal to wrist (dorsal). Stabilise anterior shoulder/arm.' },
    { id: 'shoulder_flex', label: 'Shoulder flexion', region: 'upper', muscles: 'Anterior deltoid, pec major (clavicular)',
      protocol: 'Supine, shoulder flexed 90°, elbow extended. Dynamometer just proximal to humeral epicondyles. Stabilise axilla.' },
    { id: 'shoulder_ext', label: 'Shoulder extension', region: 'upper', muscles: 'Posterior deltoid, latissimus dorsi, teres major',
      protocol: 'Supine, shoulder flexed 90°, elbow flexed. Dynamometer just proximal to humeral epicondyles (posterior). Stabilise shoulder.' },
    { id: 'shoulder_abd', label: 'Shoulder abduction', region: 'upper', muscles: 'Middle deltoid, supraspinatus',
      protocol: 'Supine, shoulder abducted 45°, elbow extended. Dynamometer just proximal to lateral epicondyle. Stabilise superior shoulder.' },
    { id: 'shoulder_er', label: 'Shoulder external (lateral) rotation', region: 'upper', muscles: 'Infraspinatus, teres minor',
      protocol: 'Supine, shoulder abducted 45°, elbow 90°. Dynamometer just proximal to styloid processes (dorsal forearm). Stabilise elbow.' },
    { id: 'shoulder_ir', label: 'Shoulder internal (medial) rotation', region: 'upper', muscles: 'Subscapularis, pec major, lat dorsi',
      protocol: 'Supine, shoulder abducted 45°, elbow 90°. Dynamometer just proximal to styloid processes (volar forearm). Stabilise elbow.' },
    // ---------- Lower limb ----------
    { id: 'hip_flex', label: 'Hip flexion', region: 'lower', muscles: 'Iliopsoas, rectus femoris',
      protocol: 'Supine, hip flexed 90°, knee relaxed. Dynamometer at femoral condyles (anterior thigh). Stabilise pelvis.' },
    { id: 'hip_abd', label: 'Hip abduction', region: 'lower', muscles: 'Gluteus medius/minimus, TFL',
      protocol: 'Supine, limbs neutral. Dynamometer at lateral femoral condyle. Stabilise contralateral limb.' },
    { id: 'hip_er', label: 'Hip external rotation', region: 'lower', muscles: 'Deep hip rotators, gluteus maximus',
      protocol: 'Seated, hip & knee 90°. Dynamometer just proximal to medial malleolus; subject rotates thigh outward.' },
    { id: 'hip_ir', label: 'Hip internal rotation', region: 'lower', muscles: 'Gluteus medius/minimus (anterior), TFL',
      protocol: 'Seated, hip & knee 90°. Dynamometer just proximal to lateral malleolus; subject rotates thigh inward.' },
    { id: 'knee_ext', label: 'Knee extension', region: 'lower', muscles: 'Quadriceps femoris',
      protocol: 'Seated, hips & knees 90°, hands in lap. Dynamometer just proximal to malleoli (anterior shin). Assistant stabilises shoulders.' },
    { id: 'knee_flex', label: 'Knee flexion', region: 'lower', muscles: 'Hamstrings',
      protocol: 'Seated, hips & knees 90°, hands in lap. Dynamometer just proximal to malleoli (posterior). Assistant stabilises shoulders.' },
    { id: 'ankle_df', label: 'Ankle dorsiflexion', region: 'lower', muscles: 'Tibialis anterior',
      protocol: 'Supine, hip/knee/ankle 0°, foot off table. Dynamometer just proximal to metatarsophalangeal joints (dorsum). Keep knee extended.' },
    { id: 'ankle_pf', label: 'Ankle plantarflexion', region: 'lower', muscles: 'Gastrocnemius, soleus',
      protocol: 'Long sitting, heel over plinth edge. Dynamometer under metatarsal heads. HHD under-estimates true plantarflexor strength.' },
  ];

  const DECADES = ['20-29', '30-39', '40-49', '50-59', '60-69', '70-79'];

  // ---------------------------------------------------------------
  // B97: % body weight, mean/SD, by sex -> action -> decade -> side
  // Each row: [Non mean, Non SD, Dom mean, Dom SD]
  // ---------------------------------------------------------------
  const B97 = {
    citation: 'Bohannon 1997 (Arch Phys Med Rehabil 78:26-32)',
    ages: [20, 79],
    unit: 'pct',
    M: {
      wrist_ext:     { '20-29': [21.7, 2.7, 23.3, 2.5], '30-39': [22.0, 4.5, 21.8, 5.1], '40-49': [21.5, 4.5, 22.0, 4.5], '50-59': [16.9, 2.6, 17.9, 4.1], '60-69': [16.0, 3.7, 17.5, 4.0], '70-79': [16.9, 3.4, 17.3, 2.8] },
      elbow_flex:    { '20-29': [35.5, 6.9, 36.4, 5.9], '30-39': [36.1, 7.4, 34.6, 7.4], '40-49': [32.5, 5.2, 33.3, 3.5], '50-59': [31.6, 5.6, 33.8, 4.9], '60-69': [30.8, 5.1, 32.6, 5.7], '70-79': [31.4, 4.3, 32.2, 4.8] },
      elbow_ext:     { '20-29': [31.1, 5.0, 30.8, 5.1], '30-39': [29.5, 8.0, 27.6, 7.2], '40-49': [25.8, 5.5, 25.3, 5.2], '50-59': [21.9, 3.7, 23.3, 4.5], '60-69': [20.7, 3.5, 21.1, 4.2], '70-79': [22.4, 4.0, 21.5, 3.6] },
      shoulder_er:   { '20-29': [26.0, 3.9, 26.3, 4.9], '30-39': [23.1, 6.1, 24.0, 4.7], '40-49': [21.1, 3.6, 22.9, 5.2], '50-59': [17.8, 2.6, 19.6, 4.4], '60-69': [17.2, 4.9, 19.0, 5.0], '70-79': [17.9, 4.2, 18.8, 4.4] },
      shoulder_ext:  { '20-29': [48.8, 7.5, 50.1, 7.8], '30-39': [48.1, 10.8, 51.8, 12.2], '40-49': [49.3, 10.1, 48.0, 10.3], '50-59': [35.9, 6.5, 39.1, 5.9], '60-69': [34.4, 7.1, 34.2, 7.2], '70-79': [34.2, 5.5, 36.8, 6.4] },
      shoulder_abd:  { '20-29': [31.4, 6.4, 32.7, 6.8], '30-39': [30.5, 9.1, 31.9, 7.7], '40-49': [29.1, 4.2, 29.6, 5.8], '50-59': [26.1, 4.7, 28.2, 5.7], '60-69': [24.9, 6.4, 25.5, 5.6], '70-79': [25.0, 4.5, 25.6, 5.0] },
      ankle_df:      { '20-29': [46.9, 5.9, 49.0, 7.2], '30-39': [49.6, 8.7, 47.3, 8.8], '40-49': [43.9, 9.9, 45.3, 9.0], '50-59': [36.7, 7.1, 36.9, 13.5], '60-69': [34.8, 9.4, 33.8, 10.4], '70-79': [32.7, 6.1, 32.1, 7.2] },
      knee_ext:      { '20-29': [74.0, 14.9, 73.7, 15.3], '30-39': [73.7, 12.3, 73.6, 11.0], '40-49': [70.6, 10.2, 69.8, 9.4], '50-59': [55.1, 11.2, 55.7, 11.1], '60-69': [47.7, 8.7, 48.9, 12.4], '70-79': [48.4, 8.8, 47.7, 8.4] },
      hip_flex:      { '20-29': [26.5, 6.2, 27.0, 5.4], '30-39': [28.9, 6.7, 28.5, 5.2], '40-49': [22.4, 5.9, 23.2, 6.5], '50-59': [24.0, 6.8, 23.1, 7.1], '60-69': [21.1, 5.6, 21.4, 6.4], '70-79': [21.5, 5.0, 22.2, 4.6] },
      hip_abd:       { '20-29': [40.2, 5.8, 40.2, 7.9], '30-39': [42.7, 6.3, 42.0, 7.6], '40-49': [38.4, 8.0, 37.3, 5.7], '50-59': [35.7, 7.9, 36.2, 7.8], '60-69': [33.1, 8.6, 32.8, 6.8], '70-79': [32.8, 6.2, 33.6, 7.2] },
    },
    F: {
      wrist_ext:     { '20-29': [16.3, 2.8, 17.2, 2.1], '30-39': [15.4, 2.7, 16.5, 3.0], '40-49': [16.4, 3.9, 16.9, 3.5], '50-59': [15.8, 2.6, 16.1, 3.2], '60-69': [13.9, 3.6, 13.8, 3.4], '70-79': [10.8, 3.6, 12.4, 4.1] },
      elbow_flex:    { '20-29': [26.5, 3.4, 26.8, 2.6], '30-39': [25.1, 3.3, 25.7, 3.0], '40-49': [26.0, 5.1, 25.0, 4.4], '50-59': [25.2, 4.4, 24.9, 4.0], '60-69': [22.0, 4.4, 21.4, 4.4], '70-79': [22.7, 5.0, 22.6, 4.9] },
      elbow_ext:     { '20-29': [20.0, 3.7, 20.2, 3.3], '30-39': [18.4, 3.2, 18.2, 3.4], '40-49': [18.5, 4.4, 18.1, 4.1], '50-59': [17.5, 3.7, 17.9, 3.4], '60-69': [15.5, 2.8, 14.8, 3.2], '70-79': [15.5, 3.1, 15.6, 3.2] },
      shoulder_er:   { '20-29': [16.8, 3.1, 18.8, 3.0], '30-39': [16.6, 3.2, 18.2, 3.6], '40-49': [18.8, 4.4, 19.1, 4.3], '50-59': [17.4, 4.5, 17.4, 3.5], '60-69': [14.1, 3.5, 14.4, 4.2], '70-79': [13.9, 3.5, 13.6, 3.2] },
      shoulder_ext:  { '20-29': [33.2, 5.2, 35.5, 5.2], '30-39': [30.7, 6.1, 32.6, 6.8], '40-49': [33.2, 7.4, 34.6, 6.4], '50-59': [30.5, 6.7, 31.3, 6.5], '60-69': [26.4, 6.7, 25.3, 7.2], '70-79': [23.9, 5.7, 24.9, 5.9] },
      shoulder_abd:  { '20-29': [23.4, 2.9, 26.5, 4.0], '30-39': [21.2, 3.7, 21.8, 3.4], '40-49': [21.4, 5.1, 22.8, 4.5], '50-59': [21.5, 4.1, 22.0, 4.1], '60-69': [17.1, 3.9, 18.4, 4.9], '70-79': [17.8, 4.6, 16.7, 4.2] },
      ankle_df:      { '20-29': [47.4, 7.1, 51.4, 9.2], '30-39': [39.8, 8.2, 38.6, 8.6], '40-49': [41.1, 11.3, 41.5, 10.7], '50-59': [39.1, 10.5, 41.3, 12.1], '60-69': [37.8, 10.7, 38.9, 15.2], '70-79': [26.7, 7.2, 29.1, 9.9] },
      knee_ext:      { '20-29': [80.5, 14.0, 80.8, 12.3], '30-39': [63.8, 15.0, 63.3, 15.5], '40-49': [59.7, 10.4, 62.6, 14.3], '50-59': [51.2, 12.4, 53.7, 12.8], '60-69': [43.3, 14.0, 44.6, 13.6], '70-79': [35.8, 9.1, 36.6, 8.8] },
      hip_flex:      { '20-29': [22.9, 4.2, 24.3, 4.6], '30-39': [18.7, 6.0, 19.2, 6.3], '40-49': [20.6, 9.4, 20.6, 5.0], '50-59': [18.8, 4.6, 18.9, 5.4], '60-69': [16.3, 4.5, 17.1, 4.9], '70-79': [16.1, 5.4, 16.2, 4.3] },
      hip_abd:       { '20-29': [32.7, 5.9, 33.7, 6.7], '30-39': [33.1, 8.2, 35.5, 7.6], '40-49': [33.3, 7.0, 36.0, 6.6], '50-59': [33.4, 6.4, 34.7, 7.8], '60-69': [26.7, 5.5, 28.2, 7.7], '70-79': [25.8, 5.9, 26.7, 6.7] },
    },
    notes: {
      knee_ext: 'Knee-extension reference values for men aged 20-59 are depressed: 20 men hit the 650 N ceiling of the dynamometer.',
    },
    // Regression: force(N) = a + b*S + c*A + d*W ;  S: male 0 / female 1 ; A: age (y) ; W: body weight (N)
    regression: {
      wrist_ext:    { N: [114.36, -45.1, -0.774, 0.094], D: [123.65, -48.5, -0.784, 0.092] },
      elbow_flex:   { N: [188.25, -89.2, -0.650, 0.132], D: [188.36, -96.5, -0.610, 0.140] },
      elbow_ext:    { N: [150.37, -71.5, -1.044, 0.126], D: [156.49, -73.0, -1.032, 0.116] },
      // The age coefficient for the non-dominant side is misprinted as "50.164" in the
      // original table; -1.164 is assumed (consistent with the dominant side, -0.930).
      shoulder_er:  { N: [140.32, -50.2, -1.164, 0.080], D: [147.66, -54.5, -0.930, 0.088], uncertain: 'N' },
      shoulder_ext: { N: [260.18, -113.5, -1.868, 0.202], D: [278.99, -120.0, -1.99, 0.202] },
      shoulder_abd: { N: [165.16, -74.9, -0.910, 0.126], D: [178.90, -77.1, -1.128, 0.134] },
      ankle_df:     { N: [302.54, -60.9, -2.203, 0.159], D: [285.46, -47.6, -2.367, 0.193] },
      knee_ext:     { N: [480.70, -95.0, -4.868, 0.310], D: [465.22, -84.7, -4.803, 0.325] },
      hip_flex:     { N: [216.48, -74.6, -0.926, 0.026], D: [219.30, -72.6, -0.977, 0.027] },
      hip_abd:      { N: [203.32, -73.3, -1.247, 0.192], D: [195.24, -62.4, -1.184, 0.198] },
    },
  };

  // ---------------------------------------------------------------
  // A96: % body weight, mean/SD, ages 50-79
  // Row: [Non mean, Non SD, Dom mean, Dom SD]
  // ---------------------------------------------------------------
  const A96 = {
    citation: 'Andrews, Thomas & Bohannon 1996 (Phys Ther 76:248-259)',
    ages: [50, 79],
    unit: 'pct',
    M: {
      shoulder_flex: { '50-59': [30.9, 5.3, 32.1, 4.3], '60-69': [29.2, 4.8, 30.3, 5.3], '70-79': [28.3, 5.3, 29.6, 5.6] },
      shoulder_ext:  { '50-59': [36.3, 4.7, 38.4, 4.9], '60-69': [35.3, 6.0, 36.5, 6.5], '70-79': [34.1, 6.9, 35.8, 7.6] },
      shoulder_abd:  { '50-59': [26.8, 3.8, 28.5, 5.7], '60-69': [25.3, 5.5, 26.1, 5.6], '70-79': [25.2, 4.3, 26.1, 5.5] },
      shoulder_er:   { '50-59': [18.4, 2.6, 18.7, 3.3], '60-69': [17.3, 4.3, 18.2, 3.6], '70-79': [17.7, 4.3, 18.2, 4.2] },
      shoulder_ir:   { '50-59': [21.8, 3.3, 23.1, 3.5], '60-69': [20.3, 2.7, 21.2, 3.1], '70-79': [20.5, 4.2, 20.6, 4.8] },
      elbow_flex:    { '50-59': [32.7, 5.8, 35.0, 5.1], '60-69': [32.3, 4.2, 33.7, 5.3], '70-79': [31.4, 5.7, 32.0, 5.5] },
      elbow_ext:     { '50-59': [21.3, 3.8, 22.5, 3.3], '60-69': [20.4, 3.8, 21.2, 4.2], '70-79': [20.8, 3.4, 20.7, 4.0] },
      wrist_ext:     { '50-59': [16.6, 2.3, 17.8, 2.9], '60-69': [15.9, 3.3, 17.1, 3.3], '70-79': [16.4, 3.0, 16.9, 2.6] },
      hip_flex:      { '50-59': [24.6, 5.5, 24.1, 6.1], '60-69': [24.2, 6.2, 24.0, 6.6], '70-79': [21.6, 5.4, 22.0, 5.4] },
      hip_abd:       { '50-59': [35.3, 7.5, 36.3, 6.7], '60-69': [35.0, 8.5, 34.3, 7.7], '70-79': [32.6, 7.9, 34.2, 8.1] },
      knee_flex:     { '50-59': [29.0, 5.0, 29.9, 5.7], '60-69': [29.2, 5.7, 30.4, 5.7], '70-79': [27.9, 4.8, 29.3, 5.4] },
      knee_ext:      { '50-59': [52.9, 8.1, 53.9, 8.4], '60-69': [49.3, 8.0, 47.4, 8.5], '70-79': [49.3, 8.2, 48.2, 10.2] },
      ankle_df:      { '50-59': [34.0, 8.2, 34.7, 8.3], '60-69': [31.4, 8.8, 30.6, 7.7], '70-79': [28.6, 7.6, 30.1, 8.2] },
    },
    F: {
      shoulder_flex: { '50-59': [22.2, 3.9, 24.0, 4.2], '60-69': [21.9, 3.7, 23.0, 4.9], '70-79': [20.5, 4.2, 20.7, 4.3] },
      shoulder_ext:  { '50-59': [25.7, 6.2, 26.9, 5.8], '60-69': [22.9, 4.2, 23.9, 5.5], '70-79': [23.5, 5.3, 24.6, 5.0] },
      shoulder_abd:  { '50-59': [18.6, 4.3, 20.1, 3.9], '60-69': [17.8, 3.0, 19.5, 3.9], '70-79': [18.4, 4.0, 17.9, 3.4] },
      shoulder_er:   { '50-59': [14.3, 2.9, 15.0, 3.2], '60-69': [13.3, 2.1, 13.7, 2.7], '70-79': [13.6, 3.2, 13.9, 2.6] },
      shoulder_ir:   { '50-59': [15.0, 3.1, 15.1, 3.1], '60-69': [14.0, 2.5, 14.4, 3.0], '70-79': [14.2, 2.3, 14.5, 2.6] },
      elbow_flex:    { '50-59': [23.9, 4.3, 24.8, 4.0], '60-69': [23.5, 4.2, 24.5, 5.0], '70-79': [23.8, 3.4, 23.3, 3.7] },
      elbow_ext:     { '50-59': [15.5, 3.2, 16.0, 2.7], '60-69': [15.0, 3.5, 15.0, 3.6], '70-79': [15.3, 2.7, 15.7, 3.7] },
      wrist_ext:     { '50-59': [12.3, 2.6, 13.4, 2.7], '60-69': [11.0, 2.1, 12.4, 2.4], '70-79': [12.0, 2.4, 13.4, 3.3] },
      hip_flex:      { '50-59': [19.3, 4.8, 20.2, 5.0], '60-69': [19.0, 3.5, 19.2, 3.7], '70-79': [17.2, 4.3, 17.6, 4.6] },
      hip_abd:       { '50-59': [30.1, 7.8, 30.3, 7.0], '60-69': [29.0, 5.9, 29.2, 6.0], '70-79': [27.2, 6.2, 28.8, 6.2] },
      knee_flex:     { '50-59': [25.0, 5.8, 25.0, 5.0], '60-69': [23.9, 4.1, 24.6, 4.6], '70-79': [23.7, 5.5, 23.0, 5.2] },
      knee_ext:      { '50-59': [43.6, 10.8, 44.2, 12.4], '60-69': [38.4, 8.8, 39.9, 8.0], '70-79': [38.0, 8.6, 38.0, 7.2] },
      ankle_df:      { '50-59': [28.5, 8.9, 29.4, 11.0], '60-69': [27.6, 6.7, 26.5, 5.2], '70-79': [25.9, 6.6, 27.1, 8.9] },
    },
    notes: {
      knee_ext: 'Eight male subjects exceeded the 512 N ceiling of the dynamometer; male knee-extension norms are slightly depressed.',
      hip_abd: 'Inter-rater reliability for hip abduction was lower than for other actions in this study.',
      ankle_df: 'Inter-rater reliability for ankle dorsiflexion was lower than for other actions in this study.',
    },
    // Regression: force(N) = a + b*S + c*W + d*A ; S: male 0 / female 1 ; W: body weight (N) ; A: age (y)
    // (stored in the same [a, S, A, W] order as B97 for a single evaluator)
    regression: {
      shoulder_flex: { N: [220.204, -73.237, -1.454, 0.130], D: [234.947, -74.442, -1.718, 0.146] },
      shoulder_ext:  { N: [224.567, -97.507, -1.357, 0.175], D: [235.710, -101.570, -1.494, 0.189] },
      shoulder_abd:  { N: [172.206, -69.368, -0.891, 0.109], D: [198.341, -68.686, -1.462, 0.135] },
      shoulder_er:   { N: [144.314, -42.459, -0.801, 0.057], D: [122.721, -40.947, -0.686, 0.082] },
      shoulder_ir:   { N: [128.554, -55.324, -0.847, 0.113], D: [141.066, -59.539, -0.984, 0.117] },
      elbow_flex:    { N: [209.154, -79.303, -1.125, 0.145], D: [229.421, -84.836, -1.503, 0.165] },
      elbow_ext:     { N: [93.477, -47.565, -0.490, 0.129], D: [112.597, -49.858, -0.834, 0.139] },
      wrist_ext:     { N: [86.992, -40.223, -0.436, 0.087], D: [85.345, -37.801, -0.482, 0.103] },
      hip_flex:      { N: [214.609, -52.922, -1.657, 0.097], D: [229.940, -50.516, -1.728, 0.081] },
      hip_abd:       { N: [288.847, -65.538, -1.969, 0.134], D: [258.118, -62.971, -1.620, 0.150] },
      knee_flex:     { N: [114.508, -40.473, -0.804, 0.206], D: [142.244, -52.112, -0.892, 0.189] },
      knee_ext:      { N: [344.343, -98.409, -2.717, 0.286], D: [358.455, -87.581, -3.136, 0.297] },
      ankle_df:      { N: [246.464, -51.379, -1.751, 0.142], D: [228.930, -50.262, -1.738, 0.168] },
    },
  };

  // ---------------------------------------------------------------
  // M17: absolute force in Newtons, mean/SD, dominant limb
  // Bands: 3-9, 10-19, 20-59, 60+ ; Row per sex: [mean, SD]
  // ---------------------------------------------------------------
  const M17 = {
    citation: 'McKay et al. 2017, 1000 Norms Project (Neurology 88:36-43)',
    ages: [3, 101],
    unit: 'N',
    bands: [
      { key: '3-9', min: 3, max: 9 },
      { key: '10-19', min: 10, max: 19 },
      { key: '20-59', min: 20, max: 59 },
      { key: '60+', min: 60, max: 120 },
    ],
    M: {
      grip:        { '3-9': [55.8, 29.1], '10-19': [195.7, 83.0], '20-59': [305.0, 73.0], '60+': [221.6, 49.5] },
      ankle_df:    { '3-9': [87.1, 38.2], '10-19': [197.2, 56.6], '20-59': [224.6, 48.9], '60+': [173.3, 44.0] },
      ankle_pf:    { '3-9': [151.7, 52.3], '10-19': [309.9, 74.9], '20-59': [338.8, 66.8], '60+': [281.4, 62.7] },
      hip_ir:      { '3-9': [63.3, 31.7], '10-19': [178.5, 67.2], '20-59': [217.7, 62.4], '60+': [169.7, 55.0] },
      hip_er:      { '3-9': [49.7, 22.7], '10-19': [141.7, 53.7], '20-59': [169.4, 45.8], '60+': [125.5, 33.9] },
      hip_abd:     { '3-9': [52.3, 23.1], '10-19': [143.4, 47.2], '20-59': [170.7, 43.9], '60+': [124.8, 32.8] },
      elbow_flex:  { '3-9': [71.7, 29.1], '10-19': [213.8, 81.1], '20-59': [270.2, 59.6], '60+': [209.4, 48.4] },
      elbow_ext:   { '3-9': [66.8, 24.4], '10-19': [159.3, 56.8], '20-59': [203.2, 46.1], '60+': [162.1, 36.8] },
      shoulder_ir: { '3-9': [56.1, 27.1], '10-19': [151.5, 63.2], '20-59': [202.4, 55.9], '60+': [159.7, 42.9] },
      shoulder_er: { '3-9': [38.7, 19.5], '10-19': [100.6, 38.8], '20-59': [134.7, 39.6], '60+': [96.7, 25.3] },
    },
    F: {
      grip:        { '3-9': [50.6, 25.3], '10-19': [153.8, 46.0], '20-59': [190.2, 50.4], '60+': [128.7, 35.4] },
      ankle_df:    { '3-9': [81.6, 29.2], '10-19': [166.0, 37.8], '20-59': [166.5, 41.6], '60+': [131.5, 38.9] },
      ankle_pf:    { '3-9': [142.7, 45.9], '10-19': [261.2, 52.7], '20-59': [243.9, 59.2], '60+': [216.3, 60.3] },
      hip_ir:      { '3-9': [61.1, 25.8], '10-19': [143.2, 45.0], '20-59': [136.1, 44.6], '60+': [108.4, 33.8] },
      hip_er:      { '3-9': [43.8, 16.8], '10-19': [104.0, 28.7], '20-59': [100.7, 29.1], '60+': [76.3, 23.7] },
      hip_abd:     { '3-9': [52.4, 21.9], '10-19': [116.6, 31.9], '20-59': [113.1, 32.4], '60+': [83.8, 23.5] },
      elbow_flex:  { '3-9': [66.0, 26.4], '10-19': [148.5, 36.8], '20-59': [164.4, 42.3], '60+': [129.7, 33.9] },
      elbow_ext:   { '3-9': [62.0, 19.7], '10-19': [118.3, 30.0], '20-59': [121.2, 30.2], '60+': [102.8, 25.3] },
      shoulder_ir: { '3-9': [47.7, 17.4], '10-19': [101.6, 27.7], '20-59': [109.7, 33.6], '60+': [86.0, 27.5] },
      shoulder_er: { '3-9': [34.7, 13.0], '10-19': [73.4, 19.1], '20-59': [82.2, 20.9], '60+': [63.3, 19.2] },
    },
    notes: {
      ankle_pf: 'Plantarflexor strength often exceeds what a tester can resist by hand; these values under-estimate true strength and act as a lower threshold for weakness.',
      _all: 'Absolute force (N), not normalised to body weight. Wide age bands. Positions differ from the Bohannon protocol, so values are not interchangeable.',
    },
  };

  // ---------------------------------------------------------------
  // D14: grip strength (kg) — centiles and mean (SD) at exact ages
  // Row: [p10, p25, p50, p75, p90, mean, SD]
  // ---------------------------------------------------------------
  const D14 = {
    citation: 'Dodds et al. 2014, 12 British studies (PLoS ONE 9:e113637)',
    ages: [5, 90],
    unit: 'kg',
    M: {
      5: [6, 7, 8, 9, 10, 7.7, 2.9], 10: [12, 15, 17, 20, 22, 17.2, 4.1], 15: [21, 25, 29, 33, 38, 29.6, 5.6],
      20: [30, 35, 40, 46, 52, 41.5, 7.3], 25: [36, 41, 48, 55, 61, 48.8, 8.7], 30: [38, 44, 51, 58, 64, 51.6, 9.6],
      35: [39, 45, 51, 58, 64, 51.6, 10.1], 40: [38, 44, 50, 57, 63, 50.3, 10.3], 45: [36, 42, 49, 56, 61, 48.8, 10.3],
      50: [35, 41, 48, 54, 60, 47.6, 10.1], 55: [34, 40, 47, 53, 59, 46.2, 9.8], 60: [33, 39, 45, 51, 56, 44.6, 9.2],
      65: [31, 37, 43, 48, 53, 42.3, 8.6], 70: [29, 34, 39, 44, 49, 39.1, 8.1], 75: [26, 31, 35, 41, 45, 35.6, 7.6],
      80: [23, 27, 32, 37, 42, 32.2, 7.3], 85: [19, 24, 29, 33, 38, 28.5, 7.0], 90: [16, 20, 25, 29, 33, 24.7, 6.8],
    },
    F: {
      5: [6, 7, 8, 9, 10, 8.0, 3.1], 10: [12, 14, 16, 19, 21, 16.7, 3.8], 15: [17, 20, 24, 27, 30, 23.9, 4.5],
      20: [21, 24, 28, 32, 36, 28.4, 5.1], 25: [23, 26, 30, 35, 38, 30.6, 5.6], 30: [24, 27, 31, 35, 39, 31.4, 6.0],
      35: [23, 27, 31, 35, 39, 31.3, 6.2], 40: [23, 27, 31, 35, 39, 30.7, 6.3], 45: [22, 26, 30, 34, 38, 29.9, 6.4],
      50: [21, 25, 29, 33, 37, 28.7, 6.4], 55: [19, 23, 28, 32, 35, 27.5, 6.4], 60: [18, 22, 27, 31, 34, 26.5, 6.2],
      65: [17, 21, 25, 29, 33, 25.3, 6.0], 70: [16, 20, 24, 27, 31, 23.5, 5.7], 75: [14, 18, 21, 25, 28, 21.4, 5.4],
      80: [13, 16, 19, 23, 26, 19.1, 5.1], 85: [11, 14, 17, 20, 23, 16.6, 4.7], 90: [9, 11, 14, 17, 20, 14.2, 4.4],
    },
    notes: {
      _all: 'Grip norms are absolute (kg), pooled from ~50,000 British participants (mostly Jamar). Grip is conventionally not normalised to body weight.',
    },
  };

  return { ACTIONS, DECADES, B97, A96, M17, D14 };
})();
