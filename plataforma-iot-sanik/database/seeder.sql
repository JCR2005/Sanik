-- ============================================================
-- SANIK / AIRSUNBOX
-- SEED DATA
-- ============================================================


-- USER
-- User: admin@gmail.com
-- Password: 1234


-- ============================================================
-- ORGANIZACIÓN INTERNA SANIK
-- ============================================================

INSERT INTO organizations (
    name,
    slug,
    plan,
    status,
    type,
    is_self_service,
    category,
    b_category,
    payment_exempt,
    account_type
)
VALUES (
    'Sanik',
    'sanik-internal',
    'enterprise',
    'active',
    'A',
    FALSE,
    'dependiente',
    'estandar',
    TRUE,
    'organizacion'
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- USUARIO ADMIN
-- ============================================================

INSERT INTO users (
    org_id,
    email,
    password_hash,
    role,
    name,
    status
)

-- PASSWORD: 1234
SELECT
    o.id,
    'admin@gmail.com',
    '$2b$10$ktOq5FqBbGBjCCeGAhAe4Oi2lxSMyBV.ODBwwSJsWg.cWVfc8wMoG',
    'superadmin',
    'Administrador',
    'active'
FROM organizations o
WHERE o.slug = 'sanik-internal'
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- ORGANIZACIÓN DE DESARROLLO
-- ============================================================

INSERT INTO organizations (
    name,
    slug,
    plan,
    status,
    type,
    is_self_service,
    category,
    b_category,
    payment_exempt,
    account_type
)
VALUES (
    'Mi Organización',
    'mi-organizacion',
    'pro',
    'active',
    'A',
    FALSE,
    'dependiente',
    'estandar',
    FALSE,
    'organizacion'
)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- VARIABLE CATALOG
-- ============================================================

INSERT INTO variable_catalog
    (name, label, unit, icon, description, data_type)
VALUES
    (
        'Temperatura',
        'temperatura',
        '°C',
        'Thermometer',
        'Temperatura ambiental del aire',
        'number'
    ),
    (
        'Humedad',
        'humedad',
        '%',
        'Droplets',
        'Humedad relativa del aire',
        'number'
    ),
    (
        'SO₂',
        'so2',
        'ppb',
        'Cloud',
        'Dióxido de azufre',
        'number'
    ),
    (
        'PM2.5',
        'pm25',
        'µg/m³',
        'Wind',
        'Material particulado 2.5 micras',
        'number'
    ),
    (
        'PM1',
        'pm1',
        'µg/m³',
        'Wind',
        'Material particulado 1 micra',
        'number'
    ),
    (
        'PM10',
        'pm10',
        'µg/m³',
        'Wind',
        'Material particulado 10 micras',
        'number'
    ),
    (
        'O₃',
        'o3',
        'ppb',
        'Sun',
        'Ozono troposférico',
        'number'
    ),
    (
        'NOx',
        'nox',
        'ppb',
        'Flame',
        'Óxidos de nitrógeno',
        'number'
    ),
    (
        'NH₃',
        'nh3',
        'ppb',
        'Activity',
        'Amoniaco',
        'number'
    ),
    (
        'MQ135 ADC',
        'mq135_adc',
        'ADC',
        'Activity',
        'Lectura analógica sensor MQ135',
        'number'
    )
ON CONFLICT (label) DO NOTHING;


INSERT INTO variable_catalog (name, label, unit, icon, description, data_type)
VALUES
    ('Monóxido de carbono', 'co', 'ppm', 'Activity', 'CO', 'number'),
    ('Dióxido de carbono', 'co2', 'ppm', 'Activity', 'CO2', 'number'),
    ('Dióxido de nitrógeno', 'no2', 'ppb', 'Activity', 'NO2', 'number'),
    ('Temperatura', 'temperatura', '°C', 'Thermometer', 'Temperatura ambiente', 'number'),
    ('Humedad', 'humedad', '%', 'Droplets', 'Humedad relativa', 'number'),
    ('Dióxido de azufre', 'so2', 'ppb', 'Activity', 'SO2', 'number'),
    ('Material particulado PM2.5', 'pm25', 'µg/m³', 'Activity', 'PM2.5', 'number'),
    ('Material particulado PM1', 'pm1', 'µg/m³', 'Activity', 'PM1', 'number'),
    ('Material particulado PM10', 'pm10', 'µg/m³', 'Activity', 'PM10', 'number'),
    ('Ozono', 'o3', 'ppb', 'Activity', 'O3', 'number'),
    ('Óxidos de nitrógeno', 'nox', 'ppb', 'Activity', 'NOx', 'number'),
    ('Amoníaco', 'nh3', 'ppb', 'Activity', 'NH3', 'number'),
    ('MQ135 ADC', 'mq135_adc', 'ADC', 'Activity', 'Lectura ADC del sensor MQ135', 'number')
ON CONFLICT (label) DO NOTHING;


-- ============================================================
-- AIR QUALITY RANGES
-- ============================================================

INSERT INTO air_quality_ranges
    (variable_label, min_value, max_value, score, category, weight)
VALUES

-- CO
('co', 0, 1, 0, 'Excelente', 1.2),
('co', 1, 3, 25, 'Buena', 1.2),
('co', 3, 6, 50, 'Precaución', 1.2),
('co', 6, 10, 75, 'Mala', 1.2),
('co', 10, NULL, 100, 'Peligrosa', 1.2),

-- CO2
('co2', 0, 600, 0, 'Excelente', 1.0),
('co2', 600, 800, 25, 'Buena', 1.0),
('co2', 800, 1200, 50, 'Precaución', 1.0),
('co2', 1200, 2000, 75, 'Mala', 1.0),
('co2', 2000, NULL, 100, 'Peligrosa', 1.0),

-- NH3
('nh3', 0, 5, 0, 'Excelente', 1.0),
('nh3', 5, 10, 25, 'Buena', 1.0),
('nh3', 10, 20, 50, 'Precaución', 1.0),
('nh3', 20, 40, 75, 'Mala', 1.0),
('nh3', 40, NULL, 100, 'Peligrosa', 1.0),

-- NOX
('nox', 0, 10, 0, 'Excelente', 1.1),
('nox', 10, 20, 25, 'Buena', 1.1),
('nox', 20, 40, 50, 'Precaución', 1.1),
('nox', 40, 60, 75, 'Mala', 1.1),
('nox', 60, NULL, 100, 'Peligrosa', 1.1),

-- NO2
('no2', 0, 5, 0, 'Excelente', 1.2),
('no2', 5, 15, 25, 'Buena', 1.2),
('no2', 15, 30, 50, 'Precaución', 1.2),
('no2', 30, 50, 75, 'Mala', 1.2),
('no2', 50, NULL, 100, 'Peligrosa', 1.2),

-- O3
('o3', 0, 25, 0, 'Excelente', 1.1),
('o3', 25, 40, 25, 'Buena', 1.1),
('o3', 40, 60, 50, 'Precaución', 1.1),
('o3', 60, 80, 75, 'Mala', 1.1),
('o3', 80, NULL, 100, 'Peligrosa', 1.1),

-- SO2
('so2', 0, 10, 0, 'Excelente', 1.1),
('so2', 10, 20, 25, 'Buena', 1.1),
('so2', 20, 40, 50, 'Precaución', 1.1),
('so2', 40, 60, 75, 'Mala', 1.1),
('so2', 60, NULL, 100, 'Peligrosa', 1.1),

-- PM2.5
('pm25', 0, 12, 0, 'Excelente', 1.5),
('pm25', 12, 25, 25, 'Buena', 1.5),
('pm25', 25, 55, 50, 'Precaución', 1.5),
('pm25', 55, 150, 75, 'Mala', 1.5),
('pm25', 150, NULL, 100, 'Peligrosa', 1.5),

-- PM10
('pm10', 0, 25, 0, 'Excelente', 1.3),
('pm10', 25, 50, 25, 'Buena', 1.3),
('pm10', 50, 100, 50, 'Precaución', 1.3),
('pm10', 100, 200, 75, 'Mala', 1.3),
('pm10', 200, NULL, 100, 'Peligrosa', 1.3);


-- ============================================================
-- ESPACIO "AIRE" PARA LAS ORGANIZACIONES
-- ============================================================

INSERT INTO spaces (
    org_id,
    name,
    slug,
    type,
    hidden,
    description,
    icon
)
SELECT
    id,
    'Aire',
    'aire',
    'aire',
    (type = 'A'),
    'Espacio de calidad del aire',
    'aire'
FROM organizations
WHERE slug IN ('sanik-internal', 'mi-organizacion')
ON CONFLICT (org_id, slug) DO NOTHING;


-- ============================================================
-- CATEGORÍAS AQI PARA LOS ESPACIOS
-- ============================================================

INSERT INTO space_aqi_categories
    (space_id, name, color, cat_order, score_lo, score_hi)

SELECT
    s.id,
    x.name,
    x.color,
    x.cat_order,
    x.score_lo,
    x.score_hi
FROM spaces s
CROSS JOIN (
    VALUES
        ('Excelente', '#10B981', 1, 0, 20),
        ('Buena', '#34D399', 2, 21, 40),
        ('Precaución', '#F59E0B', 3, 41, 60),
        ('Mala', '#F97316', 4, 61, 80),
        ('Peligrosa', '#EF4444', 5, 81, 100)
) AS x(name, color, cat_order, score_lo, score_hi)
WHERE s.slug = 'aire'
ON CONFLICT (space_id, cat_order) DO NOTHING;


-- ============================================================
-- VARIABLES DEL AQI PARA LOS ESPACIOS
-- ============================================================

INSERT INTO space_aqi_variables
    (space_id, variable_label, priority)

SELECT
    s.id,
    v.variable_label,
    v.priority
FROM spaces s
CROSS JOIN (
    VALUES
        ('pm25', 1),
        ('pm10', 2),
        ('co', 3),
        ('co2', 4),
        ('no2', 5),
        ('nox', 6),
        ('nh3', 7),
        ('o3', 8),
        ('so2', 9)
) AS v(variable_label, priority)
WHERE s.slug = 'aire'
ON CONFLICT (space_id, variable_label) DO NOTHING;


-- ============================================================
-- RANGOS AQI POR ESPACIO
-- ============================================================

INSERT INTO space_variable_ranges
    (space_id, variable_label, cat_order, min_value, max_value)

SELECT
    s.id,
    r.variable_label,
    CASE r.score
        WHEN 0 THEN 1
        WHEN 25 THEN 2
        WHEN 50 THEN 3
        WHEN 75 THEN 4
        ELSE 5
    END,
    r.min_value,
    r.max_value
FROM spaces s
JOIN air_quality_ranges r
    ON r.variable_label IN (
        'pm25',
        'pm10',
        'co2',
        'co',
        'no2',
        'nox',
        'nh3',
        'o3',
        'so2'
    )
WHERE s.slug = 'aire'
ON CONFLICT (
    space_id,
    variable_label,
    cat_order
) DO NOTHING;