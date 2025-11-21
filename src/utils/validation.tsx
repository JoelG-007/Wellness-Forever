export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface MedicineData {
  name?: string;
  category?: string;
  strength?: string;
  manufacturer?: string;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  price?: number;
  expiryDate?: string;
  batchNumber?: string;
  location?: string;
}

export interface PrescriptionData {
  patientName?: string;
  patientAge?: number;
  doctorName?: string;
  medicines?: string[];
}

export interface SaleData {
  customerName?: string;
  customerPhone?: string;
  items?: Array<{
    medicineId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total?: number;
  paymentMethod?: string;
}

export interface EmployeeData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  salary?: number;
  hireDate?: string;
}

export class Validator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static validateDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  static validateMedicine(data: MedicineData): ValidationResult {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push("Medicine name must be at least 2 characters long");
    }

    if (!data.category || data.category.trim().length < 2) {
      errors.push("Category must be at least 2 characters long");
    }

    if (!data.manufacturer || data.manufacturer.trim().length < 2) {
      errors.push("Manufacturer must be at least 2 characters long");
    }

    if (data.stock !== undefined && (data.stock < 0 || !Number.isInteger(data.stock))) {
      errors.push("Stock must be a non-negative integer");
    }

    if (data.minStock !== undefined && (data.minStock < 0 || !Number.isInteger(data.minStock))) {
      errors.push("Minimum stock must be a non-negative integer");
    }

    if (data.maxStock !== undefined && (data.maxStock < 0 || !Number.isInteger(data.maxStock))) {
      errors.push("Maximum stock must be a non-negative integer");
    }

    if (data.minStock !== undefined && data.maxStock !== undefined && data.minStock >= data.maxStock) {
      errors.push("Maximum stock must be greater than minimum stock");
    }

    if (data.price !== undefined && (data.price < 0 || isNaN(data.price))) {
      errors.push("Price must be a non-negative number");
    }

    if (data.expiryDate && !this.validateDate(data.expiryDate)) {
      errors.push("Invalid expiry date format");
    }

    if (data.expiryDate && new Date(data.expiryDate) <= new Date()) {
      errors.push("Expiry date must be in the future");
    }

    if (data.batchNumber && data.batchNumber.trim().length < 3) {
      errors.push("Batch number must be at least 3 characters long");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePrescription(data: PrescriptionData): ValidationResult {
    const errors: string[] = [];

    if (!data.patientName || data.patientName.trim().length < 2) {
      errors.push("Patient name must be at least 2 characters long");
    }

    if (!data.doctorName || data.doctorName.trim().length < 2) {
      errors.push("Doctor name must be at least 2 characters long");
    }

    if (data.patientAge !== undefined && (data.patientAge < 0 || data.patientAge > 150 || !Number.isInteger(data.patientAge))) {
      errors.push("Patient age must be a valid integer between 0 and 150");
    }

    if (!data.medicines || !Array.isArray(data.medicines) || data.medicines.length === 0) {
      errors.push("At least one medicine must be prescribed");
    }

    if (data.medicines) {
      data.medicines.forEach((medicine, index) => {
        if (!medicine || medicine.trim().length < 2) {
          errors.push(`Medicine ${index + 1} must be at least 2 characters long`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateSale(data: SaleData): ValidationResult {
    const errors: string[] = [];

    if (data.customerName && data.customerName.trim().length < 2) {
      errors.push("Customer name must be at least 2 characters long");
    }

    if (data.customerPhone && !this.validatePhone(data.customerPhone)) {
      errors.push("Invalid phone number format");
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push("At least one item must be added to the sale");
    }

    if (data.items) {
      data.items.forEach((item, index) => {
        if (!item.medicineId) {
          errors.push(`Item ${index + 1}: Medicine ID is required`);
        }
        if (!item.name || item.name.trim().length < 2) {
          errors.push(`Item ${index + 1}: Medicine name is required`);
        }
        if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
          errors.push(`Item ${index + 1}: Quantity must be a positive integer`);
        }
        if (!item.price || item.price <= 0) {
          errors.push(`Item ${index + 1}: Price must be a positive number`);
        }
      });
    }

    if (data.total !== undefined && (data.total < 0 || isNaN(data.total))) {
      errors.push("Total must be a non-negative number");
    }

    if (data.paymentMethod && !['cash', 'card', 'insurance', 'other'].includes(data.paymentMethod)) {
      errors.push("Invalid payment method");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEmployee(data: EmployeeData): ValidationResult {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push("Employee name must be at least 2 characters long");
    }

    if (!data.email || !this.validateEmail(data.email)) {
      errors.push("Valid email address is required");
    }

    if (data.phone && !this.validatePhone(data.phone)) {
      errors.push("Invalid phone number format");
    }

    if (!data.role || data.role.trim().length < 2) {
      errors.push("Role must be at least 2 characters long");
    }

    if (!data.department || data.department.trim().length < 2) {
      errors.push("Department must be at least 2 characters long");
    }

    if (data.salary !== undefined && (data.salary < 0 || isNaN(data.salary))) {
      errors.push("Salary must be a non-negative number");
    }

    if (data.hireDate && !this.validateDate(data.hireDate)) {
      errors.push("Invalid hire date format");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>'"]/g, '');
  }

  static sanitizeMedicine(data: MedicineData): MedicineData {
    return {
      ...data,
      name: data.name ? this.sanitizeString(data.name) : data.name,
      category: data.category ? this.sanitizeString(data.category) : data.category,
      strength: data.strength ? this.sanitizeString(data.strength) : data.strength,
      manufacturer: data.manufacturer ? this.sanitizeString(data.manufacturer) : data.manufacturer,
      batchNumber: data.batchNumber ? this.sanitizeString(data.batchNumber) : data.batchNumber,
      location: data.location ? this.sanitizeString(data.location) : data.location,
    };
  }
}