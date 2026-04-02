-- Run once in MySQL Workbench if trips table has no driver GPS columns yet.
USE logilink_360;

ALTER TABLE trips ADD COLUMN driver_lat DECIMAL(10,7) NULL AFTER status;
ALTER TABLE trips ADD COLUMN driver_lng DECIMAL(10,7) NULL AFTER driver_lat;
ALTER TABLE trips ADD COLUMN location_updated_at TIMESTAMP NULL DEFAULT NULL AFTER driver_lng;
