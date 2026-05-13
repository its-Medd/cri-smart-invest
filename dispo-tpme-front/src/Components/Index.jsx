// components/ui/index.jsx  — Shared UI components

import styles from '../Styles/Ui.module.css';
import { Link } from 'react-router-dom';

/* ─── Button ──────────────────────────────────────────────── */
export function Button({
  children, variant = 'primary', size = 'md',
  fullWidth = false, onClick, type = 'button',
  disabled = false, as: Tag, to, href, ...rest
}) {
  const cls = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    fullWidth ? styles.btnFull : '',
    disabled  ? styles.btnDisabled : '',
  ].join(' ');

  if (to)   return <Link to={to} className={cls} {...rest}>{children}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>;
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

/* ─── Badge / StatusBadge ─────────────────────────────────── */
export function Badge({ children, color = 'navy', size = 'sm' }) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${color}`]} ${styles[`badge_${size}`]}`}>
      {children}
    </span>
  );
}

const STATUS_MAP = {
  BROUILLON:          { label: 'Brouillon',          color: 'amber'  },
  SOUMISE:            { label: 'Soumise',             color: 'blue'   },
  EN_ETUDE:           { label: 'En étude CRUI',       color: 'teal'   },
  APPROUVEE:          { label: 'Approuvée',           color: 'green'  },
  REJETEE:            { label: 'Rejetée',             color: 'red'    },
  CONVENTION_SIGNEE:  { label: 'Convention signée',   color: 'purple' },
  EN_REALISATION:     { label: 'En réalisation',      color: 'amber'  },
  PRIME_VERSEE:       { label: 'Prime versée',        color: 'green'  },
};
export function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] ?? { label: status, color: 'navy' };
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}

/* ─── Section header ──────────────────────────────────────── */
export function SectionHeader({ tag, title, subtitle }) {
  return (
    <div className={styles.sectionHeader}>
      {tag && <span className={styles.sectionTag}>{tag}</span>}
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionDivider} />
      {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
    </div>
  );
}

/* ─── Breadcrumb ──────────────────────────────────────────── */
export function Breadcrumb({ items }) {
  return (
    <div className={styles.breadcrumbWrap}>
      <div className={styles.breadcrumb}>
        {items.map((item, i) => (
          <span key={i} className={styles.bcItem}>
            {i > 0 && <span className={styles.bcSep}>›</span>}
            {item.to
              ? <Link to={item.to} className={styles.bcLink}>{item.label}</Link>
              : <span className={styles.bcCurrent}>{item.label}</span>
            }
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Card ────────────────────────────────────────────────── */
export function Card({ children, className = '', hover = false, accent = null }) {
  return (
    <div
      className={[
        styles.card,
        hover   ? styles.cardHover   : '',
        accent  ? styles[`cardAccent_${accent}`] : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

/* ─── Form controls ───────────────────────────────────────── */
export function FormGroup({ label, error, children, required }) {
  return (
    <div className={styles.formGroup}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      {children}
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}

export function Input({ ...props }) {
  return <input className={styles.input} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={styles.select} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ ...props }) {
  return <textarea className={styles.textarea} {...props} />;
}

/* ─── Toggle ──────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label }) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleLabel}>{label}</span>
      <label className={styles.toggle}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className={styles.toggleSlider} />
      </label>
    </div>
  );
}

/* ─── Alert ───────────────────────────────────────────────── */
export function Alert({ type = 'info', title, children }) {
  return (
    <div className={`${styles.alert} ${styles[`alert_${type}`]}`}>
      {title && <strong className={styles.alertTitle}>{title}</strong>}
      <div className={styles.alertBody}>{children}</div>
    </div>
  );
}