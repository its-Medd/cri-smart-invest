import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../Styles/Auth.module.css";
import LogoTPME from "./Logotpme";
import { authService, OAUTH_BASE_URL } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (form.password !== form.confirmPassword) {
    setError("Les mots de passe ne correspondent pas.");
    return;
  }

  setLoading(true);

  try {
    const res = await authService.register({ name: form.name, email: form.email, password: form.password });
    const data = res.data;

    login(data.accessToken, data.user);

    navigate("/questionnaire");
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

   const handleGoogleLogin = () => {
    window.location.href = `${OAUTH_BASE_URL}/oauth2/authorize/google`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>
            <LogoTPME width={42} height={42} />
          </span>
          <span className={styles.brandName}>TPME invest Laayoune</span>
        </div>

        <h1 className={styles.title}>Créer un compte</h1>
        <p className={styles.subtitle}>Rejoignez la plateforme Dispo TPME</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Nom complet
            </label>
            <input
              id="name"
              className={styles.input}
              type="text"
              name="name"
              placeholder="Jean Dupont"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              name="email"
              placeholder="vous@exemple.com"
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
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              className={styles.input}
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.btn}
            type="submit"
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : "S'inscrire"}
          </button>
        </form>

        <p className={styles.footer}>
          Déjà un compte ?{" "}
          <Link className={styles.link} to="/visitorlogin">
            Se connecter
          </Link>
        </p>

          {/* Divider */}
        <div className={styles.divider}>
          <span>ou</span>
        </div>
        
                {/* Google Sign In */}
        <button className={styles.googleBtn} type="button"onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-2.9-11.9-7.2l-6.6 4.9C9.5 40 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6.1l6.2 5.2C40.5 36.2 44 30.5 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continuer avec Google
        </button>
              </div>

      </div>
    
  );
}
