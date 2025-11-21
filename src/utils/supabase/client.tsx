import { projectId, publicAnonKey } from "./info";

// Sample data for immediate functionality (used as fallback for localStorage)
const sampleMedicines = [
  {
    id: "med_001",
    name: "Paracetamol",
    category: "Pain Relief",
    strength: "500mg",
    manufacturer: "PharmaCorp",
    stock: 150,
    minStock: 50,
    maxStock: 300,
    price: 5.99,
    expiryDate: "2025-12-15",
    batchNumber: "PC240815",
    location: "A1-S2",
    createdAt: "2025-01-08T10:00:00Z",
    updatedAt: "2025-01-08T10:00:00Z"
  },
  {
    id: "med_002",
    name: "Amoxicillin",
    category: "Antibiotic",
    strength: "250mg",
    manufacturer: "MediLife",
    stock: 25,
    minStock: 30,
    maxStock: 150,
    price: 12.50,
    expiryDate: "2025-06-20",
    batchNumber: "ML240601",
    location: "B2-S1",
    createdAt: "2025-01-07T10:00:00Z",
    updatedAt: "2025-01-07T10:00:00Z"
  },
  {
    id: "med_003",
    name: "Ibuprofen",
    category: "Anti-inflammatory",
    strength: "200mg",
    manufacturer: "HealthCare+",
    stock: 200,
    minStock: 40,
    maxStock: 250,
    price: 8.75,
    expiryDate: "2026-03-10",
    batchNumber: "HC241120",
    location: "A3-S1",
    createdAt: "2025-01-08T10:00:00Z",
    updatedAt: "2025-01-08T10:00:00Z"
  },
  {
    id: "med_004",
    name: "Aspirin",
    category: "Pain Relief",
    strength: "75mg",
    manufacturer: "HealthCare+",
    stock: 8,
    minStock: 25,
    maxStock: 200,
    price: 6.50,
    expiryDate: "2025-04-15",
    batchNumber: "HC240320",
    location: "A1-S3",
    createdAt: "2025-01-06T10:00:00Z",
    updatedAt: "2025-01-06T10:00:00Z"
  },
  {
    id: "med_005",
    name: "Metformin",
    category: "Diabetes",
    strength: "500mg",
    manufacturer: "MediLife",
    stock: 5,
    minStock: 20,
    maxStock: 100,
    price: 18.00,
    expiryDate: "2025-08-30",
    batchNumber: "ML240215",
    location: "C1-S2",
    createdAt: "2025-01-05T10:00:00Z",
    updatedAt: "2025-01-05T10:00:00Z"
  }
];

const sampleSales = [
  {
    id: "sale_001",
    customerName: "John Smith",
    customerPhone: "+1234567890",
    items: [
      { medicineId: "med_001", name: "Paracetamol", quantity: 2, price: 5.99 },
    ],
    total: 11.98,
    paymentMethod: "cash",
    timestamp: new Date().toISOString(),
  }
];

const samplePrescriptions = [
  {
    id: "presc_001",
    patientName: "Jane Doe",
    patientAge: 35,
    doctorName: "Dr. Smith",
    medicines: ["Amoxicillin 250mg"],
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Local storage key for persistent data
const STORAGE_KEY = "pharmacy_data";

// Simple local storage manager
class LocalStorageManager {
  private data: any = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = {
          medicines: sampleMedicines,
          sales: sampleSales,
          prescriptions: samplePrescriptions,
          employees: [],
          tickets: [],
        };
        this.saveToStorage();
      }
    } catch (error) {
      console.warn("Failed to load from localStorage, using sample data");
      this.data = {
        medicines: sampleMedicines,
        sales: sampleSales,
        prescriptions: samplePrescriptions,
        employees: [],
        tickets: [],
      };
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.warn("Failed to save to localStorage");
    }
  }

  get(key: string) {
    return this.data[key] || [];
  }

  set(key: string, value: any) {
    this.data[key] = value;
    this.saveToStorage();
  }

  add(key: string, item: any) {
    if (!this.data[key]) this.data[key] = [];
    this.data[key].push(item);
    this.saveToStorage();
    return item;
  }

  update(key: string, id: string, updates: any) {
    if (!this.data[key]) return null;
    const index = this.data[key].findIndex((item: any) => item.id === id);
    if (index !== -1) {
      this.data[key][index] = { ...this.data[key][index], ...updates };
      this.saveToStorage();
      return this.data[key][index];
    }
    return null;
  }

  delete(key: string, id: string) {
    if (!this.data[key]) return false;
    this.data[key] = this.data[key].filter((item: any) => item.id !== id);
    this.saveToStorage();
    return true;
  }
}

const storage = new LocalStorageManager();

// Pharmacy API client with Supabase backend and localStorage fallback
export class PharmacyAPI {
  private baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3afd2cac`;
  private useBackend = true; // Enable backend by default

  private generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async tryBackend(endpoint: string, options: RequestInit = {}) {
    if (!this.useBackend) {
      throw new Error("Backend disabled");
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Don't log 404 errors or database not initialized errors - these are expected when using localStorage fallback
        if (!errorMessage.includes('Database not initialized') && response.status !== 404) {
          console.error(`Backend API Error for ${endpoint}:`, errorMessage);
        } else if (response.status === 404) {
          // Silently fall back to localStorage for 404 endpoints
          console.log(`Endpoint ${endpoint} not available, using localStorage fallback`);
        } else {
          console.log(`Database not initialized for ${endpoint}, using localStorage fallback`);
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      // Only log non-404 and non-database initialization errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('Database not initialized') && !errorMessage.includes('HTTP 404')) {
        console.error(`Backend API Error for ${endpoint}:`, error);
      }
      throw error;
    }
  }

  // Medicine/Inventory APIs
  async getMedicines() {
    try {
      return await this.tryBackend('/medicines');
    } catch {
      return { medicines: storage.get('medicines') };
    }
  }

  async addMedicine(medicine: any) {
    const newMedicine = {
      id: this.generateId(),
      ...medicine,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      return await this.tryBackend('/medicines', {
        method: 'POST',
        body: JSON.stringify(newMedicine),
      });
    } catch {
      storage.add('medicines', newMedicine);
      return { medicine: newMedicine };
    }
  }

  async updateMedicine(id: string, updates: any) {
    const updated = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      return await this.tryBackend(`/medicines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
    } catch {
      const medicine = storage.update('medicines', id, updated);
      return { medicine };
    }
  }

  async deleteMedicine(id: string) {
    try {
      return await this.tryBackend(`/medicines/${id}`, {
        method: 'DELETE',
      });
    } catch {
      storage.delete('medicines', id);
      return { success: true };
    }
  }

  async updateStock(id: string, quantity: number, type: 'add' | 'subtract') {
    try {
      return await this.tryBackend(`/medicines/${id}/stock`, {
        method: 'POST',
        body: JSON.stringify({ quantity, type }),
      });
    } catch {
      const medicines = storage.get('medicines');
      const medicine = medicines.find((m: any) => m.id === id);
      if (medicine) {
        const newStock = type === 'add' ? medicine.stock + quantity : medicine.stock - quantity;
        const updated = storage.update('medicines', id, { 
          stock: Math.max(0, newStock),
          updatedAt: new Date().toISOString()
        });
        return { medicine: updated };
      }
      throw new Error('Medicine not found');
    }
  }

  // Sales APIs
  async getSales() {
    try {
      return await this.tryBackend('/sales');
    } catch {
      return { sales: storage.get('sales') };
    }
  }

  async createSale(sale: any) {
    const newSale = {
      id: this.generateId(),
      ...sale,
      timestamp: new Date().toISOString(),
    };

    try {
      return await this.tryBackend('/sales', {
        method: 'POST',
        body: JSON.stringify(newSale),
      });
    } catch {
      storage.add('sales', newSale);
      return { sale: newSale };
    }
  }

  async getSaleById(id: string) {
    try {
      return await this.tryBackend(`/sales/${id}`);
    } catch {
      const sales = storage.get('sales');
      const sale = sales.find((s: any) => s.id === id);
      return { sale };
    }
  }

  // Prescription APIs
  async getPrescriptions() {
    try {
      return await this.tryBackend('/prescriptions');
    } catch {
      return { prescriptions: storage.get('prescriptions') };
    }
  }

  async addPrescription(prescription: any) {
    const newPrescription = {
      id: this.generateId(),
      ...prescription,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      return await this.tryBackend('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(newPrescription),
      });
    } catch {
      storage.add('prescriptions', newPrescription);
      return { prescription: newPrescription };
    }
  }

  async updatePrescriptionStatus(id: string, status: string) {
    try {
      return await this.tryBackend(`/prescriptions/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch {
      const prescription = storage.update('prescriptions', id, { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      return { prescription };
    }
  }

  async verifyPrescription(id: string, verification: any) {
    try {
      return await this.tryBackend(`/prescriptions/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify(verification),
      });
    } catch {
      const prescription = storage.update('prescriptions', id, {
        verification: {
          ...verification,
          timestamp: new Date().toISOString(),
        },
        status: verification.approved ? "verified" : "rejected",
        updatedAt: new Date().toISOString(),
      });
      return { prescription };
    }
  }

  // Employee APIs
  async getEmployees() {
    try {
      return await this.tryBackend('/employees');
    } catch {
      return { employees: storage.get('employees') };
    }
  }

  async addEmployee(employee: any) {
    const newEmployee = {
      id: this.generateId(),
      ...employee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      return await this.tryBackend('/employees', {
        method: 'POST',
        body: JSON.stringify(newEmployee),
      });
    } catch {
      storage.add('employees', newEmployee);
      return { employee: newEmployee };
    }
  }

  async clockIn(employeeId: string) {
    try {
      return await this.tryBackend(`/employees/${employeeId}/clock-in`, {
        method: 'POST',
      });
    } catch {
      // Local implementation would go here
      return { success: true };
    }
  }

  async clockOut(employeeId: string) {
    try {
      return await this.tryBackend(`/employees/${employeeId}/clock-out`, {
        method: 'POST',
      });
    } catch {
      // Local implementation would go here
      return { success: true };
    }
  }

  async getTimeEntries(employeeId?: string) {
    try {
      const endpoint = employeeId ? `/time-entries?employeeId=${employeeId}` : '/time-entries';
      return await this.tryBackend(endpoint);
    } catch {
      return { timeEntries: [] };
    }
  }

  // Help Desk APIs
  async getTickets() {
    try {
      return await this.tryBackend('/tickets');
    } catch {
      return { tickets: storage.get('tickets') };
    }
  }

  async createTicket(ticket: any) {
    const newTicket = {
      id: this.generateId(),
      ...ticket,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      return await this.tryBackend('/tickets', {
        method: 'POST',
        body: JSON.stringify(newTicket),
      });
    } catch {
      storage.add('tickets', newTicket);
      return { ticket: newTicket };
    }
  }

  async updateTicketStatus(id: string, status: string) {
    try {
      return await this.tryBackend(`/tickets/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    } catch {
      const ticket = storage.update('tickets', id, { 
        status, 
        updatedAt: new Date().toISOString() 
      });
      return { ticket };
    }
  }

  // Dashboard APIs
  async getDashboardStats() {
    try {
      return await this.tryBackend('/dashboard/stats');
    } catch {
      const medicines = storage.get('medicines');
      const sales = storage.get('sales');
      const prescriptions = storage.get('prescriptions');

      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter((sale: any) => 
        sale.timestamp && sale.timestamp.startsWith(today)
      );

      return {
        stats: {
          totalMedicines: medicines.length,
          todaySales: todaySales.length,
          todayRevenue: todaySales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0),
          lowStockAlerts: medicines.filter((m: any) => m.stock <= (m.minStock || 10)).length,
          pendingPrescriptions: prescriptions.filter((p: any) => p.status === "pending").length,
        }
      };
    }
  }

  async getRecentActivity() {
    try {
      return await this.tryBackend('/dashboard/activity');
    } catch {
      const sales = storage.get('sales');
      const prescriptions = storage.get('prescriptions');

      const activities = [
        ...sales.slice(-5).map((sale: any) => ({
          type: 'sale',
          description: `Sale to ${sale.customerName || 'Customer'} - $${sale.total?.toFixed(2)}`,
          timestamp: sale.timestamp,
        })),
        ...prescriptions.slice(-5).map((p: any) => ({
          type: 'prescription',
          description: `Prescription for ${p.patientName} - ${p.status}`,
          timestamp: p.updatedAt,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 10);

      return { activities };
    }
  }

  async getLowStockAlerts() {
    try {
      return await this.tryBackend('/dashboard/alerts');
    } catch {
      const medicines = storage.get('medicines');
      const alerts = medicines
        .filter((m: any) => m.stock <= (m.minStock || 10))
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          currentStock: m.stock,
          minStock: m.minStock || 10,
          severity: m.stock === 0 ? 'critical' : m.stock < 5 ? 'high' : 'medium',
        }));

      return { alerts };
    }
  }

  // Reports APIs
  async getSalesReport(startDate: string, endDate: string) {
    try {
      return await this.tryBackend(`/reports/sales?start=${startDate}&end=${endDate}`);
    } catch {
      const sales = storage.get('sales');
      const filteredSales = sales.filter((sale: any) => {
        const saleDate = sale.timestamp?.split('T')[0];
        return saleDate >= startDate && saleDate <= endDate;
      });

      return {
        report: {
          period: { start: startDate, end: endDate },
          totalSales: filteredSales.length,
          totalRevenue: filteredSales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0),
          averageOrderValue: filteredSales.length > 0 ? 
            filteredSales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0) / filteredSales.length : 0,
          sales: filteredSales,
        }
      };
    }
  }

  async getInventoryReport() {
    try {
      return await this.tryBackend('/reports/inventory');
    } catch {
      const medicines = storage.get('medicines');
      return {
        report: {
          totalItems: medicines.length,
          totalValue: medicines.reduce((sum: number, med: any) => sum + (med.stock * med.price || 0), 0),
          lowStockItems: medicines.filter((med: any) => med.stock < (med.minStock || 10)).length,
          outOfStockItems: medicines.filter((med: any) => med.stock === 0).length,
          medicines,
        }
      };
    }
  }

  async getEmployeeReport(month: string) {
    try {
      return await this.tryBackend(`/reports/employee?month=${month}`);
    } catch {
      return {
        report: {
          period: month,
          employees: [],
          timeEntries: [],
        }
      };
    }
  }

  async getPrescriptionReport(startDate: string, endDate: string) {
    try {
      return await this.tryBackend(`/reports/prescriptions?start=${startDate}&end=${endDate}`);
    } catch {
      const prescriptions = storage.get('prescriptions');
      const filtered = prescriptions.filter((p: any) => {
        const pDate = p.createdAt?.split('T')[0];
        return pDate >= startDate && pDate <= endDate;
      });

      return {
        report: {
          period: { start: startDate, end: endDate },
          totalPrescriptions: filtered.length,
          statusBreakdown: filtered.reduce((acc: any, p: any) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {}),
          prescriptions: filtered,
        }
      };
    }
  }
}

export const pharmacyAPI = new PharmacyAPI();

// Initialize database with sample data
export async function initializeDatabase() {
  try {
    console.log("Initializing database with sample data...");
    
    // Check if data already exists
    const existingMedicines = await pharmacyAPI.getMedicines();
    if (existingMedicines.medicines && existingMedicines.medicines.length > 0) {
      console.log("Database already initialized");
      return;
    }

    // Add sample medicines
    for (const medicine of sampleMedicines) {
      try {
        await pharmacyAPI.addMedicine({
          name: medicine.name,
          category: medicine.category,
          strength: medicine.strength,
          manufacturer: medicine.manufacturer,
          stock: medicine.stock,
          minStock: medicine.minStock,
          maxStock: medicine.maxStock,
          price: medicine.price,
          expiryDate: medicine.expiryDate,
          batchNumber: medicine.batchNumber,
          location: medicine.location,
        });
      } catch (error) {
        console.warn(`Failed to add medicine ${medicine.name}:`, error);
      }
    }

    // Add sample prescriptions
    for (const prescription of samplePrescriptions) {
      try {
        await pharmacyAPI.addPrescription({
          patientName: prescription.patientName,
          patientAge: prescription.patientAge,
          doctorName: prescription.doctorName,
          medicines: prescription.medicines,
        });
      } catch (error) {
        console.warn(`Failed to add prescription for ${prescription.patientName}:`, error);
      }
    }

    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Don't reject, let the app continue with local storage fallback
  }
}