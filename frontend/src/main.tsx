import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import { AuthProvider } from "./state/AuthContext";
import { AppLayout } from "./ui/AppLayout";
import { CartPage } from "./pages/CartPage";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { PendingApprovalPage } from "./pages/PendingApprovalPage";
import { OrdersPage } from "./pages/OrdersPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { ShipmentsPage } from "./pages/ShipmentsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { UserListPage } from "./pages/UserListPage";
import { SuppliersPage } from "./pages/SuppliersPage";
import { WarehousesPage } from "./pages/WarehousesPage";
import { WarehouseDetailPage } from "./pages/WarehouseDetailPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProtectedRoute } from "./ui/ProtectedRoute";
import { RoleGuard } from "./ui/RoleGuard";
import { ToastProvider } from "./ui/Toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/app">
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <OrdersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ChatPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CartPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipments"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ShipmentsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-orders"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RoleGuard minRole="operator" fallback={<Navigate to="/products" replace />}>
                      <AdminOrdersPage />
                    </RoleGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProductsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SuppliersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/warehouses"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WarehousesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/warehouses/:warehouseId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WarehouseDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RoleGuard minRole="operator" fallback={<Navigate to="/products" replace />}>
                      <PendingApprovalPage />
                    </RoleGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-list"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RoleGuard minRole="admin" fallback={<Navigate to="/products" replace />}>
                      <UserListPage />
                    </RoleGuard>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
