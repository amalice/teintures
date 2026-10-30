-- =====================================================================
-- 03 — Les Teinturiers peuvent supprimer une fiche
--
-- Remplace supprimer_fiche() (créée par la migration du 30/10/2026) :
-- suppression autorisée aux Administrateurs ET aux Teinturiers du projet.
-- Les Visiteurs restent en lecture seule.
-- À coller dans Supabase > SQL Editor et exécuter.
-- =====================================================================

create or replace function public.supprimer_fiche(p_projet_id uuid, p_recette_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(public.role_dans_projet(p_projet_id), '') not in ('Administrateur', 'Teinturier') then
    raise exception 'Droits insuffisants pour supprimer une fiche de ce projet' using errcode = '42501';
  end if;
  delete from public.recettes
  where projet_id = p_projet_id and recette_id = p_recette_id;
end $$;

revoke execute on function public.supprimer_fiche(uuid, uuid) from public, anon;
grant  execute on function public.supprimer_fiche(uuid, uuid) to authenticated;
