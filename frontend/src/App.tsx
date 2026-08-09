import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { CustomerDetail } from "./pages/CustomerDetail";
import { Products } from "./pages/Products";
import { Challans } from "./pages/Challans";
import { NewChallan } from "./pages/NewChallan";
import { ChallanDetail } from "./pages/ChallanDetail";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />

              <Route path="/customers" element={<ProtectedRoute resource="customers" action="list"><Customers /></ProtectedRoute>} />
              <Route path="/customers/:id" element={<ProtectedRoute resource="customers" action="read"><CustomerDetail /></ProtectedRoute>} />

              <Route path="/products" element={<ProtectedRoute resource="products" action="list"><Products /></ProtectedRoute>} />

              <Route path="/challans" element={<ProtectedRoute resource="salesChallans" action="list"><Challans /></ProtectedRoute>} />
              <Route path="/challans/new" element={<ProtectedRoute resource="salesChallans" action="create"><NewChallan /></ProtectedRoute>} />
              <Route path="/challans/:id" element={<ProtectedRoute resource="salesChallans" action="read"><ChallanDetail /></ProtectedRoute>} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
