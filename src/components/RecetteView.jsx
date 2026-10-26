import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../supabaseClient';
import { getRecettesTableName } from '../utils/tableNames';
import { formaterDate } from '../utils/recettes';
import { useNavigate, Link } from 'react-router-dom';
import { cls, Icone, PastilleNuance, Chargement, Message } from './ui';
import { useLangue, useNombre } from '../i18n';

const RecetteView = ({ projetId, projetNom, recetteId, onEdit }) => {
  const tableName = getRecettesTableName(projetNom);
  const [recette, setRecette] = useState(null);
  const [couleurs, setCouleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t, langue } = useLangue();
  const aff = useNombre(); // virgule ou point décimal selon la langue

  useEffect(() => {
    console.log('recetteId:', recetteId);
console.log('projetNom:', projetNom);
console.log('Table name:', getRecettesTableName(projetNom));

    const fetchRecette = async () => {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('recette_id', recetteId)
          .order('couleur_numero', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const firstRow = data[0];
          setRecette({
            numero_fiche: firstRow.numero_fiche,
            date: firstRow.date,
            objet: firstRow.objet,
            matiere: firstRow.matiere,
            observations: firstRow.observations,
            pre_mordancage: firstRow.pre_mordancage,
            nom: firstRow.nom,
            rapport_de_bain: firstRow.rapport_de_bain,
            nb_parts_totales: firstRow.nb_parts_totales,
            colorant_1: firstRow.colorant_1,
            colorant_2: firstRow.colorant_2,
            colorant_3: firstRow.colorant_3,
            colorant_1_qte_poudre: firstRow.colorant_1_qte_poudre,
            colorant_2_qte_poudre: firstRow.colorant_2_qte_poudre,
            colorant_3_qte_poudre: firstRow.colorant_3_qte_poudre,
            colorant_1_dilution: firstRow.colorant_1_dilution,
            colorant_2_dilution: firstRow.colorant_2_dilution,
            colorant_3_dilution: firstRow.colorant_3_dilution,
            mordant_1: firstRow.mordant_1,
            mordant_2: firstRow.mordant_2,
            mordant_3: firstRow.mordant_3,
            mordant_1_dilution: firstRow.mordant_1_dilution,
            mordant_2_dilution: firstRow.mordant_2_dilution,
            mordant_3_dilution: firstRow.mordant_3_dilution,
          });

          setCouleurs(data.map(row => ({
            couleur_numero: row.couleur_numero,
            nb_part_colorant_1: row.nb_part_colorant_1,
            nb_part_colorant_2: row.nb_part_colorant_2,
            nb_part_colorant_3: row.nb_part_colorant_3,
            profondeur_ton: row.profondeur_ton,
            poids_tissu: row.poids_tissu,
            pourcent_mordant_1: row.pourcent_mordant_1,
            pourcent_mordant_2: row.pourcent_mordant_2,
            pourcent_mordant_3: row.pourcent_mordant_3,
            couleur_hex: row.couleur_hex,
            couleur_lab_l: row.couleur_lab_l,
            couleur_lab_a: row.couleur_lab_a,
            couleur_lab_b: row.couleur_lab_b,
            info: row.info,
            bleu_depart: row.bleu_depart,
          })));
        } else {
          setError(t('fiche.introuvable'));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (recetteId) fetchRecette();
  }, [recetteId, projetNom]);

  const getRapportDeBainValue = () => {
    if (!recette?.rapport_de_bain) return 0;
    const match = String(recette.rapport_de_bain).match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const calculateValeurDeLaPart = (profondeurTon) => {
    if (!recette.nb_parts_totales || profondeurTon === undefined || profondeurTon === null) {
      return '0,00';
    }
    const valeur = (parseFloat(profondeurTon) / parseFloat(recette.nb_parts_totales)).toFixed(4);
    return valeur.replace('.', ',');
  };

  const calculateVolumeDuBain = (poidsTissu) => {
    const rapportValue = getRapportDeBainValue();
    return rapportValue ? (poidsTissu * rapportValue).toFixed(1).replace('.', ',') : '0,0';
  };

  const calculatePourcentColorant = (couleur, colorantIndex) => {
    const nbParts = couleur[`nb_part_colorant_${colorantIndex}`] ?? 0;
    const profondeurTon = couleur.profondeur_ton ?? 0;
    const nbPartsTotales = recette.nb_parts_totales ?? 0;
  
    if (nbPartsTotales === 0) return 0;
    return (nbParts * profondeurTon / nbPartsTotales).toFixed(1);
  };  

  const calculateQuantiteColorant = (couleur, colorantIndex) => {
    const dilution = recette[`colorant_${colorantIndex}_dilution`];
    const qtePoudre = recette[`colorant_${colorantIndex}_qte_poudre`];
    const nbParts = couleur[`nb_part_colorant_${colorantIndex}`];
    const poids = couleur.poids_tissu;
    const nbPartsTotales = recette.nb_parts_totales;

    const quantite = (dilution * couleur.profondeur_ton * nbParts * poids) / (qtePoudre * nbPartsTotales);
    return quantite.toFixed(3).replace('.', ',');
  };

  // Quantité de mordant = poids du tissu × % / 100 × dilution de la solution mère
  // (même convention que les colorants : % exprimé par rapport au poids du tissu).
  const calculateQuantiteMordant = (couleur, mordantIndex) => {
    const pourcentage = parseFloat(couleur[`pourcent_mordant_${mordantIndex}`]) || 0;
    const poids = parseFloat(couleur.poids_tissu) || 0;
    const dilution = parseFloat(recette[`mordant_${mordantIndex}_dilution`]) || 1;
    return (poids * pourcentage / 100 * dilution).toFixed(3).replace('.', ',');
  };

  const calculateVolumeEauInitial = (volumeDuBain, quantites) => {
    const totalQuantites = quantites.reduce((sum, qte) => sum + parseFloat(qte.replace(',', '.')) || 0, 0);
    return (parseFloat(volumeDuBain.replace(',', '.')) - totalQuantites).toFixed(1).replace('.', ',');
  };

  const getUnite = (Index,mordantOuColorant) => {
    return recette[`${mordantOuColorant}_${Index}_dilution`] === 1 ? "g" : "ml";
  };

  if (loading) return <Chargement />;
  if (error) return <Message erreur>{error}</Message>;
  if (!recette) return <Message>{t('fiche.aucuneSelectionnee')}</Message>;

  const indexColorants = [1, 2, 3].filter((i) => recette[`colorant_${i}`]);
  const indexMordants = [1, 2, 3].filter((i) => recette[`mordant_${i}`]);
  const nombre = (v, decimales) =>
    v === null || v === undefined || v === '' ? '—' : aff(Number(v).toFixed(decimales));

  const lignesNuances = [
    {
      label: t('fiche.nbParts'),
      aide: indexColorants.map((i) => recette[`colorant_${i}`]).join(' · '),
      valeur: (c) => indexColorants.map((i) => c[`nb_part_colorant_${i}`] ?? 0).join(' · ') || '—',
    },
    { label: t('fiche.valeurPart'), aide: t('fiche.calculee'), valeur: (c) => aff(calculateValeurDeLaPart(c.profondeur_ton)) },
    { label: t('fiche.profondeur'), aide: '', valeur: (c) => nombre(c.profondeur_ton, 2) },
    { label: t('fiche.poids'), aide: 'g', valeur: (c) => aff(c.poids_tissu ?? '—') },
    { label: t('fiche.volumeBain'), aide: t('fiche.mlCalcule'), valeur: (c) => aff(calculateVolumeDuBain(c.poids_tissu)) },
    { label: t('fiche.bleuDepart'), aide: '', valeur: (c) => c.bleu_depart || '—' },
    { label: t('fiche.infosNuance'), aide: '', valeur: (c) => c.info || '—' },
  ];

  const volumeEauInitial = (couleur) => {
    const quantitesColorants = [
      calculateQuantiteColorant(couleur, 1),
      calculateQuantiteColorant(couleur, 2),
      calculateQuantiteColorant(couleur, 3),
    ];
    const quantitesMordants = [
      calculateQuantiteMordant(couleur, 1),
      calculateQuantiteMordant(couleur, 2),
      calculateQuantiteMordant(couleur, 3),
    ];
    const allQuantites = [...quantitesColorants, ...quantitesMordants];
    const volumeDuBain = calculateVolumeDuBain(couleur.poids_tissu);
    return calculateVolumeEauInitial(volumeDuBain, allQuantites);
  };

  // En-tête commun aux tableaux : une colonne par nuance
  const EnTeteNuances = ({ premiere, sousColonnes = false }) => (
    <thead>
      <tr>
        <th
          scope="col"
          rowSpan={sousColonnes ? 2 : 1}
          className="text-left px-5 py-4 font-medium text-[13px] text-encre-500 w-48"
        >
          {premiere}
        </th>
        {couleurs.map((c) => (
          <th
            key={c.couleur_numero}
            scope={sousColonnes ? 'colgroup' : 'col'}
            colSpan={sousColonnes ? 2 : 1}
            className={`px-2 font-medium ${sousColonnes ? 'pt-3.5 pb-1' : 'py-4'}`}
          >
            <PastilleNuance hex={c.couleur_hex} numero={c.couleur_numero} />
          </th>
        ))}
      </tr>
      {sousColonnes && (
        <tr>
          {couleurs.map((c) => (
            <Fragment key={c.couleur_numero}>
              <th scope="col" className="px-2 pt-1 pb-3 font-normal text-xs text-encre-500">{t('fiche.pourcent')}</th>
              <th scope="col" className="px-2 pt-1 pb-3 font-normal text-xs text-encre-500">{t('fiche.quantite')}</th>
            </Fragment>
          ))}
        </tr>
      )}
    </thead>
  );

  const Info = ({ label, children, large = false }) => (
    <div className={`flex flex-col gap-1 ${large ? 'col-span-2' : ''}`}>
      <dt className="text-[13px] text-encre-500">{label}</dt>
      <dd className="m-0 text-[15px] leading-relaxed">{children || '—'}</dd>
    </div>
  );

  return (
    <div className={`${cls.page} print-container flex flex-col gap-12 print:gap-2`}>
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col gap-5">
        <nav aria-label={t('commun.filAriane')} className="no-print flex gap-2 text-sm text-encre-500">
          <Link to="/nuancier" className="text-sauge hover:text-sauge-fonce">{t('nav.nuancier')}</Link>
          <span aria-hidden="true">/</span>
          <span>{t('commun.fiche', { n: recette.numero_fiche })}</span>
        </nav>
        <div className="flex flex-wrap gap-6 justify-between items-end">
          <div className="flex flex-col gap-2.5">
            <p className="m-0 text-sm text-encre-500">{t('fiche.sousTitre', { date: formaterDate(recette.date, langue) })}</p>
            <h1 className="m-0 font-serif font-normal text-[52px] tracking-tight">{t('commun.fiche', { n: recette.numero_fiche })}</h1>
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => window.print()} className={cls.btnSecondaire}>
              <Icone.Imprimante />{t('fiche.imprimer')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/recette/${recetteId}/edit`)}  // Navigue vers l'URL d'édition
              className={cls.btnPrimaire}
            >
              <Icone.Crayon />{t('fiche.modifier')}
            </button>
          </div>
        </div>
      </div>

      {/* ===== COULEURS OBTENUES ===== */}
      <section aria-label={t('fiche.couleurs')} className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {couleurs.map((c) => (
          <div key={c.couleur_numero} className="flex flex-col gap-2.5">
            <div
              className="relative h-36 print:h-10 rounded-[14px] border border-black/5"
              style={{ backgroundColor: c.couleur_hex || '#FFFFFF' }}
            >
              <span className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-lin-50/90 flex items-center justify-center text-[13px] font-semibold">
                {c.couleur_numero}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 font-mono text-xs text-encre-600">
              <span className="font-medium text-encre">{c.couleur_hex || '—'}</span>
              <span>Lab {c.couleur_lab_l}, {c.couleur_lab_a}, {c.couleur_lab_b}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ===== INFORMATIONS + BAIN ===== */}
      <section className="flex flex-wrap gap-6">
        <div className={`${cls.carte} flex-[1_1_520px] p-7 flex flex-col gap-5`}>
          <h2 className={`m-0 ${cls.h3}`}>{t('fiche.informations')}</h2>
          <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-5">
            <Info label={t('fiche.nom')}>{recette.nom}</Info>
            <Info label={t('fiche.date')}>{formaterDate(recette.date, langue)}</Info>
            <Info label={t('fiche.objet')}>{recette.objet}</Info>
            <Info label={t('fiche.matiere')}>{recette.matiere}</Info>
            <Info label={t('fiche.preMordancage')} large>{recette.pre_mordancage}</Info>
            <Info label={t('fiche.observations')} large>{recette.observations}</Info>
          </dl>
        </div>

        <div className={`${cls.carte} flex-[1_1_400px] p-7 flex flex-col gap-5`}>
          <h2 className={`m-0 ${cls.h3}`}>{t('fiche.bain')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3.5 rounded-xl bg-lin-200">
              <div className="text-[13px] text-encre-500">{t('fiche.rapportDeBain')}</div>
              <div className="mt-1 font-mono text-[22px] font-medium">
                {recette.rapport_de_bain ? `1:${recette.rapport_de_bain}` : '—'}
              </div>
            </div>
            <div className="px-4 py-3.5 rounded-xl bg-lin-200">
              <div className="text-[13px] text-encre-500">{t('fiche.partsTotales')}</div>
              <div className="mt-1 font-mono text-[22px] font-medium">{recette.nb_parts_totales ?? '—'}</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-encre-500">
                <th className="py-2 font-medium text-[13px]">{t('fiche.colorant')}</th>
                <th className="py-2 font-medium text-[13px] text-right">{t('fiche.poudre')}</th>
                <th className="py-2 font-medium text-[13px] text-right">{t('fiche.dilution')}</th>
              </tr>
            </thead>
            <tbody>
              {indexColorants.length === 0 && (
                <tr className="border-t border-lin-400"><td colSpan="3" className="py-2.5 text-encre-500">—</td></tr>
              )}
              {indexColorants.map((i) => (
                <tr key={i} className="border-t border-lin-400">
                  <td className="py-2.5">{recette[`colorant_${i}`]}</td>
                  <td className="py-2.5 text-right font-mono">{recette[`colorant_${i}_qte_poudre`] || '0'}</td>
                  <td className="py-2.5 text-right font-mono">{recette[`colorant_${i}_dilution`] || '1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-encre-500">
                <th className="py-2 font-medium text-[13px]">{t('fiche.mordantNuancage')}</th>
                <th className="py-2 font-medium text-[13px] text-right">{t('fiche.dilution')}</th>
              </tr>
            </thead>
            <tbody>
              {indexMordants.length === 0 && (
                <tr className="border-t border-lin-400"><td colSpan="2" className="py-2.5 text-encre-500">—</td></tr>
              )}
              {indexMordants.map((i) => (
                <tr key={i} className="border-t border-lin-400">
                  <td className="py-2.5">{recette[`mordant_${i}`]}</td>
                  <td className="py-2.5 text-right font-mono">{recette[`mordant_${i}_dilution`] || '1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== NUANCES ===== */}
      <section className="flex flex-col gap-4">
        <h2 className={`m-0 ${cls.h2}`}>{t('fiche.nuances')}</h2>
        <div className={cls.tableau}>
          <table className="w-full min-w-[900px] text-sm">
            <EnTeteNuances premiere={t('fiche.nuance')} />
            <tbody>
              {lignesNuances.map((ligne) => (
                <tr key={ligne.label} className="border-t border-lin-400">
                  <th scope="row" className="text-left px-5 py-3.5 font-normal text-encre-700">
                    {ligne.label}
                    {ligne.aide && <span className="block text-xs text-encre-500">{ligne.aide}</span>}
                  </th>
                  {couleurs.map((c) => (
                    <td key={c.couleur_numero} className="px-3 py-3.5 text-center font-mono">
                      {ligne.valeur(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== COLORANTS ===== */}
      <section className="flex flex-col gap-4">
        <h2 className={`m-0 ${cls.h2}`}>{t('fiche.colorants')}</h2>
        <div className={cls.tableau}>
          <table className="w-full min-w-[1000px] text-sm">
            <EnTeteNuances premiere={t('fiche.colorant')} sousColonnes />
            <tbody>
              {indexColorants.map((i) => (
                <tr key={i} className="border-t border-lin-400">
                  <th scope="row" className="text-left px-5 py-3.5 font-normal text-encre-700">
                    {recette[`colorant_${i}`] || '—'}
                    <span className="block text-xs text-encre-500">{getUnite(i, 'colorant')}</span>
                  </th>
                  {couleurs.map((couleur) => (
                    <Fragment key={couleur.couleur_numero}>
                      <td className="px-2 py-3.5 text-center font-mono text-encre-500">
                        {aff(calculatePourcentColorant(couleur, i))}
                      </td>
                      <td className="px-2 py-3.5 text-center font-mono font-medium">
                        {aff(calculateQuantiteColorant(couleur, i))}
                      </td>
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== MORDANTS ===== */}
      <section className="flex flex-col gap-4">
        <h2 className={`m-0 ${cls.h2}`}>{t('fiche.mordants')}</h2>
        <div className={cls.tableau}>
          <table className="w-full min-w-[1000px] text-sm">
            <EnTeteNuances premiere={t('fiche.mordant')} sousColonnes />
            <tbody>
              {indexMordants.map((i) => (
                <tr key={i} className="border-t border-lin-400">
                  <th scope="row" className="text-left px-5 py-3.5 font-normal text-encre-700">
                    {recette[`mordant_${i}`] || '—'}
                    <span className="block text-xs text-encre-500">{getUnite(i, 'mordant')}</span>
                  </th>
                  {couleurs.map((couleur) => {
                    const pourcentage = couleur[`pourcent_mordant_${i}`];
                    return (
                      <Fragment key={couleur.couleur_numero}>
                        <td className="px-2 py-3.5 text-center font-mono text-encre-500">{aff(pourcentage)}</td>
                        <td className="px-2 py-3.5 text-center font-mono font-medium">
                          {aff(calculateQuantiteMordant(couleur, i))}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== VOLUME D'EAU INITIAL ===== */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-baseline gap-4">
          <h2 className={`m-0 ${cls.h2}`}>{t('fiche.volumeEau')}</h2>
          <p className="m-0 text-sm text-encre-500">{t('fiche.volumeEauNote')}</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {couleurs.map((c) => (
            <div key={c.couleur_numero} className={`${cls.carte} rounded-2xl flex items-center gap-3.5 px-5 py-4`}>
              <span
                className="w-8 h-8 flex-none rounded-lg border border-black/5 flex items-center justify-center text-[13px] font-semibold"
                style={{ backgroundColor: c.couleur_hex || '#FFFFFF' }}
              >
                {c.couleur_numero}
              </span>
              <span className="font-mono text-[22px] font-medium">{aff(volumeEauInitial(c))}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default RecetteView;
