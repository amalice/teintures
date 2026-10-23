import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import chroma from 'chroma-js';
import { getRecettesTableName } from '../utils/tableNames';
import { useNavigate, Link } from 'react-router-dom';
import { cls, Icone, PastilleNuance } from './ui';

// ===== Petits composants de mise en page =====
// Définis hors du composant principal pour que React ne recrée pas les champs
// (et ne perde pas le focus) à chaque frappe.

const ChampInfo = ({ name, label, value, onChange, type = 'text', required = false, mono = false }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={`f-${name}`} className={cls.labelPetit}>{label}{required && ' *'}</label>
    <input
      id={`f-${name}`}
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      className={mono ? cls.inputMono : cls.input}
      required={required}
    />
  </div>
);

// En-tête commun aux tableaux : une colonne par nuance
const EnTeteNuances = ({ couleurs, premiere, sousColonnes = false }) => (
  <thead>
    <tr>
      <th scope="col" className="text-left px-5 pt-4 pb-2 font-medium text-[13px] text-encre-500 w-48">{premiere}</th>
      {couleurs.map((c) => (
        <th key={c.couleur_numero} scope="col" className="px-2 pt-4 pb-2 font-medium">
          <PastilleNuance hex={c.couleur_hex} numero={c.couleur_numero} />
          {sousColonnes && (
            <span className="grid grid-cols-2 gap-1 mt-1.5 text-xs font-normal text-encre-500">
              <span>%</span><span>quantité</span>
            </span>
          )}
        </th>
      ))}
    </tr>
  </thead>
);

const LigneTitre = ({ label, aide }) => (
  <th scope="row" className="text-left px-5 py-3 font-normal text-encre-700">
    {label}
    {aide && <span className="block text-xs text-encre-500">{aide}</span>}
  </th>
);

const Section = ({ titre, note, children, minWidth = 'min-w-[1060px]' }) => (
  <section className="flex flex-col gap-4">
    <div className="flex flex-wrap justify-between items-baseline gap-4">
      <h2 className={`m-0 ${cls.h2}`}>{titre}</h2>
      {note && <p className="m-0 text-sm text-encre-500">{note}</p>}
    </div>
    <div className={cls.tableau}>
      <table className={`w-full ${minWidth} text-sm`}>{children}</table>
    </div>
  </section>
);

const BoutonsAction = ({ onAnnuler, loading, recetteId }) => (
  <div className="flex gap-2.5">
    <button type="button" onClick={onAnnuler} className={cls.btnSecondaire}>Annuler</button>
    <button type="submit" disabled={loading} className={cls.btnPrimaire}>
      <Icone.Valider />
      {loading ? 'Enregistrement…' : recetteId ? 'Mettre à jour' : 'Enregistrer'}
    </button>
  </div>
);

const RecetteForm = ({ projetId, projetNom, recetteId = null, onSuccess }) => {
  const tableName = getRecettesTableName(projetNom);

  const [recette, setRecette] = useState({
    numero_fiche: '',
    date: new Date().toISOString().split('T')[0],
    objet: '',
    matiere: '',
    observations: '',
    pre_mordancage: '',
    nom: '',
    rapport_de_bain: '',
    nb_parts_totales: 100,
    colorant_1: '',
    colorant_2: '',
    colorant_3: '',
    colorant_1_qte_poudre: 100,
    colorant_2_qte_poudre: 100,
    colorant_3_qte_poudre: 100,
    colorant_1_dilution: 1,
    colorant_2_dilution: 1,
    colorant_3_dilution: 1,
    mordant_1: '',
    mordant_2: '',
    mordant_3: '',
    mordant_1_dilution: 1,
    mordant_2_dilution: 1,
    mordant_3_dilution: 1,
  });

  const [couleurs, setCouleurs] = useState([
    { couleur_numero: 1, nb_part_colorant_1: 0, nb_part_colorant_2: 0, nb_part_colorant_3: 0, profondeur_ton: 0, poids_tissu: 0, bleu_depart: '', info: '', pourcent_mordant_1: 0, pourcent_mordant_2: 0, pourcent_mordant_3: 0, couleur_hex: '#FFFFFF', couleur_lab_l: 100, couleur_lab_a: 0, couleur_lab_b: 0 },
    { couleur_numero: 2, nb_part_colorant_1: 0, nb_part_colorant_2: 0, nb_part_colorant_3: 0, profondeur_ton: 0, poids_tissu: 0, bleu_depart: '', info: '', pourcent_mordant_1: 0, pourcent_mordant_2: 0, pourcent_mordant_3: 0, couleur_hex: '#FFFFFF', couleur_lab_l: 100, couleur_lab_a: 0, couleur_lab_b: 0 },
    { couleur_numero: 3, nb_part_colorant_1: 0, nb_part_colorant_2: 0, nb_part_colorant_3: 0, profondeur_ton: 0, poids_tissu: 0, bleu_depart: '', info: '', pourcent_mordant_1: 0, pourcent_mordant_2: 0, pourcent_mordant_3: 0, couleur_hex: '#FFFFFF', couleur_lab_l: 100, couleur_lab_a: 0, couleur_lab_b: 0 },
    { couleur_numero: 4, nb_part_colorant_1: 0, nb_part_colorant_2: 0, nb_part_colorant_3: 0, profondeur_ton: 0, poids_tissu: 0, bleu_depart: '', info: '', pourcent_mordant_1: 0, pourcent_mordant_2: 0, pourcent_mordant_3: 0, couleur_hex: '#FFFFFF', couleur_lab_l: 100, couleur_lab_a: 0, couleur_lab_b: 0 },
    { couleur_numero: 5, nb_part_colorant_1: 0, nb_part_colorant_2: 0, nb_part_colorant_3: 0, profondeur_ton: 0, poids_tissu: 0, bleu_depart: '', info: '', pourcent_mordant_1: 0, pourcent_mordant_2: 0, pourcent_mordant_3: 0, couleur_hex: '#FFFFFF', couleur_lab_l: 100, couleur_lab_a: 0, couleur_lab_b: 0 },
    { couleur_numero: 6, nb_part_colorant_1: 0, nb_part_colorant_2: 0, nb_part_colorant_3: 0, profondeur_ton: 0, poids_tissu: 0, bleu_depart: '', info: '', pourcent_mordant_1: 0, pourcent_mordant_2: 0, pourcent_mordant_3: 0, couleur_hex: '#FFFFFF', couleur_lab_l: 100, couleur_lab_a: 0, couleur_lab_b: 0 },
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (recetteId) {
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

            const newCouleurs = [...couleurs];
            data.forEach((row) => {
              const index = row.couleur_numero - 1;
              if (index >= 0 && index < 6) {
                newCouleurs[index] = {
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
                };
              }
            });
            setCouleurs(newCouleurs);
          }
        } catch (err) {
          setError('Erreur lors du chargement de la recette');
          console.error(err);
        }
      };
      fetchRecette();
    }
  }, [recetteId, projetNom]);

  useEffect(() => {
    const newCouleurs = couleurs.map((couleur) => {
      if (couleur.couleur_hex && chroma.valid(couleur.couleur_hex)) {
        const lab = chroma(couleur.couleur_hex).lab();
        return {
          ...couleur,
          couleur_lab_l: Math.round(lab[0] * 100) / 100, // Arrondi à 2 décimales
          couleur_lab_a: Math.round(lab[1] * 100) / 100,
          couleur_lab_b: Math.round(lab[2] * 100) / 100,
        };
      }
      return couleur;
    });
    setCouleurs(newCouleurs);
  }, [couleurs.map(c => c.couleur_hex).join(',')]);

  const handleRecetteChange = (e) => {
    const { name, value } = e.target;
    setRecette({ ...recette, [name]: value });
  };

  const handleCouleurChange = (index, field, value) => {
  const newCouleurs = [...couleurs];
  // Arrondir à 2 décimales si le champ est L, a ou b
  if (field.startsWith('couleur_lab_')) {
    newCouleurs[index][field] = Math.round(value * 100) / 100;
  } else {
    newCouleurs[index][field] = value;
  }
  setCouleurs(newCouleurs);
};

  const getRapportDeBainValue = () => {
    if (!recette.rapport_de_bain) return 0;
    const match = String(recette.rapport_de_bain).match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const calculateValeurDeLaPart = (profondeurTon) => {
    if (!recette.nb_parts_totales || profondeurTon === undefined || profondeurTon === null) {
      return '0,00';
    }
    const valeur = (parseFloat(profondeurTon) / parseFloat(recette.nb_parts_totales)).toFixed(2);
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
    const valeurDeLaPart = calculateValeurDeLaPart(couleur.profondeur_ton).replace(',', '.');
    const dilution = recette[`colorant_${colorantIndex}_dilution`];
    const qtePoudre = recette[`colorant_${colorantIndex}_qte_poudre`];
    const nbParts = couleur[`nb_part_colorant_${colorantIndex}`];
    const poids = couleur.poids_tissu;
    const nbPartsTotales = recette.nb_parts_totales;

    const quantite = (dilution * couleur.profondeur_ton * nbParts * poids) / (qtePoudre * nbPartsTotales);
    return quantite.toFixed(3).replace('.', ',');
  };

  const calculateQuantiteMordant = (pourcentage, valeurDeLaPart) => {
    const partValue = parseFloat(valeurDeLaPart.replace(',', '.'));
    return (pourcentage * partValue / 100).toFixed(3).replace('.', ',');
  };

  const calculateVolumeEauInitial = (volumeDuBain, quantites) => {
    const totalQuantites = quantites.reduce((sum, qte) => sum + parseFloat(qte.replace(',', '.')) || 0, 0);
    return (parseFloat(volumeDuBain.replace(',', '.')) - totalQuantites).toFixed(1).replace('.', ',');
  };

  const getUnite = (Index,mordantOuColorant) => {
    return recette[`${mordantOuColorant}_${Index}_dilution`] === 1 ? "g" : "ml";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!recetteId) {
        const { data: existing } = await supabase
          .from(tableName)
          .select('recette_id')
          .eq('numero_fiche', recette.numero_fiche)
          .maybeSingle();

        if (existing) {
          throw new Error('Ce numéro de fiche existe déjà.');
        }
      }

      const finalRecetteId = recetteId || crypto.randomUUID();

      const recetteData = couleurs
      .filter(
        (couleur) =>
          couleur.nb_part_colorant_1 > 0 ||
          couleur.nb_part_colorant_2 > 0 ||
          couleur.nb_part_colorant_3 > 0
      )
      .map((couleur) => ({
        ...recette,
        recette_id: finalRecetteId,
        id: crypto.randomUUID(),
        couleur_numero: couleur.couleur_numero,
        nb_part_colorant_1: couleur.nb_part_colorant_1,
        nb_part_colorant_2: couleur.nb_part_colorant_2,
        nb_part_colorant_3: couleur.nb_part_colorant_3,
        profondeur_ton: couleur.profondeur_ton,
        poids_tissu: couleur.poids_tissu,
        pourcent_mordant_1: couleur.pourcent_mordant_1,
        pourcent_mordant_2: couleur.pourcent_mordant_2,
        pourcent_mordant_3: couleur.pourcent_mordant_3,
        couleur_hex: couleur.couleur_hex,
        couleur_lab_l: couleur.couleur_lab_l,
        couleur_lab_a: couleur.couleur_lab_a,
        couleur_lab_b: couleur.couleur_lab_b,
        info: couleur.info,
        bleu_depart: couleur.bleu_depart,
      }));

      if (recetteId) {
        await supabase
          .from(tableName)
          .delete()
          .eq('recette_id', recetteId);

        const { error } = await supabase
          .from(tableName)
          .insert(recetteData);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(recetteData);

        if (error) throw error;
      }

      alert(recetteId ? 'Recette mise à jour !' : 'Recette enregistrée !');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const annuler = () => {
    if (recetteId) navigate(`/recette/${recetteId}`);
    else navigate(-1);
  };

  const volumeEauInitial = (couleur) => {
    const valeurDeLaPart = calculateValeurDeLaPart(couleur.profondeur_ton);
    const quantitesColorants = [
      calculateQuantiteColorant(couleur, 1),
      calculateQuantiteColorant(couleur, 2),
      calculateQuantiteColorant(couleur, 3),
    ];
    const quantitesMordants = [
      calculateQuantiteMordant(couleur.pourcent_mordant_1, valeurDeLaPart),
      calculateQuantiteMordant(couleur.pourcent_mordant_2, valeurDeLaPart),
      calculateQuantiteMordant(couleur.pourcent_mordant_3, valeurDeLaPart),
    ];
    const allQuantites = [...quantitesColorants, ...quantitesMordants];
    const volumeDuBain = calculateVolumeDuBain(couleur.poids_tissu);
    return calculateVolumeEauInitial(volumeDuBain, allQuantites);
  };

  const nomsColorants = [1, 2, 3].map((i) => recette[`colorant_${i}`] || `Colorant ${i}`);

  return (
    <form onSubmit={handleSubmit} className={`${cls.page} flex flex-col gap-8`}>
      {/* ===== EN-TÊTE ===== */}
      <div className="flex flex-col gap-5">
        {recetteId && (
          <nav aria-label="Fil d’Ariane" className="flex gap-2 text-sm text-encre-500">
            <Link to="/nuancier" className="text-sauge hover:text-sauge-fonce">Nuancier</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/recette/${recetteId}`} className="text-sauge hover:text-sauge-fonce">Fiche {recette.numero_fiche}</Link>
            <span aria-hidden="true">/</span>
            <span>Modifier</span>
          </nav>
        )}
        <div className="flex flex-wrap gap-6 justify-between items-end">
          <div className="flex flex-col gap-2.5">
            <p className="m-0 inline-flex items-center gap-2 text-sm text-brun">
              <span className="w-2 h-2 rounded-full bg-brun-accent" />
              {recetteId ? 'Mode modification' : 'Nouvelle fiche'}
            </p>
            <h1 className="m-0 font-serif font-normal text-[52px] tracking-tight">
              {recetteId ? `Fiche ${recette.numero_fiche}` : 'Nouvelle recette'}
            </h1>
          </div>
          <BoutonsAction onAnnuler={annuler} loading={loading} recetteId={recetteId} />
        </div>
        {error && <p role="alert" className={`m-0 ${cls.erreur}`}>{error}</p>}
      </div>

      {/* ===== INFORMATIONS + BAIN ===== */}
      <section className="flex flex-wrap gap-6">
        <fieldset className={`${cls.carte} m-0 flex-[1_1_520px] p-7 flex flex-col gap-5`}>
          <legend className="float-left p-0 font-serif text-2xl">Informations</legend>
          <div className="clear-both grid grid-cols-2 gap-x-5 gap-y-4">
            <ChampInfo name="numero_fiche" value={recette.numero_fiche} onChange={handleRecetteChange} label="N° de fiche" required mono />
            <ChampInfo name="date" value={recette.date} onChange={handleRecetteChange} label="Date" type="date" required />
            <ChampInfo name="nom" value={recette.nom} onChange={handleRecetteChange} label="Nom" />
            <ChampInfo name="objet" value={recette.objet} onChange={handleRecetteChange} label="Objet" />
            <ChampInfo name="matiere" value={recette.matiere} onChange={handleRecetteChange} label="Matière" />
            <ChampInfo name="pre_mordancage" value={recette.pre_mordancage} onChange={handleRecetteChange} label="Pré-mordançage" />
            <div className="col-span-2 flex flex-col gap-1.5">
              <label htmlFor="f-observations" className={cls.labelPetit}>Observations</label>
              <textarea
                id="f-observations"
                name="observations"
                rows="3"
                value={recette.observations ?? ''}
                onChange={handleRecetteChange}
                className={`${cls.input} h-auto py-2.5 leading-relaxed resize-y`}
              />
            </div>
          </div>
        </fieldset>

        <fieldset className={`${cls.carte} m-0 flex-[1_1_400px] p-7 flex flex-col gap-5`}>
          <legend className="float-left p-0 font-serif text-2xl">Bain</legend>
          <div className="clear-both grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-rapport_de_bain" className={cls.labelPetit}>Rapport de bain</label>
              <input
                id="f-rapport_de_bain"
                type="number"
                name="rapport_de_bain"
                value={recette.rapport_de_bain ?? ''}
                onChange={handleRecetteChange}
                className={cls.inputMono}
                min="1"
                step="1"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-nb_parts_totales" className={cls.labelPetit}>Parts totales</label>
              <input
                id="f-nb_parts_totales"
                type="number"
                name="nb_parts_totales"
                value={recette.nb_parts_totales}
                onChange={handleRecetteChange}
                className={cls.inputMono}
                min="1"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2 text-[13px] font-medium text-encre-500">
              <span>Colorant</span><span>[C] poudre</span><span>Dil. sol. mère</span>
            </div>
            {['colorant_1', 'colorant_2', 'colorant_3'].map((colorant, i) => (
              <div key={colorant} className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                <input
                  type="text"
                  name={colorant}
                  value={recette[colorant] ?? ''}
                  onChange={handleRecetteChange}
                  aria-label={`Colorant ${i + 1}`}
                  placeholder={`Colorant ${i + 1}`}
                  className={`${cls.input} min-w-0 h-10`}
                />
                <input
                  type="number"
                  name={`${colorant}_qte_poudre`}
                  value={recette[`${colorant}_qte_poudre`] ?? ''}
                  onChange={handleRecetteChange}
                  aria-label={`Concentration poudre colorant ${i + 1}`}
                  className={`${cls.inputMono} min-w-0 h-10`}
                  min="0"
                />
                <input
                  type="number"
                  name={`${colorant}_dilution`}
                  value={recette[`${colorant}_dilution`] ?? ''}
                  onChange={handleRecetteChange}
                  aria-label={`Dilution colorant ${i + 1}`}
                  className={`${cls.inputMono} min-w-0 h-10`}
                  min="1"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2fr_1fr] gap-2 text-[13px] font-medium text-encre-500">
              <span>Mordant / nuançage</span><span>Dil. sol. mère</span>
            </div>
            {['mordant_1', 'mordant_2', 'mordant_3'].map((mordant, i) => (
              <div key={mordant} className="grid grid-cols-[2fr_1fr] gap-2">
                <input
                  type="text"
                  name={mordant}
                  value={recette[mordant] ?? ''}
                  onChange={handleRecetteChange}
                  aria-label={`Mordant ${i + 1}`}
                  placeholder={`Mordant ${i + 1}`}
                  className={`${cls.input} min-w-0 h-10`}
                />
                <input
                  type="number"
                  name={`${mordant}_dilution`}
                  value={recette[`${mordant}_dilution`] ?? ''}
                  onChange={handleRecetteChange}
                  aria-label={`Dilution mordant ${i + 1}`}
                  className={`${cls.inputMono} min-w-0 h-10`}
                  min="1"
                />
              </div>
            ))}
          </div>
        </fieldset>
      </section>

      <p className="m-0 -mb-4 inline-flex items-center gap-2 text-sm text-encre-500">
        <span className="w-3.5 h-3.5 rounded bg-lin-300" />
        Cases grisées : valeurs calculées automatiquement
      </p>

      {/* ===== NUANCES ===== */}
      <Section titre="Nuances">
        <EnTeteNuances couleurs={couleurs} premiere="Nuance" />
        <tbody>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Nombre de parts" aide={nomsColorants.join(' · ')} />
            {couleurs.map((couleur, index) => (
              <td key={`nb_parts_${index}`} className="px-2 py-2.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((k) => (
                    <input
                      key={k}
                      type="number"
                      value={couleur[`nb_part_colorant_${k}`]}
                      onChange={(e) => handleCouleurChange(index, `nb_part_colorant_${k}`, parseInt(e.target.value) || 0)}
                      aria-label={`Parts ${nomsColorants[k - 1]}, nuance ${index + 1}`}
                      className={cls.inputCellule}
                      min="0"
                    />
                  ))}
                </div>
              </td>
            ))}
          </tr>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Valeur de la part" aide="calculée" />
            {couleurs.map((couleur, index) => (
              <td key={`valeur_part_${index}`} className="px-2 py-2.5">
                <div className={cls.calcule}>{calculateValeurDeLaPart(couleur.profondeur_ton)}</div>
              </td>
            ))}
          </tr>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Profondeur de ton" />
            {couleurs.map((couleur, index) => (
              <td key={`profondeur_${index}`} className="px-2 py-2.5">
                <input
                  type="number"
                  value={couleur.profondeur_ton}
                  onChange={(e) => handleCouleurChange(index, 'profondeur_ton', parseFloat(e.target.value) || 0)}
                  aria-label={`Profondeur de ton, nuance ${index + 1}`}
                  className={cls.inputCellule}
                  min="0"
                  step="0.01"
                />
              </td>
            ))}
          </tr>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Poids du tissu" aide="g" />
            {couleurs.map((couleur, index) => (
              <td key={`poids_${index}`} className="px-2 py-2.5">
                <input
                  type="number"
                  value={couleur.poids_tissu}
                  onChange={(e) => handleCouleurChange(index, 'poids_tissu', parseFloat(e.target.value) || 0)}
                  aria-label={`Poids du tissu, nuance ${index + 1}`}
                  className={cls.inputCellule}
                  min="0"
                  step="0.01"
                />
              </td>
            ))}
          </tr>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Volume du bain" aide="ml, calculé" />
            {couleurs.map((couleur, index) => (
              <td key={`volume_bain_${index}`} className="px-2 py-2.5">
                <div className={cls.calcule}>{calculateVolumeDuBain(couleur.poids_tissu)}</div>
              </td>
            ))}
          </tr>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Bleu de départ" />
            {couleurs.map((couleur, index) => (
              <td key={`bleu_depart_${index}`} className="px-2 py-2.5">
                <input
                  type="text"
                  value={couleur.bleu_depart ?? ''}
                  onChange={(e) => handleCouleurChange(index, 'bleu_depart', e.target.value)}
                  aria-label={`Bleu de départ, nuance ${index + 1}`}
                  className={cls.inputCellule}
                />
              </td>
            ))}
          </tr>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Informations" />
            {couleurs.map((couleur, index) => (
              <td key={`info_${index}`} className="px-2 py-2.5">
                <input
                  type="text"
                  value={couleur.info ?? ''}
                  onChange={(e) => handleCouleurChange(index, 'info', e.target.value)}
                  aria-label={`Informations, nuance ${index + 1}`}
                  className={cls.inputCellule}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </Section>

      {/* ===== COLORANTS ===== */}
      <Section titre="Colorants" note="% et quantités calculés à partir des parts" minWidth="min-w-[1000px]">
        <EnTeteNuances couleurs={couleurs} premiere="Colorant" sousColonnes />
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} className="border-t border-lin-400">
              <LigneTitre label={recette[`colorant_${i}`] || '—'} aide={getUnite(i, 'colorant')} />
              {couleurs.map((couleur, index) => (
                <td key={`colorant${i}_${index}`} className="px-2 py-2.5">
                  <div className="grid grid-cols-2 gap-1">
                    <div className={cls.calcule}>{calculatePourcentColorant(couleur, i)}</div>
                    <div className={cls.calcule}>{calculateQuantiteColorant(couleur, i)}</div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Section>

      {/* ===== MORDANTS ===== */}
      <Section titre="Mordants" note="% à saisir, quantité calculée" minWidth="min-w-[1000px]">
        <EnTeteNuances couleurs={couleurs} premiere="Mordant" sousColonnes />
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} className="border-t border-lin-400">
              <LigneTitre label={recette[`mordant_${i}`] || '—'} aide={getUnite(i, 'mordant')} />
              {couleurs.map((couleur, index) => {
                const valeurDeLaPart = calculateValeurDeLaPart(couleur.profondeur_ton);
                const pourcentage = couleur[`pourcent_mordant_${i}`];
                return (
                  <td key={`mordant${i}_${index}`} className="px-2 py-2.5">
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="number"
                        value={pourcentage}
                        onChange={(e) => handleCouleurChange(index, `pourcent_mordant_${i}`, parseFloat(e.target.value) || 0)}
                        aria-label={`Pourcentage ${recette[`mordant_${i}`] || `mordant ${i}`}, nuance ${index + 1}`}
                        className={cls.inputCellule}
                        min="0"
                        step="0.01"
                      />
                      <div className={cls.calcule}>{calculateQuantiteMordant(pourcentage, valeurDeLaPart)}</div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Section>

      {/* ===== VOLUME D'EAU INITIAL ===== */}
      <Section titre="Volume d’eau initial" note="Volume du bain moins colorants et mordants">
        <EnTeteNuances couleurs={couleurs} premiere="" />
        <tbody>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Volume d’eau initial" aide="ml, calculé" />
            {couleurs.map((couleur, index) => (
              <td key={`vol_eau_${index}`} className="px-2 py-2.5">
                <div className={cls.calcule}>{volumeEauInitial(couleur)}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </Section>

      {/* ===== COLORIMÉTRIE ===== */}
      <Section titre="Colorimétrie" note="Le Lab est recalculé à chaque changement de HEX">
        <EnTeteNuances couleurs={couleurs} premiere="" />
        <tbody>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Code HEX" />
            {couleurs.map((couleur, index) => (
              <td key={`hex_${index}`} className="px-2 py-2.5">
                <div className="flex items-center gap-1.5 p-1 rounded-[10px] border border-lin-600 bg-lin focus-within:ring-2 focus-within:ring-sauge">
                  <input
                    type="color"
                    value={couleur.couleur_hex}
                    onChange={(e) => handleCouleurChange(index, 'couleur_hex', e.target.value)}
                    aria-label={`Sélecteur de couleur, nuance ${index + 1}`}
                    className="w-8 h-8 flex-none p-0 border-0 rounded-md bg-transparent cursor-pointer"
                  />
                  <input
                    key={couleur.couleur_hex}
                    type="text"
                    defaultValue={couleur.couleur_hex}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
                        handleCouleurChange(index, 'couleur_hex', (v.startsWith('#') ? v : `#${v}`).toUpperCase());
                      }
                    }}
                    aria-label={`Code HEX, nuance ${index + 1}`}
                    className="flex-1 w-full min-w-0 h-8 px-1 bg-transparent border-0 font-mono text-[13px] text-encre focus:outline-none"
                  />
                </div>
              </td>
            ))}
          </tr>
          <tr className="border-t border-lin-400">
            <LigneTitre label="Code Lab" aide="L · a · b" />
            {couleurs.map((couleur, index) => (
              <td key={`lab_${index}`} className="px-2 py-2.5">
                <div className="grid grid-cols-3 gap-1">
                  {[
                    ['couleur_lab_l', 'L', 0, 100],
                    ['couleur_lab_a', 'a', -128, 127],
                    ['couleur_lab_b', 'b', -128, 127],
                  ].map(([champ, nom, min, max]) => (
                    <input
                      key={champ}
                      type="number"
                      value={couleur[champ]}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        handleCouleurChange(index, champ, isNaN(value) ? 0 : Math.round(value * 100) / 100);
                      }}
                      aria-label={`${nom}, nuance ${index + 1}`}
                      className={`${cls.inputCellule} px-0.5 text-xs`}
                      step="0.01"
                      min={min}
                      max={max}
                    />
                  ))}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </Section>

      {/* ===== ACTIONS ===== */}
      <div className="flex flex-wrap justify-between items-center gap-4 px-6 py-5 rounded-[20px] bg-lin-700">
        <p className="m-0 text-sm text-encre-600">* Champs obligatoires</p>
        <BoutonsAction onAnnuler={annuler} loading={loading} recetteId={recetteId} />
      </div>
    </form>
  );
};

export default RecetteForm;
