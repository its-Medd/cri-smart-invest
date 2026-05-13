import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuth2RedirectHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [message, setMessage] = useState("Connexion Google en cours...");

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      setMessage(error);
      const timeout = window.setTimeout(() => navigate("/visitorlogin", { replace: true }), 2500);
      return () => window.clearTimeout(timeout);
    }

    if (!token || !refreshToken) {
      setMessage("Connexion Google invalide. Veuillez reessayer.");
      const timeout = window.setTimeout(() => navigate("/visitorlogin", { replace: true }), 2500);
      return () => window.clearTimeout(timeout);
    }
    login(token);
    localStorage.setItem("refreshToken", refreshToken);
    navigate("/", { replace: true });
  }, [login, navigate, searchParams]);

  return <p style={{ padding: "2rem", textAlign: "center" }}>{message}</p>;
}
