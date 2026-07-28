-- SmartGov AI – Kakinada
-- PostgreSQL Database Schema
-- Version 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- OFFICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('government', 'bank')),
    city VARCHAR(100) NOT NULL DEFAULT 'Kakinada',
    district VARCHAR(100) NOT NULL DEFAULT 'Kakinada',
    state VARCHAR(100) NOT NULL DEFAULT 'Andhra Pradesh',
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    google_map_url TEXT,
    google_map_embed TEXT,
    working_hours JSONB DEFAULT '{"monday": "10:00-17:00", "tuesday": "10:00-17:00", "wednesday": "10:00-17:00", "thursday": "10:00-17:00", "friday": "10:00-17:00", "saturday": "10:00-13:00", "sunday": "closed"}',
    lunch_break JSONB DEFAULT '{"start": "13:00", "end": "14:00"}',
    holidays JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SERVICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    fees DECIMAL(10,2) DEFAULT 0,
    fees_description TEXT,
    eligibility TEXT,
    processing_time VARCHAR(100),
    documents_required JSONB DEFAULT '[]',
    steps JSONB DEFAULT '[]',
    faqs JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- QUEUES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_token INTEGER DEFAULT 0,
    total_tokens_issued INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'not_started')),
    pause_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(office_id, date)
);

-- =============================================
-- QUEUE ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS queue_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID REFERENCES queues(id) ON DELETE CASCADE,
    office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
    token_number INTEGER NOT NULL,
    citizen_name VARCHAR(255),
    citizen_phone VARCHAR(20),
    service_id UUID REFERENCES services(id),
    status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled')),
    position_at_join INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    called_at TIMESTAMP WITH TIME ZONE,
    serving_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    wait_minutes INTEGER,
    service_minutes INTEGER,
    notes TEXT
);

-- =============================================
-- EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SUPER ADMINS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    is_super_admin BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANNOUNCEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent', 'holiday', 'maintenance')),
    is_active BOOLEAN DEFAULT true,
    created_by_employee UUID REFERENCES employees(id),
    created_by_admin UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_type VARCHAR(50) NOT NULL CHECK (actor_type IN ('employee', 'admin', 'system')),
    actor_id UUID,
    actor_name VARCHAR(255),
    actor_employee_id VARCHAR(50),
    office_id UUID REFERENCES offices(id),
    office_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    action_category VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- HISTORICAL DATA TABLE (for AI training)
-- =============================================
CREATE TABLE IF NOT EXISTS historical_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_holiday BOOLEAN DEFAULT false,
    visitor_count INTEGER DEFAULT 0,
    tokens_issued INTEGER DEFAULT 0,
    tokens_served INTEGER DEFAULT 0,
    avg_wait_minutes DECIMAL(5,2) DEFAULT 0,
    avg_service_minutes DECIMAL(5,2) DEFAULT 0,
    max_queue_length INTEGER DEFAULT 0,
    crowd_level VARCHAR(20) DEFAULT 'low' CHECK (crowd_level IN ('very_low', 'low', 'medium', 'high', 'very_high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(office_id, date, hour)
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE CASCADE,
    office_id UUID REFERENCES offices(id),
    citizen_phone VARCHAR(20),
    type VARCHAR(50) NOT NULL CHECK (type IN ('queue_near', 'office_closed', 'lunch_break', 'heavy_crowd', 'server_issue', 'called', 'documents_missing')),
    title VARCHAR(255),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_queues_office_date ON queues(office_id, date);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_id ON queue_entries(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_office_id ON queue_entries(office_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_token ON queue_entries(token_number);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_historical_data_office_date ON historical_data(office_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_office ON audit_logs(office_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_office ON announcements(office_id);
CREATE INDEX IF NOT EXISTS idx_services_office ON services(office_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_offices_updated_at BEFORE UPDATE ON offices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queues_updated_at BEFORE UPDATE ON queues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create queue for today when needed
CREATE OR REPLACE FUNCTION get_or_create_today_queue(p_office_id UUID)
RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    SELECT id INTO queue_id FROM queues WHERE office_id = p_office_id AND date = CURRENT_DATE;
    IF queue_id IS NULL THEN
        INSERT INTO queues(office_id, date, current_token, status)
        VALUES(p_office_id, CURRENT_DATE, 0, 'not_started')
        RETURNING id INTO queue_id;
    END IF;
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;
