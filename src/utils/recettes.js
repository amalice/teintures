import { supabase } from '../supabaseClient';
import { getRecettesTableName } from './tableNames';

/**
 * Cherche une recette par son numéro de fiche.
 * @returns {Promise<{recetteId: string|null, erreur: string|null}>}
 */
export const rechercherRecetteParNumero = async (projetNom, numero) => {
  if (!numero || !projetNom) return { recetteId: null, erreur: null };

  try {
    const tableName = getRecettesTableName(projetNom);
    const { data, error } = await supabase
      .from(tableName)
      .select('recette_id')
      .eq('numero_fiche', numero)
      .limit(1);

    if (error) {
      console.error('Erreur Supabase:', error);
      return { recetteId: null, erreur: `Erreur : ${error.message}` };
    }
    if (data && data.length > 0) {
      return { recetteId: data[0].recette_id, erreur: null };
    }
    return { recetteId: null, erreur: 'Aucune recette trouvée avec ce numéro de fiche.' };
  } catch (err) {
    console.error('Erreur:', err);
    return { recetteId: null, erreur: 'Une erreur est survenue.' };
  }
};

/** Formate une date ISO (AAAA-MM-JJ) en « 5 avr. 2026 ». */
export const formaterDate = (date) => {
  if (!date) return '';
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};
