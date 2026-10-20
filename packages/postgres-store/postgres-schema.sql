-- Dedicated schema: no access to another application's tables.
CREATE SCHEMA IF NOT EXISTS plantcare;
SET search_path TO plantcare, public;
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, phone TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password TEXT NOT NULL, status TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'MEMBER', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires_at BIGINT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), purpose TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at BIGINT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, used INTEGER NOT NULL DEFAULT 0, sent_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS otp_locks(user_id TEXT NOT NULL REFERENCES users(id), purpose TEXT NOT NULL, locked_until BIGINT NOT NULL, PRIMARY KEY(user_id,purpose));
CREATE TABLE IF NOT EXISTS documents(kind TEXT NOT NULL, id TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id), version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL, body TEXT NOT NULL CHECK(jsonb_typeof(body::jsonb) IS NOT NULL), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(kind,id));
CREATE INDEX IF NOT EXISTS docs_owner ON documents(kind,owner_id,updated_at,id);
CREATE INDEX IF NOT EXISTS docs_status ON documents(kind,status,updated_at);
CREATE OR REPLACE FUNCTION reject_immutable_document() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.kind IN ('plan','mvp-bundle','mvp-config') THEN RAISE EXCEPTION 'document version is immutable'; END IF;
  RETURN NEW;
END;
$$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='immutable_document' AND tgrelid='plantcare.documents'::regclass) THEN
    CREATE TRIGGER immutable_document BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION reject_immutable_document();
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS shares(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), version_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at BIGINT NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS idempotency(owner_id TEXT NOT NULL, endpoint TEXT NOT NULL, key TEXT NOT NULL, request_hash TEXT NOT NULL, response TEXT NOT NULL CHECK(jsonb_typeof(response::jsonb) IS NOT NULL), PRIMARY KEY(owner_id,endpoint,key));
CREATE TABLE IF NOT EXISTS completions(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), case_id TEXT NOT NULL, version_id TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(case_id,version_id));
CREATE TABLE IF NOT EXISTS movements(id TEXT PRIMARY KEY, completion_id TEXT NOT NULL REFERENCES completions(id), material_id TEXT NOT NULL, quantity TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(completion_id,material_id));
CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY, job_id TEXT NOT NULL UNIQUE, dispatched_at TEXT);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, action TEXT NOT NULL, resource_id TEXT NOT NULL, request_id TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS ai_calls(id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, day TEXT NOT NULL, status TEXT NOT NULL, usage TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS private_files(key TEXT PRIMARY KEY, content BYTEA NOT NULL CHECK(octet_length(content)<=20971520), created_at TEXT NOT NULL);
INSERT INTO schema_migrations VALUES(1,now()::text),(2,now()::text),(3,now()::text) ON CONFLICT DO NOTHING;
