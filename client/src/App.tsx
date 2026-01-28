import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProductsProvider } from './context/ProductsContext';
import { CustomersProvider } from './context/CustomersContext';
import { WarehousesProvider } from './context/WarehousesContext';
import { startMemoryMonitoring, stopMemoryMonitoring, monitorMemory } from './utils/memoryOptimizer';
import { initSocket } from './utils/socket';
import Login from './pages/Login';

// ОПТИМИЗАЦИЯ: Ленивая загрузка компонентов для быстрых переходов
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Kassa = lazy(() => import('./pages/admin/Kassa'));
const Products = lazy(() => import('./pages/admin/Products'));
const Warehouses = lazy(() => import('./pages/admin/Warehouses'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Debts = lazy(() => import('./pages/admin/Debts'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Helpers = lazy(() => import('./pages/admin/Helpers'));
const StaffReceipts = lazy(() => import('./pages/admin/StaffReceipts'));
const StaffReceiptsArchive = lazy(() => import('./pages/admin/StaffReceiptsArchive'));
const CashierLayout = lazy(() => import('./layouts/CashierLayout'));
const CashierProducts = lazy(() => import('./pages/admin/Products'));
const CashierCustomers = lazy(() => import('./pages/cashier/Customers'));
const HelperLayout = lazy(() => import('./layouts/HelperLayout'));
const HelperScanner = lazy(() => import('./pages/helper/Scanner'));

// Компонент загрузки
const PageLoader = () => (
  <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
        <div className="spinner text-primary-600 dark:text-primary-400" />
      </div>
      <p className="text-neutral-500 dark:text-neutral-400 text-sm">Yuklanmoqda...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
 const { user, loading } = useAuth();
 
 if (loading) {
 return (
 <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
 <div className="text-center">
 <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
 <div className="spinner text-primary-600 dark:text-primary-400" />
 </div>
 <p className="text-neutral-500 dark:text-neutral-400 text-sm">Yuklanmoqda...</p>
 </div>
 </div>
 );
 }
 
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
 // Initialize socket connection globally
 useEffect(() => {
 console.log('🔌 [App] Initializing global socket connection...');
 initSocket();
 
 return () => {
 console.log('🔌 [App] App unmounting, keeping socket alive');
 };
 }, []);
 
 // Monitor memory usage
 useEffect(() => {
 if (import.meta.env.DEV) {
 console.log('🚀 App started');
 }
 monitorMemory();
 startMemoryMonitoring();
 
 return () => {
 stopMemoryMonitoring();
  };
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <ProductsProvider>
          <CustomersProvider>
            <WarehousesProvider>
              <BrowserRouter
 future={{
 v7_startTransition: true,
 v7_relativeSplatPath: true
 }}
 >
 <Suspense fallback={<PageLoader />}>
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
 <Route path="staff-receipts/archive" element={<StaffReceiptsArchive />} />
 </Route>

 {/* Cashier Routes */}
 <Route path="/cashier" element={<ProtectedRoute roles={['cashier']}><CashierLayout /></ProtectedRoute>}>
 <Route index element={<Kassa />} />
 <Route path="products" element={<CashierProducts />} />
 <Route path="customers" element={<CashierCustomers />} />
 <Route path="debts" element={<Debts />} />
 <Route path="staff-receipts" element={<StaffReceipts />} />
 <Route path="staff-receipts/archive" element={<StaffReceiptsArchive />} />
 </Route>

 {/* Helper Routes */}
 <Route path="/helper" element={<ProtectedRoute roles={['helper']}><HelperLayout /></ProtectedRoute>}>
 <Route index element={<HelperScanner />} />
 </Route>
 </Routes>
 </Suspense>
 </BrowserRouter>
 </WarehousesProvider>
 </CustomersProvider>
 </ProductsProvider>
 </AuthProvider>
      </LanguageProvider>
  );
}

export default App;
