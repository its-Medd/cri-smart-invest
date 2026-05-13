package Cri.Tpme.Back_end.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "questionnaire_submissions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionnaireSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    // Section 1 – Informations personnelles
    private String nom;
    private String telephone;
    private String email;
    private String ville;
    private String niveauEtudes;
    private String projetAuparavant;

    // Section 2 – Entreprise
    private String entrepriseEnregistree;
    private String nomEntreprise;
    private String formeJuridique;
    private String dateCreation;
    private String ice;
    private String secteurActuel;

    // Section 3 – Projet
    private String intituleProjet;
    @Column(length = 2000)
    private String descriptionProjet;
    private String typeProjet;
    private String secteurActivite;
    private String regionProjet;
    private String villeProjet;
    private String stadeAvancement;

    // Section 4 – Simulateur
    private Double investTotal;
    private Double financPropre;
    private Integer emploisDirects;
    private Integer emploisStables;
    private String region23;
    private String province23;
    private String activitePrioritaire;
    private String orientationProjet;
    private String compatibiliteRegion;

    // Section 5 – Besoins
    private String besoinAccompagnement;
    private String difficultePrincipale;

    // Résultats calculés
    private Boolean eligible;
    private Double  primeTotal;
    private Integer primePct;
    private Integer primeEmploi;
    private Integer primeTerrit;
    private Integer primePrio;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();
}
