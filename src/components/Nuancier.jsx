import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getRecettesTableName } from '../utils/tableNames';
import { useNavigate } from 'react-router-dom';

const Nuancier = ({ projetId, projetNom }) => {  
  const navigate = useNavigate();
  const [couleurs, setCouleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numeroFicheRecherche, setNumeroFicheRecherche] = useState('');

  useEffect(() => {
    const fetchCouleurs = async () => {
      setLoading(true);
      setError(null);

      if (!projetId || !projetNom) {
        setError("Projet non sélectionné.");
        setLoading(false);
        return;
      }

      const tableName = getRecettesTableName(projetNom);
      if (!tableName) {
        setError("Impossible de générer le nom de la table.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('numero_fiche, couleur_numero, couleur_hex, couleur_lab_l, couleur_lab_a, couleur_lab_b, colorant_1, colorant_2, colorant_3, recette_id');

        if (error) {
          throw error;
        }

        const uniqueCouleurs = [];
        const seen = new Set();
        data.forEach((row) => {
          if (row.couleur_hex && !seen.has(row.couleur_hex)) {
            seen.add(row.couleur_hex);
            uniqueCouleurs.push({
              fiche: row.numero_fiche,
              indexCouleur: row.couleur_numero,
              hex: row.couleur_hex,
              lab_L: row.couleur_lab_l,
              lab_a: row.couleur_lab_a,
              lab_b: row.couleur_lab_b,
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
        setError(`Erreur : ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCouleurs();
  }, [projetId, projetNom]);

  const handleSearchByNumeroFiche = async (numero) => {
    if (!numero || !projetNom) return;

    try {
      const tableName = getRecettesTableName(projetNom);
      const { data, error } = await supabase
        .from(tableName)
        .select('recette_id')
        .eq('numero_fiche', numero)
        .limit(1);

      if (error) {
        console.error('Erreur Supabase:', error);
        alert(`Erreur : ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        navigate(`/recette/${data[0].recette_id}`);  // Navigue vers l'URL de la recette
      } else {
        alert('Aucune recette trouvée avec ce numéro de fiche.');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue.');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Chargement du nuancier...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      {/* Barre de recherche par numéro de fiche (uniquement ici) */}
      {projetId && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Rechercher par numéro de fiche (ex: 260405)"
              value={numeroFicheRecherche}
              onChange={(e) => setNumeroFicheRecherche(e.target.value)}
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={() => handleSearchByNumeroFiche(numeroFicheRecherche)}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Rechercher
            </button>
          </div>
        </div>
      )}

      {couleurs.length === 0 ? (
        <div className="text-center py-4">Aucune couleur trouvée pour ce projet.</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {couleurs.map((couleur, index) => (
            <div key={index} className="text-center border rounded p-4 w-48">
              <div
                className="w-24 h-24 mx-auto mb-2 rounded shadow"
                style={{ backgroundColor: couleur.hex || '#FFFFFF' }}
              ></div>
              <p><strong>Fiche:</strong> {couleur.fiche}</p>
              <p><strong>Couleur:</strong> {couleur.indexCouleur}</p>
              <p><strong>HEX:</strong> {couleur.hex}</p>
              <p><strong>Lab:</strong> {couleur.lab_L}, {couleur.lab_a}, {couleur.lab_b}</p>
              <p><strong>Colorants:</strong> {couleur.colorants || '--'}</p>
              <button
                onClick={() => navigate(`/recette/${couleur.recette_id}`)}  // Navigue vers l'URL de la recette
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
              >
                Voir recette
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Nuancier;