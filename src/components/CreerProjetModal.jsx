import { useState } from 'react';
import { supabase } from '../SupabaseClient';

export default function CreerProjetModal({ onClose, onProjetCreated }) {
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Récupérer l'utilisateur courant
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }

      // 2. Créer le projet
      const { data: projet, error: projetError } = await supabase
        .from('projets')
        .insert({
          nom,
          date_creation: new Date().toISOString(),
          created_by: user.id,
        })
        .select()
        .single();

      if (projetError) {
        throw projetError;
      }

      // 3. Liste des utilisateurs à ajouter comme Administrateurs
      const adminUsers = [
        user.id, // Utilisateur courant
        '80ed0f34-e8a7-428a-ae6c-9233e6eb7a62',
        '1be747ff-3a84-4cba-92d5-2a7b04f97104'
      ];

      // 4. Ajouter les droits "Administrateur" pour chaque utilisateur
      for (const userId of adminUsers) {
        const { error: droitError } = await supabase
          .from('droits_projet')
          .insert({
            utilisateur_id: userId,
            projet_id: projet.id,
            role: 'Administrateur',
          });

        if (droitError) {
          console.error(`Erreur lors de l'ajout des droits pour ${userId}:`, droitError);
        }
      }

      alert('Projet créé avec succès !');
      onProjetCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Créer un projet</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nom du projet</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 p-2 rounded hover:bg-gray-400"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Création en cours...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}