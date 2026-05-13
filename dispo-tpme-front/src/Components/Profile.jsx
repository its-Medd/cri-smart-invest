import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import styles from "../Styles/Profile.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar, faHelmetSafety, faMap, faStar, faCircleCheck } from "@fortawesome/free-solid-svg-icons";


function initials(user) {
  const name = user?.name || user?.sub || "";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    || "?";
}

function formatMad(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "-";
  return `${n.toLocaleString("fr-FR")} MAD`;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [eligibilityChecks, setEligibilityChecks]   = useState([]);
  const [questionnaires, setQuestionnaires]         = useState([]);
  const [eligLoading, setEligLoading]               = useState(true);
  const [qLoading, setQLoading]                     = useState(true);
  const [selectedElig, setSelectedElig]             = useState(null);
  const [selectedQ, setSelectedQ]                   = useState(null);

  useEffect(() => {
    api
      .get("/user/eligibility-checks")
      .then((res) => setEligibilityChecks(res.data))
      .catch(() => {})
      .finally(() => setEligLoading(false));

    api
      .get("/user/questionnaire-submissions")
      .then((res) => setQuestionnaires(res.data))
      .catch(() => {})
      .finally(() => setQLoading(false));
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
  }

  const displayName  = user?.name  || user?.sub || "Visiteur";
  const displayEmail = user?.email || user?.sub || "";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* User card */}
        <div className={styles.userCard}>
          <div className={styles.avatar}>{initials(user)}</div>
          <div className={styles.userInfo}>
            <h2>{displayName}</h2>
            <p>{displayEmail}</p>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>

        {/* ── Questionnaires TPME ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Mes questionnaires TPME</h3>
            {!qLoading && <span className={styles.badge}>{questionnaires.length}</span>}
          </div>

          {qLoading && <div className={styles.loading}>Chargement…</div>}

          {!qLoading && questionnaires.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><FontAwesomeIcon icon={faChartBar} /></div>
              <p>Vous n'avez pas encore soumis de questionnaire TPME.</p>
              <Link to="/questionnaire" className={styles.btn}>Remplir le questionnaire</Link>
            </div>
          )}

          {!qLoading && questionnaires.length > 0 && (
            <div className={styles.cardsList}>
              {questionnaires.map((q) => (
                <div key={q.id} className={styles.qCard}>
                  {/* Row principale */}
                  <div className={styles.qMain}>
                    <div className={styles.qLeft}>
                      <p className={styles.dossierTitle}>
                        {q.intituleProjet || 'Projet sans titre'}
                      </p>
                      <div className={styles.dossierMeta}>
                        {q.secteurActivite && (
                          <span className={styles.metaItem}>
                            <strong>Secteur :</strong> {q.secteurActivite}
                          </span>
                        )}
                        {q.typeProjet && (
                          <span className={styles.metaItem}>
                            <strong>Type :</strong> {q.typeProjet}
                          </span>
                        )}
                        {q.investTotal > 0 && (
                          <span className={styles.metaItem}>
                            <strong>Investissement :</strong> {formatMad(q.investTotal)}
                          </span>
                        )}
                        <span className={styles.metaItem}>
                          <strong>Soumis le :</strong> {q.submittedAt}
                        </span>
                      </div>
                    </div>

                    <div className={styles.qRight}>
                      <span className={`${styles.statut} ${q.eligible ? styles.statutValide : styles.statutRejete}`}>
                        {q.eligible ? '✓ Éligible' : '✗ Non éligible'}
                      </span>
                      {q.primeTotal > 0 && (
                        <span className={styles.primeBadge}>
                          {formatMad(q.primeTotal)}
                        </span>
                      )}
                      <button
                        className={styles.detailBtn}
                        onClick={() => setSelectedQ(selectedQ?.id === q.id ? null : q)}
                      >
                        {selectedQ?.id === q.id ? 'Masquer' : 'Voir résultats'}
                      </button>
                    </div>
                  </div>

                  {/* Détail dépliable */}
                  {selectedQ?.id === q.id && (
                    <div className={styles.qDetail}>
                      {/* Bloc éligibilité */}
                      <div className={`${styles.qResultBox} ${q.eligible ? styles.qResultOk : styles.qResultKo}`}>
                        <div className={styles.qResultHead}>
                          <span className={`${styles.qResultBadge} ${q.eligible ? styles.qBadgeOk : styles.qBadgeKo}`}>
                            {q.eligible ? '✓' : '✗'}
                          </span>
                          <div>
                            <p className={styles.qResultTitle}>
                              {q.eligible ? 'Projet éligible au programme TPME' : 'Conditions non entièrement remplies'}
                            </p>
                            <p className={styles.qResultSub}>
                              {q.eligible
                                ? 'Vous pouvez déposer une demande auprès du CRI de votre région.'
                                : 'Ajustez votre projet pour satisfaire les critères requis.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bloc primes */}
                      {q.primeTotal > 0 && (
                        <div className={styles.qPrimesBox}>
                          <p className={styles.qPrimesTitle}>Primes estimées</p>
                          <div className={styles.qPrimesGrid}>
                            <div className={styles.qPrimeItem}>
                              <span className={styles.qPrimeLabel}><FontAwesomeIcon icon={faHelmetSafety} /> Emplois stables</span>
                              <span className={styles.qPrimePct}>{q.primeEmploi ?? 0}%</span>
                            </div>
                            <div className={styles.qPrimeItem}>
                              <span className={styles.qPrimeLabel}><FontAwesomeIcon icon={faMap} /> Prime territoriale</span>
                              <span className={styles.qPrimePct}>{q.primeTerrit ?? 0}%</span>
                            </div>
                            <div className={styles.qPrimeItem}>
                              <span className={styles.qPrimeLabel}><FontAwesomeIcon icon={faStar} /> Activités prioritaires</span>
                              <span className={styles.qPrimePct}>{q.primePrio ?? 0}%</span>
                            </div>
                            <div className={`${styles.qPrimeItem} ${styles.qPrimeTotal}`}>
                              <span className={styles.qPrimeLabel}>Prime totale ({q.primePct ?? 0}%)</span>
                              <span className={styles.qPrimePct}>{formatMad(q.primeTotal)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Infos projet */}
                      <div className={styles.eligGrid}>
                        {q.regionProjet && <div><span>Région</span><strong>{q.regionProjet}</strong></div>}
                        {q.province23  && <div><span>Province</span><strong>{q.province23}</strong></div>}
                        {q.stadeAvancement && <div><span>Stade</span><strong>{q.stadeAvancement}</strong></div>}
                        {q.emploisStables > 0 && <div><span>Emplois stables</span><strong>{q.emploisStables}</strong></div>}
                        {q.nomEntreprise && <div><span>Entreprise</span><strong>{q.nomEntreprise}</strong></div>}
                        {q.activitePrioritaire && <div><span>Activité prioritaire</span><strong>{q.activitePrioritaire}</strong></div>}
                        {q.orientationProjet && <div><span>Orientation</span><strong>{q.orientationProjet}</strong></div>}
                        {q.besoinAccompagnement && <div><span>Accompagnement</span><strong>{q.besoinAccompagnement}</strong></div>}
                      </div>

                      {q.descriptionProjet && (
                        <div className={styles.eligChecks}>
                          <p><strong>Description :</strong> {q.descriptionProjet}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Eligibility checks section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Mes vérifications d'éligibilité</h3>
            {!eligLoading && (
              <span className={styles.badge}>{eligibilityChecks.length}</span>
            )}
          </div>

          {eligLoading && <div className={styles.loading}>Chargement…</div>}

          {!eligLoading && eligibilityChecks.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><FontAwesomeIcon icon={faCircleCheck} /></div>
              <p>Vous n'avez pas encore effectué de vérification d'éligibilité.</p>
              <Link to="/eligibilite" className={styles.btn}>
                Vérifier mon éligibilité
              </Link>
            </div>
          )}

          {!eligLoading && eligibilityChecks.length > 0 && (
            <div className={styles.cardsList}>
              {eligibilityChecks.map((c) => (
                <div key={c.id} className={styles.eligCard}>
                  <div className={styles.eligMain}>
                    <p className={styles.dossierTitle}>{c.companyName || "Entreprise non renseignée"}</p>
                    <div className={styles.dossierMeta}>
                      {c.legalForm && (
                        <span className={styles.metaItem}>
                          <strong>Forme :</strong> {c.legalForm}
                        </span>
                      )}
                      {c.sector && (
                        <span className={styles.metaItem}>
                          <strong>Secteur :</strong> {c.sector}
                        </span>
                      )}
                      {c.investmentAmount > 0 && (
                        <span className={styles.metaItem}>
                          <strong>Investissement :</strong> {formatMad(c.investmentAmount)}
                        </span>
                      )}
                      <span className={styles.metaItem}>
                        <strong>Date :</strong> {c.date}
                      </span>
                    </div>
                  </div>
                  <div className={styles.eligRight}>
                    <span className={`${styles.statut} ${c.eligible ? styles.statutValide : styles.statutRejete}`}>
                      {c.status}
                    </span>
                    <button
                      className={styles.detailBtn}
                      onClick={() => setSelectedElig(selectedElig?.id === c.id ? null : c)}
                    >
                      {selectedElig?.id === c.id ? "Masquer" : "Voir détails"}
                    </button>
                  </div>

                  {selectedElig?.id === c.id && (
                    <div className={styles.eligDetail}>
                      <div className={styles.eligGrid}>
                        <div><span>Forme juridique</span><strong>{c.legalForm || "-"}</strong></div>
                        <div><span>RC</span><strong>{c.rc || "-"}</strong></div>
                        <div><span>ICE</span><strong>{c.ice || "-"}</strong></div>
                        <div><span>Nouvelle entreprise</span><strong>{c.newCompany ? "Oui" : "Non"}</strong></div>
                        <div><span>Chiffre d'affaires</span><strong>{formatMad(c.chiffreAffaires)}</strong></div>
                        <div><span>Capital public</span><strong>{c.publicCapitalPercent != null ? `${c.publicCapitalPercent}%` : "-"}</strong></div>
                        <div><span>Personne publique</span><strong>{c.hasPublicShareholder ? "Oui" : "Non"}</strong></div>
                        <div><span>Investissement</span><strong>{formatMad(c.investmentAmount)}</strong></div>
                        <div><span>Fonds propres</span><strong>{formatMad(c.ownFunds)}</strong></div>
                        <div><span>Emplois</span><strong>{c.jobs ?? "-"}</strong></div>
                        <div><span>Secteur</span><strong>{c.sector || "-"}</strong></div>
                        <div><span>Résultat</span><strong>{c.status}</strong></div>
                      </div>
                      {c.details && (
                        <div className={styles.eligChecks}>
                          {c.details.split("\n").map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
