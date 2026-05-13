import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../Styles/CalculateurPrimes.module.css';
import api from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHelmetSafety, faMap, faStar } from '@fortawesome/free-solid-svg-icons';

// ─── Traductions arabes des secteurs ───────────────────────────────────────
const SECTEURS_AR = {
  "Agriculture, sylviculture et pêche": "الفلاحة واستغلال الغابات وصيد الأسماك",
  "Industries extractives": "الصناعات الاستخراجية",
  "Industrie manufacturière": "الصناعات التحويلية",
  "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné": "إنتاج وتوزيع الكهرباء والغاز والبخار والهواء المكيف",
  "Production et distribution d'eau, assainissement, gestion des déchets et dépollution": "إنتاج وتوزيع الماء والتطهير وتدبير ومعالجة النفايات",
  "Transports et entreposage": "النقل والتخزين",
  "Hébergement et restauration": "الإيواء والمطاعم",
  "Artisanat": "الصناعة التقليدية",
  "Information et communication": "الإعلام والاتصال",
  "Activités spécialisées, scientifiques et techniques": "الأنشطة المتخصصة والتقنية والعلمية",
  "Enseignement": "التعليم",
  "Santé humaine et action sociale": "الصحة الإنسانية والعمل الاجتماعي",
  "Arts, spectacles et activités récréatives": "الفنون والترفيه وأنشطة العروض",
  "Autres activités de service": "أنشطة الخدمات الأخرى",
};

// ─── Traductions arabes des branches ───────────────────────────────────────
const BRANCHES_AR = {
  "Aquaculture en mer et zone littorale": "تربية الأحياء البحرية في البحر والمنطقة الساحلية",
  "Aquaculture en eau douce": "تربية الأحياء المائية في المياه العذبة",
  "Traitement & valorisation des produits aquacoles": "معالجة وتثمين المنتجات المائية",
  "Extraction de minerais métalliques": "استخراج الخامات المعدنية",
  "Services de soutien aux industries extractives": "خدمات دعم الصناعات الاستخراجية",
  "Valorisation et transformation des produits miniers": "تثمين وتحويل المنتجات المعدنية",
  "Industries alimentaires": "الصناعات الغذائية",
  "Fabrication de boissons": "صناعة المشروبات",
  "Fabrication de produits à base de tabac": "صناعة منتجات التبغ",
  "Fabrication de textiles": "صناعة النسيج",
  "Industrie de l'habillement": "صناعة الملابس",
  "Industrie du cuir et de la chaussure": "صناعة الجلود والأحذية",
  "Travail du bois et fabrication d'articles en bois, en liège, en vannerie ou sparterie": "تصنيع الخشب ومنتجاته والفلين والقش",
  "Industrie du papier et du carton": "صناعة الورق والكرتون",
  "Imprimerie et reproduction d'enregistrements": "الطباعة وإعادة إنتاج التسجيلات",
  "Industrie chimique": "الصناعة الكيميائية",
  "Industrie pharmaceutique": "الصناعة الصيدلانية",
  "Industrie de fabrication des dispositifs médicaux et de matériel biomédical": "صناعة الأجهزة الطبية والمعدات البيوطبية",
  "Fabrication de produits en caoutchouc et en plastique": "صناعة منتجات المطاط والبلاستيك",
  "Fabrication d'autres produits minéraux non métalliques": "صناعة منتجات معدنية غير فلزية أخرى",
  "Métallurgie": "علم المعادن",
  "Fabrication de produits métalliques, à l'exception des machines et des équipements": "صناعة المنتجات المعدنية باستثناء الآلات والمعدات",
  "Fabrication de produits informatiques, électroniques et optiques": "صناعة منتجات المعلوماتية والإلكترونيات والبصريات",
  "Fabrication de produits et d'équipements électriques": "صناعة المنتجات والمعدات الكهربائية",
  "Fabrication de machines et équipements non classés ailleurs": "صناعة الآلات والمعدات غير المصنفة",
  "Industrie automobile": "صناعة السيارات",
  "Fabrication d'autres matériels de transport": "صناعة معدات النقل الأخرى",
  "Fabrication de meubles": "صناعة الأثاث",
  "Autres industries manufacturières": "صناعات تحويلية أخرى",
  "Réparation et installation de machines et d'équipements": "إصلاح وتركيب الآلات والمعدات",
  "Industrie des énergies renouvelables": "صناعة الطاقات المتجددة",
  "Ingénierie et prestations techniques liées à l'industrie": "الهندسة والخدمات التقنية الصناعية",
  "Services de soutien aux activités industrielles": "خدمات دعم الأنشطة الصناعية",
  "Production d'électricité à base d'énergie renouvelable": "إنتاج الكهرباء من الطاقات المتجددة",
  "Recyclage, transformation et valorisation des déchets autres qu'importés": "إعادة التدوير وتحويل وتثمين النفايات غير المستوردة",
  "Collecte, traitement et élimination des déchets dangereux": "جمع ومعالجة والتخلص من النفايات الخطرة",
  "Dépollution et autres services de gestion des déchets non ménagers": "إزالة التلوث وخدمات تدبير النفايات غير المنزلية",
  "Entreposage et services auxiliaires des transports": "التخزين والخدمات المساعدة للنقل",
  "Activités de poste et de courrier": "أنشطة البريد والمراسلات",
  "Établissements d'hébergement touristique classés": "مؤسسات الإيواء السياحي المصنفة",
  "Restauration touristique": "الإطعام السياحي",
  "Artisanat de production d'art et utilitaire": "الصناعة التقليدية الفنية والنفعية",
  "Édition": "النشر",
  "Production de films cinématographiques, de vidéo et de programmes de télévision": "إنتاج الأفلام السينمائية ومقاطع الفيديو والبرامج التلفزيونية",
  "Programmation et diffusion": "البرمجة والبث",
  "Installation des infrastructures de télécommunications": "تركيب البنيات التحتية للاتصالات",
  "Programmation, conseil et autres activités informatiques": "البرمجة والاستشارة والأنشطة المعلوماتية الأخرى",
  "Services de l'information : outsourcing, centres d'appels, IA, datacenters": "خدمات المعلومات : الاستعانة بمصادر خارجية، مراكز الاتصال، الذكاء الاصطناعي، مراكز البيانات",
  "Activités de contrôle et d'analyse technique": "أنشطة المراقبة والتحليل التقني",
  "Formation professionnelle": "التكوين المهني",
  "Activités pour la santé humaine": "أنشطة الصحة الإنسانية",
  "Activités créatives, artistiques et de spectacle": "الأنشطة الإبداعية والفنية وأنشطة العروض",
  "Activités récréatives et de loisirs": "الأنشطة الترفيهية وأوقات الفراغ",
  "Réparation d'ordinateurs, d'équipements et de biens personnels et domestiques": "إصلاح الحواسيب والمعدات والسلع الشخصية والمنزلية",
};

// ─── Données extraites de l'Excel ──────────────────────────────────────────

const SECTEURS_BRANCHES = {
  "Agriculture, sylviculture et pêche": [
    "Aquaculture en mer et zone littorale",
    "Aquaculture en eau douce",
    "Traitement & valorisation des produits aquacoles",
  ],
  "Industries extractives": [
    "Extraction de minerais métalliques",
    "Services de soutien aux industries extractives",
    "Valorisation et transformation des produits miniers",
  ],
  "Industrie manufacturière": [
    "Industries alimentaires",
    "Fabrication de boissons",
    "Fabrication de produits à base de tabac",
    "Fabrication de textiles",
    "Industrie de l'habillement",
    "Industrie du cuir et de la chaussure",
    "Travail du bois et fabrication d'articles en bois, en liège, en vannerie ou sparterie",
    "Industrie du papier et du carton",
    "Imprimerie et reproduction d'enregistrements",
    "Industrie chimique",
    "Industrie pharmaceutique",
    "Industrie de fabrication des dispositifs médicaux et de matériel biomédical",
    "Fabrication de produits en caoutchouc et en plastique",
    "Fabrication d'autres produits minéraux non métalliques",
    "Métallurgie",
    "Fabrication de produits métalliques, à l'exception des machines et des équipements",
    "Fabrication de produits informatiques, électroniques et optiques",
    "Fabrication de produits et d'équipements électriques",
    "Fabrication de machines et équipements non classés ailleurs",
    "Industrie automobile",
    "Fabrication d'autres matériels de transport",
    "Fabrication de meubles",
    "Autres industries manufacturières",
    "Réparation et installation de machines et d'équipements",
    "Industrie des énergies renouvelables",
    "Ingénierie et prestations techniques liées à l'industrie",
    "Services de soutien aux activités industrielles",
  ],
  "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné": [
    "Production d'électricité à base d'énergie renouvelable",
  ],
  "Production et distribution d'eau, assainissement, gestion des déchets et dépollution": [
    "Recyclage, transformation et valorisation des déchets autres qu'importés",
    "Collecte, traitement et élimination des déchets dangereux",
    "Dépollution et autres services de gestion des déchets non ménagers",
  ],
  "Transports et entreposage": [
    "Entreposage et services auxiliaires des transports",
    "Activités de poste et de courrier",
  ],
  "Hébergement et restauration": [
    "Établissements d'hébergement touristique classés",
    "Restauration touristique",
  ],
  "Artisanat": [
    "Artisanat de production d'art et utilitaire",
  ],
  "Information et communication": [
    "Édition",
    "Production de films cinématographiques, de vidéo et de programmes de télévision",
    "Programmation et diffusion",
    "Installation des infrastructures de télécommunications",
    "Programmation, conseil et autres activités informatiques",
    "Services de l'information : outsourcing, centres d'appels, IA, datacenters",
  ],
  "Activités spécialisées, scientifiques et techniques": [
    "Activités de contrôle et d'analyse technique",
  ],
  "Enseignement": [
    "Formation professionnelle",
  ],
  "Santé humaine et action sociale": [
    "Activités pour la santé humaine",
  ],
  "Arts, spectacles et activités récréatives": [
    "Activités créatives, artistiques et de spectacle",
    "Activités récréatives et de loisirs",
  ],
  "Autres activités de service": [
    "Réparation d'ordinateurs, d'équipements et de biens personnels et domestiques",
  ],
};

const BRANCHES_PRIORITAIRES = new Set([
  "Aquaculture en mer et zone littorale",
  "Aquaculture en eau douce",
  "Traitement & valorisation des produits aquacoles",
  "Industries alimentaires",
  "Fabrication de boissons",
  "Fabrication de textiles",
  "Industrie de l'habillement",
  "Industrie du cuir et de la chaussure",
  "Travail du bois et fabrication d'articles en bois, en liège, en vannerie ou sparterie",
  "Industrie du papier et du carton",
  "Imprimerie et reproduction d'enregistrements",
  "Industrie chimique",
  "Industrie pharmaceutique",
  "Fabrication de produits en caoutchouc et en plastique",
  "Fabrication d'autres produits minéraux non métalliques",
  "Métallurgie",
  "Fabrication de produits métalliques, à l'exception des machines et des équipements",
  "Fabrication de produits informatiques, électroniques et optiques",
  "Fabrication de produits et d'équipements électriques",
  "Fabrication de machines et équipements non classés ailleurs",
  "Industrie automobile",
  "Fabrication de meubles",
  "Autres industries manufacturières",
  "Industrie des énergies renouvelables",
  "Recyclage, transformation et valorisation des déchets autres qu'importés",
  "Entreposage et services auxiliaires des transports",
  "Établissements d'hébergement touristique classés",
  "Restauration touristique",
  "Artisanat de production d'art et utilitaire",
  "Services de l'information : outsourcing, centres d'appels, IA, datacenters",
  "Formation professionnelle",
  "Activités créatives, artistiques et de spectacle",
  "Activités récréatives et de loisirs",
]);

const SECTEURS_TOURISME = new Set(["Hébergement et restauration"]);

// Secteurs qui affichent la section répartition de l'investissement
const SECTEURS_REPARTITION = new Set([
  "Industries extractives",
  "Industrie manufacturière",
  "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné",
  "Production et distribution d'eau, assainissement, gestion des déchets et dépollution",
  "Artisanat",
]);


const PROVINCES_LSH = {
  "Laâyoune": "A",
  "Boujdour": "B",
  "Es-Semara": "B",
  "Tarfaya": "B",
};

// ─── Utilitaires ───────────────────────────────────────────────────────────

function formatMAD(n) {
  if (!n && n !== 0) return '—';
  return Math.round(n).toLocaleString('fr-MA') + ' MAD';
}

function calcPrimes({ investissement, emplois, province, branche, secteur, activitePrioritaire }) {
  const inv = parseFloat(investissement) || 0;
  const emp = parseInt(emplois) || 0;
  if (inv <= 0) return null;

  const primable = Math.min(inv, 50_000_000);
  const ratio = inv > 0 ? emp / (inv / 1_000_000) : 0;
  const isTourisme = SECTEURS_TOURISME.has(secteur);
  const seuilMin = isTourisme ? 1 : 1.5;
  const ratioEligible = ratio >= seuilMin;

  let pctEmploi = 0;
  if (ratioEligible) {
    if (ratio >= 2  && ratio <= 5)  pctEmploi = 5;
    if (ratio > 5   && ratio <= 10) pctEmploi = 7;
    if (ratio > 10)                  pctEmploi = 10;
  }

  const categorie = PROVINCES_LSH[province] || null;
  const pctTerrit = categorie === 'A' ? 10 : categorie === 'B' ? 15 : 0;
  const pctPrio   = activitePrioritaire && BRANCHES_PRIORITAIRES.has(branche) ? 10 : 0;
  const pctTotal  = Math.min(pctEmploi + pctTerrit + pctPrio, 30);
  const montantTotal = (primable * pctTotal) / 100;

  return {
    primable, ratio: Math.round(ratio * 100) / 100,
    ratioEligible, seuilMin, categorie,
    pctEmploi, pctTerrit, pctPrio, pctTotal,
    montantEmploi: (primable * pctEmploi) / 100,
    montantTerrit: (primable * pctTerrit) / 100,
    montantPrio:   (primable * pctPrio)   / 100,
    montantTotal,
    estPrioritaire: BRANCHES_PRIORITAIRES.has(branche),
  };
}

// ─── État initial répartition ───────────────────────────────────────────────

const INITIAL_REPARTITION = {
  fraisEtudes:  '',
  typeFoncier:  '',
  foncier:      '',
  construction: '',
  equipements:  '',
};

// ─── Composant ─────────────────────────────────────────────────────────────

export default function CalculateurPrimes() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [form, setForm] = useState({
    secteur: '', branche: '', province: '',
    investissement: '', emplois: '', activitePrioritaire: false,
    repartition: { ...INITIAL_REPARTITION },
  });
  const [errors,     setErrors]     = useState({});
  const [calculated, setCalculated] = useState(false);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      ...(key === 'secteur' ? { branche: '', repartition: { ...INITIAL_REPARTITION } } : {}),
    }));

  const setRep = (key) => (e) =>
    setForm((f) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      return {
        ...f,
        repartition: {
          ...f.repartition,
          [key]: value,
          ...(key === 'typeFoncier' && value !== 'privée' ? { foncier: '' } : {}),
        },
      };
    });

  const branches       = form.secteur ? SECTEURS_BRANCHES[form.secteur] || [] : [];
  const estPrioritaire = BRANCHES_PRIORITAIRES.has(form.branche);
  const showRepartition = SECTEURS_REPARTITION.has(form.secteur);

  // ── Calculs répartition ─────────────────────────────────────────────────
  const rep = useMemo(() => {
    if (!showRepartition) return null;
    const r = form.repartition;
    const frais        = parseFloat(r.fraisEtudes)  || 0;
    const foncier      = parseFloat(r.foncier)       || 0;
    const construction = parseFloat(r.construction) || 0;
    const equipements  = parseFloat(r.equipements)  || 0;
    const total = frais + foncier + construction + equipements;

    if (total === 0) return { total: 0 };

    // Frais d'études
    // Éligible si ≤5% OU si >5% mais ≤500 000 MAD (exclu seulement si >5% ET >500k)
    const fraisPct      = (frais / total) * 100;
    const fraisOk5      = fraisPct <= 5;
    const fraisOk500k   = frais <= 500_000;
    const fraisEligible = fraisOk5 || fraisOk500k;

    // Foncier (limite fixe 20%)
    // Éligible si ≤20% OU si >20% mais ≤5 000 000 MAD (exclu seulement si >20% ET >5M)
    const foncierLimit  = 20;
    const foncierPct    = (foncier / total) * 100;
    const foncierOk     = foncierPct <= foncierLimit;
    const foncierOk5M   = foncier <= 5_000_000;
    const foncierEligible = foncierOk || foncierOk5M;

    // Montants éligibles (toutes dépenses obligatoirement incluses, éligibilité selon règles)
    const fraisEligibleAmt   = fraisEligible   ? frais       : 0;
    const foncierEligibleAmt = foncierEligible ? foncier     : 0;
    const constrEligibleAmt  = construction;
    const equipEligibleAmt   = equipements;

    const totalEligible    = fraisEligibleAmt + foncierEligibleAmt + constrEligibleAmt + equipEligibleAmt;
    const totalNonEligible = total - totalEligible;
    const tauxEligibilite  = (totalEligible / total) * 100;

    return {
      frais, foncier, construction, equipements, total,
      fraisPct, fraisOk5, fraisOk500k, fraisEligible,
      foncierLimit, foncierPct, foncierOk, foncierOk5M, foncierEligible,
      totalEligible, totalNonEligible, tauxEligibilite,
    };
  }, [form.repartition, showRepartition]);

  // ── Validation ──────────────────────────────────────────────────────────
  const handleCalculer = () => {
    const newErrors = {};
    const inv = parseFloat(form.investissement) || 0;
    const emp = parseInt(form.emplois)          || 0;

    if (!form.secteur)
      newErrors.secteur = t('err_secteur');

    if (!form.branche)
      newErrors.branche = t('err_branche');

    if (!form.province)
      newErrors.province = t('err_province');

    if (!form.investissement || inv <= 0)
      newErrors.investissement = t('err_invest_empty');
    else if (inv < 1_000_000)
      newErrors.investissement = t('err_invest_min');
    else if (inv >= 50_000_000)
      newErrors.investissement = t('err_invest_max');

    if (!form.emplois || emp < 1)
      newErrors.emplois = t('err_emplois');

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setCalculated(true);
      // Save in background — result shown regardless of API outcome
      const r = calcPrimes(form);
      api.post('/public/prime-calculations', {
        secteur:        form.secteur,
        branche:        form.branche,
        province:       form.province,
        investissement: inv,
        emplois:        emp,
        pctEmploi:      r ? r.pctEmploi  : 0,
        pctTerrit:      r ? r.pctTerrit  : 0,
        pctPrio:        r ? r.pctPrio    : 0,
        pctTotal:       r ? r.pctTotal   : 0,
        montantTotal:   r ? r.montantTotal : 0,
        userEmail:      null,
      }).catch(() => {});
    } else {
      setCalculated(false);
    }
  };

  const handleReset = () => {
    setForm({
      secteur: '', branche: '', province: '',
      investissement: '', emplois: '', activitePrioritaire: false,
      repartition: { ...INITIAL_REPARTITION },
    });
    setErrors({});
    setCalculated(false);
  };

  const result = useMemo(() => {
    if (!calculated) return null;
    return calcPrimes(form);
  }, [form, calculated]);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.tag}>{t('calc_tag')}</span>
          <h2 className={styles.title}>{t('calc_title')}</h2>
          <div className={styles.divider} />
          <p className={styles.subtitle}>{t('calc_subtitle')}</p>
        </div>

        <div className={styles.layout}>

          {/* ── Formulaire ── */}
          <div className={styles.formCard}>

            {/* Étape 1 — Activité */}
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNum}>1</span>
                <h3>{t('calc_step1_title')}</h3>
              </div>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>{t('calc_secteur_label')} <span className={styles.req}>*</span></label>
                  <select
                    value={form.secteur}
                    onChange={set('secteur')}
                    className={errors.secteur ? styles.inputError : ''}
                  >
                    <option value="">{t('calc_select')}</option>
                    {Object.keys(SECTEURS_BRANCHES).map(s => (
                      <option key={s} value={s}>{isAr ? (SECTEURS_AR[s] || s) : s}</option>
                    ))}
                  </select>
                  {errors.secteur && <span className={styles.errorMsg}>⚠ {errors.secteur}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>{t('calc_branche_label')} <span className={styles.req}>*</span></label>
                  <select
                    value={form.branche}
                    onChange={set('branche')}
                    disabled={!form.secteur}
                    className={errors.branche ? styles.inputError : ''}
                  >
                    <option value="">{t('calc_select')}</option>
                    {branches.map(b => (
                      <option key={b} value={b}>{isAr ? (BRANCHES_AR[b] || b) : b}</option>
                    ))}
                  </select>
                  {errors.branche && <span className={styles.errorMsg}>⚠ {errors.branche}</span>}
                </div>
              </div>

              {form.branche && (
                <div className={`${styles.prioritaireBadge} ${estPrioritaire ? styles.prioritaireOui : styles.prioritaireNon}`}>
                  {estPrioritaire ? (
                    <><span className={styles.badgeIcon}></span> {t('calc_prioritaire_oui')}</>
                  ) : (
                    <><span className={styles.badgeIcon}>ℹ</span> {t('calc_prioritaire_non')}</>
                  )}
                </div>
              )}

              {estPrioritaire && (
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={form.activitePrioritaire}
                    onChange={set('activitePrioritaire')}
                  />
                  <span>{t('calc_include_prio')}</span>
                </label>
              )}
            </div>

            {/* Étape 2 — Localisation */}
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNum}>2</span>
                <h3>{t('calc_step2_title')}</h3>
              </div>
              <div className={styles.formGroup}>
                <label>{t('calc_province_label')} <span className={styles.req}>*</span></label>
                <select
                  value={form.province}
                  onChange={set('province')}
                  className={errors.province ? styles.inputError : ''}
                >
                  <option value="">{t('calc_select')}</option>
                  {Object.entries(PROVINCES_LSH).map(([p, cat]) => (
                    <option key={p} value={p}>
                      {t('province_option', { province: p, cat, pct: cat === 'A' ? '+10%' : '+15%' })}
                    </option>
                  ))}
                </select>
                {errors.province && <span className={styles.errorMsg}>⚠ {errors.province}</span>}
              </div>

              {form.province && (
                <div className={`${styles.categorieBadge} ${PROVINCES_LSH[form.province] === 'A' ? styles.catA : styles.catB}`}>
                  {t('province_badge_cat', {
                    province: form.province,
                    cat: PROVINCES_LSH[form.province],
                    pct: PROVINCES_LSH[form.province] === 'A' ? '10%' : '15%',
                  })}
                </div>
              )}
            </div>

            {/* Étape 3 — Projet */}
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <span className={styles.stepNum}>3</span>
                <h3>{t('calc_step3_title')}</h3>
              </div>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>{t('calc_invest_label')} <span className={styles.req}>*</span></label>
                  <input
                    type="number"
                    placeholder={t('calc_invest_placeholder')}
                    min="1000000"
                    max="49999999"
                    value={form.investissement}
                    onChange={set('investissement')}
                    className={errors.investissement ? styles.inputError : ''}
                  />
                  <span className={styles.hint}>{t('calc_invest_hint')}</span>
                  {errors.investissement && <span className={styles.errorMsg}>⚠ {errors.investissement}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label>{t('calc_emplois_label')} <span className={styles.req}>*</span></label>
                  <input
                    type="number"
                    placeholder={t('calc_emplois_placeholder')}
                    min="1"
                    value={form.emplois}
                    onChange={set('emplois')}
                    className={errors.emplois ? styles.inputError : ''}
                  />
                  <span className={styles.hint}>{t('calc_emplois_hint')}</span>
                  {errors.emplois && <span className={styles.errorMsg}>⚠ {errors.emplois}</span>}
                </div>
              </div>
            </div>

            {/* Étape 4 — Répartition de l'investissement (industrie & artisanat) */}
            {showRepartition && (
              <div className={styles.step}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepNum}>4</span>
                  <h3>{t('calc_step4_title')}</h3>
                </div>

                <p className={styles.hint}>{t('calc_step4_hint')}</p>

                <div className={styles.grid2}>

                  {/* Frais d'études */}
                  <div className={styles.repItem}>
                    <div className={styles.formGroup}>
                      <label>{t('calc_rep_frais_label')}</label>
                      <input
                        type="number"
                        placeholder="Ex: 150 000"
                        min="0"
                        value={form.repartition.fraisEtudes}
                        onChange={setRep('fraisEtudes')}
                      />
                    </div>
                    {rep && rep.total > 0 && rep.frais > 0 && (
                      <div className={styles.repChecks}>
                        <span className={rep.fraisOk5 ? styles.repOk : styles.repFail}>
                          {rep.fraisOk5 ? '✔' : '✘'} {t('calc_rep_frais_ok5', { pct: rep.fraisPct.toFixed(1) })}
                        </span>
                        <span className={rep.fraisOk500k ? styles.repOk : styles.repFail}>
                          {rep.fraisOk500k ? '✔' : '✘'} {t('calc_rep_frais_ok500k')}
                        </span>
                      </div>
                    )}
                    {rep && rep.frais > 0 && !rep.fraisEligible && (
                      <span className={styles.checkRowIneligible}>
                        ✗ {t('calc_rep_frais_ineligible')}
                      </span>
                    )}
                  </div>

                  {/* Foncier */}
                  <div className={styles.repItem}>
                    <div className={styles.formGroup}>
                      <label>{t('calc_rep_foncier_label')}</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="typeFoncier"
                            value="publique"
                            checked={form.repartition.typeFoncier === 'publique'}
                            onChange={setRep('typeFoncier')}
                          />
                          {t('calc_rep_foncier_pub')}
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="typeFoncier"
                            value="privée"
                            checked={form.repartition.typeFoncier === 'privée'}
                            onChange={setRep('typeFoncier')}
                          />
                          {t('calc_rep_foncier_priv')}
                        </label>
                      </div>
                      {form.repartition.typeFoncier === 'privée' && (
                        <input
                          type="number"
                          placeholder="Ex: 1 000 000"
                          min="0"
                          value={form.repartition.foncier}
                          onChange={setRep('foncier')}
                        />
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      {/*<label>Type de projet</label>
                      <select value={form.repartition.typeProjet} onChange={setRep('typeProjet')}>
                        <option value="">-- Sélectionner --</option>
                        <option value="Industriel">Industriel (limite ≤ 20%)</option>
                        <option value="Touristique">Touristique (limite ≤ 20%)</option>
                        <option value="Services">Services (limite ≤ 20%)</option>
                        <option value="Autre">Autre (limite ≤ 20%)</option>
                      </select> */}
                    </div>
                    {rep && rep.total > 0 && rep.foncier > 0 && rep.foncierLimit !== null && (
                      <div className={styles.repChecks}>
                        <span className={rep.foncierOk ? styles.repOk : styles.repFail}>
                          {rep.foncierOk ? '✔' : '✘'} {t('calc_rep_foncier_pct', { limit: rep.foncierLimit, pct: rep.foncierPct.toFixed(1) })}
                        </span>
                        {!rep.foncierOk && (
                          <span className={rep.foncierOk5M ? styles.repOk : styles.repFail}>
                            {rep.foncierOk5M ? '✔' : '✘'} {t('calc_rep_foncier_5m')}
                          </span>
                        )}
                      </div>
                    )}
                    {rep && rep.foncier > 0 && !rep.foncierEligible && (
                      <span className={styles.checkRowIneligible}>
                        ✗ {t('calc_rep_foncier_ineligible')}
                      </span>
                    )}
                  </div>

                  {/* Construction */}
                  <div className={styles.repItem}>
                    <div className={styles.formGroup}>
                      <label>{t('calc_rep_construction_label')}</label>
                      <input
                        type="number"
                        placeholder="Ex: 2 000 000"
                        min="0"
                        value={form.repartition.construction}
                        onChange={setRep('construction')}
                      />
                    </div>
                  </div>

                  {/* Équipements */}
                  <div className={styles.repItem}>
                    <div className={styles.formGroup}>
                      <label>{t('calc_rep_equipements_label')}</label>
                      <input
                        type="number"
                        placeholder="Ex: 3 000 000"
                        min="0"
                        value={form.repartition.equipements}
                        onChange={setRep('equipements')}
                      />
                    </div>
                  </div>
                </div>

                {/* Alertes automatiques */}
                {rep && rep.total > 0 && (
                  <div className={styles.repAlerts}>
                    {!rep.fraisOk5 && rep.fraisOk500k && (
                      <div className={styles.alertWarn}>
                        {t('calc_alert_frais_warn', { pct: rep.fraisPct.toFixed(1) })}
                      </div>
                    )}
                    {!rep.fraisEligible && (
                      <div className={styles.alertError}>
                        {t('calc_alert_frais_error', { pct: rep.fraisPct.toFixed(1), montant: formatMAD(rep.frais) })}
                      </div>
                    )}
                    {rep.foncierLimit !== null && !rep.foncierOk && rep.foncierOk5M && (
                      <div className={styles.alertWarn}>
                        {t('calc_alert_foncier_warn', { limit: rep.foncierLimit, pct: rep.foncierPct.toFixed(1) })}
                      </div>
                    )}
                    {rep.foncierLimit !== null && !rep.foncierEligible && (
                      <div className={styles.alertError}>
                        {t('calc_alert_foncier_error', { limit: rep.foncierLimit, pct: rep.foncierPct.toFixed(1), montant: formatMAD(rep.foncier) })}
                      </div>
                    )}
                    {rep.totalNonEligible > 0 && (
                      <div className={styles.alertWarn}>
                        {t('calc_alert_non_eligible', { montant: formatMAD(rep.totalNonEligible) })}
                      </div>
                    )}
                  </div>
                )}

                {/* Résumé automatique */}
                {rep && rep.total > 0 && (
                  <div className={styles.repSummary}>
                    <div className={styles.repSummaryTitle}>{t('calc_rep_summary_title')}</div>
                    <div className={styles.repSummaryGrid}>
                      <div className={styles.repSummaryItem}>
                        <span>{t('calc_rep_total')}</span>
                        <strong>{formatMAD(rep.total)}</strong>
                      </div>
                      <div className={styles.repSummaryItem}>
                        <span>{t('calc_rep_eligible')}</span>
                        <strong className={styles.eligibleAmount}>{formatMAD(rep.totalEligible)}</strong>
                      </div>
                      <div className={styles.repSummaryItem}>
                        <span>{t('calc_rep_non_eligible')}</span>
                        <strong className={styles.nonEligibleAmount}>{formatMAD(rep.totalNonEligible)}</strong>
                      </div>
                      <div className={styles.repSummaryItem}>
                        <span>{t('calc_rep_taux')}</span>
                        <strong>{rep.tauxEligibilite.toFixed(1)}%</strong>
                      </div>
                    </div>
                    <div className={styles.eligibiliteBar}>
                      <div
                        className={styles.eligibiliteBarFill}
                        style={{ width: `${rep.tauxEligibilite}%` }}
                      />
                    </div>
                    <div className={styles.eligibiliteBarLabels}>
                      <span className={styles.eligibleLabel}>{t('calc_rep_eligible_label')}</span>
                      <span className={styles.eligibiliteBarPct}>{rep.tauxEligibilite.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Boutons */}
            <div className={styles.actions}>
              <button className={styles.btnSecondary} onClick={handleReset}>
                {t('calc_btn_reset')}
              </button>
              <button className={styles.btnPrimary} onClick={handleCalculer}>
                {t('calc_btn_calc')}
              </button>
            </div>
          </div>

          {/* ── Résultats ── */}
          <div className={styles.resultPanel}>
            {!result ? (
              <div className={styles.resultEmpty}>
                <div className={styles.emptyIcon}></div>
                <p>{t('calc_result_empty_text')}<br /><strong>{t('calc_result_empty_cta')}</strong></p>
                <p className={styles.emptyNote}>{t('calc_result_empty_note')}</p>
              </div>
            ) : (
              <div className={styles.resultContent}>

                {/* Total */}
                <div className={styles.totalBox}>
                  <div className={styles.totalLabel}>{t('calc_total_label')}</div>
                  <div className={styles.totalAmount}>{formatMAD(result.montantTotal)}</div>
                  <div className={styles.totalPct}>{result.pctTotal}% {t('calc_total_pct')}</div>
                  <div className={styles.totalBar}>
                    <div className={styles.totalBarFill} style={{ width: `${(result.pctTotal / 30) * 100}%` }} />
                  </div>
                  <div className={styles.totalMax}>{t('calc_plafond')}</div>
                </div>

                {/* Détail 3 primes */}
                <div className={styles.primesDetail}>

                  <div className={`${styles.primeItem} ${result.pctEmploi > 0 ? styles.primeItemActive : styles.primeItemInactive}`}>
                    <div className={styles.primeItemHeader}>
                      <span className={styles.primeItemIcon}><FontAwesomeIcon icon={faHelmetSafety} /></span>
                      <div>
                        <div className={styles.primeItemTitle}>{t('calc_prime_emploi_title')}</div>
                        <div className={styles.primeItemSub}>
                          {t('calc_ratio_label')} : {result.ratio} {t('calc_emplois_mmad')} —{' '}
                          {result.ratioEligible
                            ? <span className={styles.ok}>{t('calc_eligible')}</span>
                            : <span className={styles.ko}>{t('calc_ratio_insuffisant', { min: result.seuilMin })}</span>
                          }
                        </div>
                      </div>
                      <div className={styles.primeItemPct}>{result.pctEmploi}%</div>
                    </div>
                    <div className={styles.primeItemBar}>
                      <div style={{ width: `${(result.pctEmploi / 10) * 100}%` }} />
                    </div>
                    <div className={styles.primeItemAmount}>{formatMAD(result.montantEmploi)}</div>
                  </div>

                  <div className={`${styles.primeItem} ${result.pctTerrit > 0 ? styles.primeItemActive : styles.primeItemInactive}`}>
                    <div className={styles.primeItemHeader}>
                      <span className={styles.primeItemIcon}><FontAwesomeIcon icon={faMap} /></span>
                      <div>
                        <div className={styles.primeItemTitle}>{t('calc_prime_territ_title')}</div>
                        <div className={styles.primeItemSub}>
                          {t('calc_province_label_result')} {form.province} —{' '}
                          {result.categorie
                            ? <span className={styles.ok}>{t('calc_cat_ok', { cat: result.categorie })}</span>
                            : <span className={styles.ko}>{t('calc_hors_cat')}</span>
                          }
                        </div>
                      </div>
                      <div className={styles.primeItemPct}>{result.pctTerrit}%</div>
                    </div>
                    <div className={styles.primeItemBar}>
                      <div style={{ width: `${(result.pctTerrit / 15) * 100}%` }} />
                    </div>
                    <div className={styles.primeItemAmount}>{formatMAD(result.montantTerrit)}</div>
                  </div>

                  <div className={`${styles.primeItem} ${result.pctPrio > 0 ? styles.primeItemActive : styles.primeItemInactive}`}>
                    <div className={styles.primeItemHeader}>
                      <span className={styles.primeItemIcon}><FontAwesomeIcon icon={faStar} /></span>
                      <div>
                        <div className={styles.primeItemTitle}>{t('calc_prime_prio_title')}</div>
                        <div className={styles.primeItemSub}>
                          {result.estPrioritaire
                            ? form.activitePrioritaire
                              ? <span className={styles.ok}>{t('calc_prio_incluse')}</span>
                              : <span className={styles.warn}>{t('calc_prio_non_cochee')}</span>
                            : <span className={styles.ko}>{t('calc_non_prioritaire')}</span>
                          }
                        </div>
                      </div>
                      <div className={styles.primeItemPct}>{result.pctPrio}%</div>
                    </div>
                    <div className={styles.primeItemBar}>
                      <div style={{ width: `${(result.pctPrio / 10) * 100}%` }} />
                    </div>
                    <div className={styles.primeItemAmount}>{formatMAD(result.montantPrio)}</div>
                  </div>
                </div>

                {/* Récap */}
                <div className={styles.recap}>
                  <div className={styles.recapTitle}>{t('calc_recap_title')}</div>
                  <div className={styles.recapGrid}>
                    <div className={styles.recapItem}>
                      <span>{t('calc_recap_primable')}</span>
                      <strong>{formatMAD(result.primable)}</strong>
                    </div>
                    <div className={styles.recapItem}>
                      <span>{t('calc_recap_secteur')}</span>
                      <strong>{isAr ? (SECTEURS_AR[form.secteur] || form.secteur) : form.secteur}</strong>
                    </div>
                    <div className={styles.recapItem}>
                      <span>{t('calc_recap_branche')}</span>
                      <strong>{isAr ? (BRANCHES_AR[form.branche] || form.branche) : form.branche}</strong>
                    </div>
                    <div className={styles.recapItem}>
                      <span>{t('calc_recap_province')}</span>
                      <strong>{form.province} ({t('calc_recap_cat')} {result.categorie || t('calc_recap_aucune')})</strong>
                    </div>
                  </div>
                </div>

                <p className={styles.disclaimer}>{t('calc_disclaimer')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
