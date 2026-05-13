package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.entity.Dossier;
import Cri.Tpme.Back_end.entity.EligibilityCheck;
import Cri.Tpme.Back_end.entity.PrimeCalculation;
import Cri.Tpme.Back_end.entity.QuestionnaireSubmission;
import Cri.Tpme.Back_end.entity.User;
import Cri.Tpme.Back_end.repository.DossierRepository;
import Cri.Tpme.Back_end.repository.EligibilityCheckRepository;
import Cri.Tpme.Back_end.repository.PrimeCalculationRepository;
import Cri.Tpme.Back_end.repository.QuestionnaireSubmissionRepository;
import Cri.Tpme.Back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeController {

    private final UserRepository                      userRepository;
    private final DossierRepository                   dossierRepository;
    private final EligibilityCheckRepository          eligibilityCheckRepository;
    private final QuestionnaireSubmissionRepository   questionnaireSubmissionRepository;
    private final PrimeCalculationRepository          primeCalculationRepository;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> dashboard() {
        // ── Users / connexions ────────────────────────────────────────────────
        List<User> users = userRepository.findAll();
        long total    = users.size();
        long actifs   = users.stream().filter(User::isEnabled).count();
        long inactifs = total - actifs;

        Map<String, Object> connexionStats = new HashMap<>();
        connexionStats.put("totalConnexions", total);
        connexionStats.put("actifs",          actifs);
        connexionStats.put("inactifs",        inactifs);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        List<Map<String, Object>> connexions = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",     u.getId());
            row.put("nom",    u.getName());
            row.put("email",  u.getEmail());
            row.put("statut", u.isEnabled() ? "actif" : "inactif");
            row.put("date",   u.getCreatedAt() != null ? u.getCreatedAt().format(fmt) : "-");
            connexions.add(row);
        }

        // ── Dossiers ──────────────────────────────────────────────────────────
        List<Dossier> allDossiers = dossierRepository.findAll();
        long dTotal   = allDossiers.size();
        long dValides = allDossiers.stream().filter(d -> d.getStatut() == Dossier.Statut.VALIDE).count();
        long dAttente = allDossiers.stream().filter(d -> d.getStatut() == Dossier.Statut.EN_ATTENTE).count();
        long dRejetes = allDossiers.stream().filter(d -> d.getStatut() == Dossier.Statut.REJETE).count();

        Map<String, Object> dossierStats = new HashMap<>();
        dossierStats.put("total",   dTotal);
        dossierStats.put("valides", dValides);
        dossierStats.put("attente", dAttente);
        dossierStats.put("rejetes", dRejetes);

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<Map<String, Object>> dossiers = new ArrayList<>();
        for (Dossier d : allDossiers) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",            d.getId());
            row.put("nom",           (d.getNom() != null ? d.getNom() : "") + " " + (d.getPrenom() != null ? d.getPrenom() : ""));
            row.put("prenom",        d.getPrenom() != null ? d.getPrenom() : "");
            row.put("nomSeul",       d.getNom() != null ? d.getNom() : "");
            row.put("cin",           d.getCin() != null ? d.getCin() : "");
            row.put("email",         d.getEmail() != null ? d.getEmail() : "");
            row.put("tel",           d.getTel() != null ? d.getTel() : "");
            row.put("ville",         d.getVille() != null ? d.getVille() : "");
            row.put("adresse",       d.getAdresse() != null ? d.getAdresse() : "");
            row.put("raisonSociale", d.getRaisonSociale() != null ? d.getRaisonSociale() : "");
            row.put("formeJuridique",d.getFormeJuridique() != null ? d.getFormeJuridique() : "");
            row.put("rc",            d.getRc() != null ? d.getRc() : "");
            row.put("ice",           d.getIce() != null ? d.getIce() : "");
            row.put("secteur",       d.getSecteur() != null ? d.getSecteur() : "");
            row.put("activite",      d.getActivite() != null ? d.getActivite() : "");
            row.put("dateCreation",  d.getDateCreation() != null ? d.getDateCreation() : "");
            row.put("effectif",      d.getEffectif() != null ? d.getEffectif() : "");
            row.put("ca",            d.getCa() != null ? d.getCa() : "");
            row.put("titreProjet",   d.getTitreProjet() != null ? d.getTitreProjet() : "");
            row.put("description",   d.getDescription() != null ? d.getDescription() : "");
            row.put("montant",       d.getMontant() != null ? d.getMontant() : "");
            row.put("duree",         d.getDuree() != null ? d.getDuree() : "");
            row.put("objectif",      d.getObjectif() != null ? d.getObjectif() : "");
            row.put("garanties",     d.getGaranties() != null ? d.getGaranties() : "");
            row.put("statut",        d.getStatut().name());
            row.put("date",          d.getCreatedAt() != null ? d.getCreatedAt().format(dateFmt) : "-");
            dossiers.add(row);
        }

        // ── Eligibility ───────────────────────────────────────────────────────
        List<EligibilityCheck> allChecks = eligibilityCheckRepository.findAll();
        long eTotal      = allChecks.size();
        long eEligible   = allChecks.stream().filter(c -> Boolean.TRUE.equals(c.getEligible())).count();
        long eNotEligible = eTotal - eEligible;

        Map<String, Object> eligibilityStats = new HashMap<>();
        eligibilityStats.put("total",       eTotal);
        eligibilityStats.put("eligible",    eEligible);
        eligibilityStats.put("notEligible", eNotEligible);

        List<Map<String, Object>> eligibilities = allChecks.stream()
                .sorted(Comparator.comparing(EligibilityCheck::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(c -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id",                  c.getId());
                    row.put("userEmail",            c.getUserEmail());
                    row.put("companyName",          c.getCompanyName());
                    row.put("legalForm",            c.getLegalForm());
                    row.put("rc",                   c.getRc());
                    row.put("ice",                  c.getIce());
                    row.put("newCompany",           c.getNewCompany());
                    row.put("chiffreAffaires",      c.getChiffreAffaires());
                    row.put("publicCapitalPercent", c.getPublicCapitalPercent());
                    row.put("hasPublicShareholder", c.getHasPublicShareholder());
                    row.put("investmentAmount",     c.getInvestmentAmount());
                    row.put("ownFunds",             c.getOwnFunds());
                    row.put("jobs",                 c.getJobs());
                    row.put("sector",               c.getSector());
                    row.put("eligible",             c.getEligible());
                    row.put("details",              c.getDetails());
                    row.put("status",               Boolean.TRUE.equals(c.getEligible()) ? "Éligible" : "Non éligible");
                    row.put("date",                 c.getCreatedAt() != null ? c.getCreatedAt().format(dateFmt) : "-");
                    return row;
                }).collect(Collectors.toList());

        // ── Primes ────────────────────────────────────────────────────────────
        List<PrimeCalculation> allPrimes = primeCalculationRepository.findAll();
        long   pTotal       = allPrimes.size();
        double pDistribue   = allPrimes.stream().mapToDouble(p -> p.getMontantTotal() != null ? p.getMontantTotal() : 0).sum();
        double pMoyenne     = pTotal > 0 ? pDistribue / pTotal : 0;

        Map<String, Object> primeStats = new HashMap<>();
        primeStats.put("totalCalculs",   pTotal);
        primeStats.put("totalDistribue", pDistribue);
        primeStats.put("moyennePrime",   pMoyenne);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("connexionStats",   connexionStats);
        result.put("primeStats",       primeStats);
        result.put("dossierStats",     dossierStats);
        result.put("eligibilityStats", eligibilityStats);
        result.put("connexions",       connexions);
        result.put("primes",           Collections.emptyList());
        result.put("dossiers",         dossiers);
        result.put("eligibilities",    eligibilities);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/questionnaire-submissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> questionnaireSubmissions() {
        List<QuestionnaireSubmission> all = questionnaireSubmissionRepository
                .findAll(org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "submittedAt"));

        List<Map<String, Object>> result = all.stream().map(q -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",                   q.getId());
            row.put("userEmail",            q.getUserEmail());
            row.put("nom",                  q.getNom());
            row.put("telephone",            q.getTelephone());
            row.put("email",                q.getEmail());
            row.put("ville",                q.getVille());
            row.put("niveauEtudes",         q.getNiveauEtudes());
            row.put("projetAuparavant",     q.getProjetAuparavant());
            row.put("entrepriseEnregistree",q.getEntrepriseEnregistree());
            row.put("nomEntreprise",        q.getNomEntreprise());
            row.put("formeJuridique",       q.getFormeJuridique());
            row.put("dateCreation",         q.getDateCreation());
            row.put("ice",                  q.getIce());
            row.put("secteurActuel",        q.getSecteurActuel());
            row.put("intituleProjet",       q.getIntituleProjet());
            row.put("descriptionProjet",    q.getDescriptionProjet());
            row.put("typeProjet",           q.getTypeProjet());
            row.put("secteurActivite",      q.getSecteurActivite());
            row.put("regionProjet",         q.getRegionProjet());
            row.put("villeProjet",          q.getVilleProjet());
            row.put("stadeAvancement",      q.getStadeAvancement());
            row.put("investTotal",          q.getInvestTotal());
            row.put("financPropre",         q.getFinancPropre());
            row.put("emploisDirects",       q.getEmploisDirects());
            row.put("emploisStables",       q.getEmploisStables());
            row.put("region23",             q.getRegion23());
            row.put("province23",           q.getProvince23());
            row.put("activitePrioritaire",  q.getActivitePrioritaire());
            row.put("orientationProjet",    q.getOrientationProjet());
            row.put("compatibiliteRegion",  q.getCompatibiliteRegion());
            row.put("besoinAccompagnement", q.getBesoinAccompagnement());
            row.put("difficultePrincipale", q.getDifficultePrincipale());
            row.put("eligible",             q.getEligible());
            row.put("primeTotal",           q.getPrimeTotal());
            row.put("primePct",             q.getPrimePct());
            row.put("primeEmploi",          q.getPrimeEmploi());
            row.put("primeTerrit",          q.getPrimeTerrit());
            row.put("primePrio",            q.getPrimePrio());
            row.put("submittedAt",          q.getSubmittedAt() != null ? q.getSubmittedAt().toString() : null);
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/prime-calculations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> primeCalculations() {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        List<Map<String, Object>> result = primeCalculationRepository.findAll().stream()
                .sorted(Comparator.comparing(PrimeCalculation::getCalculatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(p -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id",             p.getId());
                    row.put("secteur",        p.getSecteur());
                    row.put("branche",        p.getBranche());
                    row.put("province",       p.getProvince());
                    row.put("investissement", p.getInvestissement());
                    row.put("emplois",        p.getEmplois());
                    row.put("pctEmploi",      p.getPctEmploi());
                    row.put("pctTerrit",      p.getPctTerrit());
                    row.put("pctPrio",        p.getPctPrio());
                    row.put("pctTotal",       p.getPctTotal());
                    row.put("montantTotal",   p.getMontantTotal());
                    row.put("userEmail",      p.getUserEmail());
                    row.put("date",           p.getCalculatedAt() != null ? p.getCalculatedAt().format(dateFmt) : "-");
                    return row;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
