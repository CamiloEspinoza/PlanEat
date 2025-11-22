-- users: Usuarios identificados por número de WhatsApp
CREATE TABLE users (
  phone_number VARCHAR(20) PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- households: Hogares/familias
CREATE TABLE households (
  id BIGSERIAL PRIMARY KEY,
  admin_phone VARCHAR(20) REFERENCES users(phone_number),
  household_size INT DEFAULT 1,
  dietary_restrictions TEXT,
  preferences TEXT,
  goals TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- household_members: Miembros de cada hogar
CREATE TABLE household_members (
  id BIGSERIAL PRIMARY KEY,
  household_id BIGINT REFERENCES households(id),
  phone_number VARCHAR(20) REFERENCES users(phone_number),
  role VARCHAR(20) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, phone_number)
);

-- conversations: Estado de conversaciones
CREATE TABLE conversations (
  phone_number VARCHAR(20) PRIMARY KEY REFERENCES users(phone_number),
  current_intent VARCHAR(50),
  conversation_state JSONB,
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

