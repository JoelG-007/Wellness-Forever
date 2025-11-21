import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Utility functions
function generateSaleNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `WF-${today}-${random}`;
}

function generatePrescriptionNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `RX-${today}-${random}`;
}

function generateTicketNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `TKT-${today}-${random}`;
}

// Helper function to check if error is due to missing table
function isTableMissingError(error: any): boolean {
  return error.code === '42P01' || 
         error.message?.includes('relation') || 
         error.message?.includes('does not exist') ||
         error.message?.includes('table');
}

// Health check endpoint
app.get("/make-server-3afd2cac/health", (c) => {
  return c.json({ status: "ok", message: "Pharmacy Management System API - Simplified Schema" });
});

// Database initialization endpoint - runs the simplified schema
app.post("/make-server-3afd2cac/init-db", async (c) => {
  try {
    console.log("Initializing database with simplified schema...");
    
    // Check if simplified tables exist
    try {
      await supabase.from('meds').select('id').limit(1);
      return c.json({ message: "Database already initialized with simplified schema", status: "success" });
    } catch (error) {
      console.log("Simplified tables don't exist, creating them...");
      
      return c.json({ 
        error: "Please run the simplified migration script manually in Supabase SQL Editor",
        migrationPath: "/supabase/migrations/002_simplified_schema.sql",
        instructions: "Copy and paste the simplified migration script (002_simplified_schema.sql) into Supabase SQL Editor and run it.",
        status: "manual_setup_required"
      }, 400);
    }
  } catch (error) {
    console.log("Error checking database status:", error);
    return c.json({ error: "Failed to check database status" }, 500);
  }
});

// === MEDICINE/INVENTORY ROUTES (using "meds" table) ===

// Get all medicines
app.get("/make-server-3afd2cac/medicines", async (c) => {
  try {
    const { data: medicines, error } = await supabase
      .from('meds')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      console.log("Database error fetching medicines:", error);
      if (isTableMissingError(error)) {
        console.log("Meds table not found - database needs simplified schema");
        return c.json({ 
          medicines: [],
          error: "Database not initialized with simplified schema. Please run the 002_simplified_schema.sql migration.",
          dbStatus: "not_initialized"
        }, 400);
      }
      throw error;
    }

    // Transform data to match frontend expectations
    const transformedMedicines = medicines?.map(med => ({
      id: med.id,
      name: med.name,
      category: med.cat,
      strength: med.strength,
      manufacturer: med.mfg,
      current_stock: med.stock,
      minimum_stock: med.min_stock,
      maximum_stock: med.max_stock,
      unit_price: med.price,
      expiry_date: med.exp_date,
      batch_number: med.batch,
      storage_location: med.location,
      is_active: med.active,
      created_at: med.created,
      updated_at: med.updated
    })) || [];

    return c.json({ 
      medicines: transformedMedicines,
      dbStatus: "ready"
    });
  } catch (error) {
    console.log("Error fetching medicines:", error);
    return c.json({ 
      medicines: [],
      error: "Database not initialized with simplified schema.",
      dbStatus: "not_initialized"
    }, 400);
  }
});

// Add new medicine
app.post("/make-server-3afd2cac/medicines", async (c) => {
  try {
    const medicine = await c.req.json();
    
    // Basic validation
    if (!medicine.name || medicine.name.trim().length < 2) {
      return c.json({ error: "Medicine name must be at least 2 characters long" }, 400);
    }
    
    if (!medicine.category || medicine.category.trim().length < 2) {
      return c.json({ error: "Category must be at least 2 characters long" }, 400);
    }
    
    if (!medicine.manufacturer || medicine.manufacturer.trim().length < 2) {
      return c.json({ error: "Manufacturer must be at least 2 characters long" }, 400);
    }

    const medicineData = {
      name: medicine.name.trim(),
      cat: medicine.category.trim(),
      strength: medicine.strength?.trim() || null,
      mfg: medicine.manufacturer.trim(),
      stock: parseInt(medicine.stock) || parseInt(medicine.current_stock) || 0,
      min_stock: parseInt(medicine.minStock) || parseInt(medicine.minimum_stock) || 10,
      max_stock: parseInt(medicine.maxStock) || parseInt(medicine.maximum_stock) || 100,
      price: parseFloat(medicine.price) || parseFloat(medicine.unit_price) || 0,
      exp_date: medicine.expiryDate || medicine.expiry_date || null,
      batch: medicine.batchNumber?.trim() || medicine.batch_number?.trim() || null,
      location: medicine.location?.trim() || medicine.storage_location?.trim() || null,
    };
    
    const { data, error } = await supabase
      .from('meds')
      .insert([medicineData])
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return c.json({ 
          error: "Database not initialized with simplified schema",
          medicines: []
        }, 400);
      }
      throw error;
    }

    // Transform response back to frontend format
    const transformedMedicine = {
      id: data.id,
      name: data.name,
      category: data.cat,
      strength: data.strength,
      manufacturer: data.mfg,
      current_stock: data.stock,
      minimum_stock: data.min_stock,
      maximum_stock: data.max_stock,
      unit_price: data.price,
      expiry_date: data.exp_date,
      batch_number: data.batch,
      storage_location: data.location,
      is_active: data.active,
      created_at: data.created,
      updated_at: data.updated
    };

    return c.json({ medicine: transformedMedicine });
  } catch (error) {
    console.log("Error adding medicine:", error);
    return c.json({ 
      error: "Database not initialized with simplified schema",
      medicines: []
    }, 500);
  }
});

// Update medicine
app.put("/make-server-3afd2cac/medicines/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    const updateData = {
      name: updates.name?.trim(),
      cat: updates.category?.trim(),
      strength: updates.strength?.trim() || null,
      mfg: updates.manufacturer?.trim(),
      stock: updates.stock !== undefined ? parseInt(updates.stock) : updates.current_stock,
      min_stock: updates.minStock !== undefined ? parseInt(updates.minStock) : updates.minimum_stock,
      max_stock: updates.maxStock !== undefined ? parseInt(updates.maxStock) : updates.maximum_stock,
      price: updates.price !== undefined ? parseFloat(updates.price) : updates.unit_price,
      exp_date: updates.expiryDate || updates.expiry_date,
      batch: updates.batchNumber?.trim() || updates.batch_number?.trim(),
      location: updates.location?.trim() || updates.storage_location?.trim(),
      updated: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const { data, error } = await supabase
      .from('meds')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return c.json({ error: "Database not initialized with simplified schema" }, 400);
      }
      throw error;
    }
    if (!data) return c.json({ error: "Medicine not found" }, 404);
    
    // Transform response
    const transformedMedicine = {
      id: data.id,
      name: data.name,
      category: data.cat,
      strength: data.strength,
      manufacturer: data.mfg,
      current_stock: data.stock,
      minimum_stock: data.min_stock,
      maximum_stock: data.max_stock,
      unit_price: data.price,
      expiry_date: data.exp_date,
      batch_number: data.batch,
      storage_location: data.location,
      is_active: data.active,
      created_at: data.created,
      updated_at: data.updated
    };

    return c.json({ medicine: transformedMedicine });
  } catch (error) {
    console.log("Error updating medicine:", error);
    return c.json({ error: "Database not initialized with simplified schema" }, 500);
  }
});

// Delete medicine
app.delete("/make-server-3afd2cac/medicines/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const { error } = await supabase
      .from('meds')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      if (isTableMissingError(error)) {
        return c.json({ error: "Database not initialized with simplified schema" }, 400);
      }
      throw error;
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting medicine:", error);
    return c.json({ error: "Database not initialized with simplified schema" }, 500);
  }
});

// Update stock
app.post("/make-server-3afd2cac/medicines/:id/stock", async (c) => {
  try {
    const id = c.req.param("id");
    const { quantity, type } = await c.req.json();
    
    // Validate input
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return c.json({ error: "Quantity must be a positive integer" }, 400);
    }
    
    if (!type || !['add', 'subtract'].includes(type)) {
      return c.json({ error: "Type must be 'add' or 'subtract'" }, 400);
    }
    
    // Get current medicine data
    const { data: medicine, error: fetchError } = await supabase
      .from('meds')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (isTableMissingError(fetchError)) {
        return c.json({ error: "Database not initialized with simplified schema" }, 400);
      }
      return c.json({ error: "Medicine not found" }, 404);
    }
    
    const previousStock = medicine.stock;
    const newStock = type === 'add' 
      ? previousStock + quantity 
      : previousStock - quantity;
    
    if (newStock < 0) {
      return c.json({ 
        error: "Insufficient stock",
        details: `Cannot reduce stock by ${quantity}. Current stock: ${previousStock}` 
      }, 400);
    }
    
    // Update medicine stock
    const { data: updatedMedicine, error: updateError } = await supabase
      .from('meds')
      .update({ 
        stock: newStock,
        updated: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // Log stock movement (ignore errors for stock_moves table)
    try {
      await supabase
        .from('stock_moves')
        .insert([{
          med_id: id,
          type: type === 'add' ? 'in' : 'out',
          qty_change: quantity,
          old_stock: previousStock,
          new_stock: newStock,
          reason: type === 'add' ? 'Manual Addition' : 'Manual Reduction',
          ref_type: 'adj'
        }]);
    } catch (logError) {
      console.log("Warning: Failed to log stock movement:", logError);
    }
    
    // Transform response
    const transformedMedicine = {
      id: updatedMedicine.id,
      name: updatedMedicine.name,
      category: updatedMedicine.cat,
      strength: updatedMedicine.strength,
      manufacturer: updatedMedicine.mfg,
      current_stock: updatedMedicine.stock,
      minimum_stock: updatedMedicine.min_stock,
      maximum_stock: updatedMedicine.max_stock,
      unit_price: updatedMedicine.price,
      expiry_date: updatedMedicine.exp_date,
      batch_number: updatedMedicine.batch,
      storage_location: updatedMedicine.location,
      is_active: updatedMedicine.active,
      created_at: updatedMedicine.created,
      updated_at: updatedMedicine.updated
    };

    return c.json({ medicine: transformedMedicine });
  } catch (error) {
    console.log("Error updating stock:", error);
    return c.json({ error: "Database not initialized with simplified schema" }, 500);
  }
});

// === SALES ROUTES (using "sales" and "sale_items" tables) ===

// Get all sales
app.get("/make-server-3afd2cac/sales", async (c) => {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          id,
          med_name,
          qty,
          price,
          total
        )
      `)
      .order('sale_date', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return c.json({ 
          sales: [],
          warning: "Database not initialized with simplified schema"
        });
      }
      throw error;
    }

    // Transform data to match frontend expectations
    const transformedSales = sales?.map(sale => ({
      id: sale.id,
      customerName: sale.cust_name,
      customerPhone: sale.cust_phone,
      total: sale.total,
      paymentMethod: sale.payment,
      timestamp: sale.sale_date,
      items: sale.sale_items?.map(item => ({
        medicineId: item.id,
        name: item.med_name,
        quantity: item.qty,
        price: item.price
      })) || []
    })) || [];

    return c.json({ sales: transformedSales });
  } catch (error) {
    console.log("Error fetching sales:", error);
    return c.json({ 
      sales: [],
      error: "Database not initialized with simplified schema"
    });
  }
});

// Create new sale
app.post("/make-server-3afd2cac/sales", async (c) => {
  try {
    const sale = await c.req.json();
    const saleNumber = generateSaleNumber();
    
    // Create sale record
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([{
        sale_no: saleNumber,
        cust_name: sale.customerName,
        cust_phone: sale.customerPhone,
        total: sale.total,
        payment: sale.paymentMethod || 'cash'
      }])
      .select()
      .single();

    if (saleError) {
      if (isTableMissingError(saleError)) {
        return c.json({ error: "Database not initialized with simplified schema" }, 400);
      }
      throw saleError;
    }

    // Create sale items and update stock
    for (const item of sale.items) {
      // Insert sale item
      try {
        await supabase
          .from('sale_items')
          .insert([{
            sale_id: saleData.id,
            med_id: item.medicineId,
            med_name: item.name,
            qty: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          }]);
      } catch (itemError) {
        console.log("Warning: Failed to create sale item:", itemError);
      }

      // Update medicine stock
      try {
        const { data: medicine, error: medicineError } = await supabase
          .from('meds')
          .select('stock, name')
          .eq('id', item.medicineId)
          .single();

        if (!medicineError && medicine) {
          const newStock = medicine.stock - item.quantity;
          
          if (newStock >= 0) {
            await supabase
              .from('meds')
              .update({ stock: newStock })
              .eq('id', item.medicineId);
            
            // Log stock movement
            try {
              await supabase
                .from('stock_moves')
                .insert([{
                  med_id: item.medicineId,
                  type: 'out',
                  qty_change: item.quantity,
                  old_stock: medicine.stock,
                  new_stock: newStock,
                  reason: `Sale ${saleNumber}`,
                  ref_type: 'sale',
                  ref_id: saleData.id
                }]);
            } catch (logError) {
              console.log("Warning: Failed to log stock movement:", logError);
            }
          }
        }
      } catch (medicineError) {
        console.log("Warning: Failed to update medicine stock:", medicineError);
      }
    }
    
    return c.json({ 
      sale: {
        id: saleData.id,
        customerName: saleData.cust_name,
        customerPhone: saleData.cust_phone,
        total: saleData.total,
        paymentMethod: saleData.payment,
        timestamp: saleData.sale_date,
        saleNumber: saleData.sale_no
      }
    });
  } catch (error) {
    console.log("Error creating sale:", error);
    return c.json({ error: "Database not initialized with simplified schema" }, 500);
  }
});

// === STAFF ROUTES (using "staff" table) ===

// Get all staff
app.get("/make-server-3afd2cac/employees", async (c) => {
  try {
    const { data: employees, error } = await supabase
      .from('staff')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      if (isTableMissingError(error)) {
        return c.json({ 
          employees: [],
          error: "Database not initialized with simplified schema"
        });
      }
      throw error;
    }

    // Transform data to match frontend expectations
    const transformedEmployees = employees?.map(emp => ({
      id: emp.id,
      full_name: emp.name,
      email: emp.email,
      phone_number: emp.phone,
      job_role: emp.role,
      department: emp.dept,
      monthly_salary: emp.salary,
      hire_date: emp.hire_date,
      employment_status: emp.status,
      created_at: emp.created,
      updated_at: emp.updated
    })) || [];

    return c.json({ employees: transformedEmployees });
  } catch (error) {
    console.log("Error fetching employees:", error);
    return c.json({ 
      employees: [],
      error: "Database not initialized with simplified schema"
    });
  }
});

// === PRESCRIPTION ROUTES (using "rx" and "rx_meds" tables) ===

// Get all prescriptions
app.get("/make-server-3afd2cac/prescriptions", async (c) => {
  try {
    const { data: prescriptions, error } = await supabase
      .from('rx')
      .select(`
        *,
        rx_meds (
          id,
          med_name,
          dosage,
          qty
        )
      `)
      .order('created', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return c.json({ 
          prescriptions: [],
          error: "Database not initialized with simplified schema"
        });
      }
      throw error;
    }

    // Transform data to match frontend expectations
    const transformedPrescriptions = prescriptions?.map(rx => ({
      id: rx.id,
      prescription_number: rx.rx_no,
      patient_name: rx.pat_name,
      patient_age: rx.pat_age,
      patient_phone: rx.pat_phone,
      doctor_name: rx.doc_name,
      prescription_status: rx.status,
      additional_notes: rx.notes,
      verified_by: rx.verified_by,
      verification_notes: rx.verify_notes,
      verification_date: rx.verify_date,
      dispensed_by: rx.dispensed_by,
      dispensed_date: rx.disp_date,
      created_at: rx.created,
      updated_at: rx.updated,
      medicines: rx.rx_meds?.map(med => ({
        id: med.id,
        medicine_name: med.med_name,
        dosage_instructions: med.dosage,
        quantity_prescribed: med.qty
      })) || []
    })) || [];

    return c.json({ prescriptions: transformedPrescriptions });
  } catch (error) {
    console.log("Error fetching prescriptions:", error);
    return c.json({ 
      prescriptions: [],
      error: "Database not initialized with simplified schema"
    });
  }
});

// Create new prescription
app.post("/make-server-3afd2cac/prescriptions", async (c) => {
  try {
    const prescription = await c.req.json();
    const rxNumber = generatePrescriptionNumber();
    
    // Create prescription record
    const { data: rxData, error: rxError } = await supabase
      .from('rx')
      .insert([{
        rx_no: rxNumber,
        pat_name: prescription.patient_name,
        pat_age: prescription.patient_age,
        pat_phone: prescription.patient_phone,
        doc_name: prescription.doctor_name,
        notes: prescription.additional_notes,
        status: 'pending'
      }])
      .select()
      .single();

    if (rxError) {
      if (isTableMissingError(rxError)) {
        return c.json({ error: "Database not initialized with simplified schema" }, 400);
      }
      throw rxError;
    }

    // Create prescription medicines
    if (prescription.medicines && prescription.medicines.length > 0) {
      for (const medicine of prescription.medicines) {
        try {
          await supabase
            .from('rx_meds')
            .insert([{
              rx_id: rxData.id,
              med_name: medicine.medicine_name,
              dosage: medicine.dosage_instructions,
              qty: medicine.quantity_prescribed
            }]);
        } catch (medError) {
          console.log("Warning: Failed to add prescription medicine:", medError);
        }
      }
    }
    
    return c.json({ 
      prescription: {
        id: rxData.id,
        prescription_number: rxData.rx_no,
        patient_name: rxData.pat_name,
        patient_age: rxData.pat_age,
        patient_phone: rxData.pat_phone,
        doctor_name: rxData.doc_name,
        prescription_status: rxData.status,
        additional_notes: rxData.notes,
        created_at: rxData.created,
        updated_at: rxData.updated
      }
    });
  } catch (error) {
    console.log("Error creating prescription:", error);
    return c.json({ error: "Database not initialized with simplified schema" }, 500);
  }
});

// === SUPPORT TICKETS ROUTES (using "tickets" table) ===

// Get all support tickets
app.get("/make-server-3afd2cac/tickets", async (c) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        return c.json({ 
          tickets: [],
          error: "Database not initialized with simplified schema"
        });
      }
      throw error;
    }

    // Transform data to match frontend expectations
    const transformedTickets = tickets?.map(ticket => ({
      id: ticket.id,
      ticket_number: ticket.ticket_no,
      title: ticket.title,
      description: ticket.description, // updated to use 'description' column
      category: ticket.cat,
      priority_level: ticket.priority,
      ticket_status: ticket.status,
      created_by: ticket.created_by,
      assigned_to: ticket.assigned_to,
      resolution_notes: ticket.resolution,
      resolved_date: ticket.resolved_date,
      created_at: ticket.created,
      updated_at: ticket.updated
    })) || [];

    return c.json({ tickets: transformedTickets });
  } catch (error) {
    console.log("Error fetching tickets:", error);
    return c.json({ 
      tickets: [],
      error: "Database not initialized with simplified schema"
    });
  }
});

// Dashboard analytics
app.get("/make-server-3afd2cac/analytics", async (c) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get total medicines
    const { count: totalMedicines } = await supabase
      .from('meds')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Get low stock medicines
    const { data: lowStock } = await supabase
      .from('meds')
      .select('stock, min_stock')
      .eq('active', true);
    
    const lowStockCount = lowStock?.filter(med => med.stock <= med.min_stock).length || 0;

    // Get sales data
    const { data: salesData } = await supabase
      .from('sales')
      .select('total, sale_date')
      .gte('sale_date', thirtyDaysAgo.toISOString());

    const totalSales = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
    const totalTransactions = salesData?.length || 0;

    // Get prescriptions
    const { count: totalPrescriptions } = await supabase
      .from('rx')
      .select('*', { count: 'exact', head: true });

    return c.json({
      totalMedicines: totalMedicines || 0,
      lowStockCount,
      totalSales,
      totalTransactions,
      totalPrescriptions: totalPrescriptions || 0
    });
  } catch (error) {
    console.log("Error fetching analytics:", error);
    return c.json({
      totalMedicines: 0,
      lowStockCount: 0,
      totalSales: 0,
      totalTransactions: 0,
      totalPrescriptions: 0,
      error: "Database not initialized with simplified schema"
    });
  }
});

// Dashboard stats endpoint
app.get("/make-server-3afd2cac/dashboard/stats", async (c) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get total medicines
    const { count: totalMedicines } = await supabase
      .from('meds')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    // Get today's sales
    const { data: todaySalesData } = await supabase
      .from('sales')
      .select('total, sale_date')
      .gte('sale_date', `${todayStr}T00:00:00.000Z`)
      .lt('sale_date', `${todayStr}T23:59:59.999Z`);

    const todaySales = todaySalesData?.length || 0;
    const todayRevenue = todaySalesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;

    // Get low stock alerts
    const { data: lowStockData } = await supabase
      .from('meds')
      .select('stock, min_stock')
      .eq('active', true);
    
    const lowStockAlerts = lowStockData?.filter(med => med.stock <= med.min_stock).length || 0;

    // Get pending prescriptions
    const { count: pendingPrescriptions } = await supabase
      .from('rx')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return c.json({
      stats: {
        totalMedicines: totalMedicines || 0,
        todaySales,
        todayRevenue,
        lowStockAlerts,
        pendingPrescriptions: pendingPrescriptions || 0
      }
    });
  } catch (error) {
    console.log("Error fetching dashboard stats:", error);
    if (isTableMissingError(error)) {
      return c.json({ 
        stats: {
          totalMedicines: 0,
          todaySales: 0,
          todayRevenue: 0,
          lowStockAlerts: 0,
          pendingPrescriptions: 0
        },
        error: "Database not initialized with simplified schema" 
      }, 400);
    }
    return c.json({
      stats: {
        totalMedicines: 0,
        todaySales: 0,
        todayRevenue: 0,
        lowStockAlerts: 0,
        pendingPrescriptions: 0
      },
      error: "Failed to fetch dashboard stats"
    }, 500);
  }
});

// Dashboard recent activity endpoint
app.get("/make-server-3afd2cac/dashboard/activity", async (c) => {
  try {
    const activities = [];

    // Get recent sales
    try {
      const { data: recentSales } = await supabase
        .from('sales')
        .select('id, cust_name, total, sale_date')
        .order('sale_date', { ascending: false })
        .limit(5);

      if (recentSales) {
        activities.push(...recentSales.map(sale => ({
          type: 'sale',
          description: `Sale to ${sale.cust_name || 'Customer'} - ${sale.total?.toFixed(2)}`,
          timestamp: sale.sale_date
        })));
      }
    } catch (salesError) {
      console.log("Warning: Failed to fetch recent sales:", salesError);
    }

    // Get recent prescriptions
    try {
      const { data: recentPrescriptions } = await supabase
        .from('rx')
        .select('id, pat_name, status, updated')
        .order('updated', { ascending: false })
        .limit(5);

      if (recentPrescriptions) {
        activities.push(...recentPrescriptions.map(rx => ({
          type: 'prescription',
          description: `Prescription for ${rx.pat_name} - ${rx.status}`,
          timestamp: rx.updated
        })));
      }
    } catch (rxError) {
      console.log("Warning: Failed to fetch recent prescriptions:", rxError);
    }

    // Sort activities by timestamp and limit to 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return c.json({ activities: sortedActivities });
  } catch (error) {
    console.log("Error fetching dashboard activity:", error);
    return c.json({ 
      activities: [],
      error: "Database not initialized with simplified schema"
    });
  }
});

// Dashboard alerts endpoint (low stock alerts)
app.get("/make-server-3afd2cac/dashboard/alerts", async (c) => {
  try {
    const { data: medicines } = await supabase
      .from('meds')
      .select('id, name, stock, min_stock')
      .eq('active', true);

    const alerts = medicines
      ?.filter(med => med.stock <= med.min_stock)
      ?.map(med => ({
        id: med.id,
        name: med.name,
        currentStock: med.stock,
        minStock: med.min_stock,
        severity: med.stock === 0 ? 'critical' : 
                 med.stock < 5 ? 'high' : 'medium'
      })) || [];

    return c.json({ alerts });
  } catch (error) {
    console.log("Error fetching dashboard alerts:", error);
    if (isTableMissingError(error)) {
      return c.json({ 
        alerts: [],
        error: "Database not initialized with simplified schema" 
      }, 400);
    }
    return c.json({
      alerts: [],
      error: "Failed to fetch alerts"
    }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);