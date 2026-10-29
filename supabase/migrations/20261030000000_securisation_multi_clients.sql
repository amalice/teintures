-- =====================================================================
-- 01 — SÉCURISATION MULTI-CLIENTS
--
--  1. Une seule table public.recettes (colonne projet_id) au lieu d'une
--     table recettes_<projet> par projet. Les données sont recopiées ; les
--     anciennes tables ne sont PAS supprimées (voir le script 02).
--  2. Règles RLS : chaque utilisateur ne voit que les projets, droits et
--     recettes des projets dont il est membre.
--  3. Les écritures passent par des fonctions qui vérifient le rôle :
--       creer_projet, enregistrer_fiche, supprimer_fiche.
--  4. Fonctions réservées au serveur (clé secrète) pour l'Edge Function
--     gestion-membres : membres_projet, utilisateur_par_email.
--  5. Suppression du déclencheur on_projet_created et des fonctions
--     handle_new_projet / create_recettes_table, qui créaient une table
--     recettes_<projet> à chaque nouveau projet. creer_projet() les remplace.
--
-- Tout s'exécute dans une transaction : en cas d'erreur, rien n'est modifié.
-- Lancer d'abord 00_verifications_avant_migration.sql.
-- =====================================================================

begin;

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- 0. Plus de création automatique de table par projet
-- ---------------------------------------------------------------------
-- handle_new_projet() créait la table recettes_<projet> et ajoutait le
-- créateur comme Administrateur. Ce second point est repris par creer_projet().
-- (create_recettes_table était en outre appelable par n'importe qui via l'API.)
drop trigger if exists on_projet_created on public.projets;
drop function if exists public.handle_new_projet();
drop function if exists public.create_recettes_table(uuid);

-- ---------------------------------------------------------------------
-- 1. Table unique public.recettes
-- ---------------------------------------------------------------------
-- La structure est reprise de la table recettes_* la plus complète, pour
-- garder exactement les mêmes colonnes et les mêmes types qu'aujourd'hui.
do $$
declare
  v_ref text;
begin
  select c.relname into v_ref
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'recettes\_%'
  order by (select count(*) from pg_attribute a
            where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) desc,
           c.relname
  limit 1;

  if v_ref is null then
    raise exception 'Aucune table recettes_* trouvée : migration interrompue.';
  end if;

  raise notice 'Structure reprise de public.%', v_ref;
  execute format(
    'create table public.recettes (like public.%I including defaults including constraints including generated including comments)',
    v_ref);
end $$;

-- id et recette_id en uuid (le code les génère avec crypto.randomUUID()).
do $$
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'recettes' and column_name = 'id') <> 'uuid' then
    alter table public.recettes alter column id type uuid using id::uuid;
  end if;
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'recettes' and column_name = 'recette_id') <> 'uuid' then
    alter table public.recettes alter column recette_id type uuid using recette_id::uuid;
  end if;
end $$;

alter table public.recettes add column projet_id uuid;

-- ---------------------------------------------------------------------
-- 2. Reprise des données, projet par projet
-- ---------------------------------------------------------------------
do $$
declare
  p          record;
  v_table    text;
  v_cols     text;
  v_nb       bigint;
  v_total    bigint := 0;
  v_utilisees text[] := '{}';
  v_orphelin text;
begin
  for p in select id, nom from public.projets order by nom loop
    v_table := 'recettes_' || regexp_replace(lower(p.nom), '\s+', '_', 'g');

    if to_regclass('public.' || quote_ident(v_table)) is null then
      raise notice 'Projet « % » : pas de table %, aucune fiche à reprendre.', p.nom, v_table;
      continue;
    end if;

    if v_table = any (v_utilisees) then
      raise exception 'Deux projets pointent vers la même table % : à régler à la main.', v_table;
    end if;
    v_utilisees := v_utilisees || v_table;

    -- colonnes communes à l'ancienne table et à la nouvelle
    select string_agg(quote_ident(a.attname), ', ' order by a.attnum) into v_cols
    from pg_attribute a
    where a.attrelid = ('public.' || quote_ident(v_table))::regclass
      and a.attnum > 0 and not a.attisdropped
      and exists (select 1 from pg_attribute b
                  where b.attrelid = 'public.recettes'::regclass
                    and b.attname = a.attname and b.attnum > 0
                    and not b.attisdropped and b.attgenerated = '');

    execute format(
      'insert into public.recettes (projet_id, %1$s) select %2$L::uuid, %3$s from public.%4$I',
      v_cols, p.id,
      -- les colonnes id / recette_id peuvent être du texte dans l'ancienne table
      (select string_agg(
                case when c in ('id', 'recette_id') then c || '::uuid' else c end,
                ', ')
       from unnest(string_to_array(v_cols, ', ')) as c),
      v_table);
    get diagnostics v_nb = row_count;
    v_total := v_total + v_nb;
    raise notice 'Projet « % » : % ligne(s) reprise(s) depuis %.', p.nom, v_nb, v_table;
  end loop;

  -- tables recettes_* qui ne correspondent à aucun projet
  for v_orphelin in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'recettes\_%'
      and not (c.relname = any (v_utilisees))
  loop
    raise warning 'Table % : aucun projet ne porte ce nom, ses données n''ont PAS été reprises.', v_orphelin;
  end loop;

  raise notice 'Total : % ligne(s) reprise(s) dans public.recettes.', v_total;
end $$;

-- ---------------------------------------------------------------------
-- 3. Contraintes et index
-- ---------------------------------------------------------------------
alter table public.recettes alter column projet_id set not null;
alter table public.recettes alter column recette_id set not null;
alter table public.recettes alter column id set default gen_random_uuid();

alter table public.recettes
  add constraint recettes_pkey primary key (id),
  -- une nuance n'apparaît qu'une fois par fiche (comme dans les anciennes tables)
  add constraint recettes_recette_couleur_unique unique (recette_id, couleur_numero),
  add constraint recettes_projet_id_fkey
    foreign key (projet_id) references public.projets (id) on delete cascade,
  -- un numéro de fiche n'existe qu'une fois par projet (les nuances d'une même
  -- fiche partagent le numéro). Violation => code 23P01, déjà géré par le front.
  add constraint recettes_numero_fiche_unique_par_projet
    exclude using gist (projet_id with =, numero_fiche with =, recette_id with <>);

create index recettes_projet_recette_idx on public.recettes (projet_id, recette_id);
create index recettes_projet_date_idx    on public.recettes (projet_id, date desc);

-- ---------------------------------------------------------------------
-- 4. Fonction d'aide : rôle de l'utilisateur connecté dans un projet
-- ---------------------------------------------------------------------
-- SECURITY DEFINER pour pouvoir lire droits_projet depuis les règles RLS
-- de droits_projet elle-même (sinon récursion infinie).
create or replace function public.role_dans_projet(p_projet_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select d.role
  from public.droits_projet d
  where d.projet_id = p_projet_id
    and d.utilisateur_id = (select auth.uid())
  limit 1
$$;

-- ---------------------------------------------------------------------
-- 5. Règles RLS
-- ---------------------------------------------------------------------
-- On repart de zéro sur projets et droits_projet : les anciennes règles sont supprimées.
do $$
declare
  r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('projets', 'droits_projet', 'recettes')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.projets       enable row level security;
alter table public.droits_projet enable row level security;
alter table public.recettes      enable row level security;

-- projets : visibles par leurs membres ; renommables par leurs administrateurs.
-- Création uniquement via creer_projet() ; suppression uniquement côté serveur.
create policy projets_lecture_membres on public.projets
  for select to authenticated
  using (public.role_dans_projet(id) is not null);

create policy projets_modification_admins on public.projets
  for update to authenticated
  using (public.role_dans_projet(id) = 'Administrateur')
  with check (public.role_dans_projet(id) = 'Administrateur');

-- droits_projet : chacun voit ses propres droits ; un administrateur voit
-- ceux de son projet. Aucune écriture depuis le navigateur : la gestion des
-- membres passe par l'Edge Function gestion-membres (clé secrète côté serveur).
create policy droits_lecture on public.droits_projet
  for select to authenticated
  using (utilisateur_id = (select auth.uid())
         or public.role_dans_projet(projet_id) = 'Administrateur');

-- recettes : lecture par tous les membres du projet. Écritures uniquement via
-- enregistrer_fiche() et supprimer_fiche(), qui contrôlent le rôle.
create policy recettes_lecture_membres on public.recettes
  for select to authenticated
  using (public.role_dans_projet(projet_id) is not null);

-- Pas d'accès anonyme du tout.
revoke all on public.recettes from anon;
revoke insert, update, delete on public.recettes from authenticated;
revoke insert, update, delete on public.droits_projet from authenticated, anon;
revoke insert, delete on public.projets from authenticated, anon;
grant select on public.recettes to authenticated;
grant all on public.recettes to service_role;

-- ---------------------------------------------------------------------
-- 6. Fonctions appelées par l'application
-- ---------------------------------------------------------------------

-- Création d'un projet : le créateur (et lui seul) en devient Administrateur.
-- Réservé pour l'instant aux utilisateurs déjà administrateurs d'un projet
-- (comme le bouton « Créer un projet » de l'interface).
create or replace function public.creer_projet(p_nom text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Non authentifié' using errcode = '42501';
  end if;
  if not exists (select 1 from public.droits_projet
                 where utilisateur_id = v_uid and role = 'Administrateur') then
    raise exception 'Création de projet non autorisée' using errcode = '42501';
  end if;
  if coalesce(trim(p_nom), '') = '' then
    raise exception 'Le nom du projet est obligatoire' using errcode = '22023';
  end if;

  insert into public.projets (nom, date_creation, created_by)
  values (trim(p_nom), now(), v_uid)
  returning id into v_id;

  insert into public.droits_projet (utilisateur_id, projet_id, role)
  values (v_uid, v_id, 'Administrateur')
  on conflict (utilisateur_id, projet_id) do nothing;

  return v_id;
end $$;

-- Enregistrement d'une fiche (création ou modification), en une seule
-- transaction : les anciennes nuances sont remplacées par p_lignes.
-- Autorisé aux Administrateurs et Teinturiers du projet.
create or replace function public.enregistrer_fiche(
  p_projet_id  uuid,
  p_recette_id uuid,
  p_lignes     jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cols text;
begin
  if coalesce(public.role_dans_projet(p_projet_id), '') not in ('Administrateur', 'Teinturier') then
    raise exception 'Droits insuffisants pour modifier les fiches de ce projet' using errcode = '42501';
  end if;
  if jsonb_typeof(p_lignes) is distinct from 'array' or jsonb_array_length(p_lignes) = 0 then
    raise exception 'La fiche doit contenir au moins une nuance' using errcode = '22023';
  end if;
  if exists (select 1 from public.recettes
             where recette_id = p_recette_id and projet_id <> p_projet_id) then
    raise exception 'Cette fiche appartient à un autre projet' using errcode = '42501';
  end if;

  delete from public.recettes
  where projet_id = p_projet_id and recette_id = p_recette_id;

  -- Colonnes envoyées par le navigateur (projet_id et recette_id sont imposés ici).
  select string_agg(quote_ident(a.attname), ', ' order by a.attnum) into v_cols
  from pg_attribute a
  where a.attrelid = 'public.recettes'::regclass
    and a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
    and a.attname not in ('projet_id', 'recette_id')
    and exists (select 1 from jsonb_array_elements(p_lignes) e where e ? a.attname);

  execute format(
    'insert into public.recettes (projet_id, recette_id%1$s)
     select $1, $2%1$s from jsonb_populate_recordset(null::public.recettes, $3)',
    coalesce(', ' || v_cols, ''))
  using p_projet_id, p_recette_id, p_lignes;
end $$;

-- Suppression d'une fiche : Administrateurs du projet uniquement.
-- (remplace l'ancienne version qui travaillait sur les tables recettes_*)
do $$
declare
  f regprocedure;
begin
  for f in select oid::regprocedure from pg_proc
           where proname = 'supprimer_fiche' and pronamespace = 'public'::regnamespace
  loop
    execute 'drop function ' || f;
  end loop;
end $$;

create function public.supprimer_fiche(p_projet_id uuid, p_recette_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.role_dans_projet(p_projet_id) is distinct from 'Administrateur' then
    raise exception 'Seuls les administrateurs du projet peuvent supprimer une fiche' using errcode = '42501';
  end if;
  delete from public.recettes
  where projet_id = p_projet_id and recette_id = p_recette_id;
end $$;

revoke execute on function public.role_dans_projet(uuid)                from public, anon;
revoke execute on function public.creer_projet(text)                    from public, anon;
revoke execute on function public.enregistrer_fiche(uuid, uuid, jsonb)  from public, anon;
revoke execute on function public.supprimer_fiche(uuid, uuid)           from public, anon;
grant  execute on function public.role_dans_projet(uuid)                to authenticated;
grant  execute on function public.creer_projet(text)                    to authenticated;
grant  execute on function public.enregistrer_fiche(uuid, uuid, jsonb)  to authenticated;
grant  execute on function public.supprimer_fiche(uuid, uuid)           to authenticated;

-- ---------------------------------------------------------------------
-- 7. Fonctions réservées au serveur (Edge Function gestion-membres)
-- ---------------------------------------------------------------------
-- Elles lisent auth.users : jamais exécutables depuis le navigateur.

-- Membres d'un projet, avec leur e-mail.
create or replace function public.membres_projet(p_projet_id uuid)
returns table (utilisateur_id uuid, email text, nom text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.utilisateur_id,
         u.email::text,
         coalesce(u.raw_user_meta_data ->> 'nom', split_part(u.email::text, '@', 1)),
         d.role
  from public.droits_projet d
  join auth.users u on u.id = d.utilisateur_id
  where d.projet_id = p_projet_id
  order by lower(u.email::text)
$$;

-- Identifiant d'un compte à partir de son e-mail (null s'il n'existe pas).
create or replace function public.utilisateur_par_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id from auth.users u
  where lower(u.email::text) = lower(trim(p_email))
  limit 1
$$;

revoke execute on function public.membres_projet(uuid)        from public, anon, authenticated;
revoke execute on function public.utilisateur_par_email(text) from public, anon, authenticated;
grant  execute on function public.membres_projet(uuid)        to service_role;
grant  execute on function public.utilisateur_par_email(text) to service_role;

commit;
