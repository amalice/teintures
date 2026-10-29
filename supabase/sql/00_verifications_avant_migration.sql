-- =====================================================================
-- 00 — VÉRIFICATIONS AVANT MIGRATION (lecture seule, ne modifie rien)
-- À coller dans Supabase > SQL Editor, puis exécuter requête par requête.
-- Si l'un des résultats ne correspond pas à ce qui est indiqué, ne pas lancer
-- la migration 01 et me renvoyer le résultat.
-- =====================================================================

-- 1. Tables de recettes existantes et nombre de lignes.
--    Attendu : une table recettes_<nom> par projet.
select c.relname as table_recettes,
       (xpath('/row/n/text()',
              query_to_xml(format('select count(*) as n from public.%I', c.relname), false, true, '')))[1]::text::int as nb_lignes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'recettes\_%'
order by 1;

-- 2. Correspondance projet -> table (même règle que l'ancien code :
--    « recettes_ » + nom en minuscules, espaces remplacés par « _ »).
--    Attendu : table_existe = true pour chaque projet qui a des fiches,
--    et aucun nom de table en double.
select p.id, p.nom,
       'recettes_' || regexp_replace(lower(p.nom), '\s+', '_', 'g') as table_attendue,
       to_regclass('public.' || quote_ident('recettes_' || regexp_replace(lower(p.nom), '\s+', '_', 'g'))) is not null as table_existe
from public.projets p
order by p.nom;

-- 3. Types des colonnes clés.
--    Attendu : projets.id = uuid ; droits_projet.utilisateur_id et projet_id = uuid ;
--    recettes_*.id et recette_id = uuid ou text contenant des UUID.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
       (table_name = 'projets' and column_name in ('id', 'nom', 'date_creation', 'created_by'))
    or (table_name = 'droits_projet')
    or (table_name like 'recettes\_%' and column_name in ('id', 'recette_id', 'numero_fiche'))
  )
order by table_name, column_name;

-- 4. Doublons dans droits_projet (un même utilisateur deux fois sur un projet).
--    Attendu : aucune ligne. Sinon, supprimer les doublons avant la migration.
select projet_id, utilisateur_id, count(*)
from public.droits_projet
group by 1, 2
having count(*) > 1;

-- 5. Fonctions, vues et déclencheurs qui mentionnent encore les anciennes tables.
--    Attendu : supprimer_fiche (remplacée par la migration). Tout autre nom
--    (par ex. une fonction qui crée la table d'un nouveau projet) : me le signaler.
select 'fonction' as type, p.proname as nom
from pg_proc p
where p.pronamespace = 'public'::regnamespace and p.prosrc ilike '%recettes\_%'
union all
select 'vue', viewname from pg_views where schemaname = 'public' and definition ilike '%recettes\_%'
union all
select 'déclencheur', tgname || ' sur ' || tgrelid::regclass::text
from pg_trigger where not tgisinternal and tgrelid in ('public.projets'::regclass, 'public.droits_projet'::regclass);

-- 6. Règles RLS actuelles sur projets et droits_projet (elles seront remplacées).
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('projets', 'droits_projet', 'utilisateurs')
order by 1, 2;

-- 7. Droits accordés aux deux comptes écrits en dur dans l'ancien CreerProjetModal.jsx.
--    À relire : pour chaque projet client, ces droits doivent-ils exister ?
select d.projet_id, p.nom as projet, d.utilisateur_id, u.email, d.role
from public.droits_projet d
join public.projets p on p.id = d.projet_id
left join auth.users u on u.id = d.utilisateur_id
where d.utilisateur_id in ('80ed0f34-e8a7-428a-ae6c-9233e6eb7a62',
                           '1be747ff-3a84-4cba-92d5-2a7b04f97104')
order by p.nom;
