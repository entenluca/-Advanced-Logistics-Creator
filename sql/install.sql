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
    `vehicle_type` VARCHAR(32) DEFAULT 'transporter',
    `coords` JSON NOT NULL,
    `heading` FLOAT DEFAULT 0,
    `livery` INT DEFAULT -1,
    `plate` VARCHAR(16) DEFAULT NULL,
    `fuel_level` FLOAT DEFAULT 100,
    `vehicle_health` FLOAT DEFAULT 1000,
    `max_speed` INT UNSIGNED DEFAULT 0,
    `is_rental` TINYINT(1) DEFAULT 0,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_job_id` (`job_id`),
    CONSTRAINT `fk_alc_spawns_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_depots` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` INT UNSIGNED NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `depot_type` VARCHAR(32) NOT NULL DEFAULT 'logistics_center',
    `coords` JSON NOT NULL,
    `heading` FLOAT DEFAULT 0,
    `blip_enabled` TINYINT(1) DEFAULT 1,
    `blip_sprite` INT DEFAULT 473,
    `blip_color` INT DEFAULT 3,
    `blip_label` VARCHAR(64) DEFAULT NULL,
    `marker_enabled` TINYINT(1) DEFAULT 1,
    `marker_type` INT DEFAULT 1,
    `marker_size` FLOAT DEFAULT 1.5,
    `npc_enabled` TINYINT(1) DEFAULT 0,
    `npc_model` VARCHAR(64) DEFAULT 's_m_m_trucker_01',
    `npc_coords` JSON DEFAULT NULL,
    `teleport_enabled` TINYINT(1) DEFAULT 0,
    `teleport_coords` JSON DEFAULT NULL,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_depot_job` (`job_id`),
    CONSTRAINT `fk_alc_depots_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_employees` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` INT UNSIGNED NOT NULL,
    `identifier` VARCHAR(64) NOT NULL,
    `player_name` VARCHAR(128) DEFAULT NULL,
    `rank_id` INT UNSIGNED DEFAULT 2,
    `driver_level` INT UNSIGNED DEFAULT 1,
    `hired_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `active` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_job_employee` (`job_id`, `identifier`),
    KEY `idx_employee_job` (`job_id`),
    CONSTRAINT `fk_alc_employees_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_player_progress` (
    `identifier` VARCHAR(64) NOT NULL,
    `xp` INT UNSIGNED DEFAULT 0,
    `level` INT UNSIGNED DEFAULT 1,
    `completed_deliveries` INT UNSIGNED DEFAULT 0,
    `total_earnings` BIGINT UNSIGNED DEFAULT 0,
    `km_driven` FLOAT DEFAULT 0,
    `success_count` INT UNSIGNED DEFAULT 0,
    `fail_count` INT UNSIGNED DEFAULT 0,
    `deliveries_today` INT UNSIGNED DEFAULT 0,
    `last_delivery_date` DATE DEFAULT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_driver_stats` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` INT UNSIGNED NOT NULL,
    `identifier` VARCHAR(64) NOT NULL,
    `player_name` VARCHAR(128) DEFAULT NULL,
    `completed_orders` INT UNSIGNED DEFAULT 0,
    `km_driven` FLOAT DEFAULT 0,
    `total_earnings` BIGINT UNSIGNED DEFAULT 0,
    `deliveries_today` INT UNSIGNED DEFAULT 0,
    `success_count` INT UNSIGNED DEFAULT 0,
    `fail_count` INT UNSIGNED DEFAULT 0,
    `driver_level` INT UNSIGNED DEFAULT 1,
    `last_active` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_driver_job` (`job_id`, `identifier`),
    KEY `idx_driver_job` (`job_id`),
    CONSTRAINT `fk_alc_driver_stats_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_order_history` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` INT UNSIGNED NOT NULL,
    `order_id` INT UNSIGNED DEFAULT NULL,
    `identifier` VARCHAR(64) NOT NULL,
    `player_name` VARCHAR(128) DEFAULT NULL,
    `status` VARCHAR(16) DEFAULT 'completed',
    `earnings` INT UNSIGNED DEFAULT 0,
    `distance_km` FLOAT DEFAULT 0,
    `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_history_job` (`job_id`),
    KEY `idx_history_player` (`identifier`),
    CONSTRAINT `fk_alc_history_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `alc_company_stats` (
    `job_id` INT UNSIGNED NOT NULL,
    `total_revenue` BIGINT UNSIGNED DEFAULT 0,
    `total_orders` INT UNSIGNED DEFAULT 0,
    `total_km` FLOAT DEFAULT 0,
    `success_rate` FLOAT DEFAULT 100,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`job_id`),
    CONSTRAINT `fk_alc_company_stats_job` FOREIGN KEY (`job_id`) REFERENCES `alc_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
