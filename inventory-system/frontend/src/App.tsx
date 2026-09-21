import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute, AdminRoute } from "@/routes/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { PartsList } from "@/pages/PartsList";
import { History } from "@/pages/History";
import { Users } from "@/pages/Users";
import { ProductsList } from "@/pages/ProductsList";
import { ProductReports } from "@/pages/ProductReports";
import { ChangePassword } from "@/pages/ChangePassword";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pecas" element={<PartsList />} />
                <Route path="/historico" element={<History />} />
                <Route path="/produtos" element={<ProductsList />} />
                <Route path="/produtos/relatorios" element={<ProductReports />} />
                <Route path="/trocar-senha" element={<ChangePassword />} />

                <Route element={<AdminRoute />}>
                  <Route path="/usuarios" element={<Users />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
