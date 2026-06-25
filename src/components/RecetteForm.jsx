import React, { useState, useEffect } from 'react';
import { supabase } from '../SupabaseClient';
import chroma from 'chroma-js';
import { getRecettesTableName } from '../utils/tableNames';
import { useNavigate } from 'react-router-dom';

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
    const match = recette.rapport_de_bain.match(/\d+/);
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

  return (
    <div className="max-w-7xl mx-auto p-2 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        {recetteId ? `Modifier la recette #${recette.numero_fiche}` : 'Nouvelle recette'}
      </h2>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-2 text-xs">

        {/* ===== INFOS GÉNÉRALES ===== */}
        <div className="grid grid-cols-12 gap-1 mb-4">
          <div className="col-span-12 md:col-span-2">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">N° DE FICHE:*</label>
            <input
              type="text"
              name="numero_fiche"
              value={recette.numero_fiche}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
              required
            />
          </div>
          <div className="col-span-12 md:col-span-2">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">DATE:*</label>
            <input
              type="date"
              name="date"
              value={recette.date}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
              required
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">NOM:</label>
            <input
              type="text"
              name="nom"
              value={recette.nom}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">OBJET:</label>
            <input
              type="text"
              name="objet"
              value={recette.objet}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">MATIÈRE:</label>
            <input
              type="text"
              name="matiere"
              value={recette.matiere}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
            />
          </div>
          <div className="col-span-12 md:col-span-8">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">OBSERVATIONS:</label>
            <input
              type="text"
              name="observations"
              value={recette.observations}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">PRÉ-MORDANÇAGE:</label>
            <input
              type="text"
              name="pre_mordancage"
              value={recette.pre_mordancage}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
            />
          </div>
        </div>

        {/* ===== EN-TÊTE ===== */}
        <div className="grid grid-cols-12 gap-1 mb-4">
          <div className="col-span-12 md:col-span-2">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">Rapport de bain:</label>
            <input
              type="text"
              name="rapport_de_bain"
              value={recette.rapport_de_bain}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
            />
          </div>
          <div className="col-span-12 md:col-span-2">
            <label className="block font-medium text-gray-700 mb-1 bg-green-100 p-1 rounded text-center">Nb parts totales:</label>
            <input
              type="number"
              name="nb_parts_totales"
              value={recette.nb_parts_totales}
              onChange={handleRecetteChange}
              className="w-full p-1 border rounded bg-green-50 text-center"
              min="1"
            />
          </div>
        </div>

        {/* ===== COLORANTS ===== */}
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-1 mb-1">
            <div className="col-span-4">
              <p className="font-medium text-center bg-green-100 p-1 rounded text-xs">Colorants</p>
            </div>
            <div className="col-span-2">
              <p className="font-medium text-center bg-green-100 p-1 rounded text-xs">[C] poudre</p>
            </div>
            <div className="col-span-2">
              <p className="font-medium text-center bg-green-100 p-1 rounded text-xs">Dil. sol. mère</p>
            </div>
          </div>
          {['colorant_1', 'colorant_2', 'colorant_3'].map((colorant) => (
            <div key={colorant} className="grid grid-cols-12 gap-1 mb-1">
              <div className="col-span-4">
                <input
                  type="text"
                  name={colorant}
                  value={recette[colorant]}
                  onChange={handleRecetteChange}
                  className="w-full p-1 border rounded bg-green-50 text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  name={`${colorant}_qte_poudre`}
                  value={recette[`${colorant}_qte_poudre`]}
                  onChange={handleRecetteChange}
                  className="w-full p-1 border rounded bg-green-50 text-center"
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  name={`${colorant}_dilution`}
                  value={recette[`${colorant}_dilution`]}
                  onChange={handleRecetteChange}
                  className="w-full p-1 border rounded bg-green-50 text-center"
                  min="1"
                />
              </div>
            </div>
          ))}
        </div>

        {/* ===== MORDANTS ===== */}
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-1 mb-1">
            <div className="col-span-4">
              <p className="font-medium text-center bg-green-100 p-1 rounded text-xs">Mordants / nuançage</p>
            </div>
            <div className="col-span-2">
              <p className="font-medium text-center bg-green-100 p-1 rounded text-xs">Dil. sol. mère</p>
            </div>
          </div>
          {['mordant_1', 'mordant_2', 'mordant_3'].map((mordant) => (
            <div key={mordant} className="grid grid-cols-12 gap-1 mb-1">
              <div className="col-span-4">
                <input
                  type="text"
                  name={mordant}
                  value={recette[mordant]}
                  onChange={handleRecetteChange}
                  className="w-full p-1 border rounded bg-green-50 text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  name={`${mordant}_dilution`}
                  value={recette[`${mordant}_dilution`]}
                  onChange={handleRecetteChange}
                  className="w-full p-1 border rounded bg-green-50 text-center"
                  min="1"
                />
              </div>
            </div>
          ))}
        </div>

        {/* ===== TABLEAU DES COULEURS ===== */}
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full bg-white border text-xs">
            <thead>
              <tr>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]"></th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">1</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">2</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">3</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">4</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">5</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">6</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Nombre de parts</td>
                {couleurs.map((couleur, index) => (
                  <td key={`nb_parts_${index}`} className="py-1 px-1 border">
                    <div className="grid grid-cols-3 gap-0.5">
                      <input
                        type="number"
                        value={couleur.nb_part_colorant_1}
                        onChange={(e) => handleCouleurChange(index, 'nb_part_colorant_1', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border rounded text-sm text-center bg-green-50"
                        min="0"
                      />
                      <input
                        type="number"
                        value={couleur.nb_part_colorant_2}
                        onChange={(e) => handleCouleurChange(index, 'nb_part_colorant_2', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border rounded text-sm text-center bg-green-50"
                        min="0"
                      />
                      <input
                        type="number"
                        value={couleur.nb_part_colorant_3}
                        onChange={(e) => handleCouleurChange(index, 'nb_part_colorant_3', parseInt(e.target.value) || 0)}
                        className="w-full p-1 border rounded text-sm text-center bg-green-50"
                        min="0"
                      />
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Valeur de la part</td>
                {couleurs.map((couleur, index) => (
                  <td key={`valeur_part_${index}`} className="py-1 px-1 border bg-gray-100 text-center">
                    {calculateValeurDeLaPart(couleur.profondeur_ton)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Profondeur ton</td>
                {couleurs.map((couleur, index) => (
                  <td key={`profondeur_${index}`} className="py-1 px-1 border">
                    <input
                      type="number"
                      value={couleur.profondeur_ton}
                      onChange={(e) => handleCouleurChange(index, 'profondeur_ton', parseFloat(e.target.value) || 0)}
                      className="w-full p-1 border rounded text-sm text-center bg-green-50"
                      min="0"
                      step="0.01"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Poids du tissu</td>
                {couleurs.map((couleur, index) => (
                  <td key={`poids_${index}`} className="py-1 px-1 border">
                    <input
                      type="number"
                      value={couleur.poids_tissu}
                      onChange={(e) => handleCouleurChange(index, 'poids_tissu', parseFloat(e.target.value) || 0)}
                      className="w-full p-1 border rounded text-sm text-center bg-green-50"
                      min="0"
                      step="0.01"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Volume du bain</td>
                {couleurs.map((couleur, index) => (
                  <td key={`volume_bain_${index}`} className="py-1 px-1 border bg-gray-100 text-center">
                    {calculateVolumeDuBain(couleur.poids_tissu)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Bleu de départ</td>
                {couleurs.map((couleur, index) => (
                  <td key={`bleu_depart_${index}`} className="py-1 px-1 border">
                    <input
                      type="text"
                      value={couleur.bleu_depart}
                      onChange={(e) => handleCouleurChange(index, 'bleu_depart', e.target.value)}
                      className="w-full p-1 border rounded text-sm text-center bg-green-50"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Informations</td>
                {couleurs.map((couleur, index) => (
                  <td key={`info_${index}`} className="py-1 px-1 border">
                    <input
                      type="text"
                      value={couleur.info}
                      onChange={(e) => handleCouleurChange(index, 'info', e.target.value)}
                      className="w-full p-1 border rounded text-sm text-center bg-green-50"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== COLORANTS DÉTAILS ===== */}
        <div className="mb-4">
          <table className="min-w-full bg-white border text-xs">
            <thead>
              <tr>
                <th rowSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">Colorants</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">1</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">2</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">3</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">4</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">5</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">6</th>
              </tr>
              <tr>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
              </tr>
            </thead>
            <tbody>
              {/* Colorant 1 */}
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">{recette.colorant_1 || '--'}</td>
                {couleurs.map((couleur, index) => {
                  const quantite = calculateQuantiteColorant(couleur, 1);
                  const pourcent = calculatePourcentColorant(couleur, 1);
                  const unite = getUnite(1, `colorant`);
                  return (
                    <>
                      <td key={`gaude_pct_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{pourcent}</td>
                      <td key={`gaude_qte_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{quantite} {unite}</td>
                    </>
                  );
                })}
                
              </tr>
              {/* Colorant 2 */}
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">{recette.colorant_2 || '--'}</td>
                {couleurs.map((couleur, index) => {
                  const quantite = calculateQuantiteColorant(couleur, 2);
                  const pourcent = calculatePourcentColorant(couleur, 2);
                  const unite = getUnite(2, `colorant`);
                  return (
                    <>
                      <td key={`garance_pct_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{pourcent}</td>
                      <td key={`garance_qte_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{quantite} {unite}</td>
                    </>
                  );
                })}
                
              </tr>
              {/* Colorant 3 */}
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">{recette.colorant_3 || '--'}</td>
                {couleurs.map((couleur, index) => {
                  const quantite = calculateQuantiteColorant(couleur, 3);
                  const pourcent = calculatePourcentColorant(couleur, 3);
                  const unite = getUnite(3, `colorant`);
                  return (
                    <>
                      <td key={`indigo_pct_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{pourcent}</td>
                      <td key={`indigo_qte_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{quantite} {unite}</td>
                    </>
                  );
                })}
                
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===== MORDANTS DÉTAILS ===== */}
        <div className="mb-4">
          <table className="min-w-full bg-white border text-xs">
            <thead>
              <tr>
                <th rowSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">Mordants</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">1</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">2</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">3</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">4</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">5</th>
                <th colSpan="2" className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">6</th>
              </tr>
              <tr>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">%</th>
                <th className="py-2 px-1 border text-center bg-yellow-100">quantité</th>
              </tr>
            </thead>
            <tbody>
              {/* Mordant 1 */}
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">{recette.mordant_1 || '--'}</td>
                {couleurs.map((couleur, index) => {
                  const valeurDeLaPart = calculateValeurDeLaPart(couleur.profondeur_ton);
                  const pourcentage = couleur.pourcent_mordant_1;
                  const quantite = calculateQuantiteMordant(pourcentage, valeurDeLaPart);
                  const unite = getUnite(1, `mordant`);
                  return (
                    <>
                      <td key={`mordant1_pct_${index}`} className="py-1 px-1 border bg-white text-center">
                        <input
                          type="number"
                          value={pourcentage}
                          onChange={(e) => handleCouleurChange(index, 'pourcent_mordant_1', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-sm text-center bg-green-50"
                          min="0"
                        />
                      </td>
                      <td key={`mordant1_qte_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{quantite} {unite}</td>
                    </>
                  );
                })}
                
              </tr>
              {/* Mordant 2 */}
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">{recette.mordant_2 || '--'}</td>
                {couleurs.map((couleur, index) => {
                  const valeurDeLaPart = calculateValeurDeLaPart(couleur.profondeur_ton);
                  const pourcentage = couleur.pourcent_mordant_2;
                  const quantite = calculateQuantiteMordant(pourcentage, valeurDeLaPart);
                  const unite = getUnite(2, `mordant`);
                  return (
                    <>
                      <td key={`mordant2_pct_${index}`} className="py-1 px-1 border bg-white text-center">
                        <input
                          type="number"
                          value={pourcentage}
                          onChange={(e) => handleCouleurChange(index, 'pourcent_mordant_2', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-sm text-center bg-green-50"
                          min="0"
                        />
                      </td>
                      <td key={`mordant2_qte_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{quantite} {unite}</td>
                    </>
                  );
                })}
                
              </tr>
              {/* Mordant 3 */}
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">{recette.mordant_3 || '--'}</td>
                {couleurs.map((couleur, index) => {
                  const valeurDeLaPart = calculateValeurDeLaPart(couleur.profondeur_ton);
                  const pourcentage = couleur.pourcent_mordant_3;
                  const quantite = calculateQuantiteMordant(pourcentage, valeurDeLaPart);
                  const unite = getUnite(3, `mordant`);
                  return (
                    <>
                      <td key={`mordant3_pct_${index}`} className="py-1 px-1 border bg-white text-center">
                        <input
                          type="number"
                          value={pourcentage}
                          onChange={(e) => handleCouleurChange(index, 'pourcent_mordant_3', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-sm text-center bg-green-50"
                          min="0"
                        />
                      </td>
                      <td key={`mordant3_qte_${index}`} className="py-1 px-1 border bg-gray-100 text-center">{quantite} {unite}</td>
                    </>
                  );
                })}
                
              </tr>
            </tbody>
          </table>
        </div>

{/* ===== VOLUME D'EAU INITIAL ===== */}
<div className="mb-4">
  <table className="table-fixed w-full bg-white border text-xs">
    <thead>
      <tr>
        <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">Volume d'eau initial</th>
        {couleurs.map((_, index) => (
          <th key={`vol_eau_${index}`} className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">
            {index + 1}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="py-1 px-1 border text-center bg-yellow-50 w-[14.2857%]"></td>
        {couleurs.map((couleur, index) => {
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
          return (
            <td key={`vol_eau_val_${index}`} className="py-1 px-1 border bg-gray-100 text-center w-[14.2857%]">
              {calculateVolumeEauInitial(volumeDuBain, allQuantites)}
            </td>
          );
        })}
      </tr>
    </tbody>
  </table>
</div>

        {/* ===== COULEURS HEX/LAB ===== */}
        <div className="mb-4">
          <table className="min-w-full bg-white border text-xs">
            <thead>
              <tr>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]"></th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">1</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">2</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">3</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">4</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">5</th>
                <th className="py-2 px-1 border text-center bg-yellow-100 w-[14.2857%]">6</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Code HEX</td>
                {couleurs.map((couleur, index) => (
                  <td key={`hex_${index}`} className="py-1 px-1 border bg-white">
                    <input
                      type="color"
                      value={couleur.couleur_hex}
                      onChange={(e) => handleCouleurChange(index, 'couleur_hex', e.target.value)}
                      className="w-full h-6 p-0 border rounded bg-green-50"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 px-1 border text-center bg-yellow-50">Code Lab</td>
                {couleurs.map((couleur, index) => (
                  <td key={`lab_${index}`} className="py-1 px-1 border bg-white">
                    <div className="grid grid-cols-3 gap-0.5">
                      {/* L: 0 à 100 */}
                      <input
                        type="number"
                        value={couleur.couleur_lab_l}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          handleCouleurChange(index, 'couleur_lab_l', isNaN(value) ? 0 : Math.round(value * 100) / 100);
                        }}
                        className="w-full p-1 border rounded text-[10px] text-center bg-green-50"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      {/* a: -128 à 127 */}
                      <input
                        type="number"
                        value={couleur.couleur_lab_a}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          handleCouleurChange(index, 'couleur_lab_a', isNaN(value) ? 0 : Math.round(value * 100) / 100);
                        }}
                        className="w-full p-1 border rounded text-[10px] text-center bg-green-50"
                        step="0.01"
                        min="-128"
                        max="127"
                      />
                      {/* b: -128 à 127 */}
                      <input
                        type="number"
                        value={couleur.couleur_lab_b}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          handleCouleurChange(index, 'couleur_lab_b', isNaN(value) ? 0 : Math.round(value * 100) / 100);
                        }}
                        className="w-full p-1 border rounded text-[10px] text-center bg-green-50"
                        step="0.01"
                        min="-128"
                        max="127"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* --- Bouton de soumission --- */}
        <div className="text-center mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Enregistrement...' : recetteId ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecetteForm;