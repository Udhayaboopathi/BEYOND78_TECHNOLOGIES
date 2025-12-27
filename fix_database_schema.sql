-- Migration script to fix database schema issues
-- Run this to update existing database tables

USE BEYOND;

-- Fix commodities table
ALTER TABLE `commodities` 
    MODIFY COLUMN `delete_at` DATETIME NULL;

-- Remove invalid unique constraint on uom
ALTER TABLE `commodities` 
    DROP INDEX IF EXISTS `commodities_uom_unique`;

-- Fix uoms table
ALTER TABLE `uoms` 
    MODIFY COLUMN `delete_at` DATETIME NULL;

-- Fix blends table
ALTER TABLE `blends` 
    MODIFY COLUMN `delete_at` DATETIME NULL;

-- Fix blendComponents table
ALTER TABLE `blendComponents` 
    MODIFY COLUMN `delete_at` DATETIME NULL,
    MODIFY COLUMN `proportion` DECIMAL(10, 6) NOT NULL;

-- Fix location table
ALTER TABLE `location` 
    MODIFY COLUMN `delete_at` DATETIME NULL;

-- Fix counter_parties table
ALTER TABLE `counter_parties` 
    MODIFY COLUMN `delete_at` DATETIME NULL,
    MODIFY COLUMN `CreditLimit` DECIMAL(15, 2) NOT NULL;

-- Fix capacity table
ALTER TABLE `capacity` 
    MODIFY COLUMN `delete_at` DATETIME NULL,
    MODIFY COLUMN `quantity` DECIMAL(15, 4) NOT NULL;

-- Verify changes
SELECT 'Migration completed successfully!' AS status;
