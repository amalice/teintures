import React from "react";
import { cls } from "../components/ui";
import { useLangue } from "../i18n";

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

const P = ({ children, className = "" }) => <p className={`m-0 ${className}`}>{children}</p>;
const Liste = ({ children }) => <ul className="m-0 pl-5 list-disc flex flex-col gap-1.5">{children}</ul>;
const Fort = ({ children }) => <strong className="font-medium text-encre">{children}</strong>;

// ===================== FRANÇAIS =====================
const fr = {
  titre: "Tuto",
  intro: "Tout ce qu’il faut savoir pour consulter, saisir et retrouver les recettes de teinture de l’atelier.",
  sommaire: "Sommaire",
  sections: [
    {
      id: "acces",
      titre: "Accès",
      contenu: (
        <>
          <P>Les accès sont actuellement gérés hors de la plateforme par la propriétaire.</P>
          <P>Le mot de passe ne peut pas être modifié directement par les utilisateurs.</P>
          <P>L’accès et les droits pour chaque projet doivent être fournis par la propriétaire.</P>
        </>
      ),
    },
    {
      id: "niveaux",
      titre: "Niveaux d’accès",
      contenu: (
        <>
          <P>Pour chaque projet, les utilisateurs disposent d’un des niveaux d’accès suivants :</P>
          <Liste>
            <li>
              <Fort>Visiteur</Fort> : consultation des fiches, du nuancier et recherche par teinte.
            </li>
            <li>
              <Fort>Administrateur</Fort> : en plus, enregistrement de nouvelles recettes, modification des fiches
              existantes et création de projets.
            </li>
          </Liste>
        </>
      ),
    },
    {
      id: "projet",
      titre: "Choisir un projet",
      contenu: (
        <>
          <P>
            Commencez par choisir un projet dans le menu en haut à droite (<Bouton>Sélectionner un projet</Bouton>).
            Une pastille verte indique le projet actif. Toutes les pages affichent ensuite les données de ce projet.
          </P>
          <P>
            Les administrateurs trouvent <Bouton>Créer un nouveau projet</Bouton> en bas de ce même menu. Pour vous
            déconnecter, cliquez sur le rond à vos initiales, tout à droite.
          </P>
          <P>
            Le bouton <Bouton>FR</Bouton> / <Bouton>EN</Bouton> du bandeau change la langue du site ; votre choix est
            mémorisé sur cet appareil.
          </P>
        </>
      ),
    },
    {
      id: "accueil",
      titre: "Accueil",
      contenu: (
        <P>
          L’accueil permet d’ouvrir directement une fiche en tapant son numéro, d’accéder aux pages principales, et
          liste les dernières fiches du projet (les plus récentes en premier). Cliquez sur une fiche pour l’ouvrir.
        </P>
      ),
    },
    {
      id: "nuancier",
      titre: "Nuancier",
      contenu: (
        <>
          <P>Le nuancier affiche toutes les couleurs enregistrées dans le projet.</P>
          <Liste>
            <li>
              Filtrez par colorant avec les boutons sous le titre (<Bouton>Tous</Bouton>, <Bouton>Garance</Bouton>…).
            </li>
            <li>
              Triez <Bouton>Par fiche</Bouton> (ordre des numéros) ou <Bouton>Par couleur</Bouton> (regroupe les
              teintes proches, du clair au foncé).
            </li>
            <li>Cliquez sur une couleur pour ouvrir sa fiche, ou tapez un numéro de fiche dans le champ en haut à droite.</li>
          </Liste>
        </>
      ),
    },
    {
      id: "fiche",
      titre: "Consulter une fiche",
      contenu: (
        <P>
          La fiche présente les six nuances obtenues, les informations générales (nom de l’auteur, date, objet,
          matière, pré-mordançage, observations), le bain (rapport de bain, parts totales, colorants et mordants), puis
          les tableaux Nuances, Colorants, Mordants et le volume d’eau initial pour chaque nuance.
        </P>
      ),
    },
    {
      id: "modifier",
      titre: "Modifier une fiche",
      contenu: (
        <>
          <P>
            Ouvrez la fiche puis cliquez <Bouton>Modifier</Bouton> en haut de page. Les champs à fond clair sont à
            remplir ; les cases grisées se calculent automatiquement.
          </P>
          <P>
            Le rapport de bain s’écrit sous la forme 1:n : saisissez seulement n (un nombre entier). Le code Lab se
            calcule à partir du code HEX, que vous pouvez choisir avec le sélecteur de couleur ou taper directement ;
            les cases L, a, b peuvent aussi être corrigées à la main (valeurs négatives et virgule acceptées).
          </P>
          <P>
            Cliquez <Bouton>Mettre à jour</Bouton> pour enregistrer et revenir à la fiche, ou <Bouton>Annuler</Bouton>{" "}
            pour quitter sans enregistrer. Les deux boutons sont présents en haut et en bas de page.
          </P>
        </>
      ),
    },
    {
      id: "nouvelle",
      titre: "Nouvelle recette",
      contenu: (
        <>
          <P>
            Cliquez <Bouton>Nouvelle recette</Bouton> dans le menu. La fiche vide s’affiche, organisée comme en mode
            modification. Le numéro de fiche et la date sont obligatoires ; un numéro déjà utilisé est refusé. Cliquez{" "}
            <Bouton>Enregistrer</Bouton> une fois la fiche remplie.
          </P>
          <P>Seules les nuances où au moins une case « Nombre de parts » est supérieure à 0 sont enregistrées.</P>
        </>
      ),
    },
    {
      id: "imprimer",
      titre: "Imprimer une fiche",
      contenu: (
        <P>
          Ouvrez la fiche puis cliquez <Bouton>Imprimer</Bouton> en haut de page. La fenêtre d’impression du
          navigateur s’ouvre ; le menu et les boutons sont masqués à l’impression.
        </P>
      ),
    },
    {
      id: "recherche",
      titre: "Recherche par teinte",
      contenu: (
        <>
          <P>
            Choisissez <Bouton>HEX</Bouton> ou <Bouton>Lab</Bouton>, saisissez la couleur cible (un aperçu s’affiche
            pendant la saisie) puis cliquez <Bouton>Rechercher</Bouton>. Les 10 couleurs les plus proches du projet
            s’affichent, la cible et la couleur trouvée côte à côte.
          </P>
          <P>
            L’écart est mesuré par le ΔE2000 : plus il est petit, plus les couleurs se ressemblent. En dessous de 1, la
            différence est en général invisible à l’œil ; au-delà de 10, il s’agit nettement d’une autre teinte.
          </P>
        </>
      ),
    },
    {
      id: "calculs",
      titre: "Calculs",
      contenu: (
        <>
          <P>Les cases grisées sont calculées pour chaque nuance à partir des valeurs saisies :</P>
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
          <P className="text-sm text-encre-500">
            Les quantités sont en grammes lorsque la dilution vaut 1, en millilitres de solution mère sinon.
          </P>
        </>
      ),
    },
    {
      id: "bugs",
      titre: "Bugs signalés et améliorations prévues",
      titreCourt: "Bugs et améliorations",
      contenu: (
        <Liste>
          <li>Amélioration de la page d’impression.</li>
          <li>Ajout d’une page Administrateur pour gérer les accès depuis la plateforme.</li>
        </Liste>
      ),
    },
  ],
};

// ===================== ENGLISH =====================
const en = {
  titre: "Guide",
  intro: "Everything you need to know to look up, enter and find the studio’s dye recipes.",
  sommaire: "Contents",
  sections: [
    {
      id: "acces",
      titre: "Access",
      contenu: (
        <>
          <P>Access is currently managed outside the platform by the owner.</P>
          <P>Users cannot change their password themselves.</P>
          <P>Access and permissions for each project must be granted by the owner.</P>
        </>
      ),
    },
    {
      id: "niveaux",
      titre: "Access levels",
      contenu: (
        <>
          <P>For each project, users have one of the following access levels:</P>
          <Liste>
            <li>
              <Fort>Viewer</Fort>: view recipes and the swatch book, and search by shade.
            </li>
            <li>
              <Fort>Administrator</Fort>: in addition, save new recipes, edit existing recipes and create projects.
            </li>
          </Liste>
        </>
      ),
    },
    {
      id: "projet",
      titre: "Choosing a project",
      contenu: (
        <>
          <P>
            Start by choosing a project from the menu in the top right corner (<Bouton>Select a project</Bouton>). A
            green dot shows the active project. Every page then shows that project’s data.
          </P>
          <P>
            Administrators will find <Bouton>Create a new project</Bouton> at the bottom of the same menu. To sign out,
            click the circle with your initials on the far right.
          </P>
          <P>
            The <Bouton>FR</Bouton> / <Bouton>EN</Bouton> switch in the header changes the site language; your choice
            is remembered on this device.
          </P>
        </>
      ),
    },
    {
      id: "accueil",
      titre: "Home",
      contenu: (
        <P>
          From the home page you can open a recipe directly by typing its number, reach the main pages, and see the
          project’s latest recipes (most recent first). Click a recipe to open it.
        </P>
      ),
    },
    {
      id: "nuancier",
      titre: "Swatch book",
      contenu: (
        <>
          <P>The swatch book shows every colour saved in the project.</P>
          <Liste>
            <li>
              Filter by dye with the buttons below the title (<Bouton>All</Bouton> or a dye name).
            </li>
            <li>
              Sort <Bouton>By recipe</Bouton> (number order) or <Bouton>By colour</Bouton> (groups similar hues, from
              light to dark).
            </li>
            <li>Click a colour to open its recipe, or type a recipe number in the field in the top right corner.</li>
          </Liste>
        </>
      ),
    },
    {
      id: "fiche",
      titre: "Viewing a recipe",
      contenu: (
        <P>
          The recipe sheet shows the six shades obtained, the general details (author’s name, date, purpose, fibre,
          pre-mordanting, notes), the dye bath (liquor ratio, total parts, dyes and mordants), then the Shades, Dyes and
          Mordants tables and the initial water volume for each shade.
        </P>
      ),
    },
    {
      id: "modifier",
      titre: "Editing a recipe",
      contenu: (
        <>
          <P>
            Open the recipe and click <Bouton>Edit</Bouton> at the top of the page. Light fields are for you to fill
            in; grey cells are calculated automatically.
          </P>
          <P>
            The liquor ratio is written as 1:n: enter only n (a whole number). The Lab code is calculated from the HEX
            code, which you can pick with the colour picker or type in directly; the L, a, b cells can also be corrected
            by hand (negative values and decimal commas are accepted).
          </P>
          <P>
            Click <Bouton>Update</Bouton> to save and return to the recipe, or <Bouton>Cancel</Bouton> to leave without
            saving. Both buttons appear at the top and bottom of the page.
          </P>
        </>
      ),
    },
    {
      id: "nouvelle",
      titre: "New recipe",
      contenu: (
        <>
          <P>
            Click <Bouton>New recipe</Bouton> in the menu. A blank recipe sheet opens, laid out like the edit view. The
            recipe number and date are required; a number that is already used is rejected. Click{" "}
            <Bouton>Save</Bouton> once the sheet is filled in.
          </P>
          <P>Only shades with at least one “Number of parts” cell above 0 are saved.</P>
        </>
      ),
    },
    {
      id: "imprimer",
      titre: "Printing a recipe",
      contenu: (
        <P>
          Open the recipe and click <Bouton>Print</Bouton> at the top of the page. The browser’s print window opens;
          the menu and buttons are hidden when printing.
        </P>
      ),
    },
    {
      id: "recherche",
      titre: "Search by shade",
      contenu: (
        <>
          <P>
            Choose <Bouton>HEX</Bouton> or <Bouton>Lab</Bouton>, enter the target colour (a preview appears as you
            type) and click <Bouton>Search</Bouton>. The project’s 10 closest colours are listed, with the target and
            the matching colour side by side.
          </P>
          <P>
            The difference is measured with ΔE2000: the smaller it is, the more alike the colours. Below 1 the
            difference is usually invisible to the eye; above 10 it is clearly a different shade.
          </P>
        </>
      ),
    },
    {
      id: "calculs",
      titre: "Calculations",
      contenu: (
        <>
          <P>Grey cells are calculated for each shade from the values you enter:</P>
          <dl className={`${cls.carte} m-0 px-5 py-2`}>
            <Formule nom="Value of one part">depth of shade ÷ total parts</Formule>
            <Formule nom="Dye %">number of parts × value of one part</Formule>
            <Formule nom="Dye amount">fabric weight × dye % ÷ [C] powder × stock solution dilution</Formule>
            <Formule nom="Mordant amount">fabric weight × mordant % ÷ 100 × stock solution dilution</Formule>
            <Formule nom="Bath volume">fabric weight × n (liquor ratio 1:n)</Formule>
            <Formule nom="Initial water volume">bath volume − sum of dye and mordant amounts</Formule>
          </dl>
          <P className="text-sm text-encre-500">
            Amounts are in grams when the dilution is 1, otherwise in millilitres of stock solution.
          </P>
        </>
      ),
    },
    {
      id: "bugs",
      titre: "Known bugs and planned improvements",
      titreCourt: "Bugs and improvements",
      contenu: (
        <Liste>
          <li>Better print layout.</li>
          <li>An Administrator page to manage access from within the platform.</li>
        </Liste>
      ),
    },
  ],
};

const contenus = { fr, en };

export default function Tuto() {
  const { langue } = useLangue();
  const c = contenus[langue] || fr;

  return (
    <div className={`${cls.page} pt-14 flex flex-col gap-10`}>
      <div className="flex flex-col gap-2.5">
        <h1 className={`m-0 ${cls.h1}`}>{c.titre}</h1>
        <p className="m-0 text-base text-encre-500 max-w-2xl leading-relaxed">{c.intro}</p>
      </div>

      <div className="flex flex-wrap gap-10 items-start">
        {/* ===== SOMMAIRE ===== */}
        <nav
          aria-label={c.sommaire}
          className={`${cls.carte} flex-[1_1_220px] max-w-xs p-5 flex flex-col gap-1 lg:sticky lg:top-6`}
        >
          <p className="m-0 mb-2 text-[13px] tracking-[0.08em] uppercase text-encre-500">{c.sommaire}</p>
          {c.sections.map((s) => (
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
              {s.titreCourt || s.titre}
            </a>
          ))}
        </nav>

        {/* ===== CONTENU ===== */}
        <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-10">
          {c.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-6 flex flex-col gap-3">
              <h2 className={`m-0 ${cls.h3}`}>{s.titre}</h2>
              <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-encre-700">{s.contenu}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
