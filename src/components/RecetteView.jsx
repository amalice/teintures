import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getRecettesTableName } from '../utils/tableNames';
import { useNavigate } from 'react-router-dom';

const RecetteView = ({ projetId, projetNom, recetteId, onEdit }) => {
  const tableName = getRecettesTableName(projetNom);
  const [recette, setRecette] = useState(null);
  const [couleurs, setCouleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
          setError('Recette introuvable');
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
    const match = recette.rapport_de_bain.match(/\d+/);
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

  if (loading) return <div className="text-center py-4">Chargement...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!recette) return <div className="text-center">Aucune recette sélectionnée.</div>;

  return (
    <div className="max-w-7xl mx-auto p-2 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        Fiche recette #{recette.numero_fiche}
      </h2>

      {/* ===== INFOS GÉNÉRALES ===== */}
      <div className="print-container grid grid-cols-12 gap-1 mb-4">
        <div className="col-span-12 md:col-span-2">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">N° DE FICHE:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.numero_fiche}</p>
        </div>
        <div className="col-span-12 md:col-span-2">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">DATE:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.date}</p>
        </div>
        <div className="col-span-12 md:col-span-4">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">NOM:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.nom || '--'}</p>
        </div>
        <div className="col-span-12 md:col-span-4">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">OBJET:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.objet || '--'}</p>
        </div>
        <div className="col-span-12 md:col-span-4">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">MATIÈRE:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.matiere || '--'}</p>
        </div>
        <div className="col-span-12 md:col-span-8">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">OBSERVATIONS:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.observations || '--'}</p>
        </div>
        <div className="col-span-12 md:col-span-4">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">PRÉ-MORDANÇAGE:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.pre_mordancage || '--'}</p>
        </div>
      </div>

      {/* ===== EN-TÊTE ===== */}
      <div className="grid grid-cols-12 gap-1 mb-4">
        <div className="col-span-12 md:col-span-2">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">Rapport de bain:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.rapport_de_bain}</p>
        </div>
        <div className="col-span-12 md:col-span-2">
          <p className="font-medium bg-green-100 p-1 rounded text-center text-xs">Nb parts totales:</p>
          <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette.nb_parts_totales}</p>
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
              <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette[colorant] || '--'}</p>
            </div>
            <div className="col-span-2">
              <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette[`${colorant}_qte_poudre`] || '0'}</p>
            </div>
            <div className="col-span-2">
              <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette[`${colorant}_dilution`] || '1'}</p>
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
              <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette[mordant] || '--'}</p>
            </div>
            <div className="col-span-2">
              <p className="p-1 border rounded bg-green-50 text-sm text-center">{recette[`${mordant}_dilution`] || '1'}</p>
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
                <td key={`nb_parts_${index}`} className="py-1 px-1 border bg-green-50 text-center">
                  <div className="grid grid-cols-3 gap-0.5">
                    <p className="p-1 border rounded text-sm text-center bg-green-50">{couleur.nb_part_colorant_1}</p>
                    <p className="p-1 border rounded text-sm text-center bg-green-50">{couleur.nb_part_colorant_2}</p>
                    <p className="p-1 border rounded text-sm text-center bg-green-50">{couleur.nb_part_colorant_3}</p>
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
                <td key={`profondeur_${index}`} className="py-1 px-1 border bg-green-50 text-center">
                  {couleur.profondeur_ton.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-1 px-1 border text-center bg-yellow-50">Poids du tissu</td>
              {couleurs.map((couleur, index) => (
                <td key={`poids_${index}`} className="py-1 px-1 border bg-green-50 text-center">
                  {couleur.poids_tissu}
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
                <td key={`bleu_depart_${index}`} className="py-1 px-1 border bg-green-50 text-center">
                  {couleur.bleu_depart}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-1 px-1 border text-center bg-yellow-50">Informations</td>
              {couleurs.map((couleur, index) => (
                <td key={`info_${index}`} className="py-1 px-1 border bg-green-50 text-center">
                  {couleur.info}
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
                    <td key={`mordant1_pct_${index}`} className="py-1 px-1 border bg-green-50 text-center">{pourcentage}</td>
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
                    <td key={`mordant2_pct_${index}`} className="py-1 px-1 border bg-green-50 text-center">{pourcentage}</td>
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
                    <td key={`mordant3_pct_${index}`} className="py-1 px-1 border bg-green-50 text-center">{pourcentage}</td>
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
        <table className="min-w-full bg-white border text-xs">
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
              <td className="py-1 px-1 border text-center bg-yellow-50"></td>
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
                  <td key={`vol_eau_val_${index}`} className="py-1 px-1 border bg-gray-100 text-center">
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
                <td key={`hex_${index}`} className="py-1 px-1 border bg-yellow-50">
                  <div className="flex items-center justify-center">
                    <div
                      className="w-6 h-6 mr-1 border"
                      style={{ backgroundColor: couleur.couleur_hex || '#FFFFFF' }}
                    ></div>
                    <p className="text-sm">{couleur.couleur_hex}</p>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-1 px-1 border text-center bg-yellow-50">Code Lab</td>
              {couleurs.map((couleur, index) => (
                <td key={`lab_${index}`} className="py-1 px-1 border bg-yellow-50">
                  <div className="grid grid-cols-3 gap-0.5">
                    <p className="p-1 border rounded text-sm text-center bg-yellow-50">{couleur.couleur_lab_l}</p>
                    <p className="p-1 border rounded text-sm text-center bg-yellow-50">{couleur.couleur_lab_a}</p>
                    <p className="p-1 border rounded text-sm text-center bg-yellow-50">{couleur.couleur_lab_b}</p>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- Bouton pour modifier --- */}
      <div className="flex gap-6 mt-6">
      <button
        onClick={() => navigate(`/recette/${recetteId}/edit`)}  // Navigue vers l'URL d'édition
        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
      >
        Modifier
      </button>
      <button
        onClick={() => window.print()}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Imprimer la fiche
      </button>
      </div>
    </div>
  );
};

export default RecetteView;