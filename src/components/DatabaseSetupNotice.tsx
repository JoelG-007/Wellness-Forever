import { useState } from "react";
import { motion } from "motion/react";
import { Database, AlertCircle, CheckCircle, ExternalLink, Copy, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DatabaseSetupNoticeProps {
  onSetupComplete: () => void;
}

export function DatabaseSetupNotice({ onSetupComplete }: DatabaseSetupNoticeProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'pending' | 'success' | 'manual_required'>('pending');

  const attemptAutoInit = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3afd2cac/init-db`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse init-db response:', parseError);
        setSetupStatus('manual_required');
        toast.error('Server response error - please try manual setup');
        return;
      }
      
      console.log('Auto-init response:', { status: response.status, result });
      
      if (response.ok && result.status === 'success') {
        setSetupStatus('success');
        toast.success(result.message || 'Database initialized successfully!');
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      } else if (result.status === 'manual_setup_required') {
        console.log('Manual setup required');
        setSetupStatus('manual_required');
        toast.warning('Automatic setup not available - please follow manual setup instructions');
      } else {
        console.log('Auto-init failed, showing manual setup');
        setSetupStatus('manual_required');
        toast.error(result.error || 'Database initialization failed - manual setup required');
      }
    } catch (error) {
      console.error('Auto-initialization failed:', error);
      setSetupStatus('manual_required');
      toast.error('Failed to connect to server - please try manual setup');
    } finally {
      setIsInitializing(false);
    }
  };

  const copyMigrationScript = async () => {
    const migrationScript = `-- Wellness Forever Pharmacy Management System Database Schema

-- Drop existing tables if any
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS prescription_medicines CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS medicines CASCADE;

-- Create medicines table
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    strength VARCHAR(50),
    manufacturer VARCHAR(255) NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 10,
    maximum_stock INTEGER NOT NULL DEFAULT 100,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    expiry_date DATE,
    batch_number VARCHAR(100),
    storage_location VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    job_role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    monthly_salary DECIMAL(10,2),
    hire_date DATE,
    employment_status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    served_by UUID REFERENCES employees(id),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id UUID NOT NULL REFERENCES medicines(id),
    medicine_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(50) UNIQUE,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_phone VARCHAR(20),
    doctor_name VARCHAR(255) NOT NULL,
    prescription_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    additional_notes TEXT,
    verified_by UUID REFERENCES employees(id),
    verification_notes TEXT,
    verification_date TIMESTAMP WITH TIME ZONE,
    dispensed_by UUID REFERENCES employees(id),
    dispensed_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescription_medicines table
CREATE TABLE prescription_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    dosage_instructions TEXT,
    quantity_prescribed INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(4,2),
    break_minutes INTEGER DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium',
    ticket_status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_by UUID REFERENCES employees(id),
    assigned_to UUID REFERENCES employees(id),
    resolution_notes TEXT,
    resolved_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'adjustment'
    quantity_changed INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    movement_reason VARCHAR(255),
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', 'expiry'
    reference_id UUID,
    processed_by UUID REFERENCES employees(id),
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicines_stock_level ON medicines(current_stock, minimum_stock);
CREATE INDEX idx_medicines_expiry ON medicines(expiry_date);

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_status ON employees(employment_status);

CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_customer ON sales(customer_name);

CREATE INDEX idx_prescriptions_status ON prescriptions(prescription_status);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_name);
CREATE INDEX idx_prescriptions_date ON prescriptions(created_at);

CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, work_date);
CREATE INDEX idx_time_entries_date ON time_entries(work_date);

CREATE INDEX idx_tickets_status ON support_tickets(ticket_status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority_level);
CREATE INDEX idx_tickets_category ON support_tickets(category);

CREATE INDEX idx_stock_movements_medicine ON stock_movements(medicine_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO medicines (name, category, strength, manufacturer, current_stock, minimum_stock, maximum_stock, unit_price, expiry_date, batch_number, storage_location) VALUES
('Paracetamol', 'Pain Relief', '500mg', 'PharmaCorp', 150, 50, 300, 5.99, '2025-12-15', 'PC240815', 'A1-S2'),
('Amoxicillin', 'Antibiotic', '250mg', 'MediLife', 25, 30, 150, 12.50, '2025-06-20', 'ML240601', 'B2-S1'),
('Ibuprofen', 'Anti-inflammatory', '200mg', 'HealthCare Plus', 200, 40, 250, 8.75, '2026-03-10', 'HC241120', 'A3-S1'),
('Aspirin', 'Pain Relief', '75mg', 'HealthCare Plus', 8, 25, 200, 6.50, '2025-04-15', 'HC240320', 'A1-S3'),
('Metformin', 'Diabetes', '500mg', 'MediLife', 5, 20, 100, 18.00, '2025-08-30', 'ML240215', 'C1-S2');

INSERT INTO employees (full_name, email, phone_number, job_role, department, monthly_salary, hire_date) VALUES
('Dr. Joel Guedes', 'joel.guedes@wellnessforever.com', '+91-9876543210', 'Senior Pharmacist', 'Pharmacy', 75000.00, '2020-01-15'),
('Dr. Priya Sharma', 'priya.sharma@wellnessforever.com', '+91-9876543211', 'Pharmacist', 'Pharmacy', 65000.00, '2021-03-22'),
('Dr. Rahul Patel', 'rahul.patel@wellnessforever.com', '+91-9876543212', 'Chief Pharmacist', 'Management', 85000.00, '2019-08-10'),
('Ms. Sneha Joshi', 'sneha.joshi@wellnessforever.com', '+91-9876543213', 'Assistant Pharmacist', 'Pharmacy', 45000.00, '2022-06-01'),
('Mr. Amit Singh', 'amit.singh@wellnessforever.com', '+91-9876543214', 'Cashier', 'Customer Service', 35000.00, '2023-01-20');

-- Generate unique numbers for sales and prescriptions
CREATE SEQUENCE sales_number_seq START 1000;
CREATE SEQUENCE prescription_number_seq START 2000;
CREATE SEQUENCE ticket_number_seq START 3000;

-- Function to generate sale numbers
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'WF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('sales_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate prescription numbers
CREATE OR REPLACE FUNCTION generate_prescription_number()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('prescription_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert sample prescriptions
INSERT INTO prescriptions (prescription_number, patient_name, patient_age, doctor_name, prescription_status, additional_notes) VALUES
(generate_prescription_number(), 'John Smith', 45, 'Dr. Anderson', 'pending', 'Patient has mild hypertension'),
(generate_prescription_number(), 'Jane Doe', 32, 'Dr. Johnson', 'verified', 'Regular medication refill'),
(generate_prescription_number(), 'Mike Wilson', 28, 'Dr. Brown', 'dispensed', 'Antibiotic course completed');

-- Insert sample prescription medicines
INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage_instructions, quantity_prescribed)
SELECT p.id, 'Amoxicillin 250mg', 'Take 1 tablet twice daily after meals', 20
FROM prescriptions p WHERE p.patient_name = 'John Smith';

COMMENT ON TABLE medicines IS 'Stores all medicine inventory with stock levels and details';
COMMENT ON TABLE employees IS 'Employee information and employment details';
COMMENT ON TABLE sales IS 'Sales transaction records';
COMMENT ON TABLE sale_items IS 'Individual items sold in each transaction';
COMMENT ON TABLE prescriptions IS 'Medical prescriptions and their verification status';
COMMENT ON TABLE prescription_medicines IS 'Medicines prescribed in each prescription';
COMMENT ON TABLE time_entries IS 'Employee time tracking and attendance';
COMMENT ON TABLE support_tickets IS 'Help desk and support ticket system';
COMMENT ON TABLE stock_movements IS 'Audit trail for all stock changes';`;

    try {
      await navigator.clipboard.writeText(migrationScript);
      toast.success("Migration script copied to clipboard!");
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error("Failed to copy to clipboard. Please copy manually.");
    }
  };

  const openSupabaseDashboard = () => {
    window.open(`https://supabase.com/dashboard/project/${projectId}/sql/new`, '_blank');
  };

  if (setupStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Database Initialized!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-green-700 mb-4">
                Your Wellness Forever pharmacy database has been successfully set up with sample data.
              </p>
              <div className="animate-pulse text-sm text-green-600">
                Redirecting to the application...
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-gray-800">Database Setup Required</CardTitle>
            <p className="text-gray-600 mt-2">
              Welcome to Wellness Forever! Your pharmacy management system needs to initialize its database.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {setupStatus === 'pending' && (
              <div className="text-center space-y-4">
                <p className="text-gray-700 mb-4">
                  Click the button below to automatically set up your database with sample data.
                </p>
                <Button 
                  onClick={attemptAutoInit}
                  disabled={isInitializing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isInitializing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Initializing Database...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Initialize Database
                    </>
                  )}
                </Button>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm mb-3">
                    Want to test the interface without setting up the database?
                  </p>
                  <Button 
                    onClick={() => onSetupComplete()}
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    Continue with Local Storage (Demo Mode)
                  </Button>
                  <p className="text-gray-500 text-xs mt-2">
                    Note: Most features will use sample data in demo mode
                  </p>
                </div>
              </div>
            )}

            {setupStatus === 'manual_required' && (
              <>
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Automatic setup failed. Please follow the manual setup instructions below.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Manual Setup Instructions</h3>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm mb-2">
                      <strong>For Development:</strong> If you want to test the application interface without setting up the database, 
                      you can skip this step temporarily. However, most features won't work without proper database setup.
                    </p>
                    <Button 
                      onClick={() => onSetupComplete()}
                      variant="outline" 
                      size="sm" 
                      className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                    >
                      Skip Setup (Testing Mode)
                    </Button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Copy the migration script</p>
                        <p className="text-gray-600 text-sm">Click the button below to copy the database setup script.</p>
                        <Button 
                          onClick={copyMigrationScript}
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Script
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Open Supabase SQL Editor</p>
                        <p className="text-gray-600 text-sm">Navigate to your Supabase project's SQL Editor.</p>
                        <Button 
                          onClick={openSupabaseDashboard}
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open SQL Editor
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Run the script</p>
                        <p className="text-gray-600 text-sm">Paste the script in the SQL Editor and click "Run" to create all tables and sample data.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Refresh this page</p>
                        <p className="text-gray-600 text-sm">After running the script successfully, refresh this page to access your pharmacy system.</p>
                        <Button 
                          onClick={() => window.location.reload()}
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Page
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="text-center text-sm text-gray-500">
              <p>This is a one-time setup process. Your pharmacy management system will be ready to use after completion.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}