import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TABLE_RECETTES } from '../utils/recettes';
import { Link } from 'react-router-dom';
import { labComplet, labVersHex, labVersLch, lchVersLab, deltaE2000 } from '../utils/couleurs';
import { cls, Chargement, Message, fondCouleur } from './ui';
import { useT, useNombre } from '../i18n';

const NB_RESULTATS = 10;

// « 50, 20, -10 », « 50 20 -10 » ou « 50,5 ; 20 ; -10 » → [50, 20, -10]
const lireTroisNombres = (texte) => {
  const brut = texte.trim();
  if (!brut) return null;
  const morceaux = brut.includes(';')
    ? brut.split(';').map((p) => p.trim().replace(',', '.'))
    : brut.split(/[\s,]+/);
  const nombres = morceaux.filter((p) => p !== '').map(Number);
  return nombres.length === 3 && nombres.every(Number.isFinite) ? nombres : null;
};

// Couleur saisie → Lab, quel que soit le format choisi
const versLab = (format, valeurs) => {
  if (!valeurs) return null;
  return format === 'lch' ? lchVersLab(...valeurs) : valeurs;
};

// ========== COMPOSANT ==========
// La recherche porte sur TOUS les projets auxquels l'utilisateur a accès.
const RechercheCouleur = ({ projetId, projets = [], onChangerProjet }) => {
  const t = useT();
  const nombre = useNombre();
  const [couleurs, setCouleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projetsEnErreur, setProjetsEnErreur] = useState([]);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('lab');
  const [results, setResults] = useState([]);
  const [cible, setCible] = useState(null); // couleur recherchée { hex, lab }

  // Clé stable : on ne recharge que si la liste des projets change vraiment
  const cleProjets = projets.map((p) => `${p.id}:${p.nom}`).join('|');

  // Récupération des couleurs de chaque projet
  useEffect(() => {
    let annule = false;

    const fetchCouleurs = async () => {
      setLoading(true);
      // Une seule requête pour tous les projets accessibles (RLS : uniquement ceux de l'utilisateur)
      const nomsProjets = new Map(projets.map((p) => [p.id, p.nom]));
      const { data, error } = projets.length
        ? await supabase
            .from(TABLE_RECETTES)
            .select('projet_id, recette_id, numero_fiche, couleur_numero, couleur_lab_l, couleur_lab_a, couleur_lab_b, colorant_1, colorant_2, colorant_3')
            .in('projet_id', projets.map((p) => p.id))
        : { data: [], error: null };
      if (annule) return;
      if (error) console.error('Recherche : erreur de chargement des fiches :', error);

      const toutes = [];
      (data || []).forEach((row) => {
        // Seules les nuances dont le Lab est renseigné sont comparables
        if (!labComplet(row.couleur_lab_l, row.couleur_lab_a, row.couleur_lab_b)) return;
        toutes.push({
          projetId: row.projet_id,
          projetNom: nomsProjets.get(row.projet_id) || '',
          recette_id: row.recette_id,
          fiche: row.numero_fiche,
          indexCouleur: row.couleur_numero,
          hex: labVersHex(row.couleur_lab_l, row.couleur_lab_a, row.couleur_lab_b),
          lab: [row.couleur_lab_l, row.couleur_lab_a, row.couleur_lab_b].map(Number),
          colorants: [row.colorant_1, row.colorant_2, row.colorant_3].filter(Boolean).join(', '),
        });
      });
      setCouleurs(toutes);
      setProjetsEnErreur(error ? projets.map((p) => p.nom) : []);
      setLoading(false);
    };

    fetchCouleurs();
    return () => { annule = true; };
  }, [cleProjets]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setCible(null);

    const queryLab = versLab(searchType, lireTroisNombres(query));
    if (!queryLab) {
      setResults([]);
      return;
    }
    setCible({ hex: labVersHex(...queryLab), lab: queryLab });

    // Calcul des distances et tri
    setResults(
      couleurs
        .map((couleur) => ({ ...couleur, distance: deltaE2000(queryLab, couleur.lab) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NB_RESULTATS)
    );
  };

  const fmt = (n) => (Number.isFinite(Number(n)) ? Number(n).toFixed(2) : '—');

  // Aperçu en direct de la saisie (avant même de lancer la recherche), avec l'autre code
  let apercu = null;
  const valeurs = lireTroisNombres(query);
  if (valeurs) {
    const lab = versLab(searchType, valeurs);
    const hex = labVersHex(...lab);
    if (hex) {
      apercu = {
        hex,
        autre: searchType === 'lch'
          ? `Lab ${lab.map(fmt).join(', ')}`
          : `LCh ${labVersLch(...lab).map(fmt).join(', ')}`,
      };
    }
  }

  if (loading) return <Chargement texte={t('nuancier.chargement')} />;
  if (projets.length === 0) return <Message>{t('projet.aucun')}</Message>;

  return (
    <div className={`${cls.page} pt-14 flex flex-col gap-10`}>
      <div className="flex flex-col gap-2.5">
        <h1 className={`m-0 ${cls.h1}`}>{t('recherche.titre')}</h1>
        <p className="m-0 text-base text-encre-500 max-w-xl leading-relaxed">
          {t('recherche.intro', { n: projets.length })}
        </p>
        {projetsEnErreur.length > 0 && (
          <p className="m-0 text-sm text-alerte-texte">
            {t('recherche.projetsIgnores', { projets: projetsEnErreur.join(', ') })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-8 items-start">
        <form
          onSubmit={handleSearch}
          className={`${cls.carte} flex-[1_1_320px] max-w-sm flex flex-col gap-5 p-7`}
        >
          <div
            className="h-44 rounded-[14px] border border-black/5 flex items-center justify-center text-sm text-encre-500"
            style={apercu ? { backgroundColor: apercu.hex } : undefined}
          >
            {!apercu && t('recherche.apercu')}
          </div>

          <div role="group" aria-label={t('recherche.format')} className="flex gap-1 p-1 rounded-full bg-lin-300">
            {[['lab', 'Lab'], ['lch', 'LCh']].map(([id, label]) => (
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
              {searchType === 'lch' ? t('recherche.labelLch') : t('recherche.labelLab')}
            </label>
            <input
              id="couleur-cible"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === 'lch' ? t('recherche.exempleLch') : t('recherche.exempleLab')}
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
                {results.map((couleur, index) => {
                  const autreProjet = couleur.projetId !== projetId;
                  return (
                    <Link
                      key={`${couleur.projetId}-${couleur.recette_id}-${couleur.indexCouleur}`}
                      to={`/recette/${couleur.recette_id}`}
                      // Fiche d'un autre projet : on bascule sur ce projet avant d'ouvrir la fiche
                      onClick={() => {
                        if (autreProjet && onChangerProjet) onChangerProjet(couleur.projetId, couleur.projetNom);
                      }}
                      className="flex flex-wrap items-center gap-5 px-6 py-4 border-b last:border-b-0 border-lin-400 no-underline text-encre hover:bg-lin-50"
                    >
                      <span className="w-6 font-mono text-sm font-medium text-encre-500">{index + 1}</span>
                      <span aria-hidden="true" className="flex w-28 h-14 rounded-xl overflow-hidden flex-none border border-black/5">
                        <span className="flex-1" style={fondCouleur(cible?.hex)} />
                        <span className="flex-1" style={fondCouleur(couleur.hex)} />
                      </span>
                      <span className="flex-[1_1_200px] flex flex-col gap-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-medium">{t('commun.ficheNuance', { f: couleur.fiche, n: couleur.indexCouleur })}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              autreProjet ? 'bg-[#EFE3D3] text-brun' : 'bg-sauge-pale text-encre'
                            }`}
                            title={autreProjet ? t('recherche.autreProjet') : t('recherche.projetActuel')}
                          >
                            {couleur.projetNom}
                          </span>
                        </span>
                        <span className="text-sm text-encre-600">{couleur.colorants || '—'}</span>
                        <span className="font-mono text-xs text-encre-500">
                          Lab {couleur.lab.map(fmt).join(', ')} · LCh {labVersLch(...couleur.lab).map(fmt).join(', ')}
                        </span>
                      </span>
                      <span className="min-w-[110px] text-right font-mono text-lg font-medium">
                        ΔE {nombre(couleur.distance.toFixed(2).replace('.', ','))}
                      </span>
                    </Link>
                  );
                })}
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
