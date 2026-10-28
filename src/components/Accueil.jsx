import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getRecettesTableName } from '../utils/tableNames';
import { rechercherRecetteParNumero, formaterDate } from '../utils/recettes';
import { labVersHex } from '../utils/couleurs';
import { cls, Icone, Chargement } from './ui';
import { useLangue } from '../i18n';

const NB_DERNIERES_FICHES = 4;

const raccourcis = [
  {
    to: '/nouvelle-recette',
    titre: 'accueil.nouvelleTitre',
    texte: 'accueil.nouvelleTexte',
    Icon: Icone.Plus,
    fond: 'bg-sauge-pale text-sauge',
  },
  {
    to: '/recherche-teinte',
    titre: 'accueil.rechercheTitre',
    texte: 'accueil.rechercheTexte',
    Icon: Icone.Loupe,
    fond: 'bg-[#EFE3D3] text-brun',
  },
  {
    to: '/nuancier',
    titre: 'accueil.nuancierTitre',
    texte: 'accueil.nuancierTexte',
    Icon: Icone.Grille,
    fond: 'bg-[#F1EAD8] text-[#6B5C22]',
  },
];

const Accueil = ({ projetId, projetNom }) => {
  const navigate = useNavigate();
  const { t, langue } = useLangue();
  const [prenom, setPrenom] = useState('');
  const [fiches, setFiches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [numero, setNumero] = useState('');
  const [erreurNumero, setErreurNumero] = useState('');

  // Prénom affiché dans le message d'accueil (si renseigné dans le profil Supabase)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const meta = user?.user_metadata || {};
      setPrenom(meta.prenom || meta.first_name || meta.nom || meta.name || '');
    });
  }, []);

  // Dernières fiches du projet
  useEffect(() => {
    const fetchFiches = async () => {
      if (!projetId || !projetNom) {
        setFiches([]);
        return;
      }
      const tableName = getRecettesTableName(projetNom);
      if (!tableName) return;

      setLoading(true);
      const { data, error } = await supabase
        .from(tableName)
        .select('recette_id, numero_fiche, date, matiere, colorant_1, colorant_2, colorant_3, couleur_numero, couleur_lab_l, couleur_lab_a, couleur_lab_b')
        .order('date', { ascending: false })
        .order('couleur_numero', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des fiches :', error);
        setFiches([]);
      } else {
        const parRecette = new Map();
        data.forEach((row) => {
          if (!parRecette.has(row.recette_id)) {
            parRecette.set(row.recette_id, {
              recette_id: row.recette_id,
              numero_fiche: row.numero_fiche,
              date: row.date,
              matiere: row.matiere,
              colorants: [row.colorant_1, row.colorant_2, row.colorant_3].filter(Boolean).join(', '),
              couleurs: [],
            });
          }
          // Couleur affichée calculée depuis le Lab (nuances non mesurées ignorées)
          const hex = labVersHex(row.couleur_lab_l, row.couleur_lab_a, row.couleur_lab_b);
          if (hex) parRecette.get(row.recette_id).couleurs.push(hex);
        });
        setFiches(Array.from(parRecette.values()).slice(0, NB_DERNIERES_FICHES));
      }
      setLoading(false);
    };

    fetchFiches();
  }, [projetId, projetNom]);

  const ouvrirFiche = async (e) => {
    e.preventDefault();
    setErreurNumero('');
    const { recetteId, erreur } = await rechercherRecetteParNumero(projetNom, numero.trim());
    if (recetteId) navigate(`/recette/${recetteId}`);
    else if (erreur) setErreurNumero(t(erreur.cle, { message: erreur.message }));
  };

  return (
    <div className={`${cls.page} pt-16 flex flex-col gap-16`}>
      <section className="flex flex-wrap gap-10 items-end justify-between">
        <div className="flex-[1_1_520px] flex flex-col gap-4">
          <p className="m-0 text-[13px] tracking-[0.08em] uppercase text-encre-500">
            {projetNom ? t('accueil.projet', { nom: projetNom }) : t('accueil.aucunProjet')}
          </p>
          <h1 className="m-0 font-serif font-normal text-[56px] leading-[1.05] tracking-tight">
            {prenom ? t('accueil.bonjourNom', { nom: prenom }) : t('accueil.bonjour')}
          </h1>
          <p className="m-0 text-lg leading-relaxed text-encre-600 max-w-lg">
            {projetNom ? t('accueil.intro') : t('accueil.introSansProjet')}
          </p>
        </div>

        {projetId && (
          <form onSubmit={ouvrirFiche} className="flex-[1_1_380px] max-w-md flex flex-col gap-2">
            <label htmlFor="numero-fiche-accueil" className={cls.label}>{t('accueil.ouvrirFiche')}</label>
            <div className="flex gap-2">
              <input
                id="numero-fiche-accueil"
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder={t('commun.placeholderNumero')}
                className={`${cls.inputMono} flex-1 min-w-0 h-12 px-4 bg-lin-50 text-base`}
              />
              <button type="submit" className={`${cls.btnPrimaire} h-12`}>{t('commun.ouvrir')}</button>
            </div>
            {erreurNumero && <p className="m-0 text-sm text-alerte-texte">{erreurNumero}</p>}
          </form>
        )}
      </section>

      <section aria-label={t('accueil.raccourcis')} className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        {raccourcis.map(({ to, titre, texte, Icon, fond }) => (
          <Link
            key={to}
            to={to}
            className={`${cls.carte} flex flex-col gap-6 p-6 no-underline text-encre hover:border-sauge`}
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${fond}`}>
              <Icon />
            </span>
            <span className="flex flex-col gap-1.5">
              <span className="font-serif text-[22px]">{t(titre)}</span>
              <span className="text-sm text-encre-500 leading-relaxed">{t(texte)}</span>
            </span>
          </Link>
        ))}
      </section>

      {projetId && (
        <section className="flex flex-col gap-5">
          <div className="flex flex-wrap justify-between items-baseline gap-4">
            <h2 className={`m-0 ${cls.h2}`}>{t('accueil.dernieres')}</h2>
            <Link to="/nuancier" className="text-[15px] font-medium text-sauge hover:text-sauge-fonce">
              {t('accueil.toutNuancier')}
            </Link>
          </div>

          {loading ? (
            <Chargement texte={t('accueil.chargementFiches')} />
          ) : fiches.length === 0 ? (
            <p className="m-0 text-encre-500">{t('accueil.aucuneFiche')}</p>
          ) : (
            <div className="rounded-[20px] border border-lin-500 bg-lin-100 overflow-hidden">
              {fiches.map((f) => (
                <Link
                  key={f.recette_id}
                  to={`/recette/${f.recette_id}`}
                  className="flex flex-wrap items-center gap-6 px-6 py-5 border-b last:border-b-0 border-lin-400 no-underline text-encre hover:bg-lin-50"
                >
                  <span className="flex w-[168px] h-10 rounded-[10px] overflow-hidden flex-none bg-lin-300">
                    {f.couleurs.map((hex, i) => (
                      <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
                    ))}
                  </span>
                  <span className="flex-[1_1_240px] flex flex-col gap-1 min-w-0">
                    <span className="text-base font-medium">{t('commun.fiche', { n: f.numero_fiche })}</span>
                    <span className="text-sm text-encre-500">
                      {[f.colorants, f.matiere].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </span>
                  <span className="text-sm text-encre-500 w-24">{formaterDate(f.date, langue)}</span>
                  <Icone.Droite className="text-encre-500" />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Accueil;
