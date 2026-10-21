-- Migration: permitir exclusão de comunidade apenas por criador ou admin
-- Data: 2026-10-21
-- Objetivo: criar política DELETE em public.communities restrita a criador da comunidade ou usuário admin

-- Remove política existente com mesmo nome, se houver, para evitar conflito em reaplicações
DROP POLICY IF EXISTS "communities_delete_creator_or_admin" ON public.communities;

-- Política DELETE: apenas o criador (creator_id = auth.uid()) ou admin (is_admin()) pode remover a comunidade
CREATE POLICY "communities_delete_creator_or_admin"
ON public.communities
FOR DELETE
TO authenticated
USING (
  creator_id = auth.uid()
  OR is_admin()
);

-- Nota sobre cascata
-- A exclusão de uma comunidade deve cascatear para tabelas dependentes para evitar violações de FK:
--   public.posts (community_id)
--   public.community_members (community_id)
--   public.community_mods (community_id)
--   public.community_bans (community_id)
--
-- Verifique no Supabase Dashboard / via \d+ se as chaves estrangeiras já possuem ON DELETE CASCADE.
-- Caso não possuam, considere aplicar algo como (nomes de constraints podem variar):
--
-- ALTER TABLE public.posts
--   DROP CONSTRAINT posts_community_id_fkey,
--   ADD CONSTRAINT posts_community_id_fkey
--   FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
--
-- ALTER TABLE public.community_members
--   DROP CONSTRAINT community_members_community_id_fkey,
--   ADD CONSTRAINT community_members_community_id_fkey
--   FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
--
-- ALTER TABLE public.community_mods
--   DROP CONSTRAINT community_mods_community_id_fkey,
--   ADD CONSTRAINT community_mods_community_id_fkey
--   FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
--
-- ALTER TABLE public.community_bans
--   DROP CONSTRAINT community_bans_community_id_fkey,
--   ADD CONSTRAINT community_bans_community_id_fkey
--   FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
--
-- Se as constraints já estiverem com ON DELETE CASCADE, nenhuma alteração é necessária.
