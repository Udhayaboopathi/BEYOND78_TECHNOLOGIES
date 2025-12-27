-- Sample Data SQL Insert Script
-- Run this script to insert sample data directly into the database
-- Execute in order: UOMs -> Commodities -> Counter Parties -> Locations -> Capacity

USE BEYOND;

-- ============== INSERT UOMs ==============
INSERT INTO uoms (name, type, base_uom, description, delete_at, `delete`) VALUES
('Metric Ton', 'Mass', 'kg', 'Metric ton unit for mass measurement', NOW(), 0x00000000000000000000000000000000),
('Kilogram', 'Mass', 'kg', 'Base unit for mass', NOW(), 0x00000000000000000000000000000000),
('Barrel', 'Volume', 'L', 'Standard barrel for oil measurement', NOW(), 0x00000000000000000000000000000000),
('Liter', 'Volume', 'L', 'Base unit for volume', NOW(), 0x00000000000000000000000000000000),
('Cubic Meter', 'Volume', 'L', 'Cubic meter for volume measurement', NOW(), 0x00000000000000000000000000000000),
('GJ', 'Energy', 'MJ', 'Gigajoule for energy measurement', NOW(), 0x00000000000000000000000000000000),
('MJ', 'Energy', 'MJ', 'Megajoule base unit for energy', NOW(), 0x00000000000000000000000000000000),
('kWh', 'Energy', 'MJ', 'Kilowatt-hour for energy measurement', NOW(), 0x00000000000000000000000000000000);

-- ============== INSERT COMMODITIES ==============
INSERT INTO commodities (name, description, uom, density, energy_uom, is_active, create_at, update_at, delete_at, `delete`) VALUES
('Crude Oil', 'Light sweet crude oil', 'Barrel', 0.85, 'GJ', 0x01000000000000000000000000000000, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Natural Gas', 'Pipeline quality natural gas', 'Cubic Meter', 0.72, 'GJ', 0x01000000000000000000000000000000, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Coal', 'Bituminous coal', 'Metric Ton', 1.35, 'GJ', 0x01000000000000000000000000000000, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Gasoline', 'Premium unleaded gasoline', 'Liter', 0.74, 'MJ', 0x01000000000000000000000000000000, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Diesel', 'Ultra-low sulfur diesel', 'Liter', 0.83, 'MJ', 0x01000000000000000000000000000000, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('LNG', 'Liquefied natural gas', 'Metric Ton', 0.45, 'GJ', 0x01000000000000000000000000000000, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Jet Fuel', 'Aviation turbine fuel', 'Liter', 0.81, 'MJ', 0x01000000000000000000000000000000, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000);

-- ============== INSERT COUNTER PARTIES ==============
INSERT INTO counter_parties (LegalName, ShortName, CounterpartyCode, Country, Type, CreditStatus, CreditLimit, CreatedAt, UpdatedAt, delete_at, `delete`) VALUES
('Shell International Trading Ltd', 'Shell', 'SHELL001', 'Netherlands', 'Supplier', 'Approved', 5000000.00, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('ExxonMobil Corporation', 'Exxon', 'EXXON001', 'USA', 'Supplier', 'Approved', 10000000.00, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('BP Trading Limited', 'BP', 'BP001', 'UK', 'Buyer', 'Approved', 7500000.00, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('TotalEnergies SE', 'Total', 'TOTAL001', 'France', 'Both', 'Approved', 8000000.00, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Chevron Corporation', 'Chevron', 'CHEV001', 'USA', 'Supplier', 'Under Review', 6000000.00, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Saudi Aramco', 'Aramco', 'ARAMCO001', 'Saudi Arabia', 'Supplier', 'Approved', 15000000.00, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000),
('Gazprom Export LLC', 'Gazprom', 'GAZP001', 'Russia', 'Supplier', 'Suspended', 0.00, NOW(), NOW(), NOW(), 0x00000000000000000000000000000000);

-- ============== INSERT LOCATIONS ==============
-- Note: We need to get the CounterpartyID from the counter_parties table
INSERT INTO location (name, type, description, parent_contvarcharerpartu_id, delete_at, `delete`)
SELECT 'Rotterdam Terminal', 'Port', 'Major European oil terminal', CounterpartyID, NOW(), 0x00000000000000000000000000000000
FROM counter_parties WHERE LegalName = 'Shell International Trading Ltd';

INSERT INTO location (name, type, description, parent_contvarcharerpartu_id, delete_at, `delete`)
SELECT 'Houston Refinery', 'Refinery', 'Large-scale refining facility', CounterpartyID, NOW(), 0x00000000000000000000000000000000
FROM counter_parties WHERE LegalName = 'ExxonMobil Corporation';

INSERT INTO location (name, type, description, parent_contvarcharerpartu_id, delete_at, `delete`)
SELECT 'Singapore Hub', 'Storage', 'Strategic storage facility', CounterpartyID, NOW(), 0x00000000000000000000000000000000
FROM counter_parties WHERE LegalName = 'BP Trading Limited';

INSERT INTO location (name, type, description, parent_contvarcharerpartu_id, delete_at, `delete`)
SELECT 'Marseille Terminal', 'Port', 'Mediterranean shipping terminal', CounterpartyID, NOW(), 0x00000000000000000000000000000000
FROM counter_parties WHERE LegalName = 'TotalEnergies SE';

INSERT INTO location (name, type, description, parent_contvarcharerpartu_id, delete_at, `delete`)
SELECT 'Texas Pipeline', 'Pipeline', 'Interstate crude oil pipeline', CounterpartyID, NOW(), 0x00000000000000000000000000000000
FROM counter_parties WHERE LegalName = 'Chevron Corporation';

INSERT INTO location (name, type, description, parent_contvarcharerpartu_id, delete_at, `delete`)
SELECT 'Ras Tanura Port', 'Port', 'World''s largest oil port', CounterpartyID, NOW(), 0x00000000000000000000000000000000
FROM counter_parties WHERE LegalName = 'Saudi Aramco';

INSERT INTO location (name, type, description, parent_contvarcharerpartu_id, delete_at, `delete`)
SELECT 'Nord Stream Facility', 'Pipeline', 'Natural gas pipeline facility', CounterpartyID, NOW(), 0x00000000000000000000000000000000
FROM counter_parties WHERE LegalName = 'Gazprom Export LLC';

-- ============== INSERT CAPACITY ==============
-- Note: We need to get IDs from commodities, locations, and uoms tables
INSERT INTO capacity (commodity_id, location_id, quantity, uom_id, eff_dt_from, eff_dt_to, dt_last_modified, delete_at, `delete`)
SELECT 
    c.id,
    l.id,
    1000000.00,
    u.id,
    '2024-01-01',
    '2024-12-31',
    CURDATE(),
    NOW(),
    0x00000000000000000000000000000000
FROM commodities c
JOIN location l ON l.name = 'Rotterdam Terminal'
JOIN uoms u ON u.name = 'Barrel'
WHERE c.name = 'Crude Oil';

INSERT INTO capacity (commodity_id, location_id, quantity, uom_id, eff_dt_from, eff_dt_to, dt_last_modified, delete_at, `delete`)
SELECT 
    c.id,
    l.id,
    5000000.00,
    u.id,
    '2024-01-01',
    '2024-06-30',
    CURDATE(),
    NOW(),
    0x00000000000000000000000000000000
FROM commodities c
JOIN location l ON l.name = 'Nord Stream Facility'
JOIN uoms u ON u.name = 'Cubic Meter'
WHERE c.name = 'Natural Gas';

INSERT INTO capacity (commodity_id, location_id, quantity, uom_id, eff_dt_from, eff_dt_to, dt_last_modified, delete_at, `delete`)
SELECT 
    c.id,
    l.id,
    750000.00,
    u.id,
    '2024-01-01',
    '2024-12-31',
    CURDATE(),
    NOW(),
    0x00000000000000000000000000000000
FROM commodities c
JOIN location l ON l.name = 'Houston Refinery'
JOIN uoms u ON u.name = 'Liter'
WHERE c.name = 'Diesel';

INSERT INTO capacity (commodity_id, location_id, quantity, uom_id, eff_dt_from, eff_dt_to, dt_last_modified, delete_at, `delete`)
SELECT 
    c.id,
    l.id,
    250000.00,
    u.id,
    '2024-03-01',
    '2024-12-31',
    CURDATE(),
    NOW(),
    0x00000000000000000000000000000000
FROM commodities c
JOIN location l ON l.name = 'Singapore Hub'
JOIN uoms u ON u.name = 'Metric Ton'
WHERE c.name = 'LNG';

INSERT INTO capacity (commodity_id, location_id, quantity, uom_id, eff_dt_from, eff_dt_to, dt_last_modified, delete_at, `delete`)
SELECT 
    c.id,
    l.id,
    500000.00,
    u.id,
    '2024-01-01',
    '2024-12-31',
    CURDATE(),
    NOW(),
    0x00000000000000000000000000000000
FROM commodities c
JOIN location l ON l.name = 'Marseille Terminal'
JOIN uoms u ON u.name = 'Liter'
WHERE c.name = 'Gasoline';

INSERT INTO capacity (commodity_id, location_id, quantity, uom_id, eff_dt_from, eff_dt_to, dt_last_modified, delete_at, `delete`)
SELECT 
    c.id,
    l.id,
    10000000.00,
    u.id,
    '2024-01-01',
    '2025-12-31',
    CURDATE(),
    NOW(),
    0x00000000000000000000000000000000
FROM commodities c
JOIN location l ON l.name = 'Ras Tanura Port'
JOIN uoms u ON u.name = 'Barrel'
WHERE c.name = 'Crude Oil';

INSERT INTO capacity (commodity_id, location_id, quantity, uom_id, eff_dt_from, eff_dt_to, dt_last_modified, delete_at, `delete`)
SELECT 
    c.id,
    l.id,
    300000.00,
    u.id,
    '2024-06-01',
    '2024-12-31',
    CURDATE(),
    NOW(),
    0x00000000000000000000000000000000
FROM commodities c
JOIN location l ON l.name = 'Singapore Hub'
JOIN uoms u ON u.name = 'Liter'
WHERE c.name = 'Jet Fuel';

-- Verify the inserts
SELECT 'UOMs' as TableName, COUNT(*) as RecordCount FROM uoms WHERE `delete` = 0x00000000000000000000000000000000
UNION ALL
SELECT 'Commodities', COUNT(*) FROM commodities WHERE `delete` = 0x00000000000000000000000000000000
UNION ALL
SELECT 'Counter Parties', COUNT(*) FROM counter_parties WHERE `delete` = 0x00000000000000000000000000000000
UNION ALL
SELECT 'Locations', COUNT(*) FROM location WHERE `delete` = 0x00000000000000000000000000000000
UNION ALL
SELECT 'Capacity', COUNT(*) FROM capacity WHERE `delete` = 0x00000000000000000000000000000000;
