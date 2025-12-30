/* =========================================================
   DATABASE
========================================================= */
DROP DATABASE IF EXISTS beyond;
CREATE DATABASE beyond;
USE beyond;

/* =========================================================
   UOMS
========================================================= */
CREATE TABLE uoms (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    base_uom VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    UNIQUE KEY uoms_name_unique (name)
);

/* =========================================================
   COMMODITIES
========================================================= */
CREATE TABLE commodities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    uom_id INT UNSIGNED NOT NULL,
    density FLOAT NOT NULL,
    energy_uom VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    UNIQUE KEY commodities_name_unique (name),
    CONSTRAINT commodities_uom_fk 
        FOREIGN KEY (uom_id) REFERENCES uoms(id)
);

/* =========================================================
   COUNTER PARTIES
========================================================= */
CREATE TABLE counter_parties (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    legal_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(255),
    counterparty_code VARCHAR(100),
    country VARCHAR(100),
    type VARCHAR(50),
    credit_status VARCHAR(50),
    credit_limit DECIMAL(15,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    UNIQUE KEY counter_parties_legalname_unique (legal_name)
);

/* =========================================================
   LOCATIONS (HIERARCHICAL)
========================================================= */
CREATE TABLE locations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    description VARCHAR(255),
    parent_location_id INT UNSIGNED NULL,
    counterparty_id INT UNSIGNED NOT NULL,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    CONSTRAINT locations_parent_fk 
        FOREIGN KEY (parent_location_id) REFERENCES locations(id),
    CONSTRAINT locations_counterparty_fk 
        FOREIGN KEY (counterparty_id) REFERENCES counter_parties(id)
);

/* =========================================================
   BLENDS
========================================================= */
CREATE TABLE blends (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    base_commodity_id INT UNSIGNED NOT NULL,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    UNIQUE KEY blends_name_unique (name),
    CONSTRAINT blends_commodity_fk 
        FOREIGN KEY (base_commodity_id) REFERENCES commodities(id)
);

/* =========================================================
   BLEND COMPONENTS
========================================================= */
CREATE TABLE blend_components (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    blend_id BIGINT UNSIGNED NOT NULL,
    commodity_id INT UNSIGNED NOT NULL,
    proportion DECIMAL(10,6) NOT NULL,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    CONSTRAINT blend_components_blend_fk 
        FOREIGN KEY (blend_id) REFERENCES blends(id),
    CONSTRAINT blend_components_commodity_fk 
        FOREIGN KEY (commodity_id) REFERENCES commodities(id),
    UNIQUE KEY uq_blend_commodity (blend_id, commodity_id)
);

/* =========================================================
   CAPACITY
========================================================= */
CREATE TABLE capacity (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    commodity_id INT UNSIGNED NOT NULL,
    location_id INT UNSIGNED NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    uom_id INT UNSIGNED NOT NULL,
    eff_dt_from DATE NOT NULL,
    eff_dt_to DATE NOT NULL,
    sys_config JSON NULL,
    last_modified DATETIME 
        DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT 0,
    CONSTRAINT capacity_commodity_fk 
        FOREIGN KEY (commodity_id) REFERENCES commodities(id),
    CONSTRAINT capacity_location_fk 
        FOREIGN KEY (location_id) REFERENCES locations(id),
    CONSTRAINT capacity_uom_fk 
        FOREIGN KEY (uom_id) REFERENCES uoms(id)
);
