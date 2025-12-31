CREATE TABLE IF NOT EXISTS incubators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES user(id),
  model text,
  trays_amt integer CHECK (trays_amt >= 0),
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incubator_id uuid NOT NULL REFERENCES incubators(id) ON DELETE CASCADE,
  capacity integer NOT NULL CHECK (capacity >= 0),
  floor integer NOT NULL CHECK (floor >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (incubator_id, floor)
);

CREATE TABLE IF NOT EXISTS species (
  id text PRIMARY KEY,
  name text NOT NULL,
  incubation_days integer NOT NULL CHECK (incubation_days > 0),
  temp_min numeric(4,1) NOT NULL,
  temp_max numeric(4,1) NOT NULL,
  humidity_min numeric(5,2) NOT NULL CHECK (humidity_min >= 0 AND humidity_min <= 100),
  humidity_max numeric(5,2) NOT NULL CHECK (humidity_max >= 0 AND humidity_max <= 100),
  CHECK (temp_min <= temp_max),
  CHECK (humidity_min <= humidity_max)
);


CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id uuid NOT NULL REFERENCES trays(id) ON DELETE RESTRICT,
  species_id text NOT NULL REFERENCES species(id),
  eggs_qty integer NOT NULL CHECK (eggs_qty > 0),
  start_at date NOT NULL, 
  expected_hatch_at date NOT NULL,
  status text NOT NULL DEFAULT 'incubating'
    CHECK (status IN ('incubating','hatched','failed','archived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_tray_status ON batches(tray_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_expected_hatch ON batches(expected_hatch_at);


-- CREATE TABLE IF NOT EXISTS scheduled_notifications (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id uuid NOT NULL REFERENCES auth.users(id),
--   batch_id uuid REFERENCES batches(id) ON DELETE CASCADE,
--   scheduled_at timestamptz NOT NULL,
--   title text NOT NULL,
--   body text NOT NULL,
--   status text NOT NULL DEFAULT 'scheduled'
--     CHECK (status IN ('scheduled','processing','sent','failed','canceled')),
--   attempts int NOT NULL DEFAULT 0,
--   last_error text,
--   sent_at timestamptz,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );

-- CREATE INDEX IF NOT EXISTS idx_notif_due ON scheduled_notifications(status, scheduled_at);
-- CREATE INDEX IF NOT EXISTS idx_notif_user ON scheduled_notifications(user_id, status);
