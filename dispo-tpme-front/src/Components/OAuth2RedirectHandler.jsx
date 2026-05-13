import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuth2RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [message, setMessage] = useState("Connexion Google en cours...");

  useEffect(() => {
    const paramsSource = location.hash.startsWith("#")
      ? location.hash.slice(1)
      : location.search;
    const params = new URLSearchParams(paramsSource);
    const token = params.get("token");
    const error = params.get("error");

    if (location.hash || location.search) {
      window.history.replaceState(null, "", location.pathname);
    }

    if (error) {
      setMessage(error);
      const timeout = window.setTimeout(() => navigate("/visitorlogin", { replace: true }), 2500);
      return () => window.clearTimeout(timeout);
    }

    if (!token) {
      setMessage("Connexion Google invalide. Veuillez reessayer.");
      const timeout = window.setTimeout(() => navigate("/visitorlogin", { replace: true }), 2500);
      return () => window.clearTimeout(timeout);
    }
    login(token);
    navigate("/", { replace: true });
  }, [location.hash, location.pathname, location.search, login, navigate]);

  return <p style={{ padding: "2rem", textAlign: "center" }}>{message}</p>;
}
