import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { getRecettesTableName } from '../utils/tableNames';
import { rechercherRecetteParNumero } from '../utils/recettes';
import { useNavigate, Link } from 'react-router-dom';
import { labComplet, labVersHex, labVersLch } from '../utils/couleurs';
import { cls, Chargement, Message, fondCouleur } from './ui';
import { useT } from '../i18n';

const TOUS = 'Tous';

// Angle de teinte (0-360°) calculé depuis a* et b*
const teinte = (c) => {
  const a = Number(c.lab_a) || 0;
  const b = Number(c.lab_b) || 0;
  return (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
};

const Nuancier = ({ projetId, projetNom }) => {
  const navigate = useNavigate();
  const t = useT();
  const [couleurs, setCouleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numeroFicheRecherche, setNumeroFicheRecherche] = useState('');
  const [erreurRecherche, setErreurRecherche] = useState('');
  const [filtre, setFiltre] = useState(TOUS);
  const [tri, setTri] = useState('fiche');

  useEffect(() => {
    const fetchCouleurs = async () => {
      setLoading(true);
      setError(null);

      if (!projetId || !projetNom) {
        setError({ cle: 'commun.projetNonSelectionne' });
        setLoading(false);
        return;
      }

      const tableName = getRecettesTableName(projetNom);
      if (!tableName) {
        setError({ cle: 'commun.erreurTable' });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('numero_fiche, couleur_numero, couleur_lab_l, couleur_lab_a, couleur_lab_b, colorant_1, colorant_2, colorant_3, recette_id');

        if (error) {
          throw error;
        }

        // Une entrée par nuance dont le Lab est renseigné (la couleur affichée en est calculée)
        const uniqueCouleurs = [];
        const seen = new Set();
        data.forEach((row) => {
          const cle = `${row.recette_id}-${row.couleur_numero}`;
          if (labComplet(row.couleur_lab_l, row.couleur_lab_a, row.couleur_lab_b) && !seen.has(cle)) {
            seen.add(cle);
            uniqueCouleurs.push({
              fiche: row.numero_fiche,
              indexCouleur: row.couleur_numero,
              hex: labVersHex(row.couleur_lab_l, row.couleur_lab_a, row.couleur_lab_b),
              lch: labVersLch(row.couleur_lab_l, row.couleur_lab_a, row.couleur_lab_b),
              lab_L: row.couleur_lab_l,
              lab_a: row.couleur_lab_a,
              lab_b: row.couleur_lab_b,
              listeColorants: [row.colorant_1, row.colorant_2, row.colorant_3].filter(c => c),
              colorants: [row.colorant_1, row.colorant_2, row.colorant_3]
                .filter(c => c)
                .join(', '),
              recette_id: row.recette_id,
            });
          }
        });
        setCouleurs(uniqueCouleurs);
      } catch (err) {
        console.error('Erreur lors de la récupération des couleurs:', err);
        setError({ cle: 'commun.erreur', message: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchCouleurs();
  }, [projetId, projetNom]);

  // Colorants présents dans le projet, pour les filtres
  const colorantsDisponibles = useMemo(() => {
    const set = new Set();
    couleurs.forEach((c) => c.listeColorants.forEach((nom) => set.add(nom)));
    return [TOUS, ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
  }, [couleurs]);

  const couleursAffichees = useMemo(() => {
    const filtrees = filtre === TOUS ? couleurs : couleurs.filter((c) => c.listeColorants.includes(filtre));
    const triees = [...filtrees];
    if (tri === 'couleur') {
      triees.sort((a, b) => teinte(a) - teinte(b) || (Number(b.lab_L) || 0) - (Number(a.lab_L) || 0));
    } else {
      triees.sort((a, b) =>
        String(a.fiche).localeCompare(String(b.fiche), 'fr', { numeric: true }) ||
        (a.indexCouleur || 0) - (b.indexCouleur || 0)
      );
    }
    return triees;
  }, [couleurs, filtre, tri]);

  const handleSearchByNumeroFiche = async (e) => {
    e.preventDefault();
    setErreurRecherche('');
    const { recetteId, erreur } = await rechercherRecetteParNumero(projetNom, numeroFicheRecherche.trim());
    if (recetteId) navigate(`/recette/${recetteId}`);  // Navigue vers l'URL de la recette
    else if (erreur) setErreurRecherche(t(erreur.cle, { message: erreur.message }));
  };

  if (loading) {
    return <Chargement texte={t('nuancier.chargement')} />;
  }

  if (error) {
    if (error.cle === 'commun.projetNonSelectionne') return <Message>{t('commun.selectionnezProjet')}</Message>;
    return <Message erreur>{t(error.cle, { message: error.message })}</Message>;
  }

  return (
    <div className={`${cls.page} pt-14 flex flex-col gap-8`}>
      <div className="flex flex-wrap gap-6 justify-between items-end">
        <div className="flex flex-col gap-2.5">
          <h1 className={`m-0 ${cls.h1}`}>{t('nuancier.titre')}</h1>
          <p className="m-0 text-base text-encre-500">
            {t('nuancier.compte', { n: couleursAffichees.length })} · {projetNom}
          </p>
        </div>

        {/* Recherche par numéro de fiche */}
        <form onSubmit={handleSearchByNumeroFiche} className="flex flex-col gap-1.5 flex-[0_1_420px]">
          <div className="flex gap-2">
            <label htmlFor="numero-fiche" className="sr-only">{t('commun.numeroFiche')}</label>
            <input
              id="numero-fiche"
              type="text"
              placeholder={t('commun.placeholderNumero')}
              value={numeroFicheRecherche}
              onChange={(e) => setNumeroFicheRecherche(e.target.value)}
              className={`${cls.inputMono} flex-1 min-w-0 px-4 bg-lin-50`}
            />
            <button type="submit" className={cls.btnPrimaire}>{t('commun.ouvrir')}</button>
          </div>
          {erreurRecherche && <p className="m-0 text-sm text-alerte-texte">{erreurRecherche}</p>}
        </form>
      </div>

      <div className="flex flex-wrap gap-4 justify-between items-center pb-2 border-b border-lin-500">
        <div role="group" aria-label={t('nuancier.filtrer')} className="flex flex-wrap gap-2">
          {colorantsDisponibles.map((nom) => {
            const actif = nom === filtre;
            return (
              <button
                type="button"
                key={nom}
                onClick={() => setFiltre(nom)}
                aria-pressed={actif}
                className={`h-10 px-4 rounded-full border text-sm font-medium ${
                  actif
                    ? 'bg-sauge border-sauge text-lin-50'
                    : 'bg-lin-50 border-lin-600 text-encre-700 hover:border-sauge'
                }`}
              >
                {nom === TOUS ? t('nuancier.tous') : nom}
              </button>
            );
          })}
        </div>
        <div role="group" aria-label={t('nuancier.trier')} className="flex gap-1 p-1 rounded-full bg-lin-300">
          {[['fiche', t('nuancier.parFiche')], ['couleur', t('nuancier.parCouleur')]].map(([id, label]) => (
            <button
              type="button"
              key={id}
              onClick={() => setTri(id)}
              aria-pressed={tri === id}
              className={`h-9 px-3.5 rounded-full text-[13px] font-medium text-encre ${tri === id ? 'bg-lin-50' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {couleursAffichees.length === 0 ? (
        <div className="text-center py-4 text-encre-500">{t('nuancier.aucuneCouleur')}</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-5 gap-y-7">
          {couleursAffichees.map((couleur, index) => (
            <Link
              key={index}
              to={`/recette/${couleur.recette_id}`}  // Navigue vers l'URL de la recette
              className="group flex flex-col gap-3 no-underline text-encre"
            >
              <span
                className="block aspect-[4/3] rounded-[14px] border border-black/5 transition-transform group-hover:-translate-y-0.5"
                style={fondCouleur(couleur.hex)}
              />
              <span className="flex flex-col gap-1 px-0.5">
                <span className="flex justify-between items-baseline gap-2">
                  <span className="text-[15px] font-medium">{t('commun.fiche', { n: couleur.fiche })}</span>
                  <span className="text-[13px] text-encre-500">{t('commun.numeroNuance', { n: couleur.indexCouleur })}</span>
                </span>
                <span className="text-sm text-encre-600">{couleur.colorants || '—'}</span>
                <span className="flex flex-col font-mono text-xs text-encre-500">
                  <span>Lab {couleur.lab_L}, {couleur.lab_a}, {couleur.lab_b}</span>
                  <span>LCh {couleur.lch.join(', ')}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Nuancier;
