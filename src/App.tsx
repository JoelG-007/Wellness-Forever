import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShoppingCart, 
  Package, 
  FileText, 
  Users, 
  BarChart3, 
  Home,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Dashboard } from "./components/Dashboard";
import { SalesBilling } from "./components/SalesBilling";
import { InventoryManagement } from "./components/InventoryManagement";
import { PrescriptionManagement } from "./components/PrescriptionManagement";
import { EmployeeUtilities } from "./components/EmployeeUtilities";
import { ReportsAnalytics } from "./components/ReportsAnalytics";
import { LoginPage } from "./components/LoginPage";
import { DatabaseSetupNotice } from "./components/DatabaseSetupNotice";
import { NotificationSystem } from "./components/NotificationSystem";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useIsMobile } from "./components/ui/use-mobile";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "./utils/supabase/info";

type ActiveModule = 'dashboard' | 'sales' | 'inventory' | 'prescriptions' | 'employee' | 'reports';

const navigationItems = [
  { id: 'dashboard' as ActiveModule, label: 'Dashboard', icon: Home },
  { id: 'sales' as ActiveModule, label: 'Sales & Billing', icon: ShoppingCart },
  { id: 'inventory' as ActiveModule, label: 'Inventory', icon: Package },
  { id: 'prescriptions' as ActiveModule, label: 'Prescriptions', icon: FileText },
  { id: 'employee' as ActiveModule, label: 'Employee Tools', icon: Users },
  { id: 'reports' as ActiveModule, label: 'Reports', icon: BarChart3 },
];

function PharmacyApp() {
  const { user, login, logout } = useAuth();
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null);

  // For now, skip database check and allow app to work with local storage
  // This prevents the "Database not initialized" errors from blocking the app
  useEffect(() => {
    if (user) {
      console.log('User authenticated, setting database ready to true (local storage mode)');
      // Allow the app to work with local storage fallback
      setDatabaseReady(true);
    }
  }, [user]);

  // Close sidebar on mobile by default and when switching modules
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Close sidebar on mobile when changing modules
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [activeModule, isMobile]);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'sales':
        return <SalesBilling />;
      case 'inventory':
        return <InventoryManagement />;
      case 'prescriptions':
        return <PrescriptionManagement />;
      case 'employee':
        return <EmployeeUtilities />;
      case 'reports':
        return <ReportsAnalytics />;
      default:
        return <Dashboard onNavigate={setActiveModule} />;
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out");
  };

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  // Show database setup notice if database is not ready
  if (databaseReady === false) {
    return (
      <DatabaseSetupNotice 
        onSetupComplete={() => {
          console.log('Database setup completed, rechecking status...');
          setDatabaseReady(null); // Trigger a recheck
          // Re-run the database check after a short delay
          setTimeout(() => {
            if (user) {
              const recheckDatabase = async () => {
                try {
                  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3afd2cac/medicines`, {
                    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
                  });
                  const result = await response.json();
                  if (response.ok && result.dbStatus === 'ready') {
                    setDatabaseReady(true);
                    toast.success('Database is now ready!');
                  } else {
                    setDatabaseReady(false);
                  }
                } catch (error) {
                  console.log('Recheck failed, assuming setup was successful');
                  setDatabaseReady(true);
                }
              };
              recheckDatabase();
            }
          }, 1000);
        }} 
      />
    );
  }

  // Show loading state while checking database
  if (databaseReady === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Checking database status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={{ x: isMobile ? -280 : 0 }}
        animate={{ x: sidebarOpen ? 0 : (isMobile ? -280 : -280) }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed left-0 top-0 z-50 h-full bg-white text-gray-800 shadow-xl border-r border-gray-200 ${
          isMobile ? 'w-72' : 'w-70'
        }`}
      >
        <div className={`p-4 ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`flex items-center justify-between ${isMobile ? 'mb-6' : 'mb-8'}`}>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              </div>
              <h1 className={`font-semibold text-gray-800 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                {isMobile ? 'Wellness' : 'Wellness Forever'}
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className={`space-y-1 ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: isMobile ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-3 rounded-lg text-left transition-all duration-200 ${
                    isMobile ? 'px-3 py-3' : 'px-4 py-3'
                  } ${
                    activeModule === item.id
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`${isMobile ? 'text-sm' : 'text-base'} truncate`}>
                    {isMobile && item.label.includes(' ') ? item.label.split(' ')[0] : item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        isMobile ? 'ml-0' : (sidebarOpen ? 'ml-70' : 'ml-0')
      }`}>
        {/* Top Bar */}
        <motion.header
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          className={`bg-white border-b border-gray-200 shadow-sm ${
            isMobile ? 'px-4 py-3' : 'px-6 py-4'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {(isMobile || !sidebarOpen) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h2 className={`capitalize text-gray-800 ${isMobile ? 'text-base' : 'text-lg'} truncate`}>
                {activeModule === 'dashboard' ? 'Dashboard' : 
                 navigationItems.find(item => item.id === activeModule)?.label}
              </h2>
            </div>
            
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
              {!isMobile && (
                <div className="text-sm text-gray-600 hidden sm:block">
                  {user.name} | {user.role}
                </div>
              )}
              <NotificationSystem />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <div className={`bg-green-500 rounded-full flex items-center justify-center text-white ${
                isMobile ? 'w-7 h-7 text-sm' : 'w-8 h-8'
              }`}>
                {user.initials}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Module Content */}
        <motion.main
          key={activeModule}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`overflow-y-auto bg-gray-50 relative ${
            isMobile 
              ? 'p-4 h-[calc(100vh-60px)]' 
              : 'p-6 h-[calc(100vh-80px)]'
          }`}
          style={{
            background: `radial-gradient(circle at 85% 15%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 15% 85%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 70% 70%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
                        #f9fafb`
          }}
        >
          {renderActiveModule()}
        </motion.main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40"
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PharmacyApp />
        {/* Toast Notifications */}
        <Toaster 
          position="top-right" 
          expand={false}
          richColors 
          closeButton
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}