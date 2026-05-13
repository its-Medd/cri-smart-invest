package Cri.Tpme.Back_end.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dossiers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Infos personnelles
    private String nom;
    private String prenom;
    private String cin;
    private String email;
    private String tel;
    private String ville;
    private String adresse;

    // Infos entreprise
    private String raisonSociale;
    private String formeJuridique;
    private String rc;
    private String ice;
    private String secteur;
    @Column(length = 1000)
    private String activite;
    private String dateCreation;
    private String effectif;
    private String ca;

    // Projet & financement
    private String titreProjet;
    @Column(length = 2000)
    private String description;
    private String montant;
    private String duree;
    @Column(length = 1000)
    private String objectif;
    @Column(length = 1000)
    private String garanties;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Statut { EN_ATTENTE, VALIDE, REJETE }
}
