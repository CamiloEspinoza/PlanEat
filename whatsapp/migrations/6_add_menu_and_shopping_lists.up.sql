-- weekly_menus: Menús semanales generados por el bot
CREATE TABLE weekly_menus (
  id BIGSERIAL PRIMARY KEY,
  household_id BIGINT REFERENCES households(id),
  phone_number VARCHAR(20) REFERENCES users(phone_number),
  week_start_date DATE NOT NULL,
  menu_data JSONB NOT NULL, -- Estructura: {lunes: {nombre, ingredientes}, martes: {...}, ...}
  household_size INT NOT NULL,
  dietary_restrictions TEXT,
  preferences TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- shopping_lists: Listas de compras generadas a partir de menús
CREATE TABLE shopping_lists (
  id BIGSERIAL PRIMARY KEY,
  weekly_menu_id BIGINT REFERENCES weekly_menus(id),
  phone_number VARCHAR(20) REFERENCES users(phone_number),
  items JSONB NOT NULL, -- Estructura: [{nombre, cantidad, unidad, categoria}, ...]
  total_estimated DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, ordered, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- frest_orders: Pedidos creados en Frest desde el bot
CREATE TABLE frest_orders (
  id BIGSERIAL PRIMARY KEY,
  shopping_list_id BIGINT REFERENCES shopping_lists(id),
  phone_number VARCHAR(20) REFERENCES users(phone_number),
  frest_pedido_id BIGINT, -- ID del pedido en Frest
  frest_codigo_pedido VARCHAR(50), -- Código del pedido (FRE-12345)
  frest_user_id BIGINT, -- ID del usuario en Frest
  frest_direccion_id BIGINT, -- ID de la dirección en Frest
  items JSONB NOT NULL, -- Items reales ordenados con precios de Frest
  subtotal DECIMAL(10,2),
  despacho DECIMAL(10,2),
  descuento DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  forma_pago VARCHAR(20),
  payment_link TEXT,
  estado VARCHAR(50), -- Estado del pedido en Frest
  estado_pago VARCHAR(50), -- Estado del pago
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_weekly_menus_phone ON weekly_menus(phone_number);
CREATE INDEX idx_weekly_menus_household ON weekly_menus(household_id);
CREATE INDEX idx_weekly_menus_week ON weekly_menus(week_start_date);

CREATE INDEX idx_shopping_lists_menu ON shopping_lists(weekly_menu_id);
CREATE INDEX idx_shopping_lists_phone ON shopping_lists(phone_number);
CREATE INDEX idx_shopping_lists_status ON shopping_lists(status);

CREATE INDEX idx_frest_orders_shopping_list ON frest_orders(shopping_list_id);
CREATE INDEX idx_frest_orders_phone ON frest_orders(phone_number);
CREATE INDEX idx_frest_orders_frest_pedido ON frest_orders(frest_pedido_id);

