CREATE TABLE IF NOT EXISTS `alc_jobs` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `description` TEXT,
    `icon` VARCHAR(32) DEFAULT 'truck',
    `min_level` INT UNSIGNED DEFAULT 0,
    `faction_bound` TINYINT(1) DEFAULT 0,
    `faction_name` VARCHAR(64) DEFAULT NULL,
    `active` TINYINT(1) DEFAULT 1,
  `payout` JSON NOT NULL,
    `created_by` VARCHAR(64) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_orders` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` INT UNSIGNED NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `description` TEXT,
    `order_type` VARCHAR(32) NOT NULL DEFAULT 'custom',
    `start_point` JSON NOT NULL,
    `end_point` JSON NOT NULL,
    `time_limit` INT UNSIGNED DEFAULT 0,
    `reward` INT UNSIGNED DEFAULT 0,
    `bonus_payment` INT UNSIGNED DEFAULT 0,
    `penalty` INT UNSIGNED DEFAULT 0,
    `cooldown` INT UNSIGNED DEFAULT 0,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_job_id` (`job_id`),
    CONSTRAINT `fk_alc_orders_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_routes` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `start_point` JSON NOT NULL,
    `end_point` JSON NOT NULL,
    `waypoints` JSON DEFAULT NULL,
    `gps_enabled` TINYINT(1) DEFAULT 1,
    `random_select` TINYINT(1) DEFAULT 0,
    `show_waypoints` TINYINT(1) DEFAULT 1,
    `distance` FLOAT DEFAULT 0,
    `estimated_time` INT UNSIGNED DEFAULT 0,
    `difficulty` VARCHAR(16) DEFAULT 'medium',
    `vehicle_restrictions` JSON DEFAULT NULL,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    CONSTRAINT `fk_alc_routes_order` FOREIGN KEY (`order_id`) REFERENCES `alc_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_vehicle_spawns` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` INT UNSIGNED NOT NULL,
    `model` VARCHAR(64) NOT NULL,
    `label` VARCHAR(64) DEFAULT NULL,
    `coords` JSON NOT NULL,
    `heading` FLOAT DEFAULT 0,
    `livery` INT DEFAULT -1,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_job_id` (`job_id`),
    CONSTRAINT `fk_alc_spawns_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_player_progress` (
    `identifier` VARCHAR(64) NOT NULL,
    `xp` INT UNSIGNED DEFAULT 0,
    `level` INT UNSIGNED DEFAULT 1,
    `completed_deliveries` INT UNSIGNED DEFAULT 0,
    `total_earnings` BIGINT UNSIGNED DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
