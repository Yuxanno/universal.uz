import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Kassa from './pages/admin/Kassa';
import Products from './pages/admin/Products';
import Warehouses from './pages/admin/Warehouses';
import Customers from './pages/admin/Customers';
import Debts from './pages/admin/Debts';
import Orders from './pages/admin/Orders';
import Helpers from './pages/admin/Helpers';
import StaffReceipts from './pages/admin/StaffReceipts';
import CashierLayout from './layouts/CashierLayout';
import HelperLayout from './layouts/HelperLayout';
import HelperScanner from './pages/helper/Scanner';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
  </div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'cashier') return <Navigate to="/cashier" />;
  return <Navigate to="/helper" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="kassa" element={<Kassa />} />
            <Route path="products" element={<Products />} />
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="customers" element={<Customers />} />
            <Route path="debts" element={<Debts />} />
            <Route path="orders" element={<Orders />} />
            <Route path="helpers" element={<Helpers />} />
            <Route path="staff-receipts" element={<StaffReceipts />} />
          </Route>

          {/* Cashier Routes */}
          <Route path="/cashier" element={<ProtectedRoute roles={['cashier']}><CashierLayout /></ProtectedRoute>}>
            <Route index element={<Kassa />} />
            <Route path="debts" element={<Debts />} />
            <Route path="staff-receipts" element={<StaffReceipts />} />
          </Route>

          {/* Helper Routes */}
          <Route path="/helper" element={<ProtectedRoute roles={['helper']}><HelperLayout /></ProtectedRoute>}>
            <Route index element={<HelperScanner />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
