module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Fonds beige (du plus clair au plus soutenu) et bordures
        lin: {
          DEFAULT: '#F5F0E6', // fond de page
          50: '#FBF8F2',      // cartes, champs
          100: '#F9F5EE',     // listes
          200: '#F1EBDF',     // tuiles du bain
          300: '#EBE3D4',     // valeurs calculées, onglets
          400: '#E8E0D2',     // lignes de tableau
          500: '#E3DACB',     // bordures de cartes
          600: '#D8CDBB',     // bordures de champs
          700: '#EDE5D6',     // panneau login, barre d'actions
        },
        // Textes bruns
        encre: {
          DEFAULT: '#2E241C',
          700: '#4A3D33',
          600: '#5E5045',
          500: '#6B5D50',
        },
        // Vert sauge (actions)
        sauge: {
          DEFAULT: '#4E6146',
          fonce: '#3B4A35',
          pale: '#E4E8DA',
          point: '#6E8456',
        },
        brun: {
          DEFAULT: '#7A5236',
          clair: '#C9A77A',
          accent: '#B9824F',
        },
        alerte: {
          fond: '#F4E1D9',
          texte: '#8A3B26',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
