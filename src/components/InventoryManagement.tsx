import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Calendar,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { pharmacyAPI } from "../utils/supabase/client";
import { Validator } from "../utils/validation";
import { toast } from "sonner@2.0.3";

interface Medicine {
  id: string;
  name: string;
  category: string;
  strength?: string;
  manufacturer: string;
  stock: number;
  minStock: number;
  maxStock: number;
  price: number;
  expiryDate?: string;
  batchNumber?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface StockUpdate {
  medicineId: string;
  type: 'add' | 'subtract';
  quantity: number;
  reason?: string;
}

export function InventoryManagement() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Modal states
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showEditMedicine, setShowEditMedicine] = useState(false);
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  // Form data
  const [medicineForm, setMedicineForm] = useState({
    name: "",
    category: "",
    strength: "",
    manufacturer: "",
    stock: "",
    minStock: "",
    maxStock: "",
    price: "",
    expiryDate: "",
    batchNumber: "",
    location: "",
  });
  
  const [stockUpdateForm, setStockUpdateForm] = useState({
    type: "add" as "add" | "subtract",
    quantity: "",
    reason: "",
  });

  const categories = [
    "Pain Relief", "Antibiotic", "Anti-inflammatory", "Diabetes", 
    "Heart Disease", "Blood Pressure", "Allergy", "Vitamin", "Other"
  ];

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [medicines, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const response = await pharmacyAPI.getMedicines();
      setMedicines(response.medicines || []);
    } catch (error) {
      console.error("Failed to load medicines:", error);
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...medicines];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(medicine => 
        medicine.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Stock filter
    if (stockFilter !== "all") {
      switch (stockFilter) {
        case "low":
          filtered = filtered.filter(medicine => medicine.stock <= medicine.minStock);
          break;
        case "out":
          filtered = filtered.filter(medicine => medicine.stock === 0);
          break;
        case "good":
          filtered = filtered.filter(medicine => medicine.stock > medicine.minStock);
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "stock":
          aValue = a.stock;
          bValue = b.stock;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "expiry":
          aValue = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
          bValue = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredMedicines(filtered);
  };

  const resetMedicineForm = () => {
    setMedicineForm({
      name: "",
      category: "",
      strength: "",
      manufacturer: "",
      stock: "",
      minStock: "",
      maxStock: "",
      price: "",
      expiryDate: "",
      batchNumber: "",
      location: "",
    });
  };

  const handleAddMedicine = async () => {
    const medicineData = {
      ...medicineForm,
      stock: parseInt(medicineForm.stock) || 0,
      minStock: parseInt(medicineForm.minStock) || 0,
      maxStock: parseInt(medicineForm.maxStock) || 0,
      price: parseFloat(medicineForm.price) || 0,
    };

    const validation = Validator.validateMedicine(medicineData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      await pharmacyAPI.addMedicine(medicineData);
      toast.success("Medicine added successfully");
      setShowAddMedicine(false);
      resetMedicineForm();
      loadMedicines();
    } catch (error) {
      console.error("Failed to add medicine:", error);
      toast.error("Failed to add medicine");
    }
  };

  const handleEditMedicine = async () => {
    if (!selectedMedicine) return;

    const medicineData = {
      ...medicineForm,
      stock: parseInt(medicineForm.stock) || 0,
      minStock: parseInt(medicineForm.minStock) || 0,
      maxStock: parseInt(medicineForm.maxStock) || 0,
      price: parseFloat(medicineForm.price) || 0,
    };

    const validation = Validator.validateMedicine(medicineData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      await pharmacyAPI.updateMedicine(selectedMedicine.id, medicineData);
      toast.success("Medicine updated successfully");
      setShowEditMedicine(false);
      setSelectedMedicine(null);
      resetMedicineForm();
      loadMedicines();
    } catch (error) {
      console.error("Failed to update medicine:", error);
      toast.error("Failed to update medicine");
    }
  };

  const handleDeleteMedicine = async (medicine: Medicine) => {
    if (!confirm(`Are you sure you want to delete ${medicine.name}?`)) return;

    try {
      await pharmacyAPI.deleteMedicine(medicine.id);
      toast.success("Medicine deleted successfully");
      loadMedicines();
    } catch (error) {
      console.error("Failed to delete medicine:", error);
      toast.error("Failed to delete medicine");
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedMedicine) return;

    const quantity = parseInt(stockUpdateForm.quantity);
    if (!quantity || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      await pharmacyAPI.updateStock(selectedMedicine.id, quantity, stockUpdateForm.type);
      toast.success(`Stock ${stockUpdateForm.type === 'add' ? 'added' : 'reduced'} successfully`);
      setShowStockUpdate(false);
      setSelectedMedicine(null);
      setStockUpdateForm({ type: "add", quantity: "", reason: "" });
      loadMedicines();
    } catch (error) {
      console.error("Failed to update stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const openEditModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setMedicineForm({
      name: medicine.name,
      category: medicine.category,
      strength: medicine.strength || "",
      manufacturer: medicine.manufacturer,
      stock: medicine.stock.toString(),
      minStock: medicine.minStock.toString(),
      maxStock: medicine.maxStock.toString(),
      price: medicine.price.toString(),
      expiryDate: medicine.expiryDate || "",
      batchNumber: medicine.batchNumber || "",
      location: medicine.location || "",
    });
    setShowEditMedicine(true);
  };

  const openStockModal = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowStockUpdate(true);
  };

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.stock === 0) return { label: "Out of Stock", color: "destructive" };
    if (medicine.stock <= medicine.minStock) return { label: "Low Stock", color: "secondary" };
    return { label: "In Stock", color: "default" };
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: "Expired", color: "destructive" };
    if (daysUntilExpiry <= 30) return { label: "Expiring Soon", color: "secondary" };
    return { label: "Fresh", color: "default" };
  };

  const uniqueCategories = [...new Set(medicines.map(m => m.category))];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage medicines, track stock levels, and monitor expiry dates</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={loadMedicines}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddMedicine(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-2xl font-medium">{medicines.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-medium text-orange-600">
                  {medicines.filter(m => m.stock <= m.minStock && m.stock > 0).length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-medium text-red-600">
                  {medicines.filter(m => m.stock === 0).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-medium text-green-600">
                  ${medicines.reduce((sum, m) => sum + (m.stock * m.price), 0).toFixed(0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="good">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="expiry">Expiry Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              variant="outline"
              className="w-full"
            >
              {sortOrder === "asc" ? "A-Z" : "Z-A"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Medicine Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Medicine Inventory ({filteredMedicines.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading inventory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedicines.map((medicine) => {
                    const stockStatus = getStockStatus(medicine);
                    const expiryStatus = getExpiryStatus(medicine.expiryDate);
                    
                    return (
                      <TableRow key={medicine.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{medicine.name}</div>
                            <div className="text-sm text-gray-500">
                              {medicine.strength && `${medicine.strength} • `}
                              {medicine.manufacturer}
                            </div>
                            {medicine.batchNumber && (
                              <div className="text-xs text-gray-400">
                                Batch: {medicine.batchNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{medicine.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{medicine.stock}</span>
                              <Badge variant={stockStatus.color as any}>
                                {stockStatus.label}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {medicine.minStock} | Max: {medicine.maxStock}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">${medicine.price.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              Value: ${(medicine.stock * medicine.price).toFixed(2)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {medicine.expiryDate ? (
                            <div className="space-y-1">
                              <div className="text-sm">
                                {new Date(medicine.expiryDate).toLocaleDateString()}
                              </div>
                              {expiryStatus && (
                                <Badge variant={expiryStatus.color as any} className="text-xs">
                                  {expiryStatus.label}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStockModal(medicine)}
                            >
                              <TrendingUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(medicine)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteMedicine(medicine)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredMedicines.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || categoryFilter !== "all" || stockFilter !== "all" 
                    ? "No medicines match your filters" 
                    : "No medicines in inventory"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Medicine Modal */}
      <Dialog open={showAddMedicine} onOpenChange={setShowAddMedicine}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new medicine to your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Medicine Name *</Label>
              <Input
                id="name"
                value={medicineForm.name}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter medicine name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={medicineForm.category} onValueChange={(value) => setMedicineForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="strength">Strength</Label>
              <Input
                id="strength"
                value={medicineForm.strength}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, strength: e.target.value }))}
                placeholder="e.g., 500mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={medicineForm.manufacturer}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                placeholder="Enter manufacturer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock *</Label>
              <Input
                id="stock"
                type="number"
                value={medicineForm.stock}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={medicineForm.price}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock</Label>
              <Input
                id="minStock"
                type="number"
                value={medicineForm.minStock}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, minStock: e.target.value }))}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Maximum Stock</Label>
              <Input
                id="maxStock"
                type="number"
                value={medicineForm.maxStock}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, maxStock: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={medicineForm.expiryDate}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={medicineForm.batchNumber}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="Enter batch number"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={medicineForm.location}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Shelf A1, Section 2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMedicine(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMedicine} className="bg-green-600 hover:bg-green-700">
              Add Medicine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Modal */}
      <Dialog open={showEditMedicine} onOpenChange={setShowEditMedicine}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>
              Update the medicine information and inventory details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Medicine Name *</Label>
              <Input
                id="edit-name"
                value={medicineForm.name}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter medicine name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select value={medicineForm.category} onValueChange={(value) => setMedicineForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-strength">Strength</Label>
              <Input
                id="edit-strength"
                value={medicineForm.strength}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, strength: e.target.value }))}
                placeholder="e.g., 500mg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manufacturer">Manufacturer *</Label>
              <Input
                id="edit-manufacturer"
                value={medicineForm.manufacturer}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                placeholder="Enter manufacturer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Current Stock *</Label>
              <Input
                id="edit-stock"
                type="number"
                value={medicineForm.stock}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={medicineForm.price}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minStock">Minimum Stock</Label>
              <Input
                id="edit-minStock"
                type="number"
                value={medicineForm.minStock}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, minStock: e.target.value }))}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxStock">Maximum Stock</Label>
              <Input
                id="edit-maxStock"
                type="number"
                value={medicineForm.maxStock}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, maxStock: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiryDate">Expiry Date</Label>
              <Input
                id="edit-expiryDate"
                type="date"
                value={medicineForm.expiryDate}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-batchNumber">Batch Number</Label>
              <Input
                id="edit-batchNumber"
                value={medicineForm.batchNumber}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="Enter batch number"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-location">Storage Location</Label>
              <Input
                id="edit-location"
                value={medicineForm.location}
                onChange={(e) => setMedicineForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Shelf A1, Section 2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMedicine(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMedicine} className="bg-green-600 hover:bg-green-700">
              Update Medicine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Update Modal */}
      <Dialog open={showStockUpdate} onOpenChange={setShowStockUpdate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              Add or reduce stock quantity for {selectedMedicine?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select 
                value={stockUpdateForm.type} 
                onValueChange={(value: "add" | "subtract") => 
                  setStockUpdateForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="subtract">Reduce Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={stockUpdateForm.quantity}
                onChange={(e) => setStockUpdateForm(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter quantity"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={stockUpdateForm.reason}
                onChange={(e) => setStockUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason (optional)"
              />
            </div>
            
            {selectedMedicine && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="font-medium">{selectedMedicine.stock} units</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockUpdate(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStockUpdate} 
              className={stockUpdateForm.type === 'add' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {stockUpdateForm.type === 'add' ? 'Add Stock' : 'Reduce Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}