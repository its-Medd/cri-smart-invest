// src/Components/AdminLogin.jsx
// Connexion réservée aux employés CRI (username + mot de passe)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Styles/Auth.module.css";
import LogoTPME from "./Logotpme";
import { authService } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await authService.adminLogin(form.email, form.password);
      const data = res.data;
      login(data.accessToken, data.user);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message;
      setError(
  msg === "Access denied: not an admin"
    ? "Accès refusé : compte non autorisé."
    : "Identifiants invalides. Vérifiez votre email et mot de passe."
);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.brandIcon}>
            <LogoTPME width={42} height={42} />
          </span>
          <span className={styles.brandName}>TPME invest Laayoune — CRI</span>
        </div>

        <h1 className={styles.title}>Espace Employé</h1>
        <p className={styles.subtitle}>Accès réservé aux agents CRI</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              admin email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              name="email"
              placeholder="ex : admin@tpme.ma"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.btn}
            type="submit"
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
