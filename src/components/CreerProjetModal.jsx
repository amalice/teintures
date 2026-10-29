import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { cls } from './ui';
import { useT } from '../i18n';

export default function CreerProjetModal({ onClose, onProjetCreated }) {
  const t = useT();
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
      // Création côté Supabase (fonction creer_projet) : le projet et le droit
      // « Administrateur » de la personne connectée sont créés ensemble.
      // Personne d'autre n'obtient d'accès : les membres s'ajoutent ensuite
      // depuis la page Administration.
      const { error: projetError } = await supabase.rpc('creer_projet', { p_nom: nom.trim() });
      if (projetError) throw projetError;

      alert(t('modalProjet.succes'));
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
          <h2 id="titre-creer-projet" className={`m-0 ${cls.h3}`}>{t('modalProjet.titre')}</h2>
          <p className="m-0 text-sm text-encre-500 leading-relaxed">
            {t('modalProjet.intro')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="nom-projet" className={cls.label}>{t('modalProjet.nom')}</label>
            <input
              id="nom-projet"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder={t('modalProjet.placeholder')}
              required
              autoFocus
              className={`${cls.input} h-12 px-4 text-base`}
            />
          </div>

          {error && <p role="alert" className={`m-0 ${cls.erreur}`}>{error}</p>}

          <div className="flex justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={loading} className={cls.btnSecondaire}>
              {t('commun.annuler')}
            </button>
            <button type="submit" disabled={loading} className={cls.btnPrimaire}>
              {loading ? t('modalProjet.creation') : t('modalProjet.creer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
