-- ============================================================
-- SANIK / AIRSUNBOX
-- PostgreSQL + TimescaleDB
-- ESQUEMA FINAL
--
-- DDL ONLY:
-- No migrations
-- No ALTER TABLE
-- No seed data
-- No UPDATE
-- ============================================================

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- ORGANIZATIONS
-- ============================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free',

    phone TEXT,
    location TEXT,
    status TEXT DEFAULT 'active',
    paid_until TIMESTAMPTZ,
    notes TEXT,
    nit TEXT,
    contact_name TEXT,

    type TEXT DEFAULT 'A',
    is_self_service BOOLEAN DEFAULT FALSE,

    category TEXT NOT NULL DEFAULT 'dependiente'
        CHECK (category IN ('dependiente', 'independiente')),

    b_category TEXT NOT NULL DEFAULT 'estandar'
        CHECK (b_category IN ('estandar', 'especial')),

    payment_exempt BOOLEAN NOT NULL DEFAULT FALSE,

    account_type TEXT NOT NULL DEFAULT 'organizacion'
        CHECK (account_type IN ('individual', 'organizacion')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    role TEXT DEFAULT 'viewer'
        CHECK (role IN (
            'superadmin',
            'admin',
            'worker',
            'client',
            'viewer',
            'editor'
        )),

    name TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',

    temp_password TEXT,

    reset_token_hash TEXT,
    reset_token_expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);


-- ============================================================
-- SPACES
-- ============================================================

CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    org_id UUID NOT NULL
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,
    slug TEXT NOT NULL,

    type TEXT NOT NULL DEFAULT 'aire',

    hidden BOOLEAN DEFAULT FALSE,

    description TEXT,

    icon TEXT DEFAULT 'map-pin',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (org_id, slug)
);

CREATE INDEX idx_spaces_org
    ON spaces(org_id);


-- ============================================================
-- DEVICES
-- ============================================================

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    org_id UUID REFERENCES organizations(id)
        ON DELETE CASCADE,

    space_id UUID REFERENCES spaces(id)
        ON DELETE CASCADE,

    label TEXT NOT NULL,
    name TEXT NOT NULL,

    token TEXT UNIQUE
        DEFAULT encode(gen_random_bytes(32), 'hex'),

    serial TEXT UNIQUE,

    lat FLOAT,
    lng FLOAT,

    last_seen TIMESTAMPTZ,

    status TEXT DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'active',
            'inactive',
            'review'
        )),

    image_url TEXT,
    description TEXT,

    icon TEXT DEFAULT 'map-pin',

    tags JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (org_id, label)
);

CREATE INDEX idx_devices_space
    ON devices(space_id);


-- ============================================================
-- VARIABLE CATALOG
-- Variables globales y variables privadas por espacio
-- ============================================================

CREATE TABLE variable_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name TEXT NOT NULL,
    label TEXT UNIQUE NOT NULL,

    unit TEXT,

    icon TEXT DEFAULT 'Activity',

    description TEXT,

    data_type TEXT DEFAULT 'number',

    space_id UUID REFERENCES spaces(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vc_space
    ON variable_catalog(space_id);


-- ============================================================
-- VARIABLES
-- Variables asociadas directamente a dispositivos
-- ============================================================

CREATE TABLE variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    device_id UUID REFERENCES devices(id)
        ON DELETE CASCADE,

    label TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT,

    last_value FLOAT,
    last_time TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (device_id, label)
);


-- ============================================================
-- DEVICE VARIABLES
-- Relación dispositivo ↔ catálogo de variables
-- ============================================================

CREATE TABLE device_variables (
    device_id UUID
        REFERENCES devices(id)
        ON DELETE CASCADE,

    variable_label TEXT
        REFERENCES variable_catalog(label)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (device_id, variable_label)
);


-- ============================================================
-- DOTS
-- Datos históricos de sensores
-- ============================================================

CREATE TABLE dots (
    time TIMESTAMPTZ NOT NULL,

    device_id UUID NOT NULL
        REFERENCES devices(id)
        ON DELETE CASCADE,

    variable TEXT NOT NULL,

    value FLOAT NOT NULL,

    context JSONB
);

SELECT create_hypertable(
    'dots',
    'time'
);

CREATE INDEX idx_dots_device_variable_time
    ON dots(device_id, variable, time DESC);


-- ============================================================
-- ALERTS
-- ============================================================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    device_id UUID
        REFERENCES devices(id)
        ON DELETE CASCADE,

    variable TEXT NOT NULL,

    condition TEXT NOT NULL,

    threshold FLOAT NOT NULL,

    channel TEXT NOT NULL,

    destination TEXT NOT NULL,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- AIR QUALITY RANGES
-- Rangos base del AQI
-- ============================================================

CREATE TABLE air_quality_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    variable_label TEXT NOT NULL,

    min_value FLOAT NOT NULL,

    max_value FLOAT,

    score INT NOT NULL,

    category TEXT NOT NULL,

    weight FLOAT DEFAULT 1.0
);

CREATE INDEX idx_aqr_label
    ON air_quality_ranges(variable_label);


-- ============================================================
-- SPACE AQI CATEGORIES
-- ============================================================

CREATE TABLE space_aqi_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    space_id UUID NOT NULL
        REFERENCES spaces(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    color TEXT DEFAULT '#10B981',

    cat_order INT NOT NULL DEFAULT 0,

    score_lo INT NOT NULL DEFAULT 0,

    score_hi INT NOT NULL DEFAULT 100,

    UNIQUE (space_id, cat_order)
);

CREATE INDEX idx_sac_space
    ON space_aqi_categories(space_id);


-- ============================================================
-- SPACE AQI VARIABLES
-- ============================================================

CREATE TABLE space_aqi_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    space_id UUID NOT NULL
        REFERENCES spaces(id)
        ON DELETE CASCADE,

    variable_label TEXT NOT NULL
        REFERENCES variable_catalog(label)
        ON DELETE CASCADE,

    priority INT NOT NULL DEFAULT 0,

    UNIQUE (space_id, variable_label)
);

CREATE INDEX idx_sav_space
    ON space_aqi_variables(space_id);


-- ============================================================
-- SPACE VARIABLE RANGES
-- ============================================================

CREATE TABLE space_variable_ranges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    space_id UUID NOT NULL
        REFERENCES spaces(id)
        ON DELETE CASCADE,

    variable_label TEXT NOT NULL
        REFERENCES variable_catalog(label)
        ON DELETE CASCADE,

    cat_order INT NOT NULL DEFAULT 0,

    min_value FLOAT NOT NULL DEFAULT 0,

    max_value FLOAT,

    UNIQUE (
        space_id,
        variable_label,
        cat_order
    )
);

CREATE INDEX idx_svr_space
    ON space_variable_ranges(space_id);


-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    org_id UUID
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    amount FLOAT NOT NULL,

    status TEXT DEFAULT 'pending',

    paid_at TIMESTAMPTZ,

    due_date TIMESTAMPTZ NOT NULL,

    note TEXT,

    created_by UUID
        REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- REQUESTS
-- ============================================================

CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    org_id UUID
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    device_name TEXT NOT NULL,

    location TEXT,

    quantity INT DEFAULT 1,

    note TEXT,

    payment_photo TEXT,

    status TEXT DEFAULT 'pending',

    reviewed_by UUID
        REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INCIDENTS
-- ============================================================

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    device_id UUID
        REFERENCES devices(id)
        ON DELETE CASCADE,

    org_id UUID
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    reason TEXT NOT NULL,

    status TEXT DEFAULT 'open',

    resolved_at TIMESTAMPTZ,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);