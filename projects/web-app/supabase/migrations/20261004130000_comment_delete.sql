-- The author of a comment may delete it (contract v3 "Komentarz", D-11 amended 2026-10-04).
--
-- Applied ONLY by a human (D-06): no agent runs this file against any database. Run it after
-- 20261003170200_append_only_guards.sql.
--
-- What changes:
-- - a direct DELETE on public.report_comments is allowed again. The server deletes only by
--   (id, report_id, author_id), so a comment goes away only at its author's request;
-- - comments still cannot be edited (report_comments_no_update stays) or truncated
--   (report_comments_no_truncate stays);
-- - history is unchanged: report_history stays append-only.

drop trigger report_comments_no_delete on public.report_comments;
