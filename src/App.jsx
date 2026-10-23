import { HashRouter as Router, Routes, Route, Navigate, Link, NavLink } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useEffect, useState, createContext } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Tuto from './pages/Tuto';
import PrivateRoute from './components/PrivateRoute';
import CreerProjetModal from './components/CreerProjetModal';
import { Logo, Icone } from './components/ui';

// Créer un contexte pour partager projetId, projetNom, et isAdmin
const ProjetContext = createContext();

const liensNav = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/nuancier', label: 'Nuancier' },
  { to: '/recherche-teinte', label: 'Recherche par teinte' },
  { to: '/nouvelle-recette', label: 'Nouvelle recette' },
  { to: '/tuto', label: 'Tuto' },
];

const classeLien = ({ isActive }) =>
  `px-3.5 py-2.5 rounded-full text-[15px] no-underline ${
    isActive
      ? 'bg-sauge-pale text-encre font-medium'
      : 'text-encre-600 hover:bg-lin-300 hover:text-encre'
  }`;

const initiales = (email) => {
  if (!email) return '?';
  const nom = email.split('@')[0];
  const parties = nom.split(/[._-]+/).filter(Boolean);
  if (parties.length >= 2) return (parties[0][0] + parties[1][0]).toUpperCase();
  return nom.slice(0, 2).toUpperCase();
};

function App() {
  const [session, setSession] = useState(null);
  const [projetId, setProjetId] = useState(null);
  const [projetNom, setProjetNom] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreerProjetModal, setShowCreerProjetModal] = useState(false);
  const [projets, setProjets] = useState([]);
  const [loadingProjets, setLoadingProjets] = useState(false);
  const [isProjetMenuOpen, setIsProjetMenuOpen] = useState(false);
  const [isCompteMenuOpen, setIsCompteMenuOpen] = useState(false);

  // Récupérer la session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Vérifier si l'utilisateur est administrateur
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: droits, error } = await supabase
        .from('droits_projet')
        .select('role')
        .eq('utilisateur_id', user.id);

      if (error) {
        console.error('Erreur lors de la vérification des droits :', error);
      } else {
        const isUserAdmin = droits.some(droit => droit.role === 'Administrateur');
        setIsAdmin(isUserAdmin);
      }
    };

    checkAdminStatus();
  }, [session]);

  // Récupérer la liste des projets de l'utilisateur
  useEffect(() => {
    const fetchProjets = async () => {
      if (!session) return;
      setLoadingProjets(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingProjets(false);
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

      if (error) {
        console.error('Erreur lors de la récupération des projets :', error);
      } else {
        setProjets(data);
      }
      setLoadingProjets(false);
    };

    fetchProjets();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    return <Navigate to="/login" replace />;
  };

  const handleSelectProjet = (id, nom) => {
    setProjetId(id);
    setProjetNom(nom);
  };

  const handleCreerProjet = () => {
    setShowCreerProjetModal(true);
  };

  const handleProjetCreated = () => {
    // Rafraîchir la liste des projets
    window.location.reload();
  };

  return (
    <Router>
      {session && (
        <header className="navbar no-print border-b border-lin-500 bg-lin">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4">
            <Link to="/" className="mr-4 no-underline">
              <Logo />
            </Link>

            <nav aria-label="Navigation principale" className="flex flex-wrap gap-1 flex-1">
              {liensNav.map((lien) => (
                <NavLink key={lien.to} to={lien.to} end={lien.end} className={classeLien}>
                  {lien.label}
                </NavLink>
              ))}
            </nav>

            {/* Menu déroulant pour la sélection de projet */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProjetMenuOpen(!isProjetMenuOpen);
                  setIsCompteMenuOpen(false);
                }}
                aria-expanded={isProjetMenuOpen}
                className="flex items-center gap-2 h-11 px-4 rounded-full border border-lin-600 bg-lin-50 text-sm font-medium text-encre hover:border-sauge"
              >
                <span className={`w-2 h-2 rounded-full ${projetNom ? 'bg-sauge-point' : 'bg-lin-600'}`} />
                {projetNom || 'Sélectionner un projet'}
                <Icone.Chevron />
              </button>
              {isProjetMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-lin-500 bg-lin-50 shadow-lg z-20 p-1.5">
                  {loadingProjets ? (
                    <div className="px-3 py-2 text-sm text-encre-500">Chargement…</div>
                  ) : projets.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-encre-500">Aucun projet disponible.</div>
                  ) : (
                    projets.map((droit) => (
                      <button
                        type="button"
                        key={droit.projet_id}
                        onClick={() => {
                          handleSelectProjet(droit.projets.id, droit.projets.nom);
                          setIsProjetMenuOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-2.5 rounded-xl text-sm hover:bg-lin-300 ${
                          droit.projets.id === projetId ? 'font-medium text-encre' : 'text-encre-600'
                        }`}
                      >
                        {droit.projets.nom}
                      </button>
                    ))
                  )}
                  {isAdmin && (
                    <div className="mt-1 pt-1 border-t border-lin-400">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProjetMenuOpen(false);
                          handleCreerProjet();
                        }}
                        className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-sauge hover:bg-lin-300"
                      >
                        <Icone.Plus width="16" height="16" />
                        Créer un nouveau projet
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Menu du compte */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCompteMenuOpen(!isCompteMenuOpen);
                  setIsProjetMenuOpen(false);
                }}
                aria-label="Compte et déconnexion"
                aria-expanded={isCompteMenuOpen}
                className="w-11 h-11 rounded-full bg-brun text-lin-50 text-sm font-semibold"
              >
                {initiales(session.user?.email)}
              </button>
              {isCompteMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-lin-500 bg-lin-50 shadow-lg z-20 p-1.5">
                  <div className="px-3 py-2 text-sm text-encre-500 truncate">{session.user?.email}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCompteMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-alerte-texte hover:bg-alerte-fond"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {showCreerProjetModal && (
        <CreerProjetModal
          onClose={() => setShowCreerProjetModal(false)}
          onProjetCreated={handleProjetCreated}
        />
      )}

      <ProjetContext.Provider value={{ projetId, projetNom, isAdmin, setProjetId, setProjetNom }}>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/nuancier"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/nouvelle-recette"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/recherche-teinte"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route
            path="/tuto"
            element={
              <PrivateRoute>
                <Tuto />
              </PrivateRoute>
            }
          />
          <Route
            path="/recette/:recetteId"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/recette/:recetteId/edit"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
        </Routes>
      </ProjetContext.Provider>
    </Router>
  );
}

export default App;
export { ProjetContext };
