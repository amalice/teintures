import { useState, useEffect } from 'react';
import { supabase } from '../SupabaseClient';
import { getRecettesTableName } from '../utils/tableNames';
import { useNavigate } from 'react-router-dom';

// ========== CONVERSION COULEUR ==========
const hexToRgb = (hex) => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
};

const rgbToXyz = (rgb) => {
  const [r, g, b] = rgb.map(c =>
    c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92
  ).map(c => c * 100);

  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.0721750,
    r * 0.0193339 + g * 0.1191920 + b * 0.9503041
  ];
};

const xyzToLab = (xyz) => {
  const [x, y, z] = xyz;
  const ref = { X: 95.047, Y: 100.000, Z: 108.883 };

  const f = (val, refVal) =>
    val / refVal > 0.008856
      ? Math.pow(val / refVal, 1/3)
      : (7.787 * (val / refVal)) + (16 / 116);

  const L = 116 * f(y, ref.Y) - 16;
  const a = 500 * (f(x, ref.X) - f(y, ref.Y));
  const b = 200 * (f(y, ref.Y) - f(z, ref.Z));

  return [L, a, b];
};

const hexToLab = (hex) => {
  try {
    const rgb = hexToRgb(hex);
    const xyz = rgbToXyz(rgb);
    return xyzToLab(xyz);
  } catch {
    return null;
  }
};

// ========== CALCUL DELTA E2000 ==========
const deltaE2000 = (lab1, lab2) => {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const avgL = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(avgC, 7) / (Math.pow(avgC, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (C1p + C2p) / 2;

  const h1p = Math.atan2(b1, a1p);
  const h2p = Math.atan2(b2, a2p);

  const deltaHp = Math.abs(h1p - h2p) <= Math.PI
    ? h2p - h1p
    : h2p - h1p > Math.PI
      ? h2p - h1p - 2 * Math.PI
      : h2p - h1p + 2 * Math.PI;

  const deltaLp = L2 - L1;
  const deltaCp = C2p - C1p;

  const avgHp = (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos(avgHp - Math.PI / 6) +
            0.24 * Math.cos(2 * avgHp) +
            0.32 * Math.cos(3 * avgHp + Math.PI / 30) -
            0.2 * Math.cos(4 * avgHp - Math.PI * 21 / 60);

  const SL = 1 + (0.015 * Math.pow(avgL - 50, 2)) / Math.sqrt(20 + Math.pow(avgL - 50, 2));
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;

  const deltaTheta = (Math.PI / 6) * Math.exp(-Math.pow((avgHp - Math.PI * 275 / 180) / (Math.PI * 25 / 180), 2));
  const RC = 2 * Math.sqrt(Math.pow(avgCp, 7) / (Math.pow(avgCp, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(2 * deltaTheta);

  return Math.sqrt(
    Math.pow(deltaLp / SL, 2) +
    Math.pow(deltaCp / SC, 2) +
    Math.pow(deltaHp / SH, 2) +
    RT * (deltaCp / SC) * (deltaHp / SH)
  );
};

// ========== COMPOSANT ==========
const RechercheCouleur = ({ projetId, projetNom }) => {
  const navigate = useNavigate(); // ✅ Déclarer navigate à l'intérieur du composant
  const [couleurs, setCouleurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('hex');
  const [results, setResults] = useState([]);

  // Récupération des couleurs
  useEffect(() => {
    const fetchCouleurs = async () => {
      if (!projetNom) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from(`recettes_${projetNom.toLowerCase().replace(/\s+/g, '_')}`)
        .select('recette_id, numero_fiche, couleur_numero, couleur_hex, couleur_lab_l, couleur_lab_a, couleur_lab_b, colorant_1, colorant_2, colorant_3')
        .order('couleur_hex', { ascending: true });

      if (error) {
        console.error('Erreur:', error);
        setLoading(false);
        return;
      }

      const uniqueCouleurs = [];
      const seen = new Set();
      data.forEach((row) => {
        if (row.couleur_hex && !seen.has(row.couleur_hex)) {
          seen.add(row.couleur_hex);
          uniqueCouleurs.push({
            recette_id: row.recette_id,
            fiche: row.numero_fiche,
            indexCouleur: row.couleur_numero,
            hex: row.couleur_hex,
            lab_L: row.couleur_lab_l,
            lab_a: row.couleur_lab_a,
            lab_b: row.couleur_lab_b,
            colorants: [row.colorant_1, row.colorant_2, row.colorant_3].filter(Boolean).join(', ')
          });
        }
      });
      setCouleurs(uniqueCouleurs);
      setLoading(false);
    };

    fetchCouleurs();
  }, [projetNom]);

  const handleSearch = () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    let queryLab = null;

    // Conversion de la requête en Lab
    if (searchType === 'hex') {
      queryLab = hexToLab(query);
      if (!queryLab) {
        setResults([]);
        return;
      }
    } else {
      const parts = query.split(',').map(p => parseFloat(p.trim()));
      if (parts.length !== 3 || parts.some(isNaN)) {
        setResults([]);
        return;
      }
      queryLab = parts;
    }

    // Calcul des distances et tri
    const results = couleurs
      .map(couleur => {
        const couleurLab = [couleur.lab_L, couleur.lab_a, couleur.lab_b];
        return {
          ...couleur,
          distance: deltaE2000(queryLab, couleurLab)
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    setResults(results);
  };

  if (loading) return <div className="text-center py-4">Chargement du nuancier...</div>;

  return (
    <div className="p-4">
      <div className="flex space-x-2 mb-4">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="hex">Rechercher par HEX</option>
          <option value="lab">Rechercher par Lab (L,a,b)</option>
        </select>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === 'hex' ? 'Ex: #FF0000 ou FF0000' : 'Ex: 50, 20, -10'}
          className="flex-1 p-2 border rounded"
        />

        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Rechercher
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Résultats (10 couleurs les plus proches triées par similarité):</h3>
          <div className="flex flex-wrap gap-4">
            {results.map((couleur, index) => (
              <div key={index} className="text-center border rounded p-4 w-48">
                <div
                  className="w-24 h-24 mx-auto mb-2 rounded shadow"
                  style={{ backgroundColor: couleur.hex || '#FFFFFF' }}
                ></div>
                <p><strong>Fiche:</strong> {couleur.fiche}</p>
                <p><strong>Couleur:</strong> {couleur.indexCouleur}</p>
                <p><strong>HEX:</strong> {couleur.hex}</p>
                <p><strong>Lab:</strong> {couleur.lab_L.toFixed(1)}, {couleur.lab_a.toFixed(1)}, {couleur.lab_b.toFixed(1)}</p>
                <p><strong>Colorants:</strong> {couleur.colorants || '--'}</p>
                <p><strong>ΔE2000:</strong> {couleur.distance.toFixed(2)}</p>
                <button
                  onClick={() => navigate(`/recette/${couleur.recette_id}`)} // ✅ Utilise navigate pour aller vers la recette
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                >
                  Voir recette
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RechercheCouleur;