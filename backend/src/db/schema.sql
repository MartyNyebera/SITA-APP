-- ============================================================
-- SITA Tricycle Ride-Hailing App - PostgreSQL Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- 1. USERS TABLE (Customers)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_photo_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  total_rides INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. DRIVERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_photo_url VARCHAR(500),
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_color VARCHAR(50) NOT NULL,
  license_url VARCHAR(500),
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected')
  ),
  is_online BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  location_updated_at TIMESTAMPTZ,
  total_rides INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  average_rating DECIMAL(3, 2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. RIDES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'requested' CHECK (
    status IN (
      'requested', 'searching', 'accepted', 'arrived',
      'in_progress', 'completed', 'cancelled'
    )
  ),
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_latitude DECIMAL(10, 8) NOT NULL,
  dropoff_longitude DECIMAL(11, 8) NOT NULL,
  distance_km DECIMAL(6, 2),
  fare_amount DECIMAL(10, 2),
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (
    payment_method IN ('cash', 'wallet', 'gcash')
  ),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'refunded')
  ),
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  customer_note TEXT,
  cancellation_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (
    payment_method IN ('cash', 'wallet', 'gcash')
  ),
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  transaction_reference VARCHAR(100) UNIQUE,
  driver_payout DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. DRIVER DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (
    document_type IN ('license', 'registration', 'insurance', 'clearance', 'selfie')
  ),
  file_url VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255),
  file_size_bytes INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. DRIVER LOCATION HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. RIDE LOCATION SNAPSHOTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ride_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. OTP VERIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) NOT NULL CHECK (
    purpose IN ('signup', 'login', 'reset_password')
  ),
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(10) NOT NULL CHECK (
    recipient_type IN ('user', 'driver', 'admin')
  ),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. WALLET TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  owner_type VARCHAR(10) NOT NULL CHECK (
    owner_type IN ('user', 'driver')
  ),
  type VARCHAR(20) NOT NULL CHECK (
    type IN ('credit', 'debit', 'refund', 'payout', 'top_up')
  ),
  amount DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. ADMIN USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200),
  role VARCHAR(20) DEFAULT 'admin' CHECK (
    role IN ('super_admin', 'admin', 'support')
  ),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  actor_type VARCHAR(20) NOT NULL CHECK (
    actor_type IN ('user', 'driver', 'admin', 'system')
  ),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Drivers
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_verification_status ON drivers(verification_status);
CREATE INDEX IF NOT EXISTS idx_drivers_is_online ON drivers(is_online);
CREATE INDEX IF NOT EXISTS idx_drivers_plate_number ON drivers(plate_number);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers(current_latitude, current_longitude);

-- Rides
CREATE INDEX IF NOT EXISTS idx_rides_customer_id ON rides(customer_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_pickup_location ON rides(pickup_latitude, pickup_longitude);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_ride_id ON payments(ride_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_driver_id ON payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Driver Documents
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON driver_documents(status);

-- Driver Locations
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_ride_id ON driver_locations(ride_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_recorded_at ON driver_locations(recorded_at DESC);

-- Ride Locations
CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_id ON ride_locations(ride_id);

-- OTP
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_verifications(expires_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Wallet Transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_owner ON wallet_transactions(owner_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, actor_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- VIEWS
-- ============================================================

-- Active drivers with full details
CREATE OR REPLACE VIEW active_drivers_view AS
  SELECT
    d.id,
    d.first_name,
    d.last_name,
    d.phone,
    d.plate_number,
    d.vehicle_model,
    d.vehicle_color,
    d.profile_photo_url,
    d.current_latitude,
    d.current_longitude,
    d.location_updated_at,
    d.total_rides,
    d.average_rating
  FROM drivers d
  WHERE d.is_online = TRUE
    AND d.is_active = TRUE
    AND d.verification_status = 'approved';

-- Pending driver verifications
CREATE OR REPLACE VIEW pending_verifications_view AS
  SELECT
    d.id AS driver_id,
    d.first_name,
    d.last_name,
    d.phone,
    d.email,
    d.plate_number,
    d.vehicle_model,
    d.vehicle_color,
    d.created_at AS applied_at,
    dd.file_url AS license_url,
    dd.id AS document_id
  FROM drivers d
  LEFT JOIN driver_documents dd
    ON dd.driver_id = d.id AND dd.document_type = 'license'
  WHERE d.verification_status = 'pending';

-- Ride history with user and driver details
CREATE OR REPLACE VIEW ride_details_view AS
  SELECT
    r.id AS ride_id,
    r.status,
    r.pickup_address,
    r.dropoff_address,
    r.pickup_latitude,
    r.pickup_longitude,
    r.dropoff_latitude,
    r.dropoff_longitude,
    r.distance_km,
    r.fare_amount,
    r.payment_method,
    r.payment_status,
    r.customer_rating,
    r.driver_rating,
    r.requested_at,
    r.completed_at,
    u.id AS customer_id,
    u.first_name AS customer_first_name,
    u.last_name AS customer_last_name,
    u.phone AS customer_phone,
    d.id AS driver_id,
    d.first_name AS driver_first_name,
    d.last_name AS driver_last_name,
    d.phone AS driver_phone,
    d.plate_number,
    d.vehicle_model
  FROM rides r
  LEFT JOIN users u ON u.id = r.customer_id
  LEFT JOIN drivers d ON d.id = r.driver_id;

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DEFAULT ADMIN USER (change password immediately!)
-- password: Admin@SITA2024
-- ============================================================
INSERT INTO admins (username, email, password_hash, full_name, role)
VALUES (
  'superadmin',
  'admin@sita.ph',
  '$2b$10$rQnKz0V.DP4bHv7Y9k3mMuZRKlwW9vFWLgjgHBxDT3L6jNe7P3j4i',
  'SITA Super Admin',
  'super_admin'
) ON CONFLICT (username) DO NOTHING;
