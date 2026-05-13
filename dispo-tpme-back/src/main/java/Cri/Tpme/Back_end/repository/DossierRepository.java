package Cri.Tpme.Back_end.repository;

import Cri.Tpme.Back_end.entity.Dossier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DossierRepository extends JpaRepository<Dossier, Long> {
    List<Dossier> findByEmailOrderByCreatedAtDesc(String email);
}
