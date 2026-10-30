import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import fr from './fr';
import en from './en';

// Langues disponibles. Le français est la langue par défaut.
export const LANGUES = { fr, en };
export const LANGUE_PAR_DEFAUT = 'fr';
const CLE_STOCKAGE = 'tinctilab.langue';
const ANCIENNE_CLE_STOCKAGE = 'teintures.langue'; // avant le changement de nom

const lireLangueMemorisee = () => {
  try {
    const l = window.localStorage.getItem(CLE_STOCKAGE) || window.localStorage.getItem(ANCIENNE_CLE_STOCKAGE);
    return l && LANGUES[l] ? l : LANGUE_PAR_DEFAUT;
  } catch {
    return LANGUE_PAR_DEFAUT;
  }
};

// Va chercher « a.b.c » dans le dictionnaire
const chercher = (dico, cle) =>
  cle.split('.').reduce((obj, morceau) => (obj && obj[morceau] !== undefined ? obj[morceau] : undefined), dico);

const LangueContext = createContext({
  langue: LANGUE_PAR_DEFAUT,
  setLangue: () => {},
  t: (cle) => cle,
});

export const LangueProvider = ({ children }) => {
  const [langue, setLangueEtat] = useState(lireLangueMemorisee);

  const setLangue = useCallback((l) => {
    if (!LANGUES[l]) return;
    setLangueEtat(l);
    try {
      window.localStorage.setItem(CLE_STOCKAGE, l);
    } catch {
      // stockage indisponible (navigation privée…) : le choix vaut pour la session en cours
    }
  }, []);

  // Langue du document (lecteurs d'écran, césure, correcteur…)
  useEffect(() => {
    document.documentElement.lang = langue;
    document.title = chercher(LANGUES[langue], 'app.titreDocument') || document.title;
  }, [langue]);

  /**
   * t('cle.sous_cle', { n: 3 }) → texte traduit, avec remplacement de {n}.
   * Si la clé manque dans la langue choisie, on se rabat sur le français, puis sur la clé.
   */
  const t = useCallback(
    (cle, valeurs) => {
      let texte = chercher(LANGUES[langue], cle);
      if (texte === undefined) texte = chercher(LANGUES[LANGUE_PAR_DEFAUT], cle);
      if (texte === undefined) return cle;
      if (typeof texte === 'function') return texte(valeurs || {});
      if (typeof texte !== 'string' || !valeurs) return texte;
      return texte.replace(/\{(\w+)\}/g, (m, nom) => (valeurs[nom] !== undefined ? valeurs[nom] : m));
    },
    [langue]
  );

  const valeur = useMemo(() => ({ langue, setLangue, t }), [langue, setLangue, t]);
  return <LangueContext.Provider value={valeur}>{children}</LangueContext.Provider>;
};

export const useLangue = () => useContext(LangueContext);

/** Raccourci : const t = useT(); */
export const useT = () => useContext(LangueContext).t;

/**
 * Affichage des nombres déjà formatés par les calculs (« 0,160 »).
 * En anglais, la virgule décimale devient un point (« 0.160 »).
 */
export const useNombre = () => {
  const { langue } = useContext(LangueContext);
  return useCallback(
    (v) => {
      if (v === null || v === undefined) return v;
      const s = String(v);
      // On ne touche qu'aux nombres simples (« 1.6 », « 0,160 », « -12,5 »)
      if (!/^-?\d+([.,]\d+)?$/.test(s)) return s;
      return langue === 'en' ? s.replace(',', '.') : s.replace('.', ',');
    },
    [langue]
  );
};

/** Locale pour les dates (« 5 avr. 2026 » / « Apr 5, 2026 »). */
export const localeDe = (langue) => (langue === 'en' ? 'en-GB' : 'fr-FR');

/** Bouton FR / EN */
export const ChoixLangue = ({ className = '' }) => {
  const { langue, setLangue, t } = useLangue();
  return (
    <div
      role="group"
      aria-label={t('langue.choix')}
      className={`flex gap-0.5 p-1 rounded-full bg-lin-300 ${className}`}
    >
      {Object.keys(LANGUES).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLangue(l)}
          aria-pressed={langue === l}
          lang={l}
          title={LANGUES[l].langue.nom}
          className={`h-9 min-w-[44px] px-2.5 rounded-full text-[13px] font-semibold tracking-wide ${
            langue === l ? 'bg-lin-50 text-encre shadow-sm' : 'text-encre-500 hover:text-encre'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
