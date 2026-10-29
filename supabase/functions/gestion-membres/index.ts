// Edge Function « gestion-membres »
//
// Gestion des membres d'un projet, côté serveur. La clé secrète (service_role)
// ne quitte jamais Supabase : le navigateur n'envoie que le jeton de session
// de l'utilisateur connecté, et chaque action vérifie qu'il est Administrateur
// du projet concerné.
//
// Appel depuis le front :
//   supabase.functions.invoke('gestion-membres', { body: { action, projet_id, ... } })
//
// Actions :
//   lister    { projet_id }                          -> { membres: [...] }
//   ajouter   { projet_id, email, role }             -> { membre, invite }
//   modifier  { projet_id, utilisateur_id, role }    -> { ok: true }
//   retirer   { projet_id, utilisateur_id }          -> { ok: true }
//
// Déploiement : supabase functions deploy gestion-membres
// Variables fournies automatiquement par Supabase : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Variables optionnelles (supabase secrets set ...) :
//   ORIGINES_AUTORISEES  ex. "https://amalice.github.io,http://localhost:3000"
//   URL_APPLICATION      page vers laquelle renvoie l'e-mail d'invitation

import { createClient } from 'npm:@supabase/supabase-js@2';

const ROLES = ['Administrateur', 'Teinturier', 'Visiteur'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const originesAutorisees = (Deno.env.get('ORIGINES_AUTORISEES') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const enTetesCors = (req: Request) => {
  const origine = req.headers.get('Origin') ?? '';
  const autorisee =
    originesAutorisees.length === 0 ? '*' : originesAutorisees.includes(origine) ? origine : originesAutorisees[0];
  return {
    'Access-Control-Allow-Origin': autorisee,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
};

class ErreurHttp extends Error {
  constructor(public statut: number, message: string) {
    super(message);
  }
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const verifier = (condition: unknown, message: string, statut = 400) => {
  if (!condition) throw new ErreurHttp(statut, message);
};

const roleDe = async (projetId: string, utilisateurId: string): Promise<string | null> => {
  const { data, error } = await admin
    .from('droits_projet')
    .select('role')
    .eq('projet_id', projetId)
    .eq('utilisateur_id', utilisateurId)
    .limit(1);
  if (error) throw error;
  return data?.[0]?.role ?? null;
};

const nombreAdmins = async (projetId: string): Promise<number> => {
  const { count, error } = await admin
    .from('droits_projet')
    .select('utilisateur_id', { count: 'exact', head: true })
    .eq('projet_id', projetId)
    .eq('role', 'Administrateur');
  if (error) throw error;
  return count ?? 0;
};

// Empêche un projet de se retrouver sans administrateur.
const protegerDernierAdmin = async (projetId: string, utilisateurId: string, nouveauRole: string | null) => {
  const roleActuel = await roleDe(projetId, utilisateurId);
  if (roleActuel === 'Administrateur' && nouveauRole !== 'Administrateur') {
    verifier((await nombreAdmins(projetId)) > 1, 'Le projet doit garder au moins un administrateur.', 409);
  }
  return roleActuel;
};

Deno.serve(async (req) => {
  const cors = enTetesCors(req);
  const repondre = (corps: unknown, statut = 200) =>
    new Response(JSON.stringify(corps), {
      status: statut,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return repondre({ erreur: 'Méthode non autorisée' }, 405);

  try {
    // 1. Qui appelle ? (jeton de session envoyé par supabase-js)
    const jeton = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    verifier(jeton, 'Non authentifié', 401);
    const { data: { user }, error: erreurAuth } = await admin.auth.getUser(jeton);
    verifier(!erreurAuth && user, 'Session invalide ou expirée', 401);

    // 2. Sur quel projet, et l'appelant en est-il administrateur ?
    const corps = await req.json().catch(() => ({}));
    const { action, projet_id: projetId } = corps ?? {};
    verifier(typeof projetId === 'string' && UUID.test(projetId), 'projet_id invalide');
    verifier((await roleDe(projetId, user!.id)) === 'Administrateur', 'Accès réservé aux administrateurs du projet', 403);

    switch (action) {
      case 'lister': {
        const { data, error } = await admin.rpc('membres_projet', { p_projet_id: projetId });
        if (error) throw error;
        return repondre({ membres: data ?? [] });
      }

      case 'ajouter': {
        const email = String(corps.email ?? '').trim().toLowerCase();
        const role = corps.role;
        verifier(EMAIL.test(email), 'Adresse e-mail invalide');
        verifier(ROLES.includes(role), 'Rôle invalide');

        // Compte existant ? Sinon on envoie une invitation par e-mail.
        const { data: idExistant, error: erreurRecherche } = await admin.rpc('utilisateur_par_email', { p_email: email });
        if (erreurRecherche) throw erreurRecherche;

        let utilisateurId: string | null = idExistant ?? null;
        let invite = false;
        if (!utilisateurId) {
          const redirection = Deno.env.get('URL_APPLICATION');
          const { data: invitation, error: erreurInvitation } = await admin.auth.admin.inviteUserByEmail(
            email,
            redirection ? { redirectTo: redirection } : undefined,
          );
          if (erreurInvitation) throw erreurInvitation;
          utilisateurId = invitation.user.id;
          invite = true;
        }

        verifier(!(await roleDe(projetId, utilisateurId!)), 'Cette personne est déjà membre du projet.', 409);

        const { error } = await admin
          .from('droits_projet')
          .insert({ projet_id: projetId, utilisateur_id: utilisateurId, role });
        if (error) throw error;

        return repondre({ membre: { utilisateur_id: utilisateurId, email, role }, invite });
      }

      case 'modifier': {
        const { utilisateur_id: utilisateurId, role } = corps;
        verifier(typeof utilisateurId === 'string' && UUID.test(utilisateurId), 'utilisateur_id invalide');
        verifier(ROLES.includes(role), 'Rôle invalide');
        const roleActuel = await protegerDernierAdmin(projetId, utilisateurId, role);
        verifier(roleActuel, 'Cette personne n’est pas membre du projet.', 404);

        const { error } = await admin
          .from('droits_projet')
          .update({ role })
          .eq('projet_id', projetId)
          .eq('utilisateur_id', utilisateurId);
        if (error) throw error;
        return repondre({ ok: true });
      }

      case 'retirer': {
        const { utilisateur_id: utilisateurId } = corps;
        verifier(typeof utilisateurId === 'string' && UUID.test(utilisateurId), 'utilisateur_id invalide');
        await protegerDernierAdmin(projetId, utilisateurId, null);

        const { error } = await admin
          .from('droits_projet')
          .delete()
          .eq('projet_id', projetId)
          .eq('utilisateur_id', utilisateurId);
        if (error) throw error;
        return repondre({ ok: true });
      }

      default:
        throw new ErreurHttp(400, 'Action inconnue');
    }
  } catch (err) {
    if (err instanceof ErreurHttp) return repondre({ erreur: err.message }, err.statut);
    // ajout simultané de la même personne : bloqué par l'index unique (projet_id, utilisateur_id)
    if ((err as { code?: string })?.code === '23505') {
      return repondre({ erreur: 'Cette personne est déjà membre du projet.' }, 409);
    }
    console.error(err);
    return repondre({ erreur: 'Erreur interne' }, 500);
  }
});
