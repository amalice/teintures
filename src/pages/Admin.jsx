import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Admin() {
  const [projets, setProjets] = useState([]);
  const [selectedProjet, setSelectedProjet] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [droits, setDroits] = useState({}); // { utilisateur_id: role }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modified, setModified] = useState(false);

  // Récupérer les projets où l'utilisateur courant est Administrateur
  useEffect(() => {
    const fetchProjetsAdmin = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data: droits, error: droitsError } = await supabase
          .from('droits_projet')
          .select('projet_id, projets(nom, id)')
          .eq('utilisateur_id', user.id)
          .eq('role', 'Administrateur');

        if (droitsError) throw droitsError;

        const projetsAdmin = droits.map((droit) => droit.projets);
        setProjets(projetsAdmin);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjetsAdmin();
  }, []);

// Récupérer tous les utilisateurs et leurs droits pour le projet sélectionné
useEffect(() => {
  if (!selectedProjet) return;

  const fetchUtilisateursEtDroits = async () => {
    try {
      setLoading(true);
  
      // 1. Récupérer TOUS les utilisateurs via l'API admin
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;
  
      // 2. Récupérer les droits pour le projet sélectionné
      const { data: droitsProjet, error: droitsError } = await supabase
        .from('droits_projet')
        .select('utilisateur_id, role')
        .eq('projet_id', selectedProjet);
  
      if (droitsError) throw droitsError;
  
      // 3. Créer un objet { utilisateur_id: role } pour pré-sélectionner les rôles
      const droitsMap = {};
      droitsProjet.forEach((droit) => {
        droitsMap[droit.utilisateur_id] = droit.role;
      });
  
      // 4. Associer chaque utilisateur à son rôle (ou "aucun")
      const utilisateursAvecDroits = users.map((user) => ({
        id: user.id,
        email: user.email,
        nom: user.user_metadata?.nom || user.email.split('@')[0], // Récupère le nom depuis user_metadata
        role: droitsMap[user.id] || 'aucun',
      }));
  
      setUtilisateurs(utilisateursAvecDroits);
      setDroits(droitsMap);
      setModified(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchUtilisateursEtDroits();
}, [selectedProjet]);

  // Gérer le changement de rôle pour un utilisateur
  const handleRoleChange = (utilisateurId, newRole) => {
    setDroits((prev) => ({
      ...prev,
      [utilisateurId]: newRole,
    }));
    setModified(true);
  };

  // Enregistrer les modifications des rôles
  const handleSaveModifications = async () => {
    if (!selectedProjet || !modified) return;

    try {
      setLoading(true);

      // 1. Supprimer les droits existants pour le projet
      const { error: deleteError } = await supabase
        .from('droits_projet')
        .delete()
        .eq('projet_id', selectedProjet);

      if (deleteError) throw deleteError;

      // 2. Insérer les nouveaux droits
      const droitsToInsert = Object.entries(droits)
        .filter(([_, role]) => role !== 'aucun') // Ne pas insérer les rôles "aucun"
        .map(([utilisateurId, role]) => ({
          utilisateur_id: utilisateurId,
          projet_id: selectedProjet,
          role,
        }));

      const { error: insertError } = await supabase
        .from('droits_projet')
        .insert(droitsToInsert);

      if (insertError) throw insertError;

      alert('Modifications enregistrées avec succès !');
      setModified(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Panneau d'administration</h1>

      {/* Menu déroulant pour sélectionner un projet */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Sélectionner un projet</label>
        <select
          value={selectedProjet}
          onChange={(e) => setSelectedProjet(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Sélectionnez un projet --</option>
          {projets.map((projet) => (
            <option key={projet.id} value={projet.id}>
              {projet.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des utilisateurs avec menus déroulants pour les rôles */}
      {selectedProjet && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Gérer les droits des utilisateurs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Nom</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((utilisateur) => (
                  <tr key={utilisateur.id}>
                    <td className="py-2 px-4 border-b">{utilisateur.nom}</td>
                    <td className="py-2 px-4 border-b">{utilisateur.email}</td>
                    <td className="py-2 px-4 border-b">
                      <select
                        value={droits[utilisateur.id] || 'aucun'}
                        onChange={(e) => handleRoleChange(utilisateur.id, e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="aucun">Aucun</option>
                        <option value="Administrateur">Administrateur</option>
                        <option value="Teinturier">Teinturier</option>
                        <option value="Visiteur">Visiteur</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bouton pour enregistrer les modifications */}
      {selectedProjet && modified && (
        <button
          onClick={handleSaveModifications}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Enregistrer les modifications
        </button>
      )}
    </div>
  );
}