import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { cls } from './ui';

export default function CreerProjetModal({ onClose, onProjetCreated }) {
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fermer avec la touche Échap
  useEffect(() => {
    const surTouche = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [onClose, loading]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre/40"
      onMouseDown={(e) => {
        // Clic sur le fond (hors de la fenêtre) : fermer
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-creer-projet"
        className="w-full max-w-md rounded-[20px] border border-lin-500 bg-lin-50 p-7 shadow-xl flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <h2 id="titre-creer-projet" className={`m-0 ${cls.h3}`}>Créer un projet</h2>
          <p className="m-0 text-sm text-encre-500 leading-relaxed">
            Le projet aura son propre nuancier et ses propres fiches recettes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="nom-projet" className={cls.label}>Nom du projet</label>
            <input
              id="nom-projet"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex. Atelier Garance"
              required
              autoFocus
              className={`${cls.input} h-12 px-4 text-base`}
            />
          </div>

          {error && <p role="alert" className={`m-0 ${cls.erreur}`}>{error}</p>}

          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={loading} className={cls.btnSecondaire}>
              Annuler
            </button>
            <button type="submit" disabled={loading} className={cls.btnPrimaire}>
              {loading ? 'Création en cours…' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
