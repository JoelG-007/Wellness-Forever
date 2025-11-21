-- Simplified Pharmacy Schema with Short, Query-Friendly Names
-- Run this after the initial schema or use it as a replacement

-- Drop existing tables if any
DROP TABLE IF EXISTS stock_moves CASCADE;
DROP TABLE IF EXISTS rx_meds CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS time_logs CASCADE;
DROP TABLE IF EXISTS rx CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS meds CASCADE;

-- Create medicines table (meds)
CREATE TABLE meds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cat VARCHAR(100) NOT NULL, -- category
    strength VARCHAR(50),
    mfg VARCHAR(255) NOT NULL, -- manufacturer
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 10,
    max_stock INTEGER NOT NULL DEFAULT 100,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    exp_date DATE, -- expiry_date
    batch VARCHAR(100),
    location VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff table (employees)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100) NOT NULL,
    dept VARCHAR(100) NOT NULL, -- department
    salary DECIMAL(10,2),
    hire_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_no VARCHAR(50) UNIQUE NOT NULL, -- sale_number
    cust_name VARCHAR(255), -- customer_name
    cust_phone VARCHAR(20),
    total DECIMAL(10,2) NOT NULL,
    payment VARCHAR(50) NOT NULL DEFAULT 'cash',
    staff_id UUID REFERENCES staff(id), -- served_by
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale items table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    med_id UUID NOT NULL REFERENCES meds(id), -- medicine_id
    med_name VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL, -- quantity
    price DECIMAL(10,2) NOT NULL, -- unit_price
    total DECIMAL(10,2) NOT NULL, -- line_total
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table (rx)
CREATE TABLE rx (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rx_no VARCHAR(50) UNIQUE, -- prescription_number
    pat_name VARCHAR(255) NOT NULL, -- patient_name
    pat_age INTEGER,
    pat_phone VARCHAR(20),
    doc_name VARCHAR(255) NOT NULL, -- doctor_name
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    verified_by UUID REFERENCES staff(id),
    verify_notes TEXT,
    verify_date TIMESTAMP WITH TIME ZONE,
    dispensed_by UUID REFERENCES staff(id),
    disp_date TIMESTAMP WITH TIME ZONE, -- dispensed_date
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescription medicines table (rx_meds)
CREATE TABLE rx_meds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rx_id UUID NOT NULL REFERENCES rx(id) ON DELETE CASCADE, -- prescription_id
    med_name VARCHAR(255) NOT NULL,
    dosage TEXT,
    qty INTEGER, -- quantity_prescribed
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time entries table (time_logs)
CREATE TABLE time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    hours DECIMAL(4,2), -- total_hours
    break_min INTEGER DEFAULT 0, -- break_minutes
    overtime DECIMAL(4,2) DEFAULT 0,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support tickets table (tickets)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL, -- changed from 'desc' to 'description'
    cat VARCHAR(100) NOT NULL, -- category
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_by UUID REFERENCES staff(id),
    assigned_to UUID REFERENCES staff(id),
    resolution TEXT,
    resolved_date TIMESTAMP WITH TIME ZONE,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock movements table (stock_moves)
CREATE TABLE stock_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    med_id UUID NOT NULL REFERENCES meds(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- movement_type: 'in', 'out', 'adj'
    qty_change INTEGER NOT NULL, -- quantity_changed
    old_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(255),
    ref_type VARCHAR(50), -- reference_type: 'sale', 'purchase', 'adj', 'exp'
    ref_id UUID,
    processed_by UUID REFERENCES staff(id),
    move_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (using short names)
CREATE INDEX idx_meds_name ON meds(name);
CREATE INDEX idx_meds_cat ON meds(cat);
CREATE INDEX idx_meds_stock ON meds(stock, min_stock);
CREATE INDEX idx_meds_exp ON meds(exp_date);

CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_status ON staff(status);

CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_cust ON sales(cust_name);

CREATE INDEX idx_rx_status ON rx(status);
CREATE INDEX idx_rx_pat ON rx(pat_name);
CREATE INDEX idx_rx_date ON rx(created);

CREATE INDEX idx_time_staff_date ON time_logs(staff_id, work_date);
CREATE INDEX idx_time_date ON time_logs(work_date);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_cat ON tickets(cat);

CREATE INDEX idx_moves_med ON stock_moves(med_id);
CREATE INDEX idx_moves_date ON stock_moves(move_date);
CREATE INDEX idx_moves_type ON stock_moves(type);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER meds_updated BEFORE UPDATE ON meds
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER staff_updated BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER rx_updated BEFORE UPDATE ON rx
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER time_logs_updated BEFORE UPDATE ON time_logs
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER tickets_updated BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Generate unique numbers for sales, prescriptions, and tickets
CREATE SEQUENCE IF NOT EXISTS sale_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS rx_seq START 2000;
CREATE SEQUENCE IF NOT EXISTS ticket_seq START 3000;

-- Function to generate sale numbers
CREATE OR REPLACE FUNCTION gen_sale_no()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'WF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('sale_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate prescription numbers
CREATE OR REPLACE FUNCTION gen_rx_no()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('rx_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION gen_ticket_no()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert sample data with simplified names
INSERT INTO meds (name, cat, strength, mfg, stock, min_stock, max_stock, price, exp_date, batch, location) VALUES
('Paracetamol', 'Pain Relief', '500mg', 'PharmaCorp', 150, 50, 300, 5.99, '2025-12-15', 'PC240815', 'A1-S2'),
('Amoxicillin', 'Antibiotic', '250mg', 'MediLife', 25, 30, 150, 12.50, '2025-06-20', 'ML240601', 'B2-S1'),
('Ibuprofen', 'Anti-inflammatory', '200mg', 'HealthCare Plus', 200, 40, 250, 8.75, '2026-03-10', 'HC241120', 'A3-S1'),
('Aspirin', 'Pain Relief', '75mg', 'HealthCare Plus', 8, 25, 200, 6.50, '2025-04-15', 'HC240320', 'A1-S3'),
('Metformin', 'Diabetes', '500mg', 'MediLife', 5, 20, 100, 18.00, '2025-08-30', 'ML240215', 'C1-S2');

INSERT INTO staff (name, email, phone, role, dept, salary, hire_date) VALUES
('Dr. Joel Guedes', 'joel.guedes@wellnessforever.com', '+91-9876543210', 'Senior Pharmacist', 'Pharmacy', 75000.00, '2020-01-15'),
('Dr. Priya Sharma', 'priya.sharma@wellnessforever.com', '+91-9876543211', 'Pharmacist', 'Pharmacy', 65000.00, '2021-03-22'),
('Dr. Rahul Patel', 'rahul.patel@wellnessforever.com', '+91-9876543212', 'Chief Pharmacist', 'Management', 85000.00, '2019-08-10'),
('Ms. Sneha Joshi', 'sneha.joshi@wellnessforever.com', '+91-9876543213', 'Assistant Pharmacist', 'Pharmacy', 45000.00, '2022-06-01'),
('Mr. Amit Singh', 'amit.singh@wellnessforever.com', '+91-9876543214', 'Cashier', 'Customer Service', 35000.00, '2023-01-20');

-- Insert sample prescriptions
INSERT INTO rx (rx_no, pat_name, pat_age, doc_name, status, notes) VALUES
(gen_rx_no(), 'John Smith', 45, 'Dr. Anderson', 'pending', 'Patient has mild hypertension'),
(gen_rx_no(), 'Jane Doe', 32, 'Dr. Johnson', 'verified', 'Regular medication refill'),
(gen_rx_no(), 'Mike Wilson', 28, 'Dr. Brown', 'dispensed', 'Antibiotic course completed');

-- Insert sample prescription medicines
INSERT INTO rx_meds (rx_id, med_name, dosage, qty)
SELECT r.id, 'Amoxicillin 250mg', 'Take 1 tablet twice daily after meals', 20
FROM rx r WHERE r.pat_name = 'John Smith';

-- Table comments
COMMENT ON TABLE meds IS 'Medicine inventory with stock levels';
COMMENT ON TABLE staff IS 'Employee information and details';
COMMENT ON TABLE sales IS 'Sales transaction records';
COMMENT ON TABLE sale_items IS 'Items sold in each transaction';
COMMENT ON TABLE rx IS 'Medical prescriptions and status';
COMMENT ON TABLE rx_meds IS 'Medicines in each prescription';
COMMENT ON TABLE time_logs IS 'Employee time tracking';
COMMENT ON TABLE tickets IS 'Support tickets system';
COMMENT ON TABLE stock_moves IS 'Stock movement audit trail';