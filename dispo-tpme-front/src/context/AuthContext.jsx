// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

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
  const [user,  setUser]  = useState(() => {
    const storedToken = localStorage.getItem("token");
    const userData = getStoredUser();
    return storedToken ? userFromToken(storedToken, userData) : null;
  });

  useEffect(() => {
    if (token) {
      const userData = getStoredUser();
      const nextUser = userFromToken(token, userData);
      if (nextUser) {
        setUser(nextUser);
      } else {
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    if (userData) localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userFromToken(newToken, userData));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
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
