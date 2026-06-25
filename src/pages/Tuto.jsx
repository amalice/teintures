import React from "react";

export default function Tuto() {
  return (
    <div className="container mx-auto p-6">
      {/* ===== ACCÈS ===== */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Accès</h2>
        <p className="mb-4">
          Les accès sont actuellement gérés hors de la plateforme par la propriétaire.
        </p>
        <p className="mb-4">
          Le mot de passe ne peut pas être modifié directement par les utilisateurs.
        </p>
        <p className="mb-4">
          L’accès et les droits pour chaque projet doivent être fournis par la propriétaire.
        </p>
      </section>

      {/* ===== NIVEAUX D'ACCÈS ===== */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Niveaux d’accès</h2>
        <p className="mb-4">
          Pour chaque projet, les utilisateurs disposent d’un des niveaux d’accès suivants :
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>
            <strong>Visiteur</strong> : visualisation de recettes, du nuancier et recherche de couleur.
          </li>
          <li>
            <strong>Administrateur</strong> : visualisation de recettes, du nuancier et recherche de couleur, enregistrement de nouvelles recettes et modification des recettes existantes (cases vertes et jaunes).
          </li>
        </ul>
      </section>

      {/* ===== FONCTIONNALITÉS ===== */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Fonctionnalités</h1>

        {/* Sélection d’un projet */}
        <h2 className="text-2xl font-bold mb-4">Sélection d’un projet</h2>
        <p className="mb-6">
          Commencez par sélectionner un projet auquel vous avez accès dans le menu déroulant en haut de page.
        </p>

        {/* Nuancier */}
        <h2 className="text-2xl font-bold mb-4">Nuancier</h2>
        <p className="mb-6">
          Affiche toutes les couleurs enregistrées dans la base de données du projet.
        </p>

        {/* Visualisation d’une recette existante */}
        <h2 className="text-2xl font-bold mb-4">Visualisation d’une recette existante</h2>
        <p className="mb-6">
          Cliquez « Voir recette » sous une couleur du nuancier, ou en la recherchant par numéro de fiche dans la barre de recherche de la page Nuancier.
        </p>

        {/* Modifier une recette existante */}
        <h2 className="text-2xl font-bold mb-4">Modifier une recette existante</h2>
        <p className="mb-6">
          Affichez la fiche que vous souhaitez modifier, puis cliquez « Modifier » en bas de page. Vous pouvez maintenant modifier la recette. Cliquez sur « Enregistrer » avant de quitter.
        </p>

        {/* Imprimer une fiche recette */}
        <h2 className="text-2xl font-bold mb-4">Imprimer une fiche recette</h2>
        <p className="mb-6">
          Affichez la fiche que vous souhaitez imprimer, puis cliquez « Imprimer » en bas de page. La fenêtre d’impression du navigateur s’ouvre.
        </p>

        {/* Enregistrer une nouvelle recette */}
        <h2 className="text-2xl font-bold mb-4">Enregistrer une nouvelle recette</h2>
        <p className="mb-6">
          Cliquez « Nouvelle recette » dans la barre de menu. La fiche à remplir s’affiche. Les cases vertes sont à remplir, les cellules grises se calculent automatiquement. Cliquez « Enregistrer » en bas de page.
        </p>
        <p className="mb-6">
          Seules les couleurs où au moins une case « Nombre de part » est {">"} 0 sont enregistrées dans la base de données.
        </p>

        {/* Recherche de teinte */}
        <h2 className="text-2xl font-bold mb-4">Recherche de teinte</h2>
        <p className="mb-6">
          Choisissez si vous recherchez par code HEX ou Lab. La recherche retourne les 10 couleurs les plus proches.
        </p>
      </section>

      {/* ===== BUGS SIGNALÉS ET AMÉLIORATIONS PRÉVUES ===== */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Bugs signalés et améliorations prévues</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Amélioration de la page d’impression.</li>
          <li>Ajout d’une page Administrateur pour gérer les accès depuis la plateforme.</li>
          <li>
            <strong>Bug :</strong> les cases L, a, b des fiches recettes n’acceptent pas le caractère « - ».
            <br />
            <em>Astuce : taper 0 puis cliquer sur la flèche vers le bas pour que le « - » s’affiche, puis ajuster la valeur.</em>
          </li>
        </ul>
      </section>
    </div>
  );
}