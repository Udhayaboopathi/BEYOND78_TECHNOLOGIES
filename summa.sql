USE BEYOND;

CREATE TABLE `commodities`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `uom` VARCHAR(255) NOT NULL,
    `density` FLOAT(53) NOT NULL,
    `energy_uom` VARCHAR(255) NOT NULL,
    `is_active` BINARY(16) NOT NULL,
    `create_at` DATETIME NOT NULL,
    `update_at` DATETIME NOT NULL,
    `delete_at` DATETIME NULL,
    `delete` BINARY(16) NOT NULL
);
ALTER TABLE `commodities` ADD UNIQUE `commodities_name_unique`(`name`);

CREATE TABLE `uoms`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `base_uom` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `delete_at` DATETIME NULL,
    `delete` BINARY(16) NOT NULL
);
ALTER TABLE `uoms` ADD UNIQUE `uoms_name_unique`(`name`);

CREATE TABLE `blends`(
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `commodity_id` INT UNSIGNED NOT NULL,
    `delete_at` DATETIME NULL,
    `delete` BINARY(16) NOT NULL
);
ALTER TABLE `blends` ADD UNIQUE `blends_name_unique`(`name`);

CREATE TABLE `blendComponents`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blend_id` BIGINT UNSIGNED NOT NULL,
    `commodity_id` INT UNSIGNED NOT NULL,
    `proportion` DECIMAL(10, 6) NOT NULL,
    `delete_at` DATETIME NULL,
    `delete` BINARY(16) NOT NULL
);

CREATE TABLE `location`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `parent_contvarcharerpartu_id` INT UNSIGNED NOT NULL,
    `delete_at` DATETIME NULL,
    `delete` BINARY(16) NOT NULL
);

CREATE TABLE `counter_parties`(
    `CounterpartyID` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `LegalName` VARCHAR(255) NOT NULL,
    `ShortName` VARCHAR(255) NOT NULL,
    `CounterpartyCode` VARCHAR(255) NOT NULL,
    `Country` VARCHAR(255) NOT NULL,
    `Type` VARCHAR(255) NOT NULL,
    `CreditStatus` VARCHAR(255) NOT NULL,
    `CreditLimit` DECIMAL(15, 2) NOT NULL,
    `CreatedAt` DATETIME NOT NULL,
    `UpdatedAt` DATETIME NOT NULL,
    `delete_at` DATETIME NULL,
    `delete` BINARY(16) NOT NULL
);
ALTER TABLE `counter_parties` ADD UNIQUE `counter_parties_legalname_unique`(`LegalName`);

CREATE TABLE `capacity`(
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `commodity_id` INT UNSIGNED NOT NULL,
    `location_id` INT UNSIGNED NOT NULL,
    `quantity` DECIMAL(15, 4) NOT NULL,
    `uom_id` INT UNSIGNED NOT NULL,
    `eff_dt_from` DATE NOT NULL,
    `eff_dt_to` DATE NOT NULL,
    `dt_last_modified` DATE NOT NULL,
    `delete_at` DATETIME NULL,
    `delete` BINARY(16) NOT NULL
);

ALTER TABLE `location` ADD CONSTRAINT `location_parent_contvarcharerpartu_id_foreign` FOREIGN KEY(`parent_contvarcharerpartu_id`) REFERENCES `counter_parties`(`CounterpartyID`);
ALTER TABLE `capacity` ADD CONSTRAINT `capacity_uom_id_foreign` FOREIGN KEY(`uom_id`) REFERENCES `uoms`(`id`);
ALTER TABLE `blendComponents` ADD CONSTRAINT `blendcomponents_blend_id_foreign` FOREIGN KEY(`blend_id`) REFERENCES `blends`(`id`);
ALTER TABLE `blends` ADD CONSTRAINT `blends_commodity_id_foreign` FOREIGN KEY(`commodity_id`) REFERENCES `commodities`(`id`);
ALTER TABLE `capacity` ADD CONSTRAINT `capacity_commodity_id_foreign` FOREIGN KEY(`commodity_id`) REFERENCES `commodities`(`id`);
ALTER TABLE `commodities` ADD CONSTRAINT `commodities_uom_foreign` FOREIGN KEY(`uom`) REFERENCES `uoms`(`name`);
ALTER TABLE `capacity` ADD CONSTRAINT `capacity_location_id_foreign` FOREIGN KEY(`location_id`) REFERENCES `location`(`id`);