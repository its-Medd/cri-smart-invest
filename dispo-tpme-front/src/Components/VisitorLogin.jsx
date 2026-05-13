import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "../Styles/Auth.module.css";
import LogoTPME from "./Logotpme";
import { authService, OAUTH_BASE_URL } from "../api";
import { useAuth } from "../context/AuthContext";

function VisitorLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
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
      const res = await authService.login(form.email, form.password);
      const data = res.data;
      login(data.accessToken, data.user);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.removeItem("tpme_token");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
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

        <h1 className={styles.title}>{t('login_title')}</h1>
        <p className={styles.subtitle}>{t('login_subtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              {t('login_email')}
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
              {t('login_password')}
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

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? <span className={styles.spinner} /> : t('login_btn')}
          </button>
        </form>

        <p className={styles.footer}>
          {t('login_no_account')}{" "}
          <Link className={styles.link} to="/register">
            {t('login_register')}
          </Link>
        </p>

        <div className={styles.divider}>
          <span>{t('login_or')}</span>
        </div>

        <button className={styles.googleBtn} type="button" onClick={handleGoogleLogin}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-2.9-11.9-7.2l-6.6 4.9C9.5 40 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6.1l6.2 5.2C40.5 36.2 44 30.5 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          {t('login_google')}
        </button>
      </div>
    </div>
  );
}

export default VisitorLogin;
