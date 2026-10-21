-- Fix voting security
-- poll_votes policies and aggregates

-- Remove permissive select policy
DROP POLICY IF EXISTS "poll read" ON public.poll_votes;

-- Select own vote only
CREATE POLICY "poll_votes_select_own" ON public.poll_votes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Ensure insert policy exists
DROP POLICY IF EXISTS "poll vote own" ON public.poll_votes;
CREATE POLICY "poll_votes_insert_own" ON public.poll_votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own
DROP POLICY IF EXISTS "poll change own" ON public.poll_votes;
CREATE POLICY "poll_votes_update_own" ON public.poll_votes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own
CREATE POLICY "poll_votes_delete_own" ON public.poll_votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Aggregate counts without exposing user_id
CREATE OR REPLACE FUNCTION public.get_poll_counts(p_post_id uuid)
RETURNS TABLE (option_idx int, cnt bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT option_idx, count(*)::bigint
  FROM public.poll_votes
  WHERE post_id = p_post_id
  GROUP BY option_idx;
$$;

GRANT EXECUTE ON FUNCTION public.get_poll_counts(uuid) TO authenticated;

-- Likes policies
DROP POLICY IF EXISTS "likes_select_own" ON public.likes;
CREATE POLICY "likes_select_own" ON public.likes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_insert_own" ON public.likes;
CREATE POLICY "likes_insert_own" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND vote IN (1, -1, 0));

DROP POLICY IF EXISTS "likes_delete_own" ON public.likes;
CREATE POLICY "likes_delete_own" ON public.likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Aggregate score for posts
CREATE OR REPLACE FUNCTION public.get_post_score(p_post_id uuid)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(sum(vote), 0)::int
  FROM public.likes
  WHERE post_id = p_post_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_score(uuid) TO authenticated;

-- comment_votes policies
DROP POLICY IF EXISTS "comment_votes_select_own" ON public.comment_votes;
CREATE POLICY "comment_votes_select_own" ON public.comment_votes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_votes_insert_own" ON public.comment_votes;
CREATE POLICY "comment_votes_insert_own" ON public.comment_votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND vote IN (1, -1, 0));

DROP POLICY IF EXISTS "comment_votes_update_own" ON public.comment_votes;
CREATE POLICY "comment_votes_update_own" ON public.comment_votes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND vote IN (1, -1, 0));

DROP POLICY IF EXISTS "comment_votes_delete_own" ON public.comment_votes;
CREATE POLICY "comment_votes_delete_own" ON public.comment_votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Aggregate score for comments
CREATE OR REPLACE FUNCTION public.get_comment_score(p_comment_id uuid)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(sum(vote), 0)::int
  FROM public.comment_votes
  WHERE comment_id = p_comment_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_comment_score(uuid) TO authenticated;

-- vote_post function security definer
CREATE OR REPLACE FUNCTION public.vote_post(p_post_id uuid, p_vote int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_vote NOT IN (1, -1, 0) THEN
    RAISE EXCEPTION 'voto inválido';
  END IF;

  IF p_vote = 0 THEN
    DELETE FROM public.likes WHERE post_id = p_post_id AND user_id = auth.uid();
  ELSE
    INSERT INTO public.likes(post_id, user_id, vote)
    VALUES (p_post_id, auth.uid(), p_vote)
    ON CONFLICT (post_id, user_id)
    DO UPDATE SET vote = EXCLUDED.vote;
  END IF;

  RETURN COALESCE((SELECT sum(vote) FROM public.likes WHERE post_id = p_post_id), 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.vote_post(uuid, int) TO authenticated;

-- vote_comment function security definer
CREATE OR REPLACE FUNCTION public.vote_comment(p_comment_id uuid, p_vote int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_vote NOT IN (1, -1, 0) THEN
    RAISE EXCEPTION 'voto inválido';
  END IF;

  IF p_vote = 0 THEN
    DELETE FROM public.comment_votes WHERE comment_id = p_comment_id AND user_id = auth.uid();
  ELSE
    INSERT INTO public.comment_votes(comment_id, user_id, vote)
    VALUES (p_comment_id, auth.uid(), p_vote)
    ON CONFLICT (comment_id, user_id)
    DO UPDATE SET vote = EXCLUDED.vote;
  END IF;

  RETURN COALESCE((SELECT sum(vote) FROM public.comment_votes WHERE comment_id = p_comment_id), 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.vote_comment(uuid, int) TO authenticated;
