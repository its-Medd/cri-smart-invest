import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Styles/Dashboard.module.css";
import LogoTPME from "./Logotpme.jsx";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faCalculator, faCircleCheck, faClipboardList, faXmark } from "@fortawesome/free-solid-svg-icons";

// ── Helpers ────────────────────────────────────────────────────────────────
function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMad(value) {
  return `${toNumber(value).toLocaleString("fr-FR")} MAD`;
}

function calcPct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

const EMPTY_ROWS = [];
const EMPTY_CONNEXION_STATS = {
  totalConnexions: 0,
  actifs: 0,
  inactifs: 0,
};
const EMPTY_PRIME_STATS = {
  totalCalculs: 0,
  totalDistribue: 0,
  moyennePrime: 0,
};
const EMPTY_ELIGIBILITY_STATS = {
  total: 0,
  eligible: 0,
  notEligible: 0,
};

// ── Donut Chart Component ──────────────────────────────────────────────────
function DonutChart({ segments, size = 140, strokeWidth = 22 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;

  let offset = 0;
  const arcs = segments.map((s) => {
    const dash = (s.pct / 100) * circ;
    const arc = { ...s, dash, gap: circ - dash, offset: circ - offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={a.offset}
          strokeLinecap="butt"
          style={{ transition: "stroke-dasharray .6s ease, stroke-dashoffset .6s ease" }}
        />
      ))}
    </svg>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, color }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statDot} style={{ background: color }} />
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {delta && <span className={styles.statDelta}>{delta}</span>}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("connexions");
  const [search, setSearch] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEligibility, setSelectedEligibility] = useState(null);
  const [questionnairesData, setQuestionnairesData] = useState([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
  const [primesCalcData, setPrimesCalcData] = useState([]);

  const user = authUser || JSON.parse(localStorage.getItem("user") || '{"name":"Admin CRI"}');

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get('/employee/dashboard');
        setDashboardData(response.data);
      } catch (err) {
        setError(err.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        const res = await api.get('/employee/questionnaire-submissions');
        setQuestionnairesData(res.data || []);
      } catch {
        // silently keep empty list
      }
    };
    fetchQuestionnaires();
  }, []);

  useEffect(() => {
    api.get('/employee/prime-calculations')
      .then(res => setPrimesCalcData(res.data || []))
      .catch(() => {});
  }, []);

  const connexionStats   = dashboardData?.connexionStats   || EMPTY_CONNEXION_STATS;
  {/*const primeStats       = dashboardData?.primeStats       || EMPTY_PRIME_STATS;*/}
  const eligibilityStats = dashboardData?.eligibilityStats || EMPTY_ELIGIBILITY_STATS;

  const connexionsData  = dashboardData?.connexions    || EMPTY_ROWS;
  const eligibilityData = dashboardData?.eligibilities || EMPTY_ROWS;

  const tabs = [
    { key: "connexions",      label: "Connexions",       icon: faUsers },
    { key: "primes",          label: "Calculs Prime",    icon: faCalculator },
    { key: "eligibility",     label: "Eligibilité",      icon: faCircleCheck },
    { key: "questionnaires",  label: "Questionnaires",   icon: faClipboardList },
  ];

  const filterFn = (row) =>
    !search ||
    row.nom?.toLowerCase().includes(search.toLowerCase()) ||
    (row.email || row.matricule || "").toLowerCase().includes(search.toLowerCase());

  const connexions = connexionsData.filter(filterFn);
  const primes = primesCalcData.filter(row =>
    !search ||
    row.secteur?.toLowerCase().includes(search.toLowerCase()) ||
    row.branche?.toLowerCase().includes(search.toLowerCase()) ||
    row.province?.toLowerCase().includes(search.toLowerCase())
  );
  const questionnaires = questionnairesData.filter((row) =>
    !search ||
    row.nom?.toLowerCase().includes(search.toLowerCase()) ||
    row.email?.toLowerCase().includes(search.toLowerCase()) ||
    row.intituleProjet?.toLowerCase().includes(search.toLowerCase()) ||
    row.secteurActivite?.toLowerCase().includes(search.toLowerCase())
  );
  const eligibilities = eligibilityData.filter((row) =>
    !search ||
    row.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    row.ice?.toLowerCase().includes(search.toLowerCase()) ||
    row.rc?.toLowerCase().includes(search.toLowerCase()) ||
    row.sector?.toLowerCase().includes(search.toLowerCase())
  );

  const connexionStatuts = useMemo(() => {
    const total = toNumber(connexionStats.totalConnexions);
    const actifs = toNumber(connexionStats.actifs);
    const inactifs = toNumber(connexionStats.inactifs);

    return [
      { label: "Actifs", pct: calcPct(actifs, total), color: "#10b981" },
      { label: "Inactifs", pct: calcPct(inactifs, total), color: "#94a3b8" },
    ];
  }, [connexionStats]);

  const eligibilityStatuts = useMemo(() => {
    const total = toNumber(eligibilityStats.total);
    const eligible = toNumber(eligibilityStats.eligible);
    const notEligible = toNumber(eligibilityStats.notEligible);

    return [
      { label: "Éligibles", pct: calcPct(eligible, total), color: "#10b981" },
      { label: "Non éligibles", pct: calcPct(notEligible, total), color: "#ef4444" },
    ];
  }, [eligibilityStats]);

  if (loading) {
    return <div className={styles.shell}>Chargement du dashboard...</div>;
  }

  if (error) {
    return <div className={styles.shell}>Erreur : {error}</div>;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarLogo}>
            <LogoTPME width={42} height={42} />
          </div>
          <span className={styles.sidebarTitle}>TPME invest Laayoune</span>
        </div>

        <p className={styles.sideNavLabel}>NAVIGATION</p>
        <nav className={styles.sideNav}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.navItem} ${activeTab === t.key ? styles.navActive : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className={styles.navIcon}><FontAwesomeIcon icon={t.icon} /></span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarUser}>
          <div className={styles.avatar}>
            {(user?.name || user?.email || "A")[0].toUpperCase()}
          </div>
          <div>
            <p className={styles.userName}>{user?.name || "Administrateur"}</p>
            <p className={styles.userRole}>CRI — Employé</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            margin: "0.75rem 1rem 1rem",
            padding: "0.5rem 0.9rem",
            background: "transparent",
            border: "1.5px solid #e2e8f0",
            borderRadius: "8px",
            color: "#64748b",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            width: "calc(100% - 2rem)",
          }}
        >
          Déconnexion
        </button>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>
              {tabs.find((t) => t.key === activeTab)?.label}
            </h1>
            <p className={styles.pageDate}>
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className={styles.searchWrap}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {activeTab === "connexions" && (
          <div className={styles.content}>
            <div className={styles.statsRow}>
              <StatCard label="Total connexions" value={connexionStats.totalConnexions} color="#10b981" />
              <StatCard label="Actifs" value={connexionStats.actifs} color="#10b981" />
              <StatCard label="Inactifs" value={connexionStats.inactifs} color="#94a3b8" />
            </div>

            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <p className={styles.chartTitle}>Répartition des sessions</p>
                <div className={styles.donutWrap}>
                  <DonutChart segments={connexionStatuts} />
                  <div className={styles.donutCenter}>
                    <span className={styles.donutBig}>{connexionStats.totalConnexions}</span>
                    <span className={styles.donutSub}>sessions</span>
                  </div>
                </div>
                <div className={styles.legend}>
                  {connexionStatuts.map((s) => (
                    <div key={s.label} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: s.color }} />
                      <span>{s.label}</span>
                      <span className={styles.legendPct}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
                <p className={styles.chartTitle}>Activité récente</p>
                <div className={styles.activityList}>
                  {connexionsData.slice(0, 5).map((c) => (
                    <div key={c.id} className={styles.activityItem}>
                      <div className={styles.activityAvatar}>{c.nom?.[0] || "?"}</div>
                      <div className={styles.activityInfo}>
                        <p className={styles.activityName}>{c.nom}</p>
                        <p className={styles.activityMeta}>{c.email}</p>
                      </div>
                      <div className={styles.activityRight}>
                        <span className={`${styles.badge} ${c.statut === "actif" ? styles.badgeGreen : styles.badgeGray}`}>
                          {c.statut}
                        </span>
                        <p className={styles.activityDate}>{c.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.tableCard}>
              <p className={styles.tableTitle}>Historique complet des connexions</p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Date & Heure</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {connexions.map((c, i) => (
                    <tr key={c.id}>
                      <td className={styles.tdMuted}>{String(i + 1).padStart(2, "0")}</td>
                      <td className={styles.tdBold}>{c.nom}</td>
                      <td className={styles.tdMuted}>{c.email}</td>
                      <td>{c.date}</td>
                      <td>
                        <span className={`${styles.badge} ${c.statut === "actif" ? styles.badgeGreen : styles.badgeGray}`}>
                          {c.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {connexions.length === 0 && (
                    <tr>
                      <td colSpan="5" className={styles.tdMuted} style={{ textAlign: "center", padding: "18px" }}>
                        Aucune connexion trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "primes" && (() => {
          const totalCalcs   = primesCalcData.length;
          const totalMontant = primesCalcData.reduce((s, p) => s + toNumber(p.montantTotal), 0);
          const moyenne      = totalCalcs > 0 ? totalMontant / totalCalcs : 0;

          const counts = primesCalcData.reduce((acc, p) => {
            const key = p.province || "Autre";
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
          const colors = ["#2563eb", "#8b5cf6", "#0ea5e9", "#10b981"];
          const provinceRepartition = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count], i) => ({
              label,
              pct: calcPct(count, totalCalcs),
              color: colors[i % colors.length],
            }));

          return (
            <div className={styles.content}>
              <div className={styles.statsRow}>
                <StatCard label="Calculs effectués"  value={totalCalcs}           color="#2563eb" />
                <StatCard label="Total des primes"    value={formatMad(totalMontant)} color="#8b5cf6" />
                <StatCard label="Moyenne par calcul"  value={formatMad(moyenne)}   color="#0ea5e9" />
              </div>

              <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                  <p className={styles.chartTitle}>Répartition par province</p>
                  <div className={styles.donutWrap}>
                    <DonutChart segments={provinceRepartition} />
                    <div className={styles.donutCenter}>
                      <span className={styles.donutBig}>{totalCalcs}</span>
                      <span className={styles.donutSub}>calculs</span>
                    </div>
                  </div>
                  <div className={styles.legend}>
                    {provinceRepartition.map((s) => (
                      <div key={s.label} className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ background: s.color }} />
                        <span>{s.label}</span>
                        <span className={styles.legendPct}>{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
                  <p className={styles.chartTitle}>Simulations récentes</p>
                  <div className={styles.activityList}>
                    {primesCalcData.slice(0, 5).map((p) => (
                      <div key={p.id} className={styles.activityItem}>
                        <div className={styles.activityAvatar} style={{ background: "#ede9fe", color: "#7c3aed" }}>
                          {(p.province || "?")[0]}
                        </div>
                        <div className={styles.activityInfo}>
                          <p className={styles.activityName}>{p.branche || p.secteur || "-"}</p>
                          <p className={styles.activityMeta}>{p.province} · {p.pctTotal ?? 0}%</p>
                        </div>
                        <div className={styles.activityRight}>
                          <span className={styles.primeMontant}>{formatMad(p.montantTotal)}</span>
                          <p className={styles.activityDate}>{p.date}</p>
                        </div>
                      </div>
                    ))}
                    {primesCalcData.length === 0 && (
                      <p className={styles.tdMuted}>Aucune simulation enregistrée.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.tableCard}>
                <p className={styles.tableTitle}>Historique des simulations visiteurs</p>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Secteur</th>
                      <th>Branche</th>
                      <th>Province</th>
                      <th>Investissement</th>
                      <th>Emplois</th>
                      <th>Prime %</th>
                      <th>Montant prime</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {primes.map((p, i) => (
                      <tr key={p.id}>
                        <td className={styles.tdMuted}>{String(i + 1).padStart(2, "0")}</td>
                        <td className={styles.tdBold}>{p.secteur || "-"}</td>
                        <td className={styles.tdMuted} style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.branche || "-"}</td>
                        <td>{p.province || "-"}</td>
                        <td className={styles.tdBlue}>{formatMad(p.investissement)}</td>
                        <td>{p.emplois ?? "-"}</td>
                        <td>
                          <span className={styles.typeTag}>{p.pctTotal ?? 0}%</span>
                        </td>
                        <td className={styles.tdBlue}>{formatMad(p.montantTotal)}</td>
                        <td>{p.date}</td>
                      </tr>
                    ))}
                    {primes.length === 0 && (
                      <tr>
                        <td colSpan="9" className={styles.tdMuted} style={{ textAlign: "center", padding: "18px" }}>
                          Aucune simulation trouvée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {activeTab === "eligibility" && (
          <div className={styles.content}>
            <div className={styles.statsRow}>
              <StatCard label="Entreprises vérifiées" value={eligibilityStats.total} color="#0ea5e9" />
              <StatCard label="Éligibles" value={eligibilityStats.eligible} color="#10b981" />
              <StatCard label="Non éligibles" value={eligibilityStats.notEligible} color="#ef4444" />
            </div>

            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <p className={styles.chartTitle}>Répartition globale</p>
                <div className={styles.donutWrap}>
                  <DonutChart segments={eligibilityStatuts} />
                  <div className={styles.donutCenter}>
                    <span className={styles.donutBig}>{eligibilityStats.total}</span>
                    <span className={styles.donutSub}>entreprises</span>
                  </div>
                </div>
                <div className={styles.legend}>
                  {eligibilityStatuts.map((s) => (
                    <div key={s.label} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: s.color }} />
                      <span>{s.label}</span>
                      <span className={styles.legendPct}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
                <p className={styles.chartTitle}>Dernières vérifications</p>
                <div className={styles.activityList}>
                  {eligibilityData.slice(0, 5).map((item) => (
                    <div key={item.id} className={styles.activityItem}>
                      <div
                        className={styles.activityAvatar}
                        style={{
                          background: item.eligible ? "#dcfce7" : "#fee2e2",
                          color: item.eligible ? "#166534" : "#991b1b",
                        }}
                      >
                        {item.companyName?.[0] || "E"}
                      </div>
                      <div className={styles.activityInfo}>
                        <p className={styles.activityName}>{item.companyName}</p>
                        <p className={styles.activityMeta}>{item.legalForm || "Forme non renseignée"} · {item.sector || "Secteur non renseigné"}</p>
                      </div>
                      <div className={styles.activityRight}>
                        <span className={`${styles.badge} ${item.eligible ? styles.badgeGreen : styles.badgeRed}`}>
                          {item.status}
                        </span>
                        <p className={styles.activityDate}>{item.date}</p>
                      </div>
                    </div>
                  ))}
                  {eligibilityData.length === 0 && (
                    <p className={styles.tdMuted}>Aucune vérification sauvegardée.</p>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.tableCard}>
              <p className={styles.tableTitle}>Entreprises éligibles et non éligibles</p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Visiteur</th>
                    <th>Entreprise</th>
                    <th>Forme</th>
                    <th>ICE</th>
                    <th>Secteur</th>
                    <th>Investissement</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibilities.map((item, i) => (
                    <tr key={item.id}>
                      <td className={styles.tdMuted}>{String(i + 1).padStart(2, "0")}</td>
                      <td className={styles.tdMuted}>{item.userEmail || "-"}</td>
                      <td className={styles.tdBold}>{item.companyName}</td>
                      <td className={styles.tdMuted}>{item.legalForm || "-"}</td>
                      <td className={styles.tdMuted}>{item.ice || "-"}</td>
                      <td>{item.sector || "-"}</td>
                      <td className={styles.tdBlue}>{formatMad(item.investmentAmount)}</td>
                      <td>
                        <span className={`${styles.badge} ${item.eligible ? styles.badgeGreen : styles.badgeRed}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button className={styles.actionBtn} type="button" onClick={() => setSelectedEligibility(item)}>
                          Voir informations
                        </button>
                      </td>
                    </tr>
                  ))}
                  {eligibilities.length === 0 && (
                    <tr>
                      <td colSpan="9" className={styles.tdMuted} style={{ textAlign: "center", padding: "18px" }}>
                        Aucune entreprise trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedEligibility && (
              <div className={styles.modalOverlay} onClick={() => setSelectedEligibility(null)}>
                <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
                  <div className={styles.detailHeader}>
                    <div>
                      <p className={styles.tableTitle}>Informations détaillées</p>
                      <h2 className={styles.detailTitle}>{selectedEligibility.companyName}</h2>
                    </div>
                    <button className={styles.actionBtn} type="button" onClick={() => setSelectedEligibility(null)}>
                      <FontAwesomeIcon icon={faXmark} /> Fermer
                    </button>
                  </div>
                  <div className={styles.detailGrid}>
                    <div><span>Visiteur</span><strong>{selectedEligibility.userEmail || "-"}</strong></div>
                    <div><span>Forme juridique</span><strong>{selectedEligibility.legalForm || "-"}</strong></div>
                    <div><span>RC</span><strong>{selectedEligibility.rc || "-"}</strong></div>
                    <div><span>ICE</span><strong>{selectedEligibility.ice || "-"}</strong></div>
                    <div><span>Nouvelle entreprise</span><strong>{selectedEligibility.newCompany ? "Oui" : "Non"}</strong></div>
                    <div><span>Chiffre d'affaires</span><strong>{formatMad(selectedEligibility.chiffreAffaires)}</strong></div>
                    <div><span>Capital public</span><strong>{selectedEligibility.publicCapitalPercent != null ? `${selectedEligibility.publicCapitalPercent}%` : "-"}</strong></div>
                    <div><span>Actionnaire public</span><strong>{selectedEligibility.hasPublicShareholder ? "Oui" : "Non"}</strong></div>
                    <div><span>Investissement</span><strong>{formatMad(selectedEligibility.investmentAmount)}</strong></div>
                    <div><span>Fonds propres</span><strong>{formatMad(selectedEligibility.ownFunds)}</strong></div>
                    <div><span>Emplois créés</span><strong>{selectedEligibility.jobs ?? "-"}</strong></div>
                    <div><span>Secteur</span><strong>{selectedEligibility.sector || "-"}</strong></div>
                    <div><span>Résultat</span>
                      <strong>
                        <span className={`${styles.badge} ${selectedEligibility.eligible ? styles.badgeGreen : styles.badgeRed}`}>
                          {selectedEligibility.status}
                        </span>
                      </strong>
                    </div>
                  </div>
                  {selectedEligibility.details && (
                    <div className={styles.detailChecks}>
                      <p style={{ fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>Critères d'éligibilité</p>
                      {selectedEligibility.details.split("\n").map((detail, index) => (
                        <p key={index}>{detail}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "questionnaires" && (() => {
          const totalQ   = questionnaires.length;
          const eligible = questionnaires.filter(q => q.eligible).length;
          const totalPrime = questionnaires.reduce((s, q) => s + toNumber(q.primeTotal), 0);

          return (
            <div className={styles.content}>
              <div className={styles.statsRow}>
                <StatCard label="Questionnaires soumis" value={totalQ}     color="#0ea5e9" />
                <StatCard label="Projets éligibles"      value={eligible}   color="#10b981" />
                <StatCard label="Total primes estimées"  value={formatMad(totalPrime)} color="#8b5cf6" />
              </div>

              <div className={styles.tableCard}>
                <p className={styles.tableTitle}>Soumissions visiteurs</p>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Projet</th>
                      <th>Secteur</th>
                      <th>Investissement</th>
                      <th>Éligibilité</th>
                      <th>Prime estimée</th>
                      <th>Date</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionnaires.map((q, i) => (
                      <tr key={q.id || i}>
                        <td className={styles.tdMuted}>{String(i + 1).padStart(2, "0")}</td>
                        <td className={styles.tdBold}>{q.nom || "-"}</td>
                        <td className={styles.tdMuted}>{q.email || "-"}</td>
                        <td>{q.intituleProjet || "-"}</td>
                        <td>{q.secteurActivite || "-"}</td>
                        <td className={styles.tdBlue}>{formatMad(q.investTotal)}</td>
                        <td>
                          <span className={`${styles.badge} ${q.eligible ? styles.badgeGreen : styles.badgeRed}`}>
                            {q.eligible ? "Éligible" : "Non éligible"}
                          </span>
                        </td>
                        <td className={styles.tdBlue}>{formatMad(q.primeTotal)}</td>
                        <td>{q.submittedAt ? new Date(q.submittedAt).toLocaleDateString("fr-FR") : "-"}</td>
                        <td>
                          <button className={styles.actionBtn} type="button" onClick={() => setSelectedQuestionnaire(q)}>
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    ))}
                    {questionnaires.length === 0 && (
                      <tr>
                        <td colSpan="10" className={styles.tdMuted} style={{ textAlign: "center", padding: "18px" }}>
                          Aucun questionnaire soumis pour l'instant.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {selectedQuestionnaire && (
                <div className={styles.modalOverlay} onClick={() => setSelectedQuestionnaire(null)}>
                  <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
                    <div className={styles.detailHeader}>
                      <div>
                        <p className={styles.tableTitle}>Questionnaire complet</p>
                        <h2 className={styles.detailTitle}>{selectedQuestionnaire.intituleProjet || "Soumission"}</h2>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span className={`${styles.badge} ${selectedQuestionnaire.eligible ? styles.badgeGreen : styles.badgeRed}`} style={{ fontSize: "0.85rem", padding: "4px 12px" }}>
                          {selectedQuestionnaire.eligible ? "✓ Éligible" : "✗ Non éligible"}
                        </span>
                        <button className={styles.actionBtn} type="button" onClick={() => setSelectedQuestionnaire(null)}>✕ Fermer</button>
                      </div>
                    </div>

                    <p className={styles.chartTitle} style={{ margin: "0 0 8px" }}>Informations personnelles</p>
                    <div className={styles.detailGrid}>
                      <div><span>Nom complet</span><strong>{selectedQuestionnaire.nom || "-"}</strong></div>
                      <div><span>Téléphone</span><strong>{selectedQuestionnaire.telephone || "-"}</strong></div>
                      <div><span>Email</span><strong>{selectedQuestionnaire.email || "-"}</strong></div>
                      <div><span>Ville</span><strong>{selectedQuestionnaire.ville || "-"}</strong></div>
                      <div><span>Niveau d'études</span><strong>{selectedQuestionnaire.niveauEtudes || "-"}</strong></div>
                      <div><span>Projet antérieur</span><strong>{selectedQuestionnaire.projetAuparavant || "-"}</strong></div>
                    </div>

                    <p className={styles.chartTitle} style={{ margin: "16px 0 8px" }}>Entreprise</p>
                    <div className={styles.detailGrid}>
                      <div><span>Entreprise enregistrée</span><strong>{selectedQuestionnaire.entrepriseEnregistree || "-"}</strong></div>
                      <div><span>Nom entreprise</span><strong>{selectedQuestionnaire.nomEntreprise || "-"}</strong></div>
                      <div><span>Forme juridique</span><strong>{selectedQuestionnaire.formeJuridique || "-"}</strong></div>
                      <div><span>Date de création</span><strong>{selectedQuestionnaire.dateCreation || "-"}</strong></div>
                      <div><span>ICE</span><strong>{selectedQuestionnaire.ice || "-"}</strong></div>
                      <div><span>Secteur actuel</span><strong>{selectedQuestionnaire.secteurActuel || "-"}</strong></div>
                    </div>

                    <p className={styles.chartTitle} style={{ margin: "16px 0 8px" }}>Projet</p>
                    <div className={styles.detailGrid}>
                      <div><span>Type de projet</span><strong>{selectedQuestionnaire.typeProjet || "-"}</strong></div>
                      <div><span>Secteur d'activité</span><strong>{selectedQuestionnaire.secteurActivite || "-"}</strong></div>
                      <div><span>Région</span><strong>{selectedQuestionnaire.regionProjet || "-"}</strong></div>
                      <div><span>Ville du projet</span><strong>{selectedQuestionnaire.villeProjet || "-"}</strong></div>
                      <div><span>Stade d'avancement</span><strong>{selectedQuestionnaire.stadeAvancement || "-"}</strong></div>
                    </div>
                    {selectedQuestionnaire.descriptionProjet && (
                      <div className={styles.detailChecks} style={{ marginTop: "8px" }}>
                        <p><strong>Description :</strong> {selectedQuestionnaire.descriptionProjet}</p>
                      </div>
                    )}

                    <p className={styles.chartTitle} style={{ margin: "16px 0 8px" }}>Données financières & emploi</p>
                    <div className={styles.detailGrid}>
                      <div><span>Investissement total</span><strong>{formatMad(selectedQuestionnaire.investTotal)}</strong></div>
                      <div><span>Financement propre</span><strong>{formatMad(selectedQuestionnaire.financPropre)}</strong></div>
                      <div><span>Emplois directs</span><strong>{selectedQuestionnaire.emploisDirects ?? "-"}</strong></div>
                      <div><span>Emplois stables</span><strong>{selectedQuestionnaire.emploisStables ?? "-"}</strong></div>
                      <div><span>Province (LSH)</span><strong>{selectedQuestionnaire.province23 || "-"}</strong></div>
                      <div><span>Activité prioritaire</span><strong>{selectedQuestionnaire.activitePrioritaire || "-"}</strong></div>
                      <div><span>Orientation projet</span><strong>{selectedQuestionnaire.orientationProjet || "-"}</strong></div>
                      <div><span>Compatibilité région</span><strong>{selectedQuestionnaire.compatibiliteRegion || "-"}</strong></div>
                    </div>

                    <p className={styles.chartTitle} style={{ margin: "16px 0 8px" }}>Besoins</p>
                    <div className={styles.detailGrid}>
                      <div><span>Besoin d'accompagnement</span><strong>{selectedQuestionnaire.besoinAccompagnement || "-"}</strong></div>
                      <div><span>Difficulté principale</span><strong>{selectedQuestionnaire.difficultePrincipale || "-"}</strong></div>
                    </div>

                    <p className={styles.chartTitle} style={{ margin: "16px 0 8px" }}>Résultats calculés</p>
                    <div className={styles.detailGrid}>
                      <div><span>Prime totale estimée</span><strong className={styles.tdBlue}>{formatMad(selectedQuestionnaire.primeTotal)}</strong></div>
                      <div><span>Taux total</span><strong>{selectedQuestionnaire.primePct ?? 0}%</strong></div>
                      <div><span>Prime emplois</span><strong>{selectedQuestionnaire.primeEmploi ?? 0}%</strong></div>
                      <div><span>Prime territoriale</span><strong>{selectedQuestionnaire.primeTerrit ?? 0}%</strong></div>
                      <div><span>Prime prioritaire</span><strong>{selectedQuestionnaire.primePrio ?? 0}%</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </main>
    </div>
  );
}
