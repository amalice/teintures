import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { supabase } from './SupabaseClient';
import { useEffect, useState, createContext, useContext } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Tuto from './pages/Tuto';
import PrivateRoute from './components/PrivateRoute';
import CreerProjetModal from './components/CreerProjetModal';

// Créer un contexte pour partager projetId, projetNom, et isAdmin
const ProjetContext = createContext();

function App() {
  const [session, setSession] = useState(null);
  const [projetId, setProjetId] = useState(null);
  const [projetNom, setProjetNom] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreerProjetModal, setShowCreerProjetModal] = useState(false);
  const [projets, setProjets] = useState([]);
  const [loadingProjets, setLoadingProjets] = useState(false);
  const [isProjetMenuOpen, setIsProjetMenuOpen] = useState(false);

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
        <nav className="navbar bg-gray-800 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="px-4 py-2 rounded hover:bg-gray-700">Nuancier</Link>
              <Link to="/nouvelle-recette" className="px-4 py-2 rounded hover:bg-gray-700">Nouvelle recette</Link>
              <Link to="/recherche-teinte" className="px-4 py-2 rounded hover:bg-gray-700">Recherche par teinte</Link>
              <Link to="/tuto" className="px-4 py-2 rounded hover:bg-gray-700">Tuto</Link>

              {/* Menu déroulant pour la sélection de projet */}
              <div className="relative">
                <button
                  onClick={() => setIsProjetMenuOpen(!isProjetMenuOpen)}
                  className="px-4 py-2 rounded hover:bg-gray-700 flex items-center"
                >
                  {projetNom || "Sélectionner un projet"} <span className="ml-1">▼</span>
                </button>
                {isProjetMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg z-10">
                    {loadingProjets ? (
                      <div className="p-2">Chargement...</div>
                    ) : projets.length === 0 ? (
                      <div className="p-2">Aucun projet disponible.</div>
                    ) : (
                      projets.map((droit) => (
                        <button
                          key={droit.projet_id}
                          onClick={() => {
                            handleSelectProjet(droit.projets.id, droit.projets.nom);
                            setIsProjetMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                        >
                          {droit.projets.nom}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={handleCreerProjet}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
                >
                  Créer un nouveau projet
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </nav>
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