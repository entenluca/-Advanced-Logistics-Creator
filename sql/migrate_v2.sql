-- Migration for existing v1 installations
ALTER TABLE `alc_vehicle_spawns` ADD COLUMN IF NOT EXISTS `vehicle_type` VARCHAR(32) DEFAULT 'transporter';
ALTER TABLE `alc_vehicle_spawns` ADD COLUMN IF NOT EXISTS `plate` VARCHAR(16) DEFAULT NULL;
ALTER TABLE `alc_vehicle_spawns` ADD COLUMN IF NOT EXISTS `fuel_level` FLOAT DEFAULT 100;
ALTER TABLE `alc_vehicle_spawns` ADD COLUMN IF NOT EXISTS `vehicle_health` FLOAT DEFAULT 1000;
ALTER TABLE `alc_vehicle_spawns` ADD COLUMN IF NOT EXISTS `max_speed` INT UNSIGNED DEFAULT 0;
ALTER TABLE `alc_vehicle_spawns` ADD COLUMN IF NOT EXISTS `is_rental` TINYINT(1) DEFAULT 0;

ALTER TABLE `alc_player_progress` ADD COLUMN IF NOT EXISTS `km_driven` FLOAT DEFAULT 0;
ALTER TABLE `alc_player_progress` ADD COLUMN IF NOT EXISTS `success_count` INT UNSIGNED DEFAULT 0;
ALTER TABLE `alc_player_progress` ADD COLUMN IF NOT EXISTS `fail_count` INT UNSIGNED DEFAULT 0;
ALTER TABLE `alc_player_progress` ADD COLUMN IF NOT EXISTS `deliveries_today` INT UNSIGNED DEFAULT 0;
ALTER TABLE `alc_player_progress` ADD COLUMN IF NOT EXISTS `last_delivery_date` DATE DEFAULT NULL;
