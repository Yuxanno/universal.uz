export type UserRole = 'admin' | 'cashier' | 'helper';

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: UserRole;
  image?: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  code: string;
  name: string;
  costPrice?: number;
  price: number;
  wholesalePrice?: number;
  quantity: number;
  warehouse: string;
  _warehouseName?: string;
  category?: string;
  image?: string;
  images?: string[];
  minStock?: number;
}

export interface CartItem extends Product {
  cartQuantity: number;
  originalPrice?: number; // Store original price for price toggle
}

export interface Receipt {
  _id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card';
  cashier: User;
  customer?: Customer;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'draft';
  createdBy: User;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  purchaseCount?: number;
  debt: number;
  purchaseHistory?: PurchaseHistory[];
}

export interface PurchaseHistory {
  date: string;
  amount: number;
  receiptId?: string;
}

export interface Debt {
  _id: string;
  customer: Customer;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid' | 'blacklist';
  payments: Payment[];
  createdAt: string;
}

export interface Payment {
  amount: number;
  date: string;
  method: 'cash' | 'card';
}

export interface Warehouse {
  _id: string;
  name: string;
  address: string;
  isMain?: boolean;
  products: Product[];
  productCount?: number;
}

export interface Order {
  _id: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
}

export interface Stats {
  totalRevenue: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  totalReceipts: number;
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
}
