import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Phone,
  Stethoscope,
  Pill,
  AlertCircle,
  RefreshCw,
  FileCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { pharmacyAPI } from "../utils/supabase/client";
import { Validator } from "../utils/validation";
import { toast } from "sonner@2.0.3";

interface Prescription {
  id: string;
  patientName: string;
  patientAge?: number;
  patientPhone?: string;
  doctorName: string;
  medicines: string[];
  status: 'pending' | 'verified' | 'rejected' | 'dispensed';
  notes?: string;
  verification?: {
    verifiedBy?: string;
    verifiedAt?: string;
    notes?: string;
    approved: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Modal states
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [showViewPrescription, setShowViewPrescription] = useState(false);
  const [showVerifyPrescription, setShowVerifyPrescription] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  
  // Form data
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    doctorName: "",
    medicines: [""],
    notes: "",
  });
  
  const [verificationForm, setVerificationForm] = useState({
    approved: true,
    notes: "",
    verifiedBy: "Current Pharmacist",
  });

  useEffect(() => {
    loadPrescriptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [prescriptions, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await pharmacyAPI.getPrescriptions();
      setPrescriptions(response.prescriptions || []);
    } catch (error) {
      console.error("Failed to load prescriptions:", error);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medicines.some(med => med.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(prescription => prescription.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "patientName":
          aValue = a.patientName.toLowerCase();
          bValue = b.patientName.toLowerCase();
          break;
        case "doctorName":
          aValue = a.doctorName.toLowerCase();
          bValue = b.doctorName.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredPrescriptions(filtered);
  };

  const resetPrescriptionForm = () => {
    setPrescriptionForm({
      patientName: "",
      patientAge: "",
      patientPhone: "",
      doctorName: "",
      medicines: [""],
      notes: "",
    });
  };

  const addMedicineField = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, ""]
    }));
  };

  const removeMedicineField = (index: number) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const updateMedicineField = (index: number, value: string) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => i === index ? value : med)
    }));
  };

  const handleAddPrescription = async () => {
    const prescriptionData = {
      patientName: prescriptionForm.patientName,
      patientAge: prescriptionForm.patientAge ? parseInt(prescriptionForm.patientAge) : undefined,
      patientPhone: prescriptionForm.patientPhone,
      doctorName: prescriptionForm.doctorName,
      medicines: prescriptionForm.medicines.filter(med => med.trim() !== ""),
      notes: prescriptionForm.notes,
    };

    const validation = Validator.validatePrescription(prescriptionData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      await pharmacyAPI.addPrescription(prescriptionData);
      toast.success("Prescription added successfully");
      setShowAddPrescription(false);
      resetPrescriptionForm();
      loadPrescriptions();
    } catch (error) {
      console.error("Failed to add prescription:", error);
      toast.error("Failed to add prescription");
    }
  };

  const handleVerifyPrescription = async () => {
    if (!selectedPrescription) return;

    try {
      await pharmacyAPI.verifyPrescription(selectedPrescription.id, {
        approved: verificationForm.approved,
        notes: verificationForm.notes,
        verifiedBy: verificationForm.verifiedBy,
      });
      
      toast.success(
        verificationForm.approved 
          ? "Prescription verified successfully" 
          : "Prescription rejected"
      );
      
      setShowVerifyPrescription(false);
      setSelectedPrescription(null);
      setVerificationForm({
        approved: true,
        notes: "",
        verifiedBy: "Current Pharmacist",
      });
      loadPrescriptions();
    } catch (error) {
      console.error("Failed to verify prescription:", error);
      toast.error("Failed to verify prescription");
    }
  };

  const handleStatusChange = async (prescriptionId: string, newStatus: string) => {
    try {
      await pharmacyAPI.updatePrescriptionStatus(prescriptionId, newStatus);
      toast.success("Prescription status updated");
      loadPrescriptions();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const openViewModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowViewPrescription(true);
  };

  const openVerifyModal = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowVerifyPrescription(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "verified":
        return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "dispensed":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Dispensed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "dispensed":
        return <FileCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const statusCounts = {
    pending: prescriptions.filter(p => p.status === 'pending').length,
    verified: prescriptions.filter(p => p.status === 'verified').length,
    rejected: prescriptions.filter(p => p.status === 'rejected').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl text-gray-900">Prescription Management</h1>
          <p className="text-gray-600">Manage prescriptions, verify authenticity, and track dispensing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={loadPrescriptions}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAddPrescription(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Prescription
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Prescriptions</p>
                <p className="text-2xl font-medium">{prescriptions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-medium text-yellow-600">
                  {statusCounts.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-medium text-green-600">
                  {statusCounts.verified}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dispensed</p>
                <p className="text-2xl font-medium text-blue-600">
                  {statusCounts.dispensed}
                </p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="dispensed">Dispensed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="patientName">Patient Name</SelectItem>
                <SelectItem value="doctorName">Doctor Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              variant="outline"
              className="w-full"
            >
              {sortOrder === "asc" ? "Oldest First" : "Newest First"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Prescriptions ({filteredPrescriptions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading prescriptions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Medicines</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prescription.patientName}</div>
                          <div className="text-sm text-gray-500">
                            {prescription.patientAge && `Age: ${prescription.patientAge}`}
                            {prescription.patientPhone && ` • ${prescription.patientPhone}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="h-4 w-4 text-gray-400" />
                          <span>{prescription.doctorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {prescription.medicines.slice(0, 2).map((medicine, index) => (
                            <div key={index} className="text-sm">
                              <Pill className="h-3 w-3 inline mr-1 text-gray-400" />
                              {medicine}
                            </div>
                          ))}
                          {prescription.medicines.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{prescription.medicines.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(prescription.status)}
                          {getStatusBadge(prescription.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(prescription.createdAt).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(prescription.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewModal(prescription)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {prescription.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openVerifyModal(prescription)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                          )}
                          {prescription.status === 'verified' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(prescription.id, 'dispensed')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FileCheck className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredPrescriptions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || statusFilter !== "all" 
                    ? "No prescriptions match your filters" 
                    : "No prescriptions found"}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Prescription Modal */}
      <Dialog open={showAddPrescription} onOpenChange={setShowAddPrescription}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Prescription</DialogTitle>
            <DialogDescription>
              Enter patient and doctor information along with prescribed medicines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  value={prescriptionForm.patientName}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientAge">Patient Age</Label>
                <Input
                  id="patientAge"
                  type="number"
                  value={prescriptionForm.patientAge}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, patientAge: e.target.value }))}
                  placeholder="Enter age"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientPhone">Patient Phone</Label>
                <Input
                  id="patientPhone"
                  value={prescriptionForm.patientPhone}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, patientPhone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name *</Label>
                <Input
                  id="doctorName"
                  value={prescriptionForm.doctorName}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, doctorName: e.target.value }))}
                  placeholder="Enter doctor name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Prescribed Medicines *</Label>
              {prescriptionForm.medicines.map((medicine, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={medicine}
                    onChange={(e) => updateMedicineField(index, e.target.value)}
                    placeholder="Enter medicine name and dosage"
                    className="flex-1"
                  />
                  {prescriptionForm.medicines.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMedicineField(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addMedicineField}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Medicine
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={prescriptionForm.notes}
                onChange={(e) => setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter any additional notes or instructions"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPrescription(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPrescription} className="bg-green-600 hover:bg-green-700">
              Add Prescription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Prescription Modal */}
      <Dialog open={showViewPrescription} onOpenChange={setShowViewPrescription}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              View complete prescription information including patient details and prescribed medicines.
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Patient Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm text-gray-600">Name</Label>
                      <p className="font-medium">{selectedPrescription.patientName}</p>
                    </div>
                    {selectedPrescription.patientAge && (
                      <div>
                        <Label className="text-sm text-gray-600">Age</Label>
                        <p>{selectedPrescription.patientAge} years</p>
                      </div>
                    )}
                    {selectedPrescription.patientPhone && (
                      <div>
                        <Label className="text-sm text-gray-600">Phone</Label>
                        <p>{selectedPrescription.patientPhone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Stethoscope className="h-5 w-5" />
                      <span>Doctor Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label className="text-sm text-gray-600">Doctor Name</Label>
                      <p className="font-medium">{selectedPrescription.doctorName}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Pill className="h-5 w-5" />
                    <span>Prescribed Medicines</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedPrescription.medicines.map((medicine, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <Pill className="h-4 w-4 text-gray-400" />
                        <span>{medicine}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {selectedPrescription.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedPrescription.notes}</p>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Status Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Current Status:</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedPrescription.status)}
                      {getStatusBadge(selectedPrescription.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="ml-2">{new Date(selectedPrescription.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedPrescription.verification && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Verification Details</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Verified by:</span>
                          <span className="ml-2">{selectedPrescription.verification.verifiedBy}</span>
                        </div>
                        {selectedPrescription.verification.verifiedAt && (
                          <div>
                            <span className="text-gray-600">Verified at:</span>
                            <span className="ml-2">{new Date(selectedPrescription.verification.verifiedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedPrescription.verification.notes && (
                          <div>
                            <span className="text-gray-600">Notes:</span>
                            <span className="ml-2">{selectedPrescription.verification.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewPrescription(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Prescription Modal */}
      <Dialog open={showVerifyPrescription} onOpenChange={setShowVerifyPrescription}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Prescription</DialogTitle>
            <DialogDescription>
              Review and verify the prescription for {selectedPrescription?.patientName}. Confirm authenticity and approve or reject.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Decision</Label>
              <Select 
                value={verificationForm.approved ? "approve" : "reject"} 
                onValueChange={(value) => 
                  setVerificationForm(prev => ({ ...prev, approved: value === "approve" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">Approve Prescription</SelectItem>
                  <SelectItem value="reject">Reject Prescription</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verificationNotes">Verification Notes</Label>
              <Textarea
                id="verificationNotes"
                value={verificationForm.notes}
                onChange={(e) => setVerificationForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter verification notes (optional)"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verifiedBy">Verified By</Label>
              <Input
                id="verifiedBy"
                value={verificationForm.verifiedBy}
                onChange={(e) => setVerificationForm(prev => ({ ...prev, verifiedBy: e.target.value }))}
                placeholder="Enter pharmacist name"
              />
            </div>
            
            {selectedPrescription && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Prescription Summary</h4>
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-600">Patient:</span> {selectedPrescription.patientName}</div>
                  <div><span className="text-gray-600">Doctor:</span> {selectedPrescription.doctorName}</div>
                  <div><span className="text-gray-600">Medicines:</span> {selectedPrescription.medicines.join(", ")}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyPrescription(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyPrescription} 
              className={verificationForm.approved ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {verificationForm.approved ? 'Approve Prescription' : 'Reject Prescription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}