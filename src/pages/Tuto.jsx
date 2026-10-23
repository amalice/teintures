import React from "react";
import { cls } from "../components/ui";

const sommaire = [
  { id: "acces", titre: "Accès" },
  { id: "niveaux", titre: "Niveaux d’accès" },
  { id: "projet", titre: "Choisir un projet" },
  { id: "accueil", titre: "Accueil" },
  { id: "nuancier", titre: "Nuancier" },
  { id: "fiche", titre: "Consulter une fiche" },
  { id: "modifier", titre: "Modifier une fiche" },
  { id: "nouvelle", titre: "Nouvelle recette" },
  { id: "imprimer", titre: "Imprimer une fiche" },
  { id: "recherche", titre: "Recherche par teinte" },
  { id: "calculs", titre: "Calculs" },
  { id: "bugs", titre: "Bugs et améliorations" },
];

const Section = ({ id, titre, children }) => (
  <section id={id} className="scroll-mt-6 flex flex-col gap-3">
    <h2 className={`m-0 ${cls.h3}`}>{titre}</h2>
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-encre-700">{children}</div>
  </section>
);

const Bouton = ({ children }) => (
  <span className="inline-block px-2 py-0.5 rounded-md bg-lin-300 text-encre text-[14px] font-medium whitespace-nowrap">
    {children}
  </span>
);

const Formule = ({ nom, children }) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:gap-4 py-3 border-t border-lin-400 first:border-t-0">
    <dt className="sm:w-52 flex-none font-medium text-encre">{nom}</dt>
    <dd className="m-0 font-mono text-[13px] text-encre-600 leading-relaxed">{children}</dd>
  </div>
);

export default function Tuto() {
  return (
    <div className={`${cls.page} pt-14 flex flex-col gap-10`}>
      <div className="flex flex-col gap-2.5">
        <h1 className={`m-0 ${cls.h1}`}>Tuto</h1>
        <p className="m-0 text-base text-encre-500 max-w-2xl leading-relaxed">
          Tout ce qu’il faut savoir pour consulter, saisir et retrouver les recettes de teinture de l’atelier.
        </p>
      </div>

      <div className="flex flex-wrap gap-10 items-start">
        {/* ===== SOMMAIRE ===== */}
        <nav
          aria-label="Sommaire"
          className={`${cls.carte} flex-[1_1_220px] max-w-xs p-5 flex flex-col gap-1 lg:sticky lg:top-6`}
        >
          <p className="m-0 mb-2 text-[13px] tracking-[0.08em] uppercase text-encre-500">Sommaire</p>
          {sommaire.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                // Le site utilise des routes en « #/… » : on fait défiler sans changer l’URL
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3 py-2 rounded-lg text-[15px] text-encre-600 no-underline hover:bg-lin-300 hover:text-encre"
            >
              {s.titre}
            </a>
          ))}
        </nav>

        {/* ===== CONTENU ===== */}
        <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-10">
          <Section id="acces" titre="Accès">
            <p className="m-0">Les accès sont actuellement gérés hors de la plateforme par la propriétaire.</p>
            <p className="m-0">Le mot de passe ne peut pas être modifié directement par les utilisateurs.</p>
            <p className="m-0">L’accès et les droits pour chaque projet doivent être fournis par la propriétaire.</p>
          </Section>

          <Section id="niveaux" titre="Niveaux d’accès">
            <p className="m-0">Pour chaque projet, les utilisateurs disposent d’un des niveaux d’accès suivants :</p>
            <ul className="m-0 pl-5 list-disc flex flex-col gap-1.5">
              <li>
                <strong className="font-medium text-encre">Visiteur</strong> : consultation des fiches, du nuancier
                et recherche par teinte.
              </li>
              <li>
                <strong className="font-medium text-encre">Administrateur</strong> : en plus, enregistrement de
                nouvelles recettes, modification des fiches existantes et création de projets.
              </li>
            </ul>
          </Section>

          <Section id="projet" titre="Choisir un projet">
            <p className="m-0">
              Commencez par choisir un projet dans le menu en haut à droite (<Bouton>Sélectionner un projet</Bouton>).
              Une pastille verte indique le projet actif. Toutes les pages affichent ensuite les données de ce projet.
            </p>
            <p className="m-0">
              Les administrateurs trouvent <Bouton>Créer un nouveau projet</Bouton> en bas de ce même menu.
              Pour vous déconnecter, cliquez sur le rond à vos initiales, tout à droite.
            </p>
          </Section>

          <Section id="accueil" titre="Accueil">
            <p className="m-0">
              L’accueil permet d’ouvrir directement une fiche en tapant son numéro, d’accéder aux pages principales,
              et liste les dernières fiches du projet (les plus récentes en premier). Cliquez sur une fiche pour l’ouvrir.
            </p>
          </Section>

          <Section id="nuancier" titre="Nuancier">
            <p className="m-0">Le nuancier affiche toutes les couleurs enregistrées dans le projet.</p>
            <ul className="m-0 pl-5 list-disc flex flex-col gap-1.5">
              <li>Filtrez par colorant avec les boutons sous le titre (<Bouton>Tous</Bouton>, <Bouton>Garance</Bouton>…).</li>
              <li>
                Triez <Bouton>Par fiche</Bouton> (ordre des numéros) ou <Bouton>Par couleur</Bouton> (regroupe les
                teintes proches, du clair au foncé).
              </li>
              <li>Cliquez sur une couleur pour ouvrir sa fiche, ou tapez un numéro de fiche dans le champ en haut à droite.</li>
            </ul>
          </Section>

          <Section id="fiche" titre="Consulter une fiche">
            <p className="m-0">
              La fiche présente les six nuances obtenues, les informations générales (nom de l’auteur, date, objet,
              matière, pré-mordançage, observations), le bain (rapport de bain, parts totales, colorants et mordants),
              puis les tableaux Nuances, Colorants, Mordants et le volume d’eau initial pour chaque nuance.
            </p>
          </Section>

          <Section id="modifier" titre="Modifier une fiche">
            <p className="m-0">
              Ouvrez la fiche puis cliquez <Bouton>Modifier</Bouton> en haut de page. Les champs à fond clair sont
              à remplir ; les cases grisées se calculent automatiquement.
            </p>
            <p className="m-0">
              Le rapport de bain s’écrit sous la forme 1:n : saisissez seulement n (un nombre entier). Le code Lab se
              calcule à partir du code HEX, que vous pouvez choisir avec le sélecteur de couleur ou taper directement.
            </p>
            <p className="m-0">
              Cliquez <Bouton>Mettre à jour</Bouton> pour enregistrer et revenir à la fiche, ou <Bouton>Annuler</Bouton>
              pour quitter sans enregistrer. Les deux boutons sont présents en haut et en bas de page.
            </p>
          </Section>

          <Section id="nouvelle" titre="Nouvelle recette">
            <p className="m-0">
              Cliquez <Bouton>Nouvelle recette</Bouton> dans le menu. La fiche vide s’affiche, organisée comme en mode
              modification. Le numéro de fiche et la date sont obligatoires ; un numéro déjà utilisé est refusé.
              Cliquez <Bouton>Enregistrer</Bouton> une fois la fiche remplie.
            </p>
            <p className="m-0">
              Seules les nuances où au moins une case « Nombre de parts » est supérieure à 0 sont enregistrées.
            </p>
          </Section>

          <Section id="imprimer" titre="Imprimer une fiche">
            <p className="m-0">
              Ouvrez la fiche puis cliquez <Bouton>Imprimer</Bouton> en haut de page. La fenêtre d’impression du
              navigateur s’ouvre ; le menu et les boutons sont masqués à l’impression.
            </p>
          </Section>

          <Section id="recherche" titre="Recherche par teinte">
            <p className="m-0">
              Choisissez <Bouton>HEX</Bouton> ou <Bouton>Lab</Bouton>, saisissez la couleur cible (un aperçu s’affiche
              pendant la saisie) puis cliquez <Bouton>Rechercher</Bouton>. Les 10 couleurs les plus proches du projet
              s’affichent, la cible et la couleur trouvée côte à côte.
            </p>
            <p className="m-0">
              L’écart est mesuré par le ΔE2000 : plus il est petit, plus les couleurs se ressemblent. En dessous de 1,
              la différence est en général invisible à l’œil ; au-delà de 10, il s’agit nettement d’une autre teinte.
            </p>
          </Section>

          <Section id="calculs" titre="Calculs">
            <p className="m-0">Les cases grisées sont calculées pour chaque nuance à partir des valeurs saisies :</p>
            <dl className={`${cls.carte} m-0 px-5 py-2`}>
              <Formule nom="Valeur de la part">profondeur de ton ÷ parts totales</Formule>
              <Formule nom="% colorant">nombre de parts × valeur de la part</Formule>
              <Formule nom="Quantité de colorant">
                poids du tissu × % colorant ÷ [C] poudre × dilution de la solution mère
              </Formule>
              <Formule nom="Quantité de mordant">poids du tissu × % mordant ÷ 100 × dilution de la solution mère</Formule>
              <Formule nom="Volume du bain">poids du tissu × n (rapport de bain 1:n)</Formule>
              <Formule nom="Volume d’eau initial">volume du bain − somme des quantités de colorants et de mordants</Formule>
            </dl>
            <p className="m-0 text-sm text-encre-500">
              Les quantités sont en grammes lorsque la dilution vaut 1, en millilitres de solution mère sinon.
            </p>
          </Section>

          <Section id="bugs" titre="Bugs signalés et améliorations prévues">
            <ul className="m-0 pl-5 list-disc flex flex-col gap-1.5">
              <li>Amélioration de la page d’impression.</li>
              <li>Ajout d’une page Administrateur pour gérer les accès depuis la plateforme.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
