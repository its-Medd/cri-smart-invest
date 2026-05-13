package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.entity.Dossier;
import Cri.Tpme.Back_end.repository.DossierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserDossierController {

    private final DossierRepository dossierRepository;

    @GetMapping("/dossiers")
    public ResponseEntity<List<Map<String, Object>>> mesDossiers(Authentication authentication) {
        String email = authentication.getName();
        List<Dossier> dossiers = dossierRepository.findByEmailOrderByCreatedAtDesc(email);

        List<Map<String, Object>> result = dossiers.stream().map(d -> Map.<String, Object>of(
            "id",           d.getId(),
            "titreProjet",  d.getTitreProjet() != null ? d.getTitreProjet() : "",
            "raisonSociale",d.getRaisonSociale() != null ? d.getRaisonSociale() : "",
            "secteur",      d.getSecteur() != null ? d.getSecteur() : "",
            "montant",      d.getMontant() != null ? d.getMontant() : "",
            "statut",       d.getStatut().name(),
            "createdAt",    d.getCreatedAt().toString()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
