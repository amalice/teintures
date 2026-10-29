-- =====================================================================
-- 02 — SUPPRESSION DES ANCIENNES TABLES recettes_<projet>
--
-- À lancer SEULEMENT après avoir vérifié, avec la nouvelle version de
-- l'application en ligne, que toutes les fiches de chaque projet sont bien
-- là (accueil, nuancier, ouverture et modification d'une fiche).
-- Faire une sauvegarde avant (Supabase > Database > Backups).
-- =====================================================================

-- 1. Contrôle : nombre de lignes par projet, anciennes tables vs nouvelle table.
--    Les deux colonnes doivent être égales pour chaque projet.
select p.nom,
       (select count(*) from public.recettes r where r.projet_id = p.id) as nouvelle_table,
       case when to_regclass('public.' || quote_ident('recettes_' || regexp_replace(lower(p.nom), '\s+', '_', 'g'))) is null
            then 0
            else (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I',
                   'recettes_' || regexp_replace(lower(p.nom), '\s+', '_', 'g')), false, true, '')))[1]::text::int
       end as ancienne_table
from public.projets p
order by p.nom;

-- 2. Suppression (décommenter pour exécuter).
-- do $$
-- declare t text;
-- begin
--   for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
--            where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'recettes\_%'
--   loop
--     execute format('drop table public.%I', t);
--     raise notice 'Table % supprimée', t;
--   end loop;
-- end $$;
