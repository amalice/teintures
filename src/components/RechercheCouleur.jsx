import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getRecettesTableName } from '../utils/tableNames';
import { Link } from 'react-router-dom';
import chroma from 'chroma-js';
import { cls, Chargement, Message } from './ui';
import { useT, useNombre } from '../i18n';

// ========== CONVERSION COULEUR ==========
const hexToRgb = (hex) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
};

const rgbToXyz = (rgb) => {
  const [r, g, b] = rgb.map(c =>
    c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92
  ).map(c => c * 100);

  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    r * 0.0193339 + g * 0.1191920 + b * 0.9503041
  ];
};

const xyzToLab = (xyz) => {
  const [x, y, z] = xyz;
  const ref = { X: 95.047, Y: 100.000, Z: 108.883 };

  const f = (val, refVal) =>
    val / refVal > 0.008856
      ? Math.pow(val / refVal, 1/3)
      : (7.787 * (val / refVal)) + (16 / 116);

  const L = 116 * f(y, ref.Y) - 16;
  const a = 500 * (f(x, ref.X) - f(y, ref.Y));
  const b = 200 * (f(y, ref.Y) - f(z, ref.Z));

  return [L, a, b];
};

const hexToLab = (hex) => {
  try {
    const rgb = hexToRgb(hex);
    const xyz = rgbToXyz(rgb);
    return xyzToLab(xyz);
  } catch {
    return null;
  }
};

// ========== CALCUL DELTA E2000 ==========
// Formule CIEDE2000 (Sharma, Wu & Dalal, 2005), angles en degrés.
const deltaE2000 = (lab1, lab2) => {
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

  // Angles de teinte ramenés dans [0, 360[
  const h1p = (a1p === 0 && b1 === 0) ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = (a2p === 0 && b2 === 0) ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360;

  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;

  // Écart de teinte Δh' puis ΔH' (c'est ce terme qui manquait)
  let deltahp = 0;
  if (C1p * C2p !== 0) {
    deltahp = h2p - h1p;
    if (deltahp > 180) deltahp -= 360;
    else if (deltahp < -180) deltahp += 360;
  }
  const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(deltahp / 2));

  const avgL = (L1 + L2) / 2;
  const avgCp = (C1p + C2p) / 2;

  // Teinte moyenne, en tenant compte du passage 360° → 0°
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

// ========== COMPOSANT ==========
const RechercheCouleur = ({ projetId, projetNom }) => {
  const t = useT();
  const nombre = useNombre();
  const [couleurs, setCouleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('hex');
  const [results, setResults] = useState([]);
  const [cible, setCible] = useState(null); // couleur recherchée { hex, lab }

  // Récupération des couleurs
  useEffect(() => {
    const fetchCouleurs = async () => {
      if (!projetNom) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(`recettes_${projetNom.toLowerCase().replace(/\s+/g, '_')}`)
        .select('recette_id, numero_fiche, couleur_numero, couleur_hex, couleur_lab_l, couleur_lab_a, couleur_lab_b, colorant_1, colorant_2, colorant_3')
        .order('couleur_hex', { ascending: true });

      if (error) {
        console.error('Erreur:', error);
        setLoading(false);
        return;
      }

      const uniqueCouleurs = [];
      const seen = new Set();
      data.forEach((row) => {
        if (row.couleur_hex && !seen.has(row.couleur_hex)) {
          seen.add(row.couleur_hex);
          uniqueCouleurs.push({
            recette_id: row.recette_id,
            fiche: row.numero_fiche,
            indexCouleur: row.couleur_numero,
            hex: row.couleur_hex,
            lab_L: row.couleur_lab_l,
            lab_a: row.couleur_lab_a,
            lab_b: row.couleur_lab_b,
            colorants: [row.colorant_1, row.colorant_2, row.colorant_3].filter(Boolean).join(', ')
          });
        }
      });
      setCouleurs(uniqueCouleurs);
      setLoading(false);
    };

    fetchCouleurs();
  }, [projetNom]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setCible(null);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    let queryLab = null;

    // Conversion de la requête en Lab
    if (searchType === 'hex') {
      queryLab = hexToLab(query);
      if (!queryLab) {
        setResults([]);
        return;
      }
    } else {
      const parts = query.split(',').map(p => parseFloat(p.trim()));
      if (parts.length !== 3 || parts.some(isNaN)) {
        setResults([]);
        return;
      }
      queryLab = parts;
    }

    // Couleur cible affichée à côté de chaque résultat
    let cibleHex = null;
    try {
      cibleHex = chroma.lab(queryLab[0], queryLab[1], queryLab[2]).hex().toUpperCase();
    } catch {
      cibleHex = null;
    }
    setCible({ hex: cibleHex, lab: queryLab });

    // Calcul des distances et tri
    const results = couleurs
      .map(couleur => {
        const couleurLab = [couleur.lab_L, couleur.lab_a, couleur.lab_b];
        return {
          ...couleur,
          distance: deltaE2000(queryLab, couleurLab)
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    setResults(results);
  };

  const fmt = (n) => (Number.isFinite(Number(n)) ? Number(n).toFixed(1) : '—');

  // Aperçu en direct de la saisie (avant même de lancer la recherche)
  let apercu = null;
  if (searchType === 'hex') {
    const lab = query.trim() ? hexToLab(query.trim()) : null;
    if (lab && lab.every(Number.isFinite) && chroma.valid(query.trim())) {
      apercu = { hex: chroma(query.trim()).hex().toUpperCase(), autre: `Lab ${lab.map(fmt).join(', ')}` };
    }
  } else {
    const parts = query.split(',').map((p) => parseFloat(p.trim()));
    if (parts.length === 3 && !parts.some(isNaN)) {
      try {
        const hex = chroma.lab(parts[0], parts[1], parts[2]).hex().toUpperCase();
        apercu = { hex, autre: `HEX ${hex}` };
      } catch {
        apercu = null;
      }
    }
  }

  if (loading) return <Chargement texte={t('nuancier.chargement')} />;
  if (!projetNom) return <Message>{t('commun.selectionnezProjet')}</Message>;

  return (
    <div className={`${cls.page} pt-14 flex flex-col gap-10`}>
      <div className="flex flex-col gap-2.5">
        <h1 className={`m-0 ${cls.h1}`}>{t('recherche.titre')}</h1>
        <p className="m-0 text-base text-encre-500 max-w-xl leading-relaxed">
          {t('recherche.intro')}
        </p>
      </div>

      <div className="flex flex-wrap gap-8 items-start">
        <form
          onSubmit={handleSearch}
          className={`${cls.carte} flex-[1_1_320px] max-w-sm flex flex-col gap-5 p-7`}
        >
          <div
            className="h-44 rounded-[14px] border border-black/5 flex items-center justify-center text-sm text-encre-500"
            style={{ backgroundColor: apercu ? apercu.hex : undefined }}
          >
            {!apercu && t('recherche.apercu')}
          </div>

          <div role="group" aria-label={t('recherche.format')} className="flex gap-1 p-1 rounded-full bg-lin-300">
            {[['hex', 'HEX'], ['lab', 'Lab']].map(([id, label]) => (
              <button
                type="button"
                key={id}
                onClick={() => setSearchType(id)}
                aria-pressed={searchType === id}
                className={`flex-1 h-10 rounded-full text-sm font-medium text-encre ${searchType === id ? 'bg-lin-50' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="couleur-cible" className={cls.label}>
              {searchType === 'hex' ? t('recherche.labelHex') : t('recherche.labelLab')}
            </label>
            <input
              id="couleur-cible"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'hex' ? t('recherche.exempleHex') : t('recherche.exempleLab')}
              className={`${cls.inputMono} h-12 px-4 text-base`}
            />
            <span className="font-mono text-xs text-encre-500 min-h-[16px]">{apercu ? apercu.autre : ''}</span>
          </div>

          <button type="submit" className={`${cls.btnPrimaire} h-12 text-base`}>{t('recherche.rechercher')}</button>
        </form>

        <section aria-label={t('recherche.resultats')} className="flex-[999_1_560px] min-w-0 flex flex-col gap-4">
          {results.length > 0 ? (
            <>
              <div className="flex flex-wrap justify-between items-baseline gap-4">
                <h2 className={`m-0 ${cls.h3} text-[26px]`}>{t('recherche.plusProches')}</h2>
                <p className="m-0 text-sm text-encre-500">{t('recherche.nbResultats', { n: results.length })}</p>
              </div>
              <div className="rounded-[20px] border border-lin-500 bg-lin-100 overflow-hidden">
                {results.map((couleur, index) => (
                  <Link
                    key={index}
                    to={`/recette/${couleur.recette_id}`}
                    className="flex flex-wrap items-center gap-5 px-6 py-4 border-b last:border-b-0 border-lin-400 no-underline text-encre hover:bg-lin-50"
                  >
                    <span className="w-6 font-mono text-sm font-medium text-encre-500">{index + 1}</span>
                    <span aria-hidden="true" className="flex w-28 h-14 rounded-xl overflow-hidden flex-none border border-black/5">
                      <span className="flex-1" style={{ backgroundColor: cible?.hex || '#FFFFFF' }} />
                      <span className="flex-1" style={{ backgroundColor: couleur.hex || '#FFFFFF' }} />
                    </span>
                    <span className="flex-[1_1_200px] flex flex-col gap-1 min-w-0">
                      <span className="text-base font-medium">{t('commun.ficheNuance', { f: couleur.fiche, n: couleur.indexCouleur })}</span>
                      <span className="text-sm text-encre-600">{couleur.colorants || '—'}</span>
                      <span className="font-mono text-xs text-encre-500">
                        {couleur.hex} · Lab {fmt(couleur.lab_L)}, {fmt(couleur.lab_a)}, {fmt(couleur.lab_b)}
                      </span>
                    </span>
                    <span className="min-w-[110px] text-right font-mono text-lg font-medium">
                      ΔE {nombre(couleur.distance.toFixed(2).replace('.', ','))}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[20px] border border-dashed border-lin-600 px-6 py-16 text-center text-encre-500">
              {cible ? t('recherche.aucunResultat') : t('recherche.invite')}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RechercheCouleur;