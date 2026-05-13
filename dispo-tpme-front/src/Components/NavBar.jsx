// components/layout/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../Styles/navbar.module.css';
import LogoTPME from './Logotpme';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faXmark } from '@fortawesome/free-solid-svg-icons';

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function NotificationDropdown({ notifications, onClose }) {
  return (
    <div className={styles.notifDropdown}>
      <div className={styles.notifHeader}>
        <span>Notifications</span>
        <button className={styles.notifClose} onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
      </div>
      {notifications.length === 0 ? (
        <p className={styles.notifEmpty}>Aucune notification</p>
      ) : (
        <ul className={styles.notifList}>
          {notifications.map((n) => (
            <li key={n.id} className={styles.notifItem}>
              <span className={`${styles.notifDot} ${n.statut === 'VALIDE' ? styles.notifDotGreen : styles.notifDotRed}`} />
              <div className={styles.notifBody}>
                <p className={styles.notifTitle}>
                  {n.statut === 'VALIDE'
                    ? <><FontAwesomeIcon icon={faCircleCheck} /> Dossier validé</>
                    : <><FontAwesomeIcon icon={faCircleXmark} /> Dossier rejeté</>}
                </p>
                <p className={styles.notifSub}>
                  {n.titreProjet || n.raisonSociale || 'Sans titre'}
                </p>
                <p className={styles.notifDate}>
                  {new Date(n.createdAt).toLocaleDateString('fr-MA', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const isAr = i18n.language === 'ar';

  function avatarInitials() {
    const name = user?.name || user?.sub || '';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  }

  // Fetch dossiers with VALIDE or REJETE status when visitor is logged in
  useEffect(() => {
    if (!isAuthenticated || isAdmin) {
      setNotifications([]);
      return;
    }
    api.get('/user/dossiers')
      .then((res) => {
        const relevant = res.data.filter(
          (d) => d.statut === 'VALIDE' || d.statut === 'REJETE'
        );
        setNotifications(relevant);
      })
      .catch(() => {});
  }, [isAuthenticated, isAdmin]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NAV_ITEMS = [
    { to: '/',            label: t('nav_home') },
    { to: '/questionnaire',  label: t('nav_questionnaire') },
    { to: '/eligibilite', label: t('nav_eligibilite') },
    { to: '/simulateur',  label: t('nav_simulateur') },
    { to: '/dossier',        label: t('nav_dossier') },
    { to: 'https://laayouneinvest.ma/', label: t('nav_cri') },
  ];

  const switchLang = (lang) => {
    i18n.changeLanguage(lang);
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isAr, i18n.language]);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>
          {/* Brand */}
          <button className={styles.brand} onClick={() => navigate('/')}>
            <div className={styles.brandIcon}>
              <LogoTPME width={42} height={42} />
            </div>
            <div className={styles.brandText}>
              <strong>TPME invest Laayoune</strong>
              <span>{t('nav_subtitle')}</span>
            </div>
          </button>

          {/* Desktop links */}
          <div className={styles.links}>
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.linkActive : ''}`
                }
              >
                {label}
              </NavLink>
            ))}

            {/* Notification bell — visitor only */}
            {isAuthenticated && !isAdmin && (
              <div className={styles.notifWrap} ref={notifRef}>
                <button
                  className={styles.notifBtn}
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {notifications.length > 0 && (
                    <span className={styles.notifBadge}>{notifications.length}</span>
                  )}
                </button>
                {notifOpen && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setNotifOpen(false)}
                  />
                )}
              </div>
            )}

            {isAdmin ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `${styles.link} ${styles.linkCta} ${isActive ? styles.linkActive : ''}`
                }
              >
                Espace Admin
              </NavLink>
            ) : isAuthenticated ? (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${styles.link} ${styles.linkCta} ${isActive ? styles.linkActive : ''}`
                }
              >
                <span style={{ marginRight: 6 }}>{avatarInitials()}</span>
                Mon profil
              </NavLink>
            ) : (
              <NavLink
                to="/visitorlogin"
                className={({ isActive }) =>
                  `${styles.link} ${styles.linkCta} ${isActive ? styles.linkActive : ''}`
                }
              >
                {t('nav_espace')}
              </NavLink>
            )}

            {/* Language switcher */}
            <div className={styles.langGroup}>
              <button
                className={`${styles.langBtn} ${!isAr ? styles.langBtnActive : ''}`}
                onClick={() => switchLang('fr')}
              >
                FR
              </button>
              <button
                className={`${styles.langBtn} ${isAr ? styles.langBtnActive : ''}`}
                onClick={() => switchLang('ar')}
              >
                AR
              </button>
            </div>
          </div>

          {/* Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <span className={open ? styles.barOpen : ''} />
            <span className={open ? styles.barOpen : ''} />
            <span className={open ? styles.barOpen : ''} />
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className={styles.drawer}>
            {[
              ...NAV_ITEMS,
              isAdmin
                ? { to: '/dashboard', label: 'Espace Admin' }
                : isAuthenticated
                  ? { to: '/profile', label: 'Mon profil' }
                  : { to: '/visitorlogin', label: t('nav_espace') },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`
                }
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}

            {/* Mobile notifications summary */}
            {isAuthenticated && !isAdmin && notifications.length > 0 && (
              <div className={styles.drawerNotif}>
                <span className={styles.notifBadgeInline}>{notifications.length}</span>
                {notifications.length === 1 ? ' notification' : ' notifications'} — voir profil
              </div>
            )}

            <div className={styles.drawerLangGroup}>
              <button
                className={`${styles.langBtn} ${!isAr ? styles.langBtnActive : ''}`}
                onClick={() => { switchLang('fr'); setOpen(false); }}
              >
                FR
              </button>
              <button
                className={`${styles.langBtn} ${isAr ? styles.langBtnActive : ''}`}
                onClick={() => { switchLang('ar'); setOpen(false); }}
              >
                AR
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;
