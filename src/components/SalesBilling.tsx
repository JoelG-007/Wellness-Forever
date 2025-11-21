import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  Phone,
  CreditCard,
  DollarSign,
  Package2,
  Search,
  CheckCircle,
  AlertCircle,
  Receipt as ReceiptIcon,
  Printer,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { useIsMobile } from "./ui/use-mobile";
import { pharmacyAPI } from "../utils/supabase/client";
import { Validator } from "../utils/validation";
import { toast } from "sonner@2.0.3";

interface CartItem {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  strength?: string;
  manufacturer?: string;
}

interface Medicine {
  id: string;
  name: string;
  price: number;
  stock: number;
  strength?: string;
  manufacturer?: string;
  category?: string;
}

export function SalesBilling() {
  const isMobile = useIsMobile();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, []);

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

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine) => {
    if (medicine.stock <= 0) {
      toast.error("This medicine is out of stock");
      return;
    }

    const existingItem = cart.find((item) => item.medicineId === medicine.id);
    
    if (existingItem) {
      if (existingItem.quantity >= medicine.stock) {
        toast.error("Cannot add more than available stock");
        return;
      }
      setCart(cart.map((item) =>
        item.medicineId === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        medicineId: medicine.id,
        name: medicine.name,
        price: medicine.price,
        quantity: 1,
        stock: medicine.stock,
        strength: medicine.strength,
        manufacturer: medicine.manufacturer,
      }]);
    }
    toast.success(`${medicine.name} added to cart`);
  };

  const updateQuantity = (medicineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    const item = cart.find((item) => item.medicineId === medicineId);
    if (item && newQuantity > item.stock) {
      toast.error("Cannot exceed available stock");
      return;
    }

    setCart(cart.map((item) =>
      item.medicineId === medicineId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter((item) => item.medicineId !== medicineId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Validate sale data
    const saleData = {
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      items: cart,
      total: calculateTotal(),
      paymentMethod,
    };

    const validation = Validator.validateSale(saleData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Process the sale
      const response = await pharmacyAPI.createSale(saleData);
      
      if (response.sale) {
        // Create receipt data
        setCurrentReceipt({
          ...response.sale,
          receiptNumber: response.sale.id.slice(-8).toUpperCase(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
        });
        
        // Clear cart and customer info
        setCart([]);
        setCustomerInfo({ name: "", phone: "" });
        setPaymentMethod("cash");
        setShowReceipt(true);
        
        // Reload medicines to update stock
        loadMedicines();
        
        toast.success("Sale completed successfully!");
      }
    } catch (error) {
      console.error("Failed to process sale:", error);
      toast.error("Failed to process sale. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  if (showReceipt && currentReceipt) {
    return (
      <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={isMobile ? 'w-full' : 'max-w-md mx-auto'}
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center bg-green-50">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              </div>
              <CardTitle className="text-green-700">Wellness Forever</CardTitle>
              <p className="text-sm text-green-600">Pharmacy Receipt</p>
            </CardHeader>
            
            <CardContent className={`space-y-4 ${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex justify-between text-sm">
                <span>Receipt #:</span>
                <span className="font-mono">{currentReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Date:</span>
                <span>{currentReceipt.date} {currentReceipt.time}</span>
              </div>
              
              {currentReceipt.customerName && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Customer:</span>
                      <span>{currentReceipt.customerName}</span>
                    </div>
                    {currentReceipt.customerPhone && (
                      <div className="flex justify-between text-sm">
                        <span>Phone:</span>
                        <span>{currentReceipt.customerPhone}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Items:</h4>
                {currentReceipt.items.map((item: CartItem, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <div>{item.name}</div>
                      <div className="text-gray-500">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-medium text-lg">
                <span>Total:</span>
                <span>${currentReceipt.total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Payment Method:</span>
                <span className="capitalize">{currentReceipt.paymentMethod}</span>
              </div>
              
              <Separator />
              
              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>Thank you for choosing Wellness Forever!</p>
                <p>Your health, our commitment</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex space-x-4 mt-6">
            <Button onClick={printReceipt} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button onClick={() => setShowReceipt(false)} variant="outline" className="flex-1">
              New Sale
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}
      >
        <div>
          <h1 className={`text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            Sales & Billing
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-base'}`}>
            Process sales and manage transactions
          </p>
        </div>
        <div className={`flex items-center space-x-2 ${isMobile ? 'self-start' : ''}`}>
          <ShoppingCart className="h-5 w-5 text-green-600" />
          <Badge variant="secondary" className={isMobile ? 'text-xs' : ''}>
            {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
          </Badge>
        </div>
      </motion.div>

      <div className={`grid gap-4 ${
        isMobile 
          ? 'grid-cols-1' 
          : 'grid-cols-1 lg:grid-cols-3 gap-6'
      }`}>
        {/* Medicine Search & Selection */}
        <div className={`space-y-4 ${isMobile ? 'order-2' : 'lg:col-span-2'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package2 className="h-5 w-5" />
                <span>Medicine Catalog</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search medicines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-600">Loading medicines...</p>
                </div>
              ) : (
                <div className={`grid gap-3 overflow-y-auto ${
                  isMobile ? 'max-h-64' : 'max-h-96'
                }`}>
                  {filteredMedicines.map((medicine) => (
                    <motion.div
                      key={medicine.id}
                      whileHover={{ scale: isMobile ? 1 : 1.02 }}
                      className={`flex items-center justify-between border rounded-lg hover:bg-gray-50 ${
                        isMobile ? 'p-3' : 'p-4'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
                          {medicine.name}
                        </h4>
                        <div className={`flex flex-wrap items-center gap-2 text-gray-600 ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          {medicine.strength && <span className="truncate">{medicine.strength}</span>}
                          {medicine.manufacturer && !isMobile && (
                            <span className="truncate">{medicine.manufacturer}</span>
                          )}
                          <Badge 
                            variant={medicine.stock <= 10 ? "destructive" : "secondary"}
                            className={isMobile ? 'text-xs px-1 py-0' : ''}
                          >
                            {medicine.stock}
                          </Badge>
                        </div>
                      </div>
                      <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} flex-shrink-0`}>
                        <div className="text-right">
                          <div className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                            ${medicine.price.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          onClick={() => addToCart(medicine)}
                          disabled={medicine.stock <= 0}
                          size="sm"
                          className={`bg-green-600 hover:bg-green-700 ${
                            isMobile ? 'h-8 w-8 p-0' : ''
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {filteredMedicines.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? "No medicines found matching your search" : "No medicines available"}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <div className={`space-y-4 ${isMobile ? 'order-1' : ''}`}>
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Customer Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name (Optional)</Label>
                <Input
                  id="customerName"
                  placeholder="Customer name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="customerPhone"
                    placeholder="+1 234 567 8900"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shopping Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5" />
                <span>Shopping Cart</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add medicines to get started</p>
                </div>
              ) : (
                <div className={`space-y-2 overflow-y-auto ${
                  isMobile ? 'max-h-48' : 'max-h-64'
                }`}>
                  {cart.map((item) => (
                    <div key={item.medicineId} className={`flex items-center justify-between bg-gray-50 rounded ${
                      isMobile ? 'p-2' : 'p-3'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <h5 className={`font-medium truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {item.name}
                        </h5>
                        <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                          className={isMobile ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}
                        >
                          <Minus className={isMobile ? 'h-2 w-2' : 'h-3 w-3'} />
                        </Button>
                        <span className={`font-medium text-center ${
                          isMobile ? 'text-xs w-6' : 'text-sm w-8'
                        }`}>
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className={isMobile ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}
                        >
                          <Plus className={isMobile ? 'h-2 w-2' : 'h-3 w-3'} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.medicineId)}
                          className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${
                            isMobile ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'
                          }`}
                        >
                          <Trash2 className={isMobile ? 'h-2 w-2' : 'h-3 w-3'} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                      <span>${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
                      <span>Total</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment & Checkout */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={processSale}
                  disabled={processingPayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Sale - ${calculateTotal().toFixed(2)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}