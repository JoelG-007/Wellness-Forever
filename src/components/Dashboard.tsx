import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShoppingCart, 
  Package, 
  FileText, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { useIsMobile } from "./ui/use-mobile";
import { DatabaseSetupNotice } from "./DatabaseSetupNotice";
import { pharmacyAPI } from "../utils/supabase/client";
import { toast } from "sonner@2.0.3";

interface DashboardProps {
  onNavigate: (module: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const isMobile = useIsMobile();
  
  // Helper function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Helper function to format date and time
  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = isMobile ? {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    } : {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };
  const [dashboardData, setDashboardData] = useState<any>({
    stats: {
      totalMedicines: 0,
      todaySales: 0,
      todayRevenue: 0,
      lowStockAlerts: 0,
      pendingPrescriptions: 0,
    },
    activities: [],
    alerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [showDatabaseNotice, setShowDatabaseNotice] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setDatabaseError(false);
      
      const [statsResponse, activitiesResponse, alertsResponse] = await Promise.all([
        pharmacyAPI.getDashboardStats(),
        pharmacyAPI.getRecentActivity(),
        pharmacyAPI.getLowStockAlerts(),
      ]);

      setDashboardData({
        stats: statsResponse.stats || {
          totalMedicines: 0,
          todaySales: 0,
          todayRevenue: 0,
          lowStockAlerts: 0,
          pendingPrescriptions: 0,
        },
        activities: activitiesResponse.activities || [],
        alerts: alertsResponse.alerts || [],
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('database') || errorMessage.includes('table') || errorMessage.includes('relation')) {
        setDatabaseError(true);
        setShowDatabaseNotice(true);
      } else {
        toast.error("Failed to load dashboard data - using local storage");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // Update time and date every minute
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Update every minute

    // Update immediately
    setCurrentDateTime(new Date());

    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: "Today's Sales",
      value: `${dashboardData.stats.todayRevenue?.toFixed(2) || '0.00'}`,
      change: `${dashboardData.stats.todaySales || 0} transactions`,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Total Medicines",
      value: dashboardData.stats.totalMedicines?.toString() || "0",
      change: "In inventory",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Low Stock Alerts",
      value: dashboardData.stats.lowStockAlerts?.toString() || "0",
      change: "Need attention",
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Pending Prescriptions",
      value: dashboardData.stats.pendingPrescriptions?.toString() || "0",
      change: "Awaiting verification",
      icon: FileText,
      color: "text-purple-600"
    }
  ];

  if (showDatabaseNotice) {
    return <DatabaseSetupNotice onDismiss={() => setShowDatabaseNotice(false)} />;
  }

  return (
    <div className="space-y-6">
      {databaseError && (
        <Alert className="border-orange-200 bg-orange-50">
          <Database className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Database not initialized - running with sample data in localStorage. 
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowDatabaseNotice(true)}
              className="p-0 ml-2 text-orange-600"
            >
              Set up database →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white ${
          isMobile ? 'p-4' : 'p-6'
        }`}
      >
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
          <div>
            <h1 className={`mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {getGreeting()}, Dr. Joel!
            </h1>
            <p className={`text-green-100 ${isMobile ? 'text-sm' : 'text-base'}`}>
              Here's what's happening at your pharmacy today.
            </p>
            <div className={`flex items-center mt-3 text-green-100 ${isMobile ? 'mt-3' : 'mt-4'}`}>
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className={isMobile ? 'text-sm' : 'text-base'}>
                {formatDateTime(currentDateTime)}
              </span>
            </div>
          </div>
          <Button
            onClick={loadDashboardData}
            disabled={loading}
            variant="secondary"
            size={isMobile ? "sm" : "sm"}
            className={`bg-white/20 hover:bg-white/30 text-white border-white/20 ${
              isMobile ? 'self-start' : ''
            }`}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className={`grid gap-4 ${
        isMobile 
          ? 'grid-cols-1 sm:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
      }`}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className={isMobile ? 'p-4' : 'p-6'}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {stat.title}
                      </p>
                      <p className={`mt-1 ${isMobile ? 'text-xl' : 'text-2xl'} truncate`}>
                        {stat.value}
                      </p>
                      <p className={`mt-1 ${stat.color} ${isMobile ? 'text-xs' : 'text-sm'} truncate`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={`rounded-full bg-gray-100 ${stat.color} flex-shrink-0 ${
                      isMobile ? 'p-2' : 'p-3'
                    }`}>
                      <Icon className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className={`grid gap-4 ${
        isMobile 
          ? 'grid-cols-1' 
          : 'grid-cols-1 lg:grid-cols-3 gap-6'
      }`}>
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'space-y-2 p-4' : 'space-y-3'}>
              <Button 
                onClick={() => onNavigate('sales')}
                className={`w-full justify-start bg-orange-500 hover:bg-orange-600 text-white ${
                  isMobile ? 'py-2 text-sm' : ''
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">New Sale</span>
              </Button>
              <Button 
                onClick={() => onNavigate('prescriptions')}
                variant="outline" 
                className={`w-full justify-start ${isMobile ? 'py-2 text-sm' : ''}`}
              >
                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Process Prescription</span>
              </Button>
              <Button 
                onClick={() => onNavigate('inventory')}
                variant="outline" 
                className={`w-full justify-start ${isMobile ? 'py-2 text-sm' : ''}`}
              >
                <Package className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Check Inventory</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock Alerts</CardTitle>
              <Badge variant="destructive">{dashboardData.alerts.length} items</Badge>
            </CardHeader>
            <CardContent className={isMobile ? 'space-y-2 p-4' : 'space-y-3'}>
              {loading ? (
                <div className={`text-center py-4 text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                  Loading alerts...
                </div>
              ) : dashboardData.alerts.length === 0 ? (
                <div className={`text-center py-4 text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                  No low stock alerts
                </div>
              ) : (
                dashboardData.alerts.slice(0, isMobile ? 3 : 4).map((alert: any, index: number) => (
                  <div key={alert.id} className={`flex items-center justify-between bg-gray-50 rounded ${
                    isMobile ? 'p-2' : 'p-2'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`${isMobile ? 'text-sm' : 'text-sm'} truncate`}>{alert.name}</p>
                      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        Current: {alert.currentStock} | Min: {alert.minStock}
                      </p>
                    </div>
                    <Badge 
                      variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                      className={isMobile ? 'text-xs px-2 py-1' : ''}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))
              )}
              <Button 
                onClick={() => onNavigate('inventory')}
                variant="outline" 
                size="sm" 
                className={`w-full ${isMobile ? 'text-sm py-2' : ''}`}
              >
                View All Stock
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'space-y-2 p-4' : 'space-y-3'}>
              {loading ? (
                <div className={`text-center py-4 text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                  Loading activity...
                </div>
              ) : dashboardData.activities.length === 0 ? (
                <div className={`text-center py-4 text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
                  No recent activity
                </div>
              ) : (
                dashboardData.activities.slice(0, isMobile ? 4 : 5).map((activity: any, index: number) => (
                  <div key={index} className={`flex items-center space-x-3 ${isMobile ? 'p-1' : 'p-2'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      activity.type === 'sale' ? 'bg-green-500' :
                      activity.type === 'prescription' ? 'bg-blue-500' :
                      activity.type === 'stock' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`${isMobile ? 'text-sm' : 'text-sm'} truncate`}>
                        {activity.description}
                      </p>
                      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}