// src/Components/AdminRoute.jsx
// Protège les routes réservées aux admins CRI.
// - Non authentifié  → /admin/login
// - Authentifié mais pas ADMIN → /admin/login
// - ADMIN            → affiche la page

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isAdmin)         return <Navigate to="/admin/login" replace />;

  return children;
}
