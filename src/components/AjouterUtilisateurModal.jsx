import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useT } from '../i18n';

export default function AjouterUtilisateurModal({ onClose, onUtilisateurAjoute }) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Insérer l'utilisateur dans la table `utilisateurs` (sans mot de passe)
      const { data: utilisateur, error: utilisateurError } = await supabase
        .from('utilisateurs')
        .insert({
          email,
          nom,
        })
        .select();

      if (utilisateurError) {
        throw utilisateurError;
      }

      alert(t('ajoutUtilisateur.succes'));
      onUtilisateurAjoute();
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
        <h2 className="text-xl font-bold mb-4">{t('ajoutUtilisateur.titre')}</h2>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('ajoutUtilisateur.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('ajoutUtilisateur.nom')}</label>
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
              {t('commun.annuler')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? t('ajoutUtilisateur.ajout') : t('ajoutUtilisateur.ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}