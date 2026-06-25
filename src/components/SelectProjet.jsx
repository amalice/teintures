import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const SelectProjet = ({ onSelect }) => {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjets = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          setError('Utilisateur non connecté');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('droits_projet')
          .select(`
            projet_id,
            role,
            projets:projet_id (id, nom)
          `)
          .eq('utilisateur_id', user.id);

        if (error) throw error;

        if (!data || data.length === 0) {
          setError('Aucun projet disponible.');
        } else {
          setProjets(data);
        }
      } catch (err) {
        setError(`Erreur : ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProjets();
  }, []);

  if (loading) return <div className="text-center py-2">Chargement des projets...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (projets.length === 0) return <div className="text-center">Aucun projet disponible.</div>;

  return (
    <div className="mb-6">
      <label className="block text-gray-700 mb-2">Sélectionnez un projet</label>
      <select
        onChange={(e) => {
          const selectedProjet = projets.find(p => p.projet_id === e.target.value);
          onSelect(selectedProjet.projet_id, selectedProjet.projets.nom);
        }}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">-- Choisir un projet --</option>
        {projets.map(({ projet_id, role, projets }) => (
          <option key={projet_id} value={projet_id}>
            {projets.nom} ({role})
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectProjet;