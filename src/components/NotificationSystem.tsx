import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  CheckCircle,
  Info,
  TrendingDown
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { pharmacyAPI } from "../utils/supabase/client";

interface Alert {
  id: string;
  type: 'low_stock' | 'expired' | 'expiring' | 'out_of_stock';
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  medicineId?: string;
  medicineName?: string;
  acknowledged?: boolean;
}

interface NotificationSystemProps {
  className?: string;
}

export function NotificationSystem({ className = "" }: NotificationSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await pharmacyAPI.getLowStockAlerts();
      
      const newAlerts: Alert[] = response.alerts.map((alert: any) => ({
        id: `alert_${alert.id}`,
        type: alert.severity === 'critical' ? 'out_of_stock' : 'low_stock',
        title: alert.severity === 'critical' ? 'Out of Stock' : 'Low Stock Alert',
        message: `${alert.name} has ${alert.currentStock} units remaining (minimum: ${alert.minStock})`,
        severity: alert.severity,
        timestamp: new Date().toISOString(),
        medicineId: alert.id,
        medicineName: alert.name,
        acknowledged: false,
      }));

      setAlerts(newAlerts);
      setLastCheck(new Date());
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    
    // Set up periodic alert checking (every 5 minutes)
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: Alert['type'], severity: Alert['severity']) => {
    if (severity === 'critical') {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    if (severity === 'high') {
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-yellow-600" />;
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unacknowledgedAlerts.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unacknowledgedAlerts.length}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 lg:hidden"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-12 z-50 w-96 max-w-[90vw]"
            >
              <Card className="shadow-lg border">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Notifications</h3>
                        <p className="text-sm text-gray-500">
                          Last updated: {lastCheck.toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2" />
                        Loading notifications...
                      </div>
                    ) : alerts.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <p>No alerts at this time</p>
                        <p className="text-sm">All systems are running smoothly</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {/* Unacknowledged Alerts */}
                        {unacknowledgedAlerts.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                              New Alerts ({unacknowledgedAlerts.length})
                            </div>
                            {unacknowledgedAlerts.map((alert) => (
                              <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 border-l-4 ${getAlertColor(alert.severity)}`}
                              >
                                <div className="flex items-start space-x-3">
                                  {getAlertIcon(alert.type, alert.severity)}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {alert.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {alert.message}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => acknowledgeAlert(alert.id)}
                                        className="text-xs"
                                      >
                                        Acknowledge
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => dismissAlert(alert.id)}
                                        className="text-xs text-gray-500"
                                      >
                                        Dismiss
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Acknowledged Alerts */}
                        {acknowledgedAlerts.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                              Acknowledged ({acknowledgedAlerts.length})
                            </div>
                            {acknowledgedAlerts.map((alert) => (
                              <div
                                key={alert.id}
                                className="p-4 opacity-60"
                              >
                                <div className="flex items-start space-x-3">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {alert.title}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {alert.message}
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => dismissAlert(alert.id)}
                                      className="text-xs text-gray-500 mt-1"
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t bg-gray-50 space-y-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={loadAlerts}
                      disabled={loading}
                      className="w-full text-sm"
                    >
                      {loading ? "Refreshing..." : "Refresh Alerts"}
                    </Button>
                    
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Using local storage mode.{" "}
                        <button 
                          onClick={() => {
                            const setupMode = confirm('Would you like to set up the database for full functionality?\n\nThis will open setup instructions in a new page.');
                            if (setupMode) {
                              window.open('./database-setup.html', '_blank');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Setup database
                        </button>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}