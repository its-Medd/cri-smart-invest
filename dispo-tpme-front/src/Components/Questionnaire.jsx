import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from './Index.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHelmetSafety, faMap, faStar, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import api from '../api';
import styles from '../Styles/Questionnaire.module.css';

// ── Province → catégorie territoriale ────────────────────────────────────────
const PROVINCES_LSH = { 'Laâyoune': 'A', 'Boujdour': 'B', 'Es-Semara': 'B', 'Tarfaya': 'B' };

// ── Mapping secteur simplifié → secteur détaillé (pour le calcul) ─────────────
const SECTOR_MAP = {
  'Industrie':   'Industrie manufacturière',
  'Tourisme':    'Hébergement et restauration',
  'Agriculture': 'Agriculture, sylviculture et pêche',
  'Services':    'Autres activités de service',
  'Digital':     'Information et communication',
};

// ── Utilitaires ───────────────────────────────────────────────────────────────
function fmtMAD(n) {
  return Math.round(n).toLocaleString('fr-MA') + ' MAD';
}

// ── Calcul éligibilité — retourne des données structurées (pas de strings) ───
function calcEligibilite(form) {
  const invest = parseFloat(form.investTotal) || 0;
  const fp     = parseFloat(form.financPropre) || 0;
  const emp    = parseInt(form.emploisStables) || 0;
  const secteur    = SECTOR_MAP[form.secteurActivite] || '';
  const isTourisme = secteur === 'Hébergement et restauration';
  const fpPct  = invest > 0 ? (fp / invest) * 100 : 0;
  const ratio  = invest > 0 ? emp / (invest / 1_000_000) : 0;
  const seuil  = isTourisme ? 1 : 1.5;

  const checks = [
    {
      ok:       invest >= 1_000_000 && invest < 50_000_000,
      type:     'invest',
      invest,
      underMin: invest < 1_000_000,
    },
    { ok: fpPct >= 10, type: 'fpPct', fpPct },
    { ok: ratio >= seuil, type: 'ratio', ratio, seuil, isTourisme },
  ];

  return { eligible: checks.every(c => c.ok), checks };
}

// ── Calcul des primes depuis les réponses du questionnaire ────────────────────
function calcPrimesQ(form) {
  const inv = parseFloat(form.investTotal) || 0;
  const emp = parseInt(form.emploisStables) || 0;
  if (inv <= 0) return null;

  const primable   = Math.min(inv, 50_000_000);
  const ratio      = inv > 0 ? emp / (inv / 1_000_000) : 0;
  const secteur    = SECTOR_MAP[form.secteurActivite] || '';
  const isTourisme = secteur === 'Hébergement et restauration';
  const seuilMin   = isTourisme ? 1 : 1.5;
  const ratioOk    = ratio >= seuilMin;

  let pctEmploi = 0;
  if (ratioOk) {
    if (ratio >= 2  && ratio <= 5)  pctEmploi = 5;
    if (ratio > 5   && ratio <= 10) pctEmploi = 7;
    if (ratio > 10)                  pctEmploi = 10;
  }

  const categorie = PROVINCES_LSH[form.province23] || null;
  const pctTerrit = categorie === 'A' ? 10 : categorie === 'B' ? 15 : 0;
  const pctPrio   = form.activitePrioritaire === 'oui' ? 10 : 0;
  const pctTotal  = Math.min(pctEmploi + pctTerrit + pctPrio, 30);

  return {
    primable,
    ratio: Math.round(ratio * 100) / 100,
    ratioOk, seuilMin, categorie,
    pctEmploi, pctTerrit, pctPrio, pctTotal,
    montantEmploi: (primable * pctEmploi) / 100,
    montantTerrit: (primable * pctTerrit) / 100,
    montantPrio:   (primable * pctPrio)   / 100,
    montantTotal:  (primable * pctTotal)  / 100,
  };
}

// ── Régions du Maroc et leurs villes ─────────────────────────────────────────
const REGIONS_MAROC = {
  'Tanger-Tétouan-Al Hoceïma':  ['Tanger', 'Tétouan', 'Al Hoceïma', 'Larache', 'Chefchaouen', 'Ouezzane', 'M\'diq-Fnideq', 'Fahs-Anjra'],
  'Oriental':                    ['Oujda', 'Nador', 'Berkane', 'Taourirt', 'Jerada', 'Guercif', 'Driouch', 'Figuig'],
  'Fès-Meknès':                  ['Fès', 'Meknès', 'Taza', 'Ifrane', 'El Hajeb', 'Sefrou', 'Boulemane', 'Taounate', 'Moulay Yacoub'],
  'Rabat-Salé-Kénitra':          ['Rabat', 'Salé', 'Kénitra', 'Khémisset', 'Skhirate-Témara'],
  'Béni Mellal-Khénifra':        ['Béni Mellal', 'Khénifra', 'Khouribga', 'Azilal', 'Fquih Ben Salah'],
  'Casablanca-Settat':           ['Casablanca', 'Mohammedia', 'El Jadida', 'Settat', 'Berrechid', 'Médiouna', 'Benslimane', 'Nouaceur', 'Sidi Bennour'],
  'Marrakech-Safi':              ['Marrakech', 'Safi', 'El Kelâa des Sraghna', 'Essaouira', 'Chichaoua', 'Al Haouz', 'Rehamna', 'Youssoufia'],
  'Drâa-Tafilalet':              ['Errachidia', 'Ouarzazate', 'Zagora', 'Tinghir', 'Midelt'],
  'Souss-Massa':                 ['Agadir', 'Tiznit', 'Taroudannt', 'Chtouka Aït Baha', 'Inezgane-Aït Melloul', 'Tata'],
  'Guelmim-Oued Noun':           ['Guelmim', 'Sidi Ifni', 'Assa-Zag', 'Tan-Tan'],
  'Laâyoune-Sakia El Hamra':     ['Laâyoune', 'Boujdour', 'Es-Semara', 'Tarfaya'],
  'Dakhla-Oued Ed-Dahab':        ['Dakhla', 'Aousserd'],
};

// ── État initial du formulaire ────────────────────────────────────────────────
const INIT = {
  nom: '', telephone: '', email: '', ville: '',
  niveauEtudes: '', projetAuparavant: '',
  entrepriseEnregistree: '',
  nomEntreprise: '', formeJuridique: '', dateCreation: '', ice: '', secteurActuel: '',
  intituleProjet: '', descriptionProjet: '',
  typeProjet: '', secteurActivite: '',
  regionProjet: '', villeProjet: '', stadeAvancement: '',
  investTotal: '', financPropre: '', emploisDirects: '', emploisStables: '',
  region23: 'Laâyoune-Sakia El Hamra', province23: '',
  activitePrioritaire: '', orientationProjet: [], compatibiliteRegion: '',
  besoinAccompagnement: '', difficultePrincipale: '',
};

// ── Composant principal ───────────────────────────────────────────────────────
function Questionnaire() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // ── Sections (dépend de t) ──
  const SECTIONS = [
    { label: t('ques_step1') },
    { label: t('ques_step2') },
    { label: t('ques_step3') },
    { label: t('ques_step4') },
    { label: t('ques_step5') },
  ];

  // ── Validation (dépend de t) ──
  function validateSection(step, form) {
    const errs = {};
    if (step === 0) {
      if (!form.nom.trim())       errs.nom = t('ques_err_required');
      if (!form.telephone.trim()) errs.telephone = t('ques_err_required');
      if (!form.email.trim())     errs.email = t('ques_err_required');
      else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = t('ques_err_email');
    }
    if (step === 1) {
      if (!form.entrepriseEnregistree) errs.entrepriseEnregistree = t('ques_err_required');
    }
    if (step === 2) {
      if (!form.intituleProjet.trim())    errs.intituleProjet = t('ques_err_required');
      if (!form.descriptionProjet.trim()) errs.descriptionProjet = t('ques_err_required');
      if (!form.typeProjet)               errs.typeProjet = t('ques_err_required');
      if (!form.secteurActivite)          errs.secteurActivite = t('ques_err_required');
      if (!form.regionProjet.trim())      errs.regionProjet = t('ques_err_required');
      if (!form.stadeAvancement)          errs.stadeAvancement = t('ques_err_required');
    }
    if (step === 3) {
      const inv = parseFloat(form.investTotal) || 0;
      const fp  = parseFloat(form.financPropre) || 0;
      const emp = parseInt(form.emploisStables) || 0;
      if (!form.investTotal || inv <= 0)   errs.investTotal    = t('ques_err_required');
      else if (inv < 1_000_000)            errs.investTotal    = t('ques_err_invest_min');
      else if (inv >= 50_000_000)          errs.investTotal    = t('ques_err_invest_max');
      if (!form.financPropre || fp <= 0)   errs.financPropre   = t('ques_err_required');
      if (!form.emploisStables || emp < 1) errs.emploisStables = t('ques_err_emplois');
      if (!form.province23)                errs.province23     = t('ques_err_required');
      if (!form.activitePrioritaire)       errs.activitePrioritaire = t('ques_err_required');
      if (!form.compatibiliteRegion)       errs.compatibiliteRegion = t('ques_err_required');
    }
    return errs;
  }

  const [step,       setStep]       = useState(0);
  const [form,       setForm]       = useState({ ...INIT });
  const [errors,     setErrors]     = useState({});
  const [submitted,  setSubmitted]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [apiError,   setApiError]   = useState('');
  const [eligResult, setEligResult] = useState(null);
  const [primResult, setPrimResult] = useState(null);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setRadio = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleArr = (key, val) =>
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(v => v !== val) : [...f[key], val],
    }));

  const handleNext = () => {
    const errs = validateSection(step, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setErrors({});
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const elig   = calcEligibilite(form);
    const primes = calcPrimesQ(form);
    setEligResult(elig);
    setPrimResult(primes);
    setLoading(true);
    setApiError('');

    if (isAuthenticated) {
      try {
        const invest = parseFloat(form.investTotal) || 0;
        const fp     = parseFloat(form.financPropre) || 0;
        const emp    = parseInt(form.emploisStables) || 0;

        await api.post('/user/questionnaire-submissions', {
          nom:                   form.nom,
          telephone:             form.telephone,
          email:                 form.email,
          ville:                 form.ville,
          niveauEtudes:          form.niveauEtudes,
          projetAuparavant:      form.projetAuparavant,
          entrepriseEnregistree: form.entrepriseEnregistree,
          nomEntreprise:         form.nomEntreprise,
          formeJuridique:        form.formeJuridique,
          dateCreation:          form.dateCreation,
          ice:                   form.ice,
          secteurActuel:         form.secteurActuel,
          intituleProjet:        form.intituleProjet,
          descriptionProjet:     form.descriptionProjet,
          typeProjet:            form.typeProjet,
          secteurActivite:       SECTOR_MAP[form.secteurActivite] || form.secteurActivite,
          regionProjet:          form.regionProjet,
          villeProjet:           form.villeProjet,
          stadeAvancement:       form.stadeAvancement,
          investTotal:           invest,
          financPropre:          fp,
          emploisDirects:        parseInt(form.emploisDirects) || 0,
          emploisStables:        emp,
          region23:              form.region23,
          province23:            form.province23,
          activitePrioritaire:   form.activitePrioritaire,
          orientationProjet:     form.orientationProjet.join(', '),
          compatibiliteRegion:   form.compatibiliteRegion,
          besoinAccompagnement:  form.besoinAccompagnement,
          difficultePrincipale:  form.difficultePrincipale,
          eligible:              elig.eligible,
          primeTotal:            primes ? primes.montantTotal : 0,
          primePct:              primes ? primes.pctTotal : 0,
          primeEmploi:           primes ? primes.pctEmploi : 0,
          primeTerrit:           primes ? primes.pctTerrit : 0,
          primePrio:             primes ? primes.pctPrio : 0,
        });

        await api.post('/user/eligibility-checks', {
          companyName:           form.nomEntreprise || form.intituleProjet || 'Questionnaire TPME',
          legalForm:             form.formeJuridique || 'Non renseigné',
          rc: '', ice:           form.ice || '',
          newCompany:            false,
          chiffreAffaires:       null,
          publicCapitalPercent:  0,
          hasPublicShareholder:  false,
          investmentAmount:      invest,
          ownFunds:              fp,
          jobs:                  emp,
          sector:                SECTOR_MAP[form.secteurActivite] || form.secteurActivite,
          eligible:              elig.eligible,
          details:               elig.checks.map(c => {
            if (c.type === 'invest') return `Investissement : ${c.invest.toLocaleString('fr-MA')} MAD`;
            if (c.type === 'fpPct')  return `Financement propre : ${c.fpPct.toFixed(1)}%`;
            if (c.type === 'ratio')  return `Ratio emplois : ${c.ratio.toFixed(2)} emp/MMAD`;
            return '';
          }),
        });
      } catch (err) {
        setApiError(err.response?.data?.message || t('ques_api_error_default'));
      }
    }

    setLoading(false);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <Breadcrumb items={[{ to: '/', label: t('nav_home') }, { label: t('ques_breadcrumb') }]} />

      <div className={styles.inner}>

        {/* ── Barre de progression ── */}
        {!submitted && (
          <div className={styles.progressWrap}>
            {SECTIONS.map((s, i) => (
              <div key={i} className={styles.progressItem}>
                <div className={[
                  styles.progressCircle,
                  i === step ? styles.pActive : '',
                  i < step  ? styles.pDone   : '',
                ].join(' ')}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`${styles.progressLabel} ${i === step ? styles.pLabelActive : ''}`}>
                  {s.label}
                </span>
                {i < SECTIONS.length - 1 && (
                  <div className={`${styles.progressLine} ${i < step ? styles.pLineDone : ''}`} />
                )}
              </div>
            ))}
            <div className={styles.mobileStep}>
              {t('ques_mobile_step', { current: step + 1, total: SECTIONS.length, label: SECTIONS[step].label })}
            </div>
          </div>
        )}

        {/* ── Formulaire ── */}
        {!submitted ? (
          <div className={styles.formCard}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionNum}>{t('ques_section_num')} {step + 1}</span>
              <h2 className={styles.sectionTitle}>{SECTIONS[step].label}</h2>
            </div>

            {/* SECTION 1 — Informations personnelles */}
            {step === 0 && (
              <div className={styles.fields}>
                <div className={styles.grid2}>
                  <Field label={t('ques_nom')} required error={errors.nom}>
                    <input value={form.nom} onChange={set('nom')} placeholder={t('ques_nom_placeholder')}
                      className={errors.nom ? styles.inputErr : ''} />
                  </Field>
                  <Field label={t('ques_telephone')} required error={errors.telephone}>
                    <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="+212 6XX XXX XXX"
                      className={errors.telephone ? styles.inputErr : ''} />
                  </Field>
                  <Field label={t('ques_email_label')} required error={errors.email}>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="exemple@mail.com"
                      className={errors.email ? styles.inputErr : ''} />
                  </Field>
                  <Field label={t('ques_ville_label')}>
                    <input value={form.ville} onChange={set('ville')} placeholder={t('ques_ville_placeholder')} />
                  </Field>
                </div>
                <Field label={t('ques_niveau_etudes')}>
                  <RadioGroup name="niveauEtudes" value={form.niveauEtudes}
                    options={[t('ques_secondaire'), t('ques_technique'), t('ques_universitaire'), t('ques_autre')]}
                    values={['Secondaire', 'Technique', 'Universitaire', 'Autre']}
                    onSelect={(v) => setRadio('niveauEtudes', v)} />
                </Field>
                <Field label={t('ques_projet_precedent')}>
                  <RadioGroup name="projetAuparavant" value={form.projetAuparavant}
                    options={[t('ques_oui'), t('ques_non')]}
                    values={['Oui', 'Non']}
                    onSelect={(v) => setRadio('projetAuparavant', v)} />
                </Field>
              </div>
            )}

            {/* SECTION 2 — Informations sur l'entreprise */}
            {step === 1 && (
              <div className={styles.fields}>
                <Field label={t('ques_entreprise_enregistree')} required error={errors.entrepriseEnregistree}>
                  <RadioGroup name="entrepriseEnregistree" value={form.entrepriseEnregistree}
                    options={[t('ques_oui'), t('ques_non')]}
                    values={['Oui', 'Non']}
                    onSelect={(v) => setRadio('entrepriseEnregistree', v)} />
                </Field>
                {form.entrepriseEnregistree === 'Oui' && (
                  <div className={styles.conditionalBlock}>
                    <div className={styles.grid2}>
                      <Field label={t('ques_nom_entreprise')}>
                        <input value={form.nomEntreprise} onChange={set('nomEntreprise')} placeholder={t('ques_nom_entreprise_placeholder')} />
                      </Field>
                      <Field label={t('ques_forme_juridique')}>
                        <select value={form.formeJuridique} onChange={set('formeJuridique')}>
                          <option value="">{t('ques_select')}</option>
                          <option value="SARL">SARL</option>
                          <option value="SA">SA</option>
                          <option value="Auto-entrepreneur">{t('ques_auto_entrepreneur')}</option>
                          <option value="Autre">{t('ques_autre')}</option>
                        </select>
                      </Field>
                      <Field label={t('ques_date_creation')}>
                        <input type="date" value={form.dateCreation} onChange={set('dateCreation')} />
                      </Field>
                      <Field label={t('ques_ice')}>
                        <input value={form.ice} onChange={set('ice')} placeholder={t('ques_ice_placeholder')} />
                      </Field>
                    </div>
                    <Field label={t('ques_secteur_actuel')}>
                      <input value={form.secteurActuel} onChange={set('secteurActuel')}
                        placeholder={t('ques_secteur_actuel_placeholder')} />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 3 — Informations sur le projet */}
            {step === 2 && (
              <div className={styles.fields}>
                <Field label={t('ques_intitule')} required error={errors.intituleProjet}>
                  <input value={form.intituleProjet} onChange={set('intituleProjet')}
                    placeholder={t('ques_intitule_placeholder')}
                    className={errors.intituleProjet ? styles.inputErr : ''} />
                </Field>
                <Field label={t('ques_description')} required error={errors.descriptionProjet}>
                  <textarea rows={4} value={form.descriptionProjet} onChange={set('descriptionProjet')}
                    placeholder={t('ques_description_placeholder')}
                    className={errors.descriptionProjet ? styles.inputErr : ''} />
                </Field>
                <Field label={t('ques_type_projet')} required error={errors.typeProjet}>
                  <RadioGroup name="typeProjet" value={form.typeProjet}
                    options={[t('ques_creation'), t('ques_extension'), t('ques_modernisation')]}
                    values={['Création', 'Extension', 'Modernisation']}
                    onSelect={(v) => setRadio('typeProjet', v)} />
                </Field>
                <Field label={t('ques_secteur_activite')} required error={errors.secteurActivite}>
                  <RadioGroup name="secteurActivite" value={form.secteurActivite}
                    options={[t('ques_industrie'), t('ques_tourisme'), t('ques_agriculture'), t('ques_services'), t('ques_digital')]}
                    values={['Industrie', 'Tourisme', 'Agriculture', 'Services', 'Digital']}
                    onSelect={(v) => setRadio('secteurActivite', v)} />
                </Field>
                <div className={styles.grid2}>
                  <Field label={t('ques_region')} required error={errors.regionProjet}>
                    <select
                      value={form.regionProjet}
                      onChange={e => setForm(f => ({ ...f, regionProjet: e.target.value, villeProjet: '' }))}
                      className={errors.regionProjet ? styles.inputErr : ''}
                    >
                      <option value="">{t('ques_select_region')}</option>
                      {Object.keys(REGIONS_MAROC).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('ques_ville_projet')}>
                    <select value={form.villeProjet} onChange={set('villeProjet')} disabled={!form.regionProjet}>
                      <option value="">{form.regionProjet ? t('ques_select_ville') : t('ques_select_region_first')}</option>
                      {(REGIONS_MAROC[form.regionProjet] || []).map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label={t('ques_stade_avancement')} required error={errors.stadeAvancement}>
                  <RadioGroup name="stadeAvancement" value={form.stadeAvancement}
                    options={[t('ques_idee'), t('ques_etude_cours'), t('ques_en_realisation')]}
                    values={['Idée', 'Étude en cours', 'En cours de réalisation']}
                    onSelect={(v) => setRadio('stadeAvancement', v)} />
                </Field>
              </div>
            )}

            {/* SECTION 4 — Données pour le simulateur */}
            {step === 3 && (
              <div className={styles.fields}>
                <div className={styles.simNote}>{t('ques_sim_note')}</div>
                <div className={styles.grid2}>
                  <Field label={t('ques_invest_total')} required error={errors.investTotal}>
                    <input type="number" value={form.investTotal} onChange={set('investTotal')}
                      placeholder={t('ques_invest_total_placeholder')} min="0"
                      className={errors.investTotal ? styles.inputErr : ''} />
                    <span className={styles.hint}>{t('ques_invest_total_hint')}</span>
                  </Field>
                  <Field label={t('ques_financement_propre')} required error={errors.financPropre}>
                    <input type="number" value={form.financPropre} onChange={set('financPropre')}
                      placeholder={t('ques_financement_propre_placeholder')} min="0"
                      className={errors.financPropre ? styles.inputErr : ''} />
                  </Field>
                  <Field label={t('ques_emplois_directs')}>
                    <input type="number" value={form.emploisDirects} onChange={set('emploisDirects')}
                      placeholder={t('ques_emplois_directs_placeholder')} min="0" />
                  </Field>
                  <Field label={t('ques_emplois_stables')} required error={errors.emploisStables}>
                    <input type="number" value={form.emploisStables} onChange={set('emploisStables')}
                      placeholder={t('ques_emplois_stables_placeholder')} min="0"
                      className={errors.emploisStables ? styles.inputErr : ''} />
                    <span className={styles.hint}>{t('ques_emplois_stables_hint')}</span>
                  </Field>
                </div>
                <div className={styles.grid2}>
                  <Field label={t('ques_region_simulateur')}>
                    <input value="Laâyoune-Sakia El Hamra" readOnly
                      style={{ background: '#f8faff', color: '#1e3a5f', fontWeight: 600, cursor: 'default' }} />
                  </Field>
                  <Field label={t('ques_province')} required error={errors.province23}>
                    <select value={form.province23} onChange={set('province23')}
                      className={errors.province23 ? styles.inputErr : ''}>
                      <option value="">{t('ques_select')}</option>
                      {Object.entries(PROVINCES_LSH).map(([p, cat]) => (
                        <option key={p} value={p}>
                          {t('ques_province_option', { province: p, cat, pct: cat === 'A' ? '+10 %' : '+15 %' })}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label={t('ques_activite_prioritaire')} required error={errors.activitePrioritaire}>
                  <RadioGroup name="activitePrioritaire" value={form.activitePrioritaire}
                    options={[t('ques_oui'), t('ques_non'), t('ques_je_ne_sais_pas')]}
                    values={['oui', 'non', 'nsp']}
                    onSelect={(v) => setRadio('activitePrioritaire', v)} />
                </Field>
                <Field label={t('ques_orientation')}>
                  <CheckGroup
                    options={[t('ques_export'), t('ques_substitution'), t('ques_innovation'), t('ques_aucun')]}
                    values={['Export', 'Substitution aux importations', 'Innovation', 'Aucun']}
                    selected={form.orientationProjet}
                    onToggle={(v) => toggleArr('orientationProjet', v)} />
                </Field>
                <Field label={t('ques_compatibilite')} required error={errors.compatibiliteRegion}>
                  <RadioGroup name="compatibiliteRegion" value={form.compatibiliteRegion}
                    options={[t('ques_oui'), t('ques_non'), t('ques_je_ne_sais_pas')]}
                    values={['oui', 'non', 'nsp']}
                    onSelect={(v) => setRadio('compatibiliteRegion', v)} />
                </Field>
              </div>
            )}

            {/* SECTION 5 — Besoins et accompagnement */}
            {step === 4 && (
              <div className={styles.fields}>
                <Field label={t('ques_besoin_accompagnement')}>
                  <RadioGroup name="besoinAccompagnement" value={form.besoinAccompagnement}
                    options={[t('ques_oui'), t('ques_non')]}
                    values={['Oui', 'Non']}
                    onSelect={(v) => setRadio('besoinAccompagnement', v)} />
                </Field>
                <Field label={t('ques_difficulte')}>
                  <RadioGroup name="difficultePrincipale" value={form.difficultePrincipale}
                    options={[t('ques_diff_financement'), t('ques_diff_admin'), t('ques_diff_technique'), t('ques_diff_marche'), t('ques_autre')]}
                    values={['Financement', 'Procédures administratives', 'Étude technique', 'Accès au marché', 'Autre']}
                    onSelect={(v) => setRadio('difficultePrincipale', v)} />
                </Field>
              </div>
            )}

            {/* Navigation */}
            <div className={styles.navRow}>
              {step > 0 && (
                <button className={styles.btnPrev} onClick={handlePrev}>{t('ques_prev')}</button>
              )}
              <div className={styles.navSpacer} />
              {step < SECTIONS.length - 1 ? (
                <button className={styles.btnNext} onClick={handleNext}>{t('ques_next')}</button>
              ) : (
                <button className={styles.btnSubmit} onClick={handleSubmit} disabled={loading}>
                  {loading ? t('ques_submitting') : t('ques_submit')}
                </button>
              )}
            </div>
          </div>

        ) : (

          /* ── RÉSULTATS ── */
          <div className={styles.results}>

            {/* Eligibilité */}
            <div className={`${styles.eligBox} ${eligResult?.eligible ? styles.eligOk : styles.eligKo}`}>
              <div className={styles.eligHead}>
                <div className={`${styles.eligBadge} ${eligResult?.eligible ? styles.eligBadgeOk : styles.eligBadgeKo}`}>
                  {eligResult?.eligible ? '✓' : '✗'}
                </div>
                <div>
                  <h2 className={styles.eligTitle}>
                    {eligResult?.eligible ? t('ques_eligible_title') : t('ques_not_eligible_title')}
                  </h2>
                  <p className={styles.eligDesc}>
                    {eligResult?.eligible ? t('ques_eligible_desc') : t('ques_not_eligible_desc')}
                  </p>
                </div>
              </div>
              <div className={styles.checkList}>
                {eligResult?.checks.map((c, i) => {
                  let label, detail;
                  if (c.type === 'invest') {
                    label  = t('ques_check_invest_label', { val: c.invest.toLocaleString('fr-MA') });
                    detail = c.ok ? t('ques_check_ok') : c.underMin ? t('ques_check_invest_min') : t('ques_check_invest_max');
                  } else if (c.type === 'fpPct') {
                    label  = t('ques_check_fp_label', { val: c.fpPct.toFixed(1) });
                    detail = c.ok ? t('ques_check_ok') : t('ques_check_fp_err');
                  } else {
                    label  = t('ques_check_ratio_label', { val: c.ratio.toFixed(2) });
                    detail = c.ok
                      ? t('ques_check_ok')
                      : t('ques_check_ratio_err', {
                          seuil: c.seuil,
                          secteur: c.isTourisme ? t('ques_check_tourisme') : t('ques_check_general'),
                        });
                  }
                  return (
                    <div key={i} className={`${styles.checkItem} ${c.ok ? styles.checkOk : styles.checkKo}`}>
                      <span className={styles.checkDot}>{c.ok ? '✓' : '✗'}</span>
                      <div>
                        <div className={styles.checkLabel}>{label}</div>
                        <div className={styles.checkDetail}>{detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primes */}
            {primResult && (
              <div className={styles.primesBox}>
                <h3 className={styles.primesTitle}>{t('ques_primes_title')}</h3>

                <div className={styles.totalPrime}>
                  <div>
                    <div className={styles.totalLabel}>{t('ques_prime_total_label')}</div>
                    <div className={styles.totalAmount}>{fmtMAD(primResult.montantTotal)}</div>
                    <div className={styles.totalBar}>
                      <div className={styles.totalBarFill}
                        style={{ width: `${(primResult.pctTotal / 30) * 100}%` }} />
                    </div>
                    <div className={styles.totalMeta}>
                      {t('ques_prime_total_meta', { pct: primResult.pctTotal, primable: fmtMAD(primResult.primable) })}
                    </div>
                  </div>
                </div>

                <div className={styles.primesGrid}>
                  <PrimeCard icon={faHelmetSafety} title={t('ques_prime_emploi')}
                    pct={primResult.pctEmploi} amount={primResult.montantEmploi}
                    active={primResult.pctEmploi > 0}
                    sub={t('ques_ratio_emploi', { ratio: primResult.ratio })} max={10} />
                  <PrimeCard icon={faMap} title={t('ques_prime_territ')}
                    pct={primResult.pctTerrit} amount={primResult.montantTerrit}
                    active={primResult.pctTerrit > 0}
                    sub={primResult.categorie
                      ? t('ques_province_cat', { cat: primResult.categorie })
                      : t('ques_province_hors_cat')}
                    max={15} />
                  <PrimeCard icon={faStar} title={t('ques_prime_prio')}
                    pct={primResult.pctPrio} amount={primResult.montantPrio}
                    active={primResult.pctPrio > 0}
                    sub={primResult.pctPrio > 0 ? t('ques_prioritaire_declared') : t('ques_non_applicable')}
                    max={10} />
                </div>

                <p className={styles.disclaimer}>{t('ques_disclaimer')}</p>
              </div>
            )}

            {apiError && <p className={styles.apiError}>{apiError}</p>}

            <div className={styles.resultActions}>
              <button className={styles.btnPrev}
                onClick={() => { setSubmitted(false); setStep(0); setErrors({}); }}>
                {t('ques_modifier')}
              </button>
              <button className={styles.btnNext} onClick={() => navigate('/simulateur')}>
                {t('ques_simulateur_btn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div className={styles.fieldWrap}>
      <label className={styles.fieldLabel}>
        {label}{required && <span className={styles.req}> *</span>}
      </label>
      {children}
      {error && <span className={styles.fieldError}><FontAwesomeIcon icon={faTriangleExclamation} /> {error}</span>}
    </div>
  );
}

function RadioGroup({ name, value, options, values, onSelect }) {
  return (
    <div className={styles.radioGroup}>
      {options.map((opt, i) => {
        const val = values ? values[i] : opt;
        return (
          <button key={val} type="button"
            className={`${styles.radioCard} ${value === val ? styles.radioSelected : ''}`}
            onClick={() => onSelect(val)}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function CheckGroup({ options, values, selected, onToggle }) {
  return (
    <div className={styles.radioGroup}>
      {options.map((opt, i) => {
        const val = values ? values[i] : opt;
        return (
          <button key={val} type="button"
            className={`${styles.radioCard} ${selected.includes(val) ? styles.radioSelected : ''}`}
            onClick={() => onToggle(val)}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PrimeCard({ icon, title, pct, amount, active, sub, max }) {
  return (
    <div className={`${styles.primeCard} ${active ? styles.primeActive : styles.primeInactive}`}>
      <div className={styles.primeCardHead}>
        <span className={styles.primeIcon}><FontAwesomeIcon icon={icon} /></span>
        <div className={styles.primeCardInfo}>
          <div className={styles.primeCardTitle}>{title}</div>
          <div className={styles.primeCardSub}>{sub}</div>
        </div>
        <span className={styles.primePct}>{pct}%</span>
      </div>
      <div className={styles.primeBar}>
        <div className={styles.primeBarFill} style={{ width: `${(pct / max) * 100}%` }} />
      </div>
      <div className={styles.primeAmount}>{fmtMAD(amount)}</div>
    </div>
  );
}

export default Questionnaire;
