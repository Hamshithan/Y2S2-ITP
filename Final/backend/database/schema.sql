-- Create database
CREATE DATABASE IF NOT EXISTS logilink_360;
USE logilink_360;

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
  capacity DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50),
  status ENUM('Active', 'Inactive', 'On Leave') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parcels/Deliveries table
CREATE TABLE IF NOT EXISTS parcels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_id VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('Picked Up', 'In Transit', 'Delivered', 'Cancelled') DEFAULT 'Picked Up',
  origin VARCHAR(100),
  destination VARCHAR(100),
  driver_id INT,
  vehicle_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Insert sample data
INSERT INTO vehicles (vehicle_number, type, status, capacity) VALUES
('Lorry-001', 'Lorry', 'Active', 5000.00),
('Van-003', 'Van', 'Active', 1500.00),
('Lorry-002', 'Lorry', 'Maintenance', 5000.00),
('Bike-012', 'Motorcycle', 'Active', 50.00),
('Van-001', 'Van', 'Active', 1500.00),
('Lorry-003', 'Lorry', 'Active', 8000.00);

INSERT INTO drivers (name, phone, license_number, status) VALUES
('Kamal Perera', '077-1234567', 'L12345678', 'Active'),
('Sunil Silva', '077-2345678', 'L23456789', 'Active'),
('Nimal Fernando', '077-3456789', 'L34567890', 'Inactive'),
('Priyantha Raj', '077-4567890', 'L45678901', 'Active'),
('Amal Jayasinghe', '077-5678901', 'L56789012', 'Active'),
('Saman Kumara', '077-6789012', 'L67890123', 'On Leave');

INSERT INTO parcels (tracking_id, status, origin, destination, driver_id, vehicle_id) VALUES
('PKG-7823', 'Delivered', 'Colombo', 'Colombo 03', 1, 1),
('PKG-7824', 'In Transit', 'Colombo', 'Kandy', 2, 2),
('PKG-7825', 'Picked Up', 'Galle', 'Colombo', 4, 4),
('PKG-7826', 'Delivered', 'Negombo', 'Colombo', 1, 1),
('PKG-7827', 'In Transit', 'Kandy', 'Colombo', 2, 2),
('PKG-7828', 'Delivered', 'Colombo', 'Galle', 4, 4),
('PKG-7829', 'Picked Up', 'Jaffna', 'Colombo', 5, 5),
('PKG-7830', 'In Transit', 'Colombo', 'Jaffna', 1, 1);

-- Trips/Dispatch table
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_number VARCHAR(50) NOT NULL UNIQUE,
  vehicle_id INT,
  driver_id INT,
  route_description VARCHAR(255),
  total_weight DECIMAL(10,2),
  capacity_used DECIMAL(5,2),
  status ENUM('Active', 'Completed', 'Overload Alert', 'Cancelled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Trip parcels junction table
CREATE TABLE IF NOT EXISTS trip_parcels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT,
  parcel_id INT,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  start_location VARCHAR(100),
  end_location VARCHAR(100),
  distance VARCHAR(50),
  estimated_time VARCHAR(50),
  priority ENUM('Critical', 'High', 'Medium', 'Low', 'Normal') DEFAULT 'Normal',
  stops INT DEFAULT 0,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route stops table
CREATE TABLE IF NOT EXISTS route_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT,
  location VARCHAR(255),
  type ENUM('Start', 'Delivery', 'Pickup') DEFAULT 'Delivery',
  estimated_time VARCHAR(20),
  parcels INT DEFAULT 0,
  sequence_order INT,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

-- Insert sample trips
INSERT INTO trips (trip_number, vehicle_id, driver_id, route_description, total_weight, capacity_used, status) VALUES
('TRIP-001', 1, 1, 'Colombo → Kandy → Colombo', 800, 16.0, 'Active'),
('TRIP-002', 4, 4, 'Colombo → Galle', 200, 400.0, 'Overload Alert');

-- View all trips with vehicle and driver details
SELECT 
  t.id,
  t.trip_number,
  v.vehicle_number,
  d.name as driver_name,
  t.route_description,
  t.total_weight,
  t.capacity_used,
  t.status,
  t.created_at
FROM trips t
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN drivers d ON t.driver_id = d.id
ORDER BY t.id DESC;

-- Simple trips table view (like drivers/vehicles table)
SELECT * FROM trips;

-- Insert sample routes
INSERT INTO routes (route_number, name, start_location, end_location, distance, estimated_time, priority, stops) VALUES
('ROUTE-001', 'Colombo → Kandy → Jaffna', 'Colombo Warehouse', 'Jaffna', '450 km', '8 hours', 'High', 3),
('ROUTE-002', 'Colombo → Galle → Negombo', 'Colombo Warehouse', 'Negombo', '280 km', '5 hours', 'Medium', 3);

-- Insert sample route stops
INSERT INTO route_stops (route_id, location, type, estimated_time, parcels, sequence_order) VALUES
(1, 'Colombo Warehouse', 'Start', '06:00', 0, 1),
(1, 'Kandy - 456 Park Ave', 'Delivery', '09:30', 3, 2),
(1, 'Jaffna - 321 Hill St', 'Delivery', '14:00', 4, 3),
(2, 'Colombo Warehouse', 'Start', '08:00', 0, 1),
(2, 'Galle - 789 Beach Rd', 'Delivery', '11:00', 2, 2),
(2, 'Negombo - 654 Lake Rd', 'Delivery', '13:30', 3, 3);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  driver_id INT,
  parcel_id INT,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (parcel_id) REFERENCES parcels(id)
);

-- Loyalty/Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  purchases INT DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  discount_percent INT DEFAULT 0,
  tier ENUM('Member', 'Bronze', 'Silver', 'Gold', 'Platinum') DEFAULT 'Member',
  eligible_for_offer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample reviews
INSERT INTO reviews (customer_name, rating, comment, driver_id, parcel_id, helpful_count) VALUES
('John Smith', 5, 'Excellent service! The delivery was on time and the driver was very professional.', 1, 1, 12),
('Sarah Johnson', 4, 'Good experience overall. Package arrived in good condition.', 2, 2, 8),
('Mike Davis', 5, 'Fast delivery and great communication throughout the process.', 3, 3, 15),
('Emma Wilson', 3, 'Delivery was slightly delayed but the package was intact.', 4, 4, 5);

-- Insert sample customers
INSERT INTO customers (customer_id, name, email, phone, purchases, total_spent, discount_percent, tier, eligible_for_offer) VALUES
('CUST-001', 'John Smith', 'john@example.com', '077-111-2222', 24, 48500, 15, 'Gold', TRUE),
('CUST-002', 'Sarah Johnson', 'sarah@example.com', '077-222-3333', 12, 23400, 10, 'Silver', TRUE),
('CUST-003', 'Mike Davis', 'mike@example.com', '077-333-4444', 8, 15200, 5, 'Bronze', FALSE),
('CUST-004', 'Emma Wilson', 'emma@example.com', '077-444-5555', 45, 89200, 20, 'Platinum', TRUE),
('CUST-005', 'David Brown', 'david@example.com', '077-555-6666', 3, 5200, 0, 'Member', FALSE);
