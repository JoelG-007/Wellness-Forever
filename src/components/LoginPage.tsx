import { useState } from "react";
import { motion } from "motion/react";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";

interface LoginPageProps {
  onLogin: (user: PharmacistUser) => Promise<void> | void;
}

interface PharmacistUser {
  id: string;
  email: string;
  name: string;
  role: string;
  pharmacy: string;
  initials: string;
}

// Predefined pharmacists for the demo
const DEMO_PHARMACISTS: PharmacistUser[] = [
  {
    id: "1",
    email: "joel.guedes@wellnessforever.com",
    name: "Dr. Joel Guedes",
    role: "Senior Pharmacist",
    pharmacy: "Wellness Forever - Mumbai Central",
    initials: "JG",
  },
  {
    id: "2",
    email: "priya.sharma@wellnessforever.com",
    name: "Dr. Priya Sharma",
    role: "Pharmacist",
    pharmacy: "Wellness Forever - Bandra",
    initials: "PS",
  },
  {
    id: "3",
    email: "rahul.patel@wellnessforever.com",
    name: "Dr. Rahul Patel",
    role: "Chief Pharmacist",
    pharmacy: "Wellness Forever - Andheri",
    initials: "RP",
  },
  {
    id: "4",
    email: "sneha.joshi@wellnessforever.com",
    name: "Dr. Sneha Joshi",
    role: "Pharmacist",
    pharmacy: "Wellness Forever - Powai",
    initials: "SJ",
  },
  {
    id: "5",
    email: "amit.singh@wellnessforever.com",
    name: "Dr. Amit Singh",
    role: "Pharmacist",
    pharmacy: "Wellness Forever - Thane",
    initials: "AS",
  },
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      if (error) setError("");
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Find user by email
    const user = DEMO_PHARMACISTS.find(
      (p) => p.email === formData.email,
    );

    if (!user) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
      return;
    }

    // Simple password validation (in real app, this would be hashed)
    if (formData.password !== "pharmacy123") {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
      return;
    }

    // Store user session in localStorage
    localStorage.setItem(
      "wellnessForever_currentUser",
      JSON.stringify(user),
    );

    toast.success(`Welcome back, ${user.name}!`);
    await onLogin(user);
    setIsLoading(false);
  };

  const handleDemoLogin = async (user: PharmacistUser) => {
    setIsLoading(true);
    localStorage.setItem(
      "wellnessForever_currentUser",
      JSON.stringify(user),
    );
    toast.success(`Logged in as ${user.name}`);
    await onLogin(user);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 60% 40%, rgba(249, 115, 22, 0.1) 0%, transparent 50%),
                      #f9fafb`,
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
              <div className="flex space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              </div>
              <h1 className="text-3xl text-gray-800">
                Wellness Forever
              </h1>
            </div>

            <h2 className="text-4xl text-gray-800 mb-4">
              Pharmacy Management
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Comprehensive solution for modern pharmacy
              operations. Streamline sales, inventory,
              prescriptions, and analytics all in one place.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  Sales & Billing
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-600">
                  Inventory Management
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">
                  Prescription Tracking
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  Analytics & Reports
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">
                  Welcome Back
                </CardTitle>
                <CardDescription>
                  Sign in to access your pharmacy management
                  dashboard
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="pharmacist@wellnessforever.com"
                        value={formData.email}
                        onChange={handleInputChange("email")}
                        className="pl-10 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="password"
                        type={
                          showPassword ? "text" : "password"
                        }
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange("password")}
                        className="pl-10 pr-10 bg-white"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>

                {/* Demo Login Section */}
                <div className="border-t border-gray-200 pt-6">
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Demo Login - Quick Access:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {DEMO_PHARMACISTS.slice(0, 3).map(
                      (user) => (
                        <Button
                          key={user.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDemoLogin(user)}
                          className="justify-start text-left hover:bg-green-50 hover:border-green-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                              {user.initials}
                            </div>
                            <div>
                              <div className="text-sm">
                                {user.name}
                              </div>
                              <div className="text-xs text-gray-500 text-left">
                                {user.role}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ),
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      <strong>Demo Password:</strong>{" "}
                      pharmacy123
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}