import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Users,
  Plus,
  Search,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  UserPlus,
  LogIn,
  LogOut,
  BarChart3,
  FileText,
  HelpCircle,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Timer,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { pharmacyAPI } from "../utils/supabase/client";
import { Validator } from "../utils/validation";
import { toast } from "sonner@2.0.3";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  salary?: number;
  hireDate?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  hoursWorked?: number;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdBy?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export function EmployeeUtilities() {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form data
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    salary: "",
    hireDate: "",
  });
  
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  const departments = ["Pharmacy", "Administration", "Customer Service", "Management", "IT"];
  const roles = ["Pharmacist", "Assistant Pharmacist", "Manager", "Cashier", "Administrator"];
  const ticketCategories = ["Technical", "HR", "Equipment", "Process", "Other"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesResponse, timeEntriesResponse, ticketsResponse] = await Promise.all([
        pharmacyAPI.getEmployees(),
        pharmacyAPI.getTimeEntries(),
        pharmacyAPI.getTickets(),
      ]);
      
      setEmployees(employeesResponse.employees || []);
      setTimeEntries(timeEntriesResponse.timeEntries || []);
      setTickets(ticketsResponse.tickets || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      salary: "",
      hireDate: "",
    });
  };

  const resetTicketForm = () => {
    setTicketForm({
      title: "",
      description: "",
      category: "",
      priority: "medium",
    });
  };

  const handleAddEmployee = async () => {
    const employeeData = {
      ...employeeForm,
      salary: employeeForm.salary ? parseFloat(employeeForm.salary) : undefined,
      status: 'active' as const,
    };

    const validation = Validator.validateEmployee(employeeData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      await pharmacyAPI.addEmployee(employeeData);
      toast.success("Employee added successfully");
      setShowAddEmployee(false);
      resetEmployeeForm();
      loadData();
    } catch (error) {
      console.error("Failed to add employee:", error);
      toast.error("Failed to add employee");
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    const employeeData = {
      ...employeeForm,
      salary: employeeForm.salary ? parseFloat(employeeForm.salary) : undefined,
    };

    const validation = Validator.validateEmployee(employeeData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      await pharmacyAPI.updateEmployee?.(selectedEmployee.id, employeeData);
      toast.success("Employee updated successfully");
      setShowEditEmployee(false);
      setSelectedEmployee(null);
      resetEmployeeForm();
      loadData();
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast.error("Failed to update employee");
    }
  };

  const handleClockIn = async (employeeId: string) => {
    try {
      await pharmacyAPI.clockIn(employeeId);
      toast.success("Clock in successful");
      loadData();
    } catch (error) {
      console.error("Failed to clock in:", error);
      toast.error("Failed to clock in");
    }
  };

  const handleClockOut = async (employeeId: string) => {
    try {
      await pharmacyAPI.clockOut(employeeId);
      toast.success("Clock out successful");
      loadData();
    } catch (error) {
      console.error("Failed to clock out:", error);
      toast.error("Failed to clock out");
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.title || !ticketForm.description || !ticketForm.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await pharmacyAPI.createTicket({
        ...ticketForm,
        createdBy: "Current User", // In real app, get from auth context
      });
      toast.success("Ticket created successfully");
      setShowCreateTicket(false);
      resetTicketForm();
      loadData();
    } catch (error) {
      console.error("Failed to create ticket:", error);
      toast.error("Failed to create ticket");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await pharmacyAPI.updateTicketStatus(ticketId, status);
      toast.success("Ticket status updated");
      loadData();
    } catch (error) {
      console.error("Failed to update ticket status:", error);
      toast.error("Failed to update ticket status");
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      role: employee.role,
      department: employee.department,
      salary: employee.salary?.toString() || "",
      hireDate: employee.hireDate || "",
    });
    setShowEditEmployee(true);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Open</Badge>;
      case "in-progress":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "resolved":
        return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const isEmployeeClockedIn = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return timeEntries.some(entry => 
      entry.employeeId === employeeId && 
      entry.date === today && 
      entry.clockIn && 
      !entry.clockOut
    );
  };

  const getEmployeeTodayHours = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = timeEntries.find(entry => 
      entry.employeeId === employeeId && 
      entry.date === today
    );
    return todayEntry?.hoursWorked || 0;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl text-gray-900">Employee Utilities</h1>
          <p className="text-gray-600">Manage employees, time tracking, and help desk</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Employees</span>
          </TabsTrigger>
          <TabsTrigger value="timetracking" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Time Tracking</span>
          </TabsTrigger>
          <TabsTrigger value="helpdesk" className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4" />
            <span>Help Desk</span>
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowAddEmployee(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>

          {/* Employee Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Employees</p>
                    <p className="text-2xl font-medium">{employees.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Today</p>
                    <p className="text-2xl font-medium text-green-600">
                      {employees.filter(emp => isEmployeeClockedIn(emp.id)).length}
                    </p>
                  </div>
                  <Timer className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Departments</p>
                    <p className="text-2xl font-medium">{new Set(employees.map(e => e.department)).size}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Hours Today</p>
                    <p className="text-2xl font-medium text-orange-600">
                      {employees.length > 0 ? 
                        (employees.reduce((sum, emp) => sum + getEmployeeTodayHours(emp.id), 0) / employees.length).toFixed(1) 
                        : "0"
                      }
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Table */}
          <Card>
            <CardHeader>
              <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading employees...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Role & Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Today's Hours</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-gray-500">
                                {employee.email}
                              </div>
                              {employee.phone && (
                                <div className="text-sm text-gray-500">
                                  {employee.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {employee.role}
                              </Badge>
                              <div className="text-sm text-gray-500">
                                {employee.department}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={isEmployeeClockedIn(employee.id) ? "default" : "secondary"}>
                                {isEmployeeClockedIn(employee.id) ? "Clocked In" : "Clocked Out"}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                {employee.status === 'active' ? 'Active' : 'Inactive'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <span className="text-lg font-medium">
                                {getEmployeeTodayHours(employee.id).toFixed(1)}h
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {isEmployeeClockedIn(employee.id) ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClockOut(employee.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <LogOut className="h-3 w-3 mr-1" />
                                  Clock Out
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClockIn(employee.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <LogIn className="h-3 w-3 mr-1" />
                                  Clock In
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(employee)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredEmployees.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? "No employees match your search" : "No employees found"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tracking Tab */}
        <TabsContent value="timetracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries
                      .filter(entry => entry.date === new Date().toISOString().split('T')[0])
                      .map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="font-medium">{entry.employeeName}</div>
                          </TableCell>
                          <TableCell>
                            {entry.clockIn ? new Date(entry.clockIn).toLocaleTimeString() : '-'}
                          </TableCell>
                          <TableCell>
                            {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : '-'}
                          </TableCell>
                          <TableCell>
                            {entry.hoursWorked ? `${entry.hoursWorked.toFixed(2)}h` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.clockOut ? "default" : "secondary"}>
                              {entry.clockOut ? "Complete" : "In Progress"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                
                {timeEntries.filter(entry => entry.date === new Date().toISOString().split('T')[0]).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No time entries for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help Desk Tab */}
        <TabsContent value="helpdesk" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowCreateTicket(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </div>

          {/* Ticket Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-medium">{tickets.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open</p>
                    <p className="text-2xl font-medium text-red-600">
                      {tickets.filter(t => t.status === 'open').length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-medium text-yellow-600">
                      {tickets.filter(t => t.status === 'in-progress').length}
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
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-medium text-green-600">
                      {tickets.filter(t => t.status === 'resolved').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {ticket.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ticket.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(ticket.priority)}
                        </TableCell>
                        <TableCell>
                          {getTicketStatusBadge(ticket.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ticket.status}
                            onValueChange={(value) => handleUpdateTicketStatus(ticket.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "No tickets match your search" : "No tickets found"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Employee Modal */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter employee information including role, department, and contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={employeeForm.role} onValueChange={(value) => setEmployeeForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={employeeForm.department} onValueChange={(value) => setEmployeeForm(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                value={employeeForm.salary}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="Enter salary"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input
                id="hireDate"
                type="date"
                value={employeeForm.hireDate}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, hireDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEmployee(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee} className="bg-green-600 hover:bg-green-700">
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={showEditEmployee} onOpenChange={setShowEditEmployee}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information including role, department, and contact details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={employeeForm.role} onValueChange={(value) => setEmployeeForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department *</Label>
              <Select value={employeeForm.department} onValueChange={(value) => setEmployeeForm(prev => ({ ...prev, department: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-salary">Salary</Label>
              <Input
                id="edit-salary"
                type="number"
                value={employeeForm.salary}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="Enter salary"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-hireDate">Hire Date</Label>
              <Input
                id="edit-hireDate"
                type="date"
                value={employeeForm.hireDate}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, hireDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEmployee(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee} className="bg-green-600 hover:bg-green-700">
              Update Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateTicket} onOpenChange={setShowCreateTicket}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Submit a new support ticket for technical issues, HR requests, or equipment concerns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-title">Title *</Label>
              <Input
                id="ticket-title"
                value={ticketForm.title}
                onChange={(e) => setTicketForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter ticket title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-category">Category *</Label>
                <Select value={ticketForm.category} onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ticket-priority">Priority</Label>
                <Select value={ticketForm.priority} onValueChange={(value: "low" | "medium" | "high") => setTicketForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ticket-description">Description *</Label>
              <Textarea
                id="ticket-description"
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue in detail"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTicket(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} className="bg-green-600 hover:bg-green-700">
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}