package Cri.Tpme.Back_end.repository;

import Cri.Tpme.Back_end.entity.EligibilityCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EligibilityCheckRepository extends JpaRepository<EligibilityCheck, Long> {
    List<EligibilityCheck> findByUserEmailOrderByCreatedAtDesc(String email);
}
