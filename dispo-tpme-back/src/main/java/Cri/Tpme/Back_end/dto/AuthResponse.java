package Cri.Tpme.Back_end.dto;

import Cri.Tpme.Back_end.entity.User;
import lombok.Data;

@Data
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private final String tokenType = "Bearer";
    private UserDto user;

    public AuthResponse(String accessToken, String refreshToken, User user) {
        this.accessToken  = accessToken;
        this.refreshToken = refreshToken;
        this.user         = new UserDto(user);
    }

    @Data
    public static class UserDto {
        private Long   id;
        private String name;
        private String email;
        private String imageUrl;
        private String role;
        private String provider;

        public UserDto(User u) {
            this.id       = u.getId();
            this.name     = u.getName();
            this.email    = u.getEmail();
            this.imageUrl = u.getImageUrl();
            this.role     = u.getRole().name();
            this.provider = u.getProvider().name();
        }
    }
}
