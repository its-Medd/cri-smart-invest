package Cri.Tpme.Back_end.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import Cri.Tpme.Back_end.entity.RefreshToken;
import Cri.Tpme.Back_end.entity.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByUser(User user);
    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);
}
