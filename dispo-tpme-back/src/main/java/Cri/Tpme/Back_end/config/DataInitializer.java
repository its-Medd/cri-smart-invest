package Cri.Tpme.Back_end.config;

import Cri.Tpme.Back_end.entity.User;
import Cri.Tpme.Back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@cri.local";

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = User.builder()
                    .email(ADMIN_EMAIL)
                    .name("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(User.Role.ADMIN)
                    .provider(User.AuthProvider.LOCAL)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
        }
    }
}
