package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.entity.EligibilityCheck;
import Cri.Tpme.Back_end.repository.EligibilityCheckRepository;
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
public class UserEligibilityController {

    private final EligibilityCheckRepository eligibilityCheckRepository;

    @PostMapping("/eligibility-checks")
    public ResponseEntity<Map<String, String>> saveCheck(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String email = authentication.getName();

        @SuppressWarnings("unchecked")
        List<String> detailsList = (List<String>) body.get("details");
        String detailsStr = detailsList != null ? String.join("\n", detailsList) : "";

        EligibilityCheck check = EligibilityCheck.builder()
                .userEmail(email)
                .companyName(toStr(body.get("companyName")))
                .legalForm(toStr(body.get("legalForm")))
                .rc(toStr(body.get("rc")))
                .ice(toStr(body.get("ice")))
                .newCompany(Boolean.TRUE.equals(body.get("newCompany")))
                .chiffreAffaires(toDouble(body.get("chiffreAffaires")))
                .publicCapitalPercent(toDouble(body.get("publicCapitalPercent")))
                .hasPublicShareholder(Boolean.TRUE.equals(body.get("hasPublicShareholder")))
                .investmentAmount(toDouble(body.get("investmentAmount")))
                .ownFunds(toDouble(body.get("ownFunds")))
                .jobs(toInt(body.get("jobs")))
                .sector(toStr(body.get("sector")))
                .eligible(Boolean.TRUE.equals(body.get("eligible")))
                .details(detailsStr)
                .build();

        eligibilityCheckRepository.save(check);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Vérification enregistrée"));
    }

    @GetMapping("/eligibility-checks")
    public ResponseEntity<List<Map<String, Object>>> myChecks(Authentication authentication) {
        String email = authentication.getName();
        List<EligibilityCheck> checks = eligibilityCheckRepository.findByUserEmailOrderByCreatedAtDesc(email);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<Map<String, Object>> result = checks.stream().map(c -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",                  c.getId());
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
            row.put("date",                 c.getCreatedAt() != null ? c.getCreatedAt().format(fmt) : "-");
            row.put("createdAt",            c.getCreatedAt() != null ? c.getCreatedAt().toString() : "");
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private String toStr(Object val) {
        return val != null ? val.toString() : "";
    }

    private Double toDouble(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return null; }
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return null; }
    }
}
