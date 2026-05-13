package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.entity.PrimeCalculation;
import Cri.Tpme.Back_end.repository.PrimeCalculationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicPrimeCalculationController {

    private final PrimeCalculationRepository primeCalculationRepository;

    @PostMapping("/prime-calculations")
    public ResponseEntity<Void> save(@RequestBody Map<String, Object> body) {
        PrimeCalculation calc = PrimeCalculation.builder()
                .secteur(str(body, "secteur"))
                .branche(str(body, "branche"))
                .province(str(body, "province"))
                .investissement(dbl(body, "investissement"))
                .emplois(intVal(body, "emplois"))
                .pctEmploi(intVal(body, "pctEmploi"))
                .pctTerrit(intVal(body, "pctTerrit"))
                .pctPrio(intVal(body, "pctPrio"))
                .pctTotal(intVal(body, "pctTotal"))
                .montantTotal(dbl(body, "montantTotal"))
                .userEmail(str(body, "userEmail"))
                .build();
        primeCalculationRepository.save(calc);
        return ResponseEntity.ok().build();
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private Double dbl(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        try { return ((Number) v).doubleValue(); } catch (ClassCastException e) { return null; }
    }

    private Integer intVal(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        try { return ((Number) v).intValue(); } catch (ClassCastException e) { return null; }
    }
}
