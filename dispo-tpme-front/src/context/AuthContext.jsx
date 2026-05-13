// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT, authService } from "../api";

const AuthContext = createContext(null);

function parseToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function rolesFromUserData(userData) {
  if (!userData?.role) return [];
  return [`ROLE_${userData.role}`];
}

function userFromToken(token, userData = null) {
  const payload = parseToken(token);
  if (!payload) return null;

  const tokenRoles = (payload.roles || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
  const roles = tokenRoles.length > 0 ? tokenRoles : rolesFromUserData(userData);

  return { ...payload, ...userData, roles };
}

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");
    const userData = getStoredUser();
    return storedToken ? userFromToken(storedToken, userData) : null;
  });

  const syncFromStorage = () => {
    const storedToken = localStorage.getItem("token");
    const userData = getStoredUser();
    setToken(storedToken);
    setUser(storedToken ? userFromToken(storedToken, userData) : null);
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tpme_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  };

  useEffect(() => {
    if (token) {
      const userData = getStoredUser();
      const nextUser = userFromToken(token, userData);
      if (nextUser) {
        setUser(nextUser);
      } else {
        clearSession();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    window.addEventListener(AUTH_CHANGED_EVENT, syncFromStorage);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, syncFromStorage);
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    localStorage.removeItem("tpme_token");
    setToken(newToken);
    setUser(userFromToken(newToken, userData));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  };

  const logout = async () => {
    try {
      if (localStorage.getItem("token")) {
        await authService.logout();
      }
    } catch {
      // Local cleanup still matters even if the server-side logout fails.
    } finally {
      clearSession();
    }
  };

  const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
