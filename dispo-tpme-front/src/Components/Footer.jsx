// components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../Styles/footer.module.css';
import LogoTPME from './Logotpme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faPhone, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons';

function Footer() {
  const { t } = useTranslation();

  const QUICK_LINKS = [
    { to: '/eligibilite', label: t('footer_link_elig') },
    { to: '/simulateur',  label: t('footer_link_sim') },
    { to: '/dossier',     label: t('footer_link_dossier') },
    { to: 'https://laayouneinvest.ma/', label: t('footer_link_cri') },
  ];

  const LEGAL_LINKS = [
    { label: 'Loi cadre 03.22',       href: '#' },
    { label: 'Décret 2.25.342',       href: '#' },
    { label: "Textes d'application",  href: '#' },
    { label: "Guide d'orientation",   href: '#' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <LogoTPME width={42} height={42} />
            <div>
              <strong>TPME invest Laayoune Maroc</strong>
              <span>{t('nav_subtitle')}</span>
            </div>
          </div>
          <p>{t('footer_desc')}</p>
          <div className={styles.badges}>
            <span className={styles.badge}>MICEPP</span>
            <span className={styles.badge}>CRI-INVEST</span>
            <span className={styles.badge}>Loi 03.22</span>
          </div>
        </div>

        {/* Services */}
        <div className={styles.col}>
          <h4>{t('footer_services')}</h4>
          <ul>
            {QUICK_LINKS.map(({ to, label }) => (
              <li key={to}><Link to={to}>{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className={styles.col}>
          <h4>{t('footer_legal')}</h4>
          <ul>
            {LEGAL_LINKS.map(({ label, href }) => (
              <li key={label}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className={styles.col}>
          <h4>{t('footer_contact')}</h4>
          <div className={styles.contactList}>
            <div className={styles.contactRow}>
  <FontAwesomeIcon icon={faLocationDot} />

  <a
    href="https://maps.app.goo.gl/53bwZV65Zz5aTvGY7"
    target="_blank"
    rel="noopener noreferrer"
    className={styles.mapLink}
  >
    {t("footer_address")}
  </a>
</div>
            <div className={styles.contactRow}>
              <FontAwesomeIcon icon={faPhone} />
              <a href="tel:+212 528 891 189">+212 528 891 189 /+212 528 991 201</a>
            </div>
            <div className={styles.contactRow}>
              <FontAwesomeIcon icon={faEnvelope} />
              <a href="contact@laayouneinvest.ma">contact@laayouneinvest.ma</a>
            </div>
            <div className={styles.contactRow}>
              <FontAwesomeIcon icon={faGlobe} />
              <a href="https://www.micepp.gov.ma" target="_blank" rel="noreferrer">www.micepp.gov.ma</a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>{t('footer_copy', { year: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}

export default Footer;
