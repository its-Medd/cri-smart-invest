// pages/Eligibilite.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  SectionHeader, Breadcrumb, Button,
  FormGroup, Input, Select, Alert,
} from '../Components/Index.jsx';
import styles from '../Styles/Eligibilite.module.css';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const SECTEURS = [
  'Industrie manufacturière', 'Agriculture, sylviculture et pêche',
  'Hébergement et restauration', 'Tourisme', 'Information et communication',
  'Artisanat', 'Énergies renouvelables', 'Autre',
];

const SECTEURS_AR = {
  'Industrie manufacturière': 'الصناعات التحويلية',
  'Agriculture, sylviculture et pêche': 'الفلاحة واستغلال الغابات وصيد الأسماك',
  'Hébergement et restauration': 'الإيواء والمطاعم',
  'Tourisme': 'السياحة',
  'Information et communication': 'الإعلام والاتصال',
  'Artisanat': 'الصناعة التقليدية',
  'Énergies renouvelables': 'الطاقات المتجددة',
  'Autre': 'أخرى',
};

const FORMES_JURIDIQUES = [
  { value: 'SA',                label: 'SA' },
  { value: 'SARL',              label: 'SARL' },
  { value: 'SNC',               label: 'SNC' },
  { value: 'Auto-entrepreneur', label: { fr: 'Auto-entrepreneur', ar: 'مقاول ذاتي' } },
  { value: 'Autre',             label: { fr: 'Autre',             ar: 'أخرى' } },
];

function CheckItem({ ok, warn, label }) {
  const icon = ok ? '✓' : warn ? '!' : '✗';
  const cls  = ok ? styles.iconOk : warn ? styles.iconWarn : styles.iconKo;
  return (
    <div className={styles.checkItem}>
      <span className={`${styles.checkIcon} ${cls}`}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Eligibilite() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isAr = i18n.language === 'ar';
  const [form, setForm] = useState({
    companyName: '', forme: '', rc: '', ice: '',
    isNew: 'non', ca: '', cap: '0', hasPub: 'non',
    invest: '', fp: '', emplois: '', secteur: '',
  });
  const [result, setResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function verifier() {
    const isNew  = form.isNew === 'oui';
    const ca     = parseFloat(form.ca)     || 0;
    const cap    = parseFloat(form.cap)    || 0;
    const invest = parseFloat(form.invest) || 0;
    const fp     = parseFloat(form.fp)     || 0;
    const emplois = parseInt(form.emplois) || 0;
    const isTourisme = form.secteur.toLowerCase() === 'tourisme';

    const checks = [];

    // 1. CA
    if (!isNew) {
      const ok = ca >= 1_000_000 && ca <= 200_000_000;
      checks.push({ ok, label: t('elig_check_ca', { val: ca.toLocaleString() }) });
    } else {
      checks.push({ ok: true, warn: false, label: t('elig_check_ca_new') });
    }

    // 2. Capital
    const capOk = cap <= 25;
    checks.push({ ok: capOk, label: t('elig_check_cap', { val: cap }) });

    // 3. Personne publique
    const pubOk = form.hasPub === 'non';
    checks.push({ ok: pubOk, label: pubOk ? t('elig_check_pub_ok') : t('elig_check_pub_ko') });

    // 4. Montant invest
    const invOk = invest >= 1_000_000 && invest < 50_000_000;
    checks.push({ ok: invOk, label: t('elig_check_invest', { val: invest.toLocaleString() }) });

    // 5. Financement propre
    const fpPct = invest > 0 ? (fp / invest) * 100 : 0;
    const fpOk  = fpPct >= 10;
    checks.push({ ok: fpOk, label: t('elig_check_fp', { val: fpPct.toFixed(1) }) });

    // 6. Ratio emplois
    const ratio    = invest > 0 ? emplois / (invest / 1_000_000) : 0;
    const seuil    = isTourisme ? 1 : 1.5;
    const ratioOk  = ratio >= seuil;
    checks.push({
      ok: ratioOk,
      label: t('elig_check_ratio', {
        val: ratio.toFixed(2),
        min: seuil,
        secteur: isTourisme ? t('elig_tourisme') : t('elig_secteur_general'),
      })
    });

    const eligible = checks.every((c) => c.ok);
    const nextResult = { checks, eligible };
    setResult(nextResult);
    setSaveError('');
    setSaveMessage('');

    if (!isAuthenticated) {
      return;
    }

    setSaveLoading(true);
    try {
      await api.post('/user/eligibility-checks', {
        companyName: form.companyName || 'Entreprise non renseignée',
        legalForm: form.forme,
        rc: form.rc,
        ice: form.ice,
        newCompany: isNew,
        chiffreAffaires: isNew ? null : ca,
        publicCapitalPercent: cap,
        hasPublicShareholder: form.hasPub === 'oui',
        investmentAmount: invest,
        ownFunds: fp,
        jobs: emplois,
        sector: form.secteur,
        eligible,
        details: checks.map((check) => check.label),
      });
      setSaveMessage('Vérification sauvegardée dans votre profil.');
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Impossible de sauvegarder cette vérification.');
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ to: '/', label: t('nav_home') }, { label: t('elig_breadcrumb') }]} />

      <div className={styles.page}>
        <div className={styles.inner}>
          <SectionHeader
            tag={t('elig_tag')}
            title={t('elig_title')}
            subtitle={t('elig_subtitle')}
          />

          <div className={styles.layout}>
            {/* ── Form ── */}
            <div className={styles.formWrap}>
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>{t('elig_section_entreprise')}</h3>
                <div className={styles.grid2}>
                  <FormGroup label="Nom de l'entreprise" required>
                    <Input placeholder=" " value={form.companyName} onChange={set('companyName')} />
                  </FormGroup>
                  <FormGroup label={t('elig_forme_label')} required>
                    <Select value={form.forme} onChange={set('forme')}>
                      <option value="">{t('elig_select')}</option>
                      {FORMES_JURIDIQUES.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {typeof label === 'string' ? label : (isAr ? label.ar : label.fr)}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup label={t('elig_new_label')} required>
                    <Select value={form.isNew} onChange={set('isNew')}>
                      <option value="non">{t('elig_new_non')}</option>
                      <option value="oui">{t('elig_new_oui')}</option>
                    </Select>
                  </FormGroup>
                  {form.isNew === 'non' && (
                    <FormGroup label={t('elig_ca_label')} required>
                      <Input type="number" placeholder="Ex: 5000000" value={form.ca} onChange={set('ca')} min="0" />
                    </FormGroup>
                  )}
                  <FormGroup label={t('elig_cap_label')}>
                    <Input type="number" placeholder="0" value={form.cap} onChange={set('cap')} min="0" max="100" />
                  </FormGroup>
                  <FormGroup label={t('elig_pub_label')} required>
                    <Select value={form.hasPub} onChange={set('hasPub')}>
                      <option value="non">{t('elig_pub_non')}</option>
                      <option value="oui">{t('elig_pub_oui')}</option>
                    </Select>
                  </FormGroup>
                  
                </div>
              </div>

              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>{t('elig_section_projet')}</h3>
                <div className={styles.grid2}>
                  <FormGroup label={t('elig_invest_label')} required>
                    <Input type="number" placeholder="Ex: 8000000" value={form.invest} onChange={set('invest')} min="0" />
                  </FormGroup>
                  <FormGroup label={t('elig_fp_label')} required>
                    <Input type="number" placeholder="Ex: 800000" value={form.fp} onChange={set('fp')} min="0" />
                  </FormGroup>
                  <FormGroup label={t('elig_emplois_label')} required>
                    <Input type="number" placeholder="Ex: 15" value={form.emplois} onChange={set('emplois')} min="0" />
                  </FormGroup>
                  <FormGroup label={t('elig_secteur_label')} required>
                    <Select value={form.secteur} onChange={set('secteur')}>
                      <option value="">{t('elig_select')}</option>
                      {SECTEURS.map(s => (
                        <option key={s} value={s}>{isAr ? (SECTEURS_AR[s] || s) : s}</option>
                      ))}
                    </Select>
                  </FormGroup>
                </div>
              </div>

              <Button variant="primary" size="lg" fullWidth onClick={verifier} disabled={saveLoading}>
                {saveLoading ? 'Sauvegarde...' : t('elig_btn_verifier')}
              </Button>
              {saveError && <p style={{ color: '#b91c1c', fontWeight: 600, marginTop: '0.75rem' }}>{saveError}</p>}
              {saveMessage && <p style={{ color: '#166534', fontWeight: 600, marginTop: '0.75rem' }}>{saveMessage}</p>}

              {/* Result */}
              {result && (
                <div className={`${styles.resultBox} ${result.eligible ? styles.resultOk : styles.resultKo}`}>
                  <h3>{result.eligible ? t('elig_result_ok_title') : t('elig_result_ko_title')}</h3>
                  <p>{result.eligible ? t('elig_result_ok_desc') : t('elig_result_ko_desc')}</p>
                  <div className={styles.checkList}>
                    {result.checks.map((c, i) => <CheckItem key={i} {...c} />)}
                  </div>
                  {result.eligible && (
                    <Button variant="primary" size="md" onClick={() => navigate('/simulateur')}>
                      {t('elig_btn_simuler')}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* ── Conditions sidebar ── */}
            <div className={styles.sidebar}>
              <div className={styles.sideCard} style={{ background: 'var(--navy-700)' }}>
                <h4 className={styles.sideTitle} style={{ color: 'white' }}>{t('elig_side_entreprise_title')}</h4>
                {[
                  t('elig_cond_ca'),
                  t('elig_cond_cap'),
                  t('elig_cond_pub'),
                  t('elig_cond_new'),
                ].map((text) => (
                  <div key={text} className={styles.sideItem} style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.85)' }}>
                    {text}
                  </div>
                ))}
              </div>

              <div className={styles.sideCard}>
                <h4 className={styles.sideTitle}>{t('elig_side_projet_title')}</h4>
                {[
                  t('elig_cond_invest'),
                  t('elig_cond_fp'),
                  t('elig_cond_ratio'),
                  t('elig_cond_branche'),
                ].map((text) => (
                  <div key={text} className={styles.sideItem}>{text}</div>
                ))}
              </div>

              <Alert type="info" title={t('elig_alert_title')}>
                {t('elig_alert_text')}
              </Alert>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Eligibilite;
