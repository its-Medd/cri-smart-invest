import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRef, useEffect, useState } from 'react';
import { Button, SectionHeader } from './Index.jsx';
import styles from '../Styles/Accueil.module.css';
import CalculateurPrimes from './CalculateurPrimes.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheck, faClipboardList, faSackDollar, faBullhorn } from '@fortawesome/free-solid-svg-icons';

function Acceuil() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const PRIMES = [
    {
      color: 'navy',
      title: t('prime_emploi_title'),
      rows: [
        { label: t('prime_emploi_row1'),  pct: '5%' },
        { label: t('prime_emploi_row2'), pct: '7%' },
        { label: t('prime_emploi_row3'),         pct: '10%', highlight: true },
      ],
    },
    {
      color: 'blue',
      title: t('prime_territoriale_title'),
      rows: [
        { label: t('prime_territoriale_row1'), pct: '10%' },
        { label: t('prime_territoriale_row2'), pct: '15%', highlight: true },
      ],
    },
    {
      color: 'red',
      icon: '',
      title: t('prime_prioritaire_title'),
      rows: [
        { label: t('prime_prioritaire_row1'), pct: '10%', highlight: true },
      ],
      note: t('prime_prioritaire_note'),
    },
  ];

  const STEPS = [
    { icon: faLock,          title: t('process_step1_title'), desc: t('process_step1_desc') },
    { icon: faClipboardList, title: t('process_step2_title'), desc: t('process_step2_desc') },
    { icon: faCheck,         title: t('process_step3_title'), desc: t('process_step3_desc') },
    { icon: faSackDollar,    title: t('process_step4_title'), desc: t('process_step4_desc') },
  ];

  return (
    <div className={styles.page}>

      {/* ── Hero avec vidéo de fond ── */}
      <section className={styles.hero}>
        <video
          className={styles.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          controls
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>

        <div className={styles.heroOverlay}></div>

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              {t('hero_badge')}
            </div>
            <h1 className={styles.heroTitle}>
              {t('hero_title_part1')}{' '}
              <em className={styles.heroEm}>{t('hero_title_em')}</em>
            </h1>
            <p className={styles.heroSubtitle}>
              {t('hero_subtitle')}
            </p>
            <div className={styles.heroCta}>
              <Button variant="danger" size="lg" onClick={() => navigate('/eligibilite')}>
                {t('btn_elig')}
              </Button>
              <Button variant="white" size="lg" onClick={() => navigate('/simulateur')}>
                {t('btn_simuler')}
              </Button>
            </div>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <strong>{t('stat_1_value')}</strong>
              <span>{t('stat_1_label')}</span>
            </div>
            <div className={styles.heroStat}>
              <strong>{t('stat_2_value')}</strong>
              <span>{t('stat_2_label')}</span>
            </div>
            <div className={styles.heroStat}>
              <strong>{t('stat_3_value')}</strong>
              <span>{t('stat_3_label')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Info strip ── */}
      <div className={styles.infoStrip}>
        <div className={styles.infoStripInner}>
          <FontAwesomeIcon icon={faBullhorn} />
          <span>
            <strong>{t('infostrip_new')}</strong> {t('infostrip_text')}{' '}
            <a href="/docs/Arrêté dispositif TPME vf.pdf" target="_blank" rel="noopener noreferrer">{t('infostrip_link')}</a>
          </span>
        </div>
      </div>

      {/* ── 3 Primes ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <SectionHeader
            tag={t('primes_tag')}
            title={t('primes_title')}
          />
          <div className={styles.primesGrid}>
            {PRIMES.map((p) => (
              <div key={p.title} className={`${styles.primeCard} ${styles[`primeCard_${p.color}`]}`}>
                <div className={styles.primeCardHeader}>
                  <span className={styles.primeCardIcon}></span>
                  <h3>{p.title}</h3>
                </div>
                <div className={styles.primeCardBody}>
                  {p.rows.map((r) => (
                    <div
                      key={r.label}
                      className={`${styles.primeRow} ${r.highlight ? styles.primeRowHighlight : ''}`}
                    >
                      <span>{r.label}</span>
                      <strong>{r.pct}</strong>
                    </div>
                  ))}
                  {p.note && <p className={styles.primeNote}>{p.note}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.plafondBanner}>
            <div>
              <div className={styles.plafondLabel}>{t('plafond_label')}</div>
              <div className={styles.plafondVal}>
                {t('plafond_val')} <span>{t('plafond_sub')}</span>
              </div>
            </div>
            <Button variant="gold" size="lg" onClick={() => navigate('/eligibilite')}>
              {t('plafond_btn')}
            </Button>
          </div>
        </div>
      </section>

      <CalculateurPrimes />

      {/* ── Processus / CTA Questionnaire ── */}
      <section className={styles.processSection} ref={sectionRef}>
        <div className={styles.sectionInner}>

          <div className={`${styles.processHeader} ${visible ? styles.processHeaderVisible : ''}`}>
            <span className={styles.processTag}>{t('process_tag')}</span>
            <h2 className={styles.processTitle}>{t('process_title')}</h2>
            <p className={styles.processSubtitle}>{t('process_subtitle')}</p>
          </div>

          <div className={styles.stepsRow}>
            {STEPS.map((step, i) => (
              <div key={i} className={styles.stepWrap}>
                <div
                  className={`${styles.stepCard} ${visible ? styles.stepCardVisible : ''}`}
                  style={{ '--stagger': `${i * 0.15}s` }}
                >
                  <div className={styles.stepBubble}>{i + 1}</div>
                  <div
                    className={styles.stepIcon}
                    style={{ animationDelay: `${i * 0.4}s` }}
                  >
                    <FontAwesomeIcon icon={step.icon} style={{ fontSize: '2rem', color: 'var(--gold-400)' }} />
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={styles.stepArrow}>›</div>
                )}
              </div>
            ))}
          </div>

          <div className={`${styles.processCta} ${visible ? styles.processCtaVisible : ''}`}>
            {isAuthenticated ? (
              <div className={styles.ctaGlowWrap}>
                <Button variant="gold" size="lg" onClick={() => navigate('/questionnaire')}>
                  {t('process_btn_questionnaire')}
                </Button>
              </div>
            ) : (
              <div className={styles.ctaBtnGroup}>
                <div className={styles.ctaGlowWrap}>
                  <Button variant="gold" size="lg" onClick={() => navigate('/register')}>
                    {t('process_btn_register')}
                  </Button>
                </div>
                <div className={styles.ctaLoginHint}>
                  <span>{t('process_already_member')}</span>
                  <button className={styles.ctaLoginLink} onClick={() => navigate('/login')}>
                    {t('process_btn_login')} →
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

    </div>
  );
}

export default Acceuil;
