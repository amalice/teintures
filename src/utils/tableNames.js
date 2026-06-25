/**
 * Génère le nom de la table des recettes à partir du nom du projet.
 * @param {string} projetNom - Nom du projet (ex: "Projet Test")
 * @returns {string|null} - Nom de la table (ex: "recettes_projet_test") ou null si projetNom est invalide
 */
export const getRecettesTableName = (projetNom) => {
  if (!projetNom || typeof projetNom !== 'string') {
    console.error('Erreur : projetNom est undefined, null ou non une chaîne de caractères.');
    return null;
  }
  return `recettes_${projetNom.toLowerCase().replace(/\s+/g, '_')}`;
};

/**
 * Récupère le nom de la table des recettes à partir de l'ID du projet.
 * @param {string} projetId - ID du projet (ex: "5fcc6122-fc76-47f0-86f4-92d88d3e4c06")
 * @param {object} supabase - Instance Supabase
 * @returns {Promise<string|null>} - Nom de la table ou null en cas d'erreur
 */
export const getRecettesTableNameFromId = async (projetId, supabase) => {
  if (!projetId) {
    console.error('Erreur : projetId est undefined ou null.');
    return null;
  }

  const { data, error } = await supabase
    .from('projets')
    .select('nom')
    .eq('id', projetId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du nom du projet:', error);
    return null;
  }

  if (!data?.nom) {
    console.error('Erreur : le projet n\'a pas de nom.');
    return null;
  }

  return getRecettesTableName(data.nom);
};