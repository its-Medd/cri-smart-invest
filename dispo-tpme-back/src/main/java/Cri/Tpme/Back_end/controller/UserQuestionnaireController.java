package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.entity.QuestionnaireSubmission;
import Cri.Tpme.Back_end.repository.QuestionnaireSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserQuestionnaireController {

    private final QuestionnaireSubmissionRepository questionnaireSubmissionRepository;

    @GetMapping("/questionnaire-submissions")
    public ResponseEntity<List<Map<String, Object>>> mySubmissions(Authentication authentication) {
        String email = authentication.getName();
        List<QuestionnaireSubmission> list =
                questionnaireSubmissionRepository.findByUserEmailOrderBySubmittedAtDesc(email);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<Map<String, Object>> result = list.stream().map(q -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",                   q.getId());
            row.put("intituleProjet",       q.getIntituleProjet());
            row.put("secteurActivite",      q.getSecteurActivite());
            row.put("typeProjet",           q.getTypeProjet());
            row.put("regionProjet",         q.getRegionProjet());
            row.put("stadeAvancement",      q.getStadeAvancement());
            row.put("investTotal",          q.getInvestTotal());
            row.put("financPropre",         q.getFinancPropre());
            row.put("emploisStables",       q.getEmploisStables());
            row.put("province23",           q.getProvince23());
            row.put("eligible",             q.getEligible());
            row.put("primeTotal",           q.getPrimeTotal());
            row.put("primePct",             q.getPrimePct());
            row.put("primeEmploi",          q.getPrimeEmploi());
            row.put("primeTerrit",          q.getPrimeTerrit());
            row.put("primePrio",            q.getPrimePrio());
            row.put("nomEntreprise",        q.getNomEntreprise());
            row.put("descriptionProjet",    q.getDescriptionProjet());
            row.put("activitePrioritaire",  q.getActivitePrioritaire());
            row.put("orientationProjet",    q.getOrientationProjet());
            row.put("besoinAccompagnement", q.getBesoinAccompagnement());
            row.put("difficultePrincipale", q.getDifficultePrincipale());
            row.put("submittedAt",          q.getSubmittedAt() != null
                                            ? q.getSubmittedAt().format(fmt) : "-");
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/questionnaire-submissions")
    public ResponseEntity<Map<String, String>> submit(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String userEmail = authentication.getName();

        QuestionnaireSubmission sub = QuestionnaireSubmission.builder()
                .userEmail(userEmail)
                .nom(str(body.get("nom")))
                .telephone(str(body.get("telephone")))
                .email(str(body.get("email")))
                .ville(str(body.get("ville")))
                .niveauEtudes(str(body.get("niveauEtudes")))
                .projetAuparavant(str(body.get("projetAuparavant")))
                .entrepriseEnregistree(str(body.get("entrepriseEnregistree")))
                .nomEntreprise(str(body.get("nomEntreprise")))
                .formeJuridique(str(body.get("formeJuridique")))
                .dateCreation(str(body.get("dateCreation")))
                .ice(str(body.get("ice")))
                .secteurActuel(str(body.get("secteurActuel")))
                .intituleProjet(str(body.get("intituleProjet")))
                .descriptionProjet(str(body.get("descriptionProjet")))
                .typeProjet(str(body.get("typeProjet")))
                .secteurActivite(str(body.get("secteurActivite")))
                .regionProjet(str(body.get("regionProjet")))
                .villeProjet(str(body.get("villeProjet")))
                .stadeAvancement(str(body.get("stadeAvancement")))
                .investTotal(dbl(body.get("investTotal")))
                .financPropre(dbl(body.get("financPropre")))
                .emploisDirects(intVal(body.get("emploisDirects")))
                .emploisStables(intVal(body.get("emploisStables")))
                .region23(str(body.get("region23")))
                .province23(str(body.get("province23")))
                .activitePrioritaire(str(body.get("activitePrioritaire")))
                .orientationProjet(str(body.get("orientationProjet")))
                .compatibiliteRegion(str(body.get("compatibiliteRegion")))
                .besoinAccompagnement(str(body.get("besoinAccompagnement")))
                .difficultePrincipale(str(body.get("difficultePrincipale")))
                .eligible(Boolean.TRUE.equals(body.get("eligible")))
                .primeTotal(dbl(body.get("primeTotal")))
                .primePct(intVal(body.get("primePct")))
                .primeEmploi(intVal(body.get("primeEmploi")))
                .primeTerrit(intVal(body.get("primeTerrit")))
                .primePrio(intVal(body.get("primePrio")))
                .build();

        questionnaireSubmissionRepository.save(sub);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Questionnaire enregistré avec succès"));
    }

    private String str(Object v) { return v != null ? v.toString() : ""; }

    private Double dbl(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return null; }
    }

    private Integer intVal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }
}
