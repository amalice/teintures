import chroma from 'chroma-js';

// Toutes les valeurs colorimétriques (Lab comme LCh) sont conservées à 2 décimales.
export const DECIMALES_COULEUR = 2;
const FACTEUR = 10 ** DECIMALES_COULEUR;

export const arrondi = (v) => Math.round(v * FACTEUR) / FACTEUR;

const estNombre = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

/** Vrai si L, a et b sont tous renseignés. */
export const labComplet = (L, a, b) => estNombre(L) && estNombre(a) && estNombre(b);

/** Vrai si L, C et h sont tous renseignés. */
export const lchComplet = (L, C, h) => estNombre(L) && estNombre(C) && estNombre(h);

/** Lab → LCh(ab). Renvoie [L, C, h] arrondis à 2 décimales, h dans [0, 360[. */
export const labVersLch = (L, a, b) => {
  const A = Number(a);
  const B = Number(b);
  const C = arrondi(Math.sqrt(A * A + B * B));
  // Teinte indéfinie pour un gris neutre (a = b = 0) : on prend 0 par convention
  const h = A === 0 && B === 0 ? 0 : arrondi((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return [arrondi(Number(L)), C, arrondi(h)];
};

/** LCh(ab) → Lab. Renvoie [L, a, b] arrondis à 2 décimales. */
export const lchVersLab = (L, C, h) => {
  const rad = (Number(h) * Math.PI) / 180;
  const c = Number(C);
  // « + 0 » évite d'afficher -0
  return [arrondi(Number(L)), arrondi(c * Math.cos(rad)) + 0, arrondi(c * Math.sin(rad)) + 0];
};

/**
 * Couleur d'affichage (écran) calculée depuis le Lab.
 * Renvoie null si le Lab n'est pas renseigné : rien n'est alors affiché.
 * Les couleurs hors du gamut sRGB sont ramenées à la plus proche affichable.
 */
export const labVersHex = (L, a, b) => {
  if (!labComplet(L, a, b)) return null;
  try {
    return chroma.lab(Number(L), Number(a), Number(b)).hex();
  } catch {
    return null;
  }
};

/** Raccourci pour une ligne de nuance (champs couleur_lab_l/a/b). */
export const hexNuance = (c) => (c ? labVersHex(c.couleur_lab_l, c.couleur_lab_a, c.couleur_lab_b) : null);

// ========== ÉCART DE COULEUR ΔE2000 ==========
// Formule CIEDE2000 (Sharma, Wu & Dalal, 2005), angles en degrés.
export const deltaE2000 = (lab1, lab2) => {
  const [L1, a1, b1] = lab1.map(Number);
  const [L2, a2, b2] = lab2.map(Number);
  const rad = (deg) => (deg * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = (a1p === 0 && b1 === 0) ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = (a2p === 0 && b2 === 0) ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360;

  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;

  let deltahp = 0;
  if (C1p * C2p !== 0) {
    deltahp = h2p - h1p;
    if (deltahp > 180) deltahp -= 360;
    else if (deltahp < -180) deltahp += 360;
  }
  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(deltahp / 2));

  const avgL = (L1 + L2) / 2;
  const avgCp = (C1p + C2p) / 2;

  let avgHp;
  if (C1p * C2p === 0) avgHp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) avgHp = (h1p + h2p) / 2;
  else if (h1p + h2p < 360) avgHp = (h1p + h2p + 360) / 2;
  else avgHp = (h1p + h2p - 360) / 2;

  const T = 1
    - 0.17 * Math.cos(rad(avgHp - 30))
    + 0.24 * Math.cos(rad(2 * avgHp))
    + 0.32 * Math.cos(rad(3 * avgHp + 6))
    - 0.20 * Math.cos(rad(4 * avgHp - 63));

  const SL = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const deltaTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(rad(2 * deltaTheta));

  return Math.sqrt(
    Math.pow(deltaLp / SL, 2) +
    Math.pow(deltaCp / SC, 2) +
    Math.pow(deltaHp / SH, 2) +
    RT * (deltaCp / SC) * (deltaHp / SH)
  );
};
