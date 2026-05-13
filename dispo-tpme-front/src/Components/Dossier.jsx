// pages/Dossier.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DOCUMENTS_REQUIS } from '../data/index.js';
import { SectionHeader, Breadcrumb, Alert } from '../Components/Index.jsx';
import styles from '../Styles/Dossier.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFile, faThumbTack, faMoneyBill, faCalendarDays, faLocationDot, faHelmetSafety, faIndustry, faLandmark } from '@fortawesome/free-solid-svg-icons';

function Dossier() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(new Set());
  const [files] = useState([]);

  const toggleDoc = (id) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const progress = Math.round((checked.size / DOCUMENTS_REQUIS.length) * 100);

  return (
    <div>
      <Breadcrumb items={[{ to: '/', label: t('nav_home') }, { label: t('dossier_breadcrumb') }]} />

      <div className={styles.page}>
        <div className={styles.inner}>
          <SectionHeader
            tag={t('dossier_tag')}
            title={t('dossier_title')}
            subtitle={t('dossier_subtitle')}
          />

          {/* Progress bar */}
          <div className={styles.progressWrap}>
            <div className={styles.progressTop}>
              <span className={styles.progressLabel}>
                {t('dossier_progress', { done: checked.size, total: DOCUMENTS_REQUIS.length })}
              </span>
              <span className={styles.progressPct}>{progress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%`, background: progress === 100 ? 'var(--green-600)' : 'var(--navy-700)' }}
              />
            </div>
          </div>

          <Alert type="info" title={t('dossier_alert_title')}>
            {t('dossier_alert_text')}{' '}
            <a href="https://www.cri-invest.ma" target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
              www.cri-invest.ma
            </a>
          </Alert>

          {/* Document checklist */}
          <div className={styles.docGrid}>
            {DOCUMENTS_REQUIS.map((doc) => {
              const done = checked.has(doc.id);
              return (
                <button
                  key={doc.id}
                  className={`${styles.docCard} ${done ? styles.docCardDone : ''}`}
                  onClick={() => toggleDoc(doc.id)}
                >
                  <div className={`${styles.docIcon} ${done ? styles.docIconDone : ''}`}>
                    {done ? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faFile} />}
                  </div>
                  <div className={styles.docInfo}>
                    <h4>{t(`doc_${doc.id}_label`)}</h4>
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={styles.link}
                      >
                        {t(`doc_${doc.id}_desc`)}
                      </a>
                    ) : (
                      <p>{t(`doc_${doc.id}_desc`)}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Declaration note */}
          <div className={styles.declarationBox}>
            <h3>{t('dossier_decl_title')}</h3>
            <div className={styles.declarationGrid}>
              {[
                { icon: faThumbTack,     text: t('dossier_decl_nature') },
                { icon: faMoneyBill,     text: t('dossier_decl_montant') },
                { icon: faCalendarDays,  text: t('dossier_decl_planning') },
                { icon: faLocationDot,   text: t('dossier_decl_lieu') },
                { icon: faHelmetSafety,  text: t('dossier_decl_emplois') },
                { icon: faIndustry,      text: t('dossier_decl_branche') },
                { icon: faLandmark,      text: t('dossier_decl_fin') },
              ].map(({ icon, text }) => (
                <div key={text} className={styles.declarationItem}>
                  <FontAwesomeIcon icon={icon} /><span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {files.length > 0 && (
            <div className={styles.fileList}>
              <h4>Fichiers sélectionnés ({files.length})</h4>
              {files.map((f, i) => (
                <div key={i} className={styles.fileRow}>
                  <span><FontAwesomeIcon icon={faFile} /> {f.name}</span>
                  <span className={styles.fileSize}>{(f.size / 1024).toFixed(0)} Ko</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dossier;
