import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { cls, Logo } from '../components/ui';
import { useT, ChoixLangue } from '../i18n';

// Bandes décoratives du panneau gauche
const bandes = [
  { c: '#E3CFA0', h: '62%' },
  { c: '#D9C46A', h: '78%' },
  { c: '#A7A35A', h: '90%' },
  { c: '#6E8456', h: '70%' },
  { c: '#C9876B', h: '100%' },
  { c: '#A65442', h: '84%' },
  { c: '#8E6A4B', h: '66%' },
  { c: '#5B4535', h: '92%' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const t = useT();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      navigate('/');
    } catch (err) {
      setError(err.message || t('login.erreur'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-wrap bg-lin text-encre">
      <aside
        aria-hidden="true"
        className="flex-[1_1_480px] min-h-[320px] flex flex-col justify-between gap-12 p-12 bg-lin-700"
      >
        <Logo />
        <div className="hidden md:flex gap-2.5 items-end h-96">
          {bandes.map((b) => (
            <div
              key={b.c}
              className="flex-1 rounded-t-md rounded-b-sm"
              style={{ height: b.h, backgroundColor: b.c }}
            />
          ))}
        </div>
        <p className="m-0 font-serif text-[28px] leading-snug max-w-md text-encre-700">
          {t('login.accroche')}
        </p>
      </aside>

      <main className="relative flex-[1_1_480px] flex items-center justify-center px-6 pt-20 pb-12">
        <ChoixLangue className="absolute top-6 right-6" />
        <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-7">
          <div className="flex flex-col gap-2.5">
            <h1 className="m-0 font-serif font-normal text-[40px]">{t('login.titre')}</h1>
            <p className="m-0 text-base text-encre-500">{t('login.sousTitre')}</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className={cls.label} htmlFor="email">{t('login.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.placeholderEmail')}
                className={`${cls.input} h-12 px-4 text-base bg-lin-50`}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={cls.label} htmlFor="password">{t('login.motDePasse')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${cls.input} h-12 px-4 text-base bg-lin-50`}
                required
              />
            </div>
          </div>

          {error && <p role="alert" className={`m-0 ${cls.erreur}`}>{error}</p>}

          <button type="submit" disabled={loading} className={`${cls.btnPrimaire} h-12 text-base w-full`}>
            {loading ? t('login.connexionEnCours') : t('login.seConnecter')}
          </button>

          <p className="m-0 text-sm text-encre-500 leading-relaxed">
            {t('login.pasDeCompte')}
          </p>
        </form>
      </main>
    </div>
  );
};

export default Login;
