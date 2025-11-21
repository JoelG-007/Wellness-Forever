import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  FileText,
  Users,
  Filter,
  RefreshCw,
  Eye,
  PieChart,
  LineChart,
  Activity,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { pharmacyAPI } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";

interface SalesReport {
  period: { start: string; end: string };
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  sales: any[];
}

interface InventoryReport {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: any[];
  medicines: any[];
}

interface EmployeeReport {
  period: string;
  employees: any[];
  timeEntries: any[];
}

interface PrescriptionReport {
  period: { start: string; end: string };
  totalPrescriptions: number;
  statusBreakdown: Record<string, number>;
  prescriptions: any[];
}

export function ReportsAnalytics() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);

  // Report data
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [employeeReport, setEmployeeReport] = useState<EmployeeReport | null>(null);
  const [prescriptionReport, setPrescriptionReport] = useState<PrescriptionReport | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setDatabaseError(false);
    try {
      const [salesRes, inventoryRes, employeeRes, prescriptionRes] = await Promise.all([
        pharmacyAPI.getSalesReport(dateRange.start, dateRange.end),
        pharmacyAPI.getInventoryReport(),
        pharmacyAPI.getEmployeeReport(selectedMonth),
        pharmacyAPI.getPrescriptionReport(dateRange.start, dateRange.end),
      ]);
      
      setSalesReport(salesRes.report);
      setInventoryReport(inventoryRes.report);
      setEmployeeReport(employeeRes.report);
      setPrescriptionReport(prescriptionRes.report);
    } catch (error) {
      console.error("Failed to load reports:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Database not initialized') || errorMessage.includes('not initialized')) {
        setDatabaseError(true);
        toast.error("Database not initialized. Using sample data.");
      } else {
        toast.error("Failed to load reports. Using sample data.");
      }
      
      // Set sample/fallback data
      setSalesReport({
        period: { start: dateRange.start, end: dateRange.end },
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        sales: []
      });
      setInventoryReport({
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        recentMovements: [],
        medicines: []
      });
      setEmployeeReport({
        period: selectedMonth,
        employees: [],
        timeEntries: []
      });
      setPrescriptionReport({
        period: { start: dateRange.start, end: dateRange.end },
        totalPrescriptions: 0,
        statusBreakdown: {},
        prescriptions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = async () => {
    setLoading(true);
    try {
      const [salesRes, prescriptionRes] = await Promise.all([
        pharmacyAPI.getSalesReport(dateRange.start, dateRange.end),
        pharmacyAPI.getPrescriptionReport(dateRange.start, dateRange.end),
      ]);
      
      setSalesReport(salesRes.report);
      setPrescriptionReport(prescriptionRes.report);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = async () => {
    setLoading(true);
    try {
      const employeeRes = await pharmacyAPI.getEmployeeReport(selectedMonth);
      setEmployeeReport(employeeRes.report);
    } catch (error) {
      console.error("Failed to load employee report:", error);
      toast.error("Failed to load employee report");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (reportType: string) => {
    let data: any;
    let filename: string;
    
    switch (reportType) {
      case 'sales':
        data = salesReport;
        filename = `sales-report-${dateRange.start}-to-${dateRange.end}.json`;
        break;
      case 'inventory':
        data = inventoryReport;
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'employee':
        data = employeeReport;
        filename = `employee-report-${selectedMonth}.json`;
        break;
      case 'prescription':
        data = prescriptionReport;
        filename = `prescription-report-${dateRange.start}-to-${dateRange.end}.json`;
        break;
      default:
        return;
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Report exported successfully");
  };

  // Chart data preparation
  const prepareSalesChartData = () => {
    if (!salesReport?.sales) return [];
    
    const dailySales = salesReport.sales.reduce((acc: any, sale: any) => {
      const date = sale.timestamp?.split('T')[0] || 'Unknown';
      if (!acc[date]) {
        acc[date] = { date, sales: 0, revenue: 0 };
      }
      acc[date].sales += 1;
      acc[date].revenue += sale.total || 0;
      return acc;
    }, {});
    
    return Object.values(dailySales).slice(-7); // Last 7 days
  };

  const prepareInventoryChartData = () => {
    if (!inventoryReport?.medicines) return [];
    
    const categoryData = inventoryReport.medicines.reduce((acc: any, medicine: any) => {
      const category = medicine.category || 'Other';
      if (!acc[category]) {
        acc[category] = { category, count: 0, value: 0 };
      }
      acc[category].count += 1;
      acc[category].value += medicine.stock * medicine.price || 0;
      return acc;
    }, {});
    
    return Object.values(categoryData);
  };

  const preparePrescriptionStatusData = () => {
    if (!prescriptionReport?.statusBreakdown) return [];
    
    const colors = {
      pending: '#f59e0b',
      verified: '#10b981',
      rejected: '#ef4444',
      dispensed: '#3b82f6'
    };
    
    return Object.entries(prescriptionReport.statusBreakdown).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: colors[status as keyof typeof colors] || '#6b7280'
    }));
  };

  const prepareEmployeeHoursData = () => {
    if (!employeeReport?.employees) return [];
    
    return employeeReport.employees.map((emp: any) => ({
      name: emp.employee.name,
      hours: emp.totalHours || 0,
      days: emp.workingDays || 0,
      avgHours: emp.averageHoursPerDay || 0
    })).slice(0, 10); // Top 10 employees
  };

  const salesChartData = prepareSalesChartData();
  const inventoryChartData = prepareInventoryChartData();
  const prescriptionStatusData = preparePrescriptionStatusData();
  const employeeHoursData = prepareEmployeeHoursData();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}
      >
        <div>
          <h1 className={`text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            Reports & Analytics
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className={`flex items-center space-x-2 ${isMobile ? 'self-start' : ''}`}>
          <Button
            onClick={loadReports}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {databaseError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-yellow-800 font-medium">Database Connection Issue</p>
              <p className="text-yellow-700 text-sm">
                Reports are currently showing sample data. Database may need to be initialized.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <TabsTrigger value="sales" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className={isMobile ? 'text-xs' : 'text-sm'}>Sales</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center space-x-2">
            <Package className="h-4 w-4 flex-shrink-0" />
            <span className={isMobile ? 'text-xs' : 'text-sm'}>Inventory</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center space-x-2">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className={isMobile ? 'text-xs' : 'text-sm'}>Prescriptions</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center space-x-2">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className={isMobile ? 'text-xs' : 'text-sm'}>Employees</span>
          </TabsTrigger>
        </TabsList>

        {/* Sales Report Tab */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Report</CardTitle>
              <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                {isMobile && <div className="w-full" />}
                <div className={`flex items-center ${isMobile ? 'w-full space-x-1' : 'space-x-2'}`}>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className={isMobile ? 'flex-1 text-sm' : 'w-40'}
                  />
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>to</span>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className={isMobile ? 'flex-1 text-sm' : 'w-40'}
                  />
                </div>
                <div className={`flex ${isMobile ? 'w-full space-x-2' : 'space-x-2'}`}>
                  <Button 
                    onClick={handleDateRangeChange} 
                    size="sm"
                    className={isMobile ? 'flex-1' : ''}
                  >
                    Apply
                  </Button>
                  <Button 
                    onClick={() => exportReport('sales')} 
                    variant="outline" 
                    size="sm"
                    className={isMobile ? 'flex-1' : ''}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isMobile ? '' : 'Export'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading sales report...</p>
                </div>
              ) : salesReport ? (
                <div className="space-y-6">
                  {/* Sales KPIs */}
                  <div className={`grid gap-4 ${
                    isMobile 
                      ? 'grid-cols-1' 
                      : 'grid-cols-1 md:grid-cols-3'
                  }`}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Sales</p>
                            <p className="text-2xl font-medium">{salesReport.totalSales}</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-medium text-green-600">
                              ${salesReport.totalRevenue.toFixed(2)}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Avg. Order Value</p>
                            <p className="text-2xl font-medium text-purple-600">
                              ${salesReport.averageOrderValue.toFixed(2)}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sales Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Sales Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={isMobile ? 'h-64' : 'h-80'}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={salesChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Area
                              yAxisId="right"
                              type="monotone"
                              dataKey="revenue"
                              stackId="1"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.3}
                            />
                            <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Sales Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Items</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Payment</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {salesReport.sales.slice(-10).reverse().map((sale: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {new Date(sale.timestamp).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {sale.customerName || 'Walk-in Customer'}
                                </TableCell>
                                <TableCell>
                                  {sale.items?.length || 0} items
                                </TableCell>
                                <TableCell className="font-medium">
                                  ${sale.total?.toFixed(2) || '0.00'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {sale.paymentMethod || 'cash'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No sales data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Report Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Report</CardTitle>
              <Button onClick={() => exportReport('inventory')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                {isMobile ? '' : 'Export'}
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading inventory report...</p>
                </div>
              ) : inventoryReport ? (
                <div className="space-y-6">
                  {/* Inventory KPIs */}
                  <div className={`grid gap-4 ${
                    isMobile 
                      ? 'grid-cols-1 sm:grid-cols-2' 
                      : 'grid-cols-1 md:grid-cols-4'
                  }`}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Items</p>
                            <p className="text-2xl font-medium">{inventoryReport.totalItems}</p>
                          </div>
                          <Package className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="text-2xl font-medium text-green-600">
                              ${inventoryReport.totalValue.toFixed(2)}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Low Stock</p>
                            <p className="text-2xl font-medium text-orange-600">
                              {inventoryReport.lowStockItems}
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
                              {inventoryReport.outOfStockItems}
                            </p>
                          </div>
                          <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Inventory by Category Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={inventoryChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Low Stock Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Items Requiring Attention</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medicine</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Current Stock</TableHead>
                              <TableHead>Min Stock</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inventoryReport.medicines
                              .filter((med: any) => med.stock <= med.minStock)
                              .slice(0, 10)
                              .map((medicine: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{medicine.name}</div>
                                      <div className="text-sm text-gray-500">
                                        {medicine.manufacturer}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{medicine.category}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {medicine.stock}
                                  </TableCell>
                                  <TableCell>{medicine.minStock}</TableCell>
                                  <TableCell>
                                    <Badge variant={medicine.stock === 0 ? "destructive" : "secondary"}>
                                      {medicine.stock === 0 ? "Out of Stock" : "Low Stock"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No inventory data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions Report Tab */}
        <TabsContent value="prescriptions" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Prescription Report</CardTitle>
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-40"
                />
                <span>to</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-40"
                />
                <Button onClick={handleDateRangeChange} size="sm">
                  Apply
                </Button>
                <Button onClick={() => exportReport('prescription')} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading prescription report...</p>
                </div>
              ) : prescriptionReport ? (
                <div className="space-y-6">
                  {/* Prescription KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Prescriptions</p>
                            <p className="text-2xl font-medium">{prescriptionReport.totalPrescriptions}</p>
                          </div>
                          <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Verification Rate</p>
                            <p className="text-2xl font-medium text-green-600">
                              {prescriptionReport.totalPrescriptions > 0 
                                ? ((prescriptionReport.statusBreakdown.verified || 0) / prescriptionReport.totalPrescriptions * 100).toFixed(1)
                                : 0}%
                            </p>
                          </div>
                          <Activity className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Prescription Status Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Prescription Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={prescriptionStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {prescriptionStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Prescriptions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Prescriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Patient</TableHead>
                              <TableHead>Doctor</TableHead>
                              <TableHead>Medicines</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {prescriptionReport.prescriptions.slice(-10).reverse().map((prescription: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {new Date(prescription.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{prescription.patientName}</TableCell>
                                <TableCell>{prescription.doctorName}</TableCell>
                                <TableCell>
                                  {prescription.medicines?.length || 0} items
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      prescription.status === 'verified' ? 'default' :
                                      prescription.status === 'pending' ? 'secondary' :
                                      prescription.status === 'rejected' ? 'destructive' :
                                      'outline'
                                    }
                                  >
                                    {prescription.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No prescription data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Report Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Employee Report</CardTitle>
              <div className="flex items-center space-x-2">
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-40"
                />
                <Button onClick={handleMonthChange} size="sm">
                  Apply
                </Button>
                <Button onClick={() => exportReport('employee')} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading employee report...</p>
                </div>
              ) : employeeReport ? (
                <div className="space-y-6">
                  {/* Employee KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Employees</p>
                            <p className="text-2xl font-medium">{employeeReport.employees?.length || 0}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Hours</p>
                            <p className="text-2xl font-medium text-green-600">
                              {employeeReport.employees?.reduce((sum: number, emp: any) => sum + (emp.totalHours || 0), 0).toFixed(1) || 0}h
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Avg Hours/Employee</p>
                            <p className="text-2xl font-medium text-purple-600">
                              {employeeReport.employees?.length 
                                ? (employeeReport.employees.reduce((sum: number, emp: any) => sum + (emp.totalHours || 0), 0) / employeeReport.employees.length).toFixed(1)
                                : 0}h
                            </p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Employee Hours Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Hours Worked</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={employeeHoursData} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} />
                            <Tooltip />
                            <Bar dataKey="hours" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Employee Performance Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Employee Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Total Hours</TableHead>
                              <TableHead>Working Days</TableHead>
                              <TableHead>Avg Hours/Day</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employeeReport.employees?.map((emp: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{emp.employee.name}</div>
                                    <div className="text-sm text-gray-500">{emp.employee.email}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{emp.employee.role}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {emp.totalHours?.toFixed(1) || 0}h
                                </TableCell>
                                <TableCell>{emp.workingDays || 0} days</TableCell>
                                <TableCell>{emp.averageHoursPerDay?.toFixed(1) || 0}h</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No employee data available for the selected month
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}