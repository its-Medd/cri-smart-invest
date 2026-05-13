package Cri.Tpme.Back_end.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "eligibility_checks")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class EligibilityCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String companyName;
    private String legalForm;
    private String rc;
    private String ice;
    private Boolean newCompany;
    private Double chiffreAffaires;
    private Double publicCapitalPercent;
    private Boolean hasPublicShareholder;
    private Double investmentAmount;
    private Double ownFunds;
    private Integer jobs;
    private String sector;
    private Boolean eligible;

    @Column(length = 2000)
    private String details;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
