package Cri.Tpme.Back_end.controller;

import Cri.Tpme.Back_end.entity.Dossier;
import Cri.Tpme.Back_end.repository.DossierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicDossierController {

    private final DossierRepository dossierRepository;

    @PostMapping("/dossiers")
    public ResponseEntity<Map<String, String>> soumettre(@RequestBody Map<String, String> body) {
        Dossier dossier = Dossier.builder()
                .nom(body.get("nom"))
                .prenom(body.get("prenom"))
                .cin(body.get("cin"))
                .email(body.get("email"))
                .tel(body.get("tel"))
                .ville(body.get("ville"))
                .adresse(body.get("adresse"))
                .raisonSociale(body.get("raisonSociale"))
                .formeJuridique(body.get("formeJuridique"))
                .rc(body.get("rc"))
                .ice(body.get("ice"))
                .secteur(body.get("secteur"))
                .activite(body.get("activite"))
                .dateCreation(body.get("dateCreation"))
                .effectif(body.get("effectif"))
                .ca(body.get("ca"))
                .titreProjet(body.get("titreProjet"))
                .description(body.get("description"))
                .montant(body.get("montant"))
                .duree(body.get("duree"))
                .objectif(body.get("objectif"))
                .garanties(body.get("garanties"))
                .build();

        dossierRepository.save(dossier);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Dossier soumis avec succès"));
    }
}
