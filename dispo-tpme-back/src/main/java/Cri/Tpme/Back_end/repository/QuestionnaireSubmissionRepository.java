package Cri.Tpme.Back_end.repository;

import Cri.Tpme.Back_end.entity.QuestionnaireSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionnaireSubmissionRepository extends JpaRepository<QuestionnaireSubmission, Long> {
    List<QuestionnaireSubmission> findByUserEmailOrderBySubmittedAtDesc(String userEmail);
}
