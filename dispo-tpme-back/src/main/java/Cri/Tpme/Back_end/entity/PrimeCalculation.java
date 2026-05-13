package Cri.Tpme.Back_end.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prime_calculations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PrimeCalculation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String secteur;
    private String branche;
    private String province;
    private Double investissement;
    private Integer emplois;

    private Integer pctEmploi;
    private Integer pctTerrit;
    private Integer pctPrio;
    private Integer pctTotal;
    private Double  montantTotal;

    private String userEmail;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime calculatedAt = LocalDateTime.now();
}
