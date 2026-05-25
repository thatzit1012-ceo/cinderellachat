-- Cinderella Chat DB Schema
-- 실행: psql -U postgres -d cinderellachat -f schema.sql

-- 확장
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────
-- 자정에 전체 삭제되는 테이블
-- ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  session_id    DATE PRIMARY KEY,
  open_at       TIMESTAMP NOT NULL,
  close_at      TIMESTAMP NOT NULL,
  room_limit    INT NOT NULL DEFAULT 100,
  max_per_room  INT NOT NULL DEFAULT 5,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_sets (
  set_id        SERIAL PRIMARY KEY,
  session_id    DATE NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  questions     JSONB NOT NULL,
  approved_by   VARCHAR(50),
  approved_at   TIMESTAMP,
  is_active     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  room_id       VARCHAR(64) PRIMARY KEY,
  session_id    DATE NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  answer_combo  JSONB NOT NULL,
  current_count INT NOT NULL DEFAULT 0,
  max_count     INT NOT NULL DEFAULT 5,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  user_token        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname          VARCHAR(20) NOT NULL,
  room_id           VARCHAR(64) REFERENCES rooms(room_id) ON DELETE SET NULL,
  session_id        DATE NOT NULL,
  status            VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','watching','left')),
  is_host           BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  whisper_count     INT NOT NULL DEFAULT 0,
  watching_room_id  VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS messages (
  message_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       VARCHAR(64) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
  user_token    UUID NOT NULL,
  nickname      VARCHAR(20) NOT NULL,
  content       TEXT NOT NULL,
  translations  JSONB NOT NULL DEFAULT '{}',
  is_whisper    BOOLEAN NOT NULL DEFAULT FALSE,
  target_token  UUID,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- 영구 보관 테이블
-- ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_daily (
  date           DATE PRIMARY KEY,
  total_rooms    INT NOT NULL DEFAULT 0,
  total_users    INT NOT NULL DEFAULT 0,
  peak_users     INT NOT NULL DEFAULT 0,
  total_messages INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_logs (
  log_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date  DATE NOT NULL,
  action        VARCHAR(10) NOT NULL CHECK (action IN ('join','leave','watch')),
  room_id       VARCHAR(64),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────
-- 인덱스
-- ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_room ON users(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_rooms_session ON rooms(session_id);
