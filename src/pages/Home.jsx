import { useState, useEffect, useContext } from 'react';
import RecetteForm from '../components/RecetteForm';
import RecetteView from '../components/RecetteView';
import Nuancier from '../components/Nuancier';
import RechercheCouleur from '../components/RechercheCouleur';
import { ProjetContext } from '../App';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

export default function Home() {
  const location = useLocation();
  const params = useParams();  // Utilise useParams pour lire recetteId
  const navigate = useNavigate();  // Ajoute useNavigate pour la navigation
  const { projetId, projetNom } = useContext(ProjetContext);
  const [mode, setMode] = useState('list');
  const [recetteId, setRecetteId] = useState(null);

  // Déterminer le mode et recetteId en fonction de l'URL
  useEffect(() => {
    if (location.pathname === '/nouvelle-recette') {
      setMode('create');
      setRecetteId(null);
    } else if (location.pathname === '/recherche-teinte') {
      setMode('search');
      setRecetteId(null);
    } else if (location.pathname.startsWith('/recette/')) {
      if (location.pathname.includes('/edit')) {
        setMode('edit');
      } else {
        setMode('view');
      }
      setRecetteId(params.recetteId);  // Met à jour recetteId depuis l'URL
    } else {
      setMode('list');
      setRecetteId(null);
    }
  }, [location.pathname, params.recetteId]);

  return (
    <div className="p-8">
      {mode === 'list' && (
        <Nuancier projetId={projetId} projetNom={projetNom} />
      )}
      {mode === 'create' && (
        <RecetteForm projetId={projetId} projetNom={projetNom} />
      )}
      {mode === 'search' && (
        <RechercheCouleur projetId={projetId} projetNom={projetNom} />
      )}
      {mode === 'view' && recetteId && (
        <RecetteView
          projetId={projetId}
          projetNom={projetNom}
          recetteId={recetteId}
          onEdit={() => navigate(`/recette/${recetteId}/edit`)}  // Navigue vers l'URL d'édition
        />
      )}
      {mode === 'edit' && recetteId && (
        <RecetteForm
          projetId={projetId}
          projetNom={projetNom}
          recetteId={recetteId}
        />
      )}
    </div>
  );
}