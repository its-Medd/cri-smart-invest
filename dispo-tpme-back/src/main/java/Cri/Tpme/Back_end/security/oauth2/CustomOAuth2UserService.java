package Cri.Tpme.Back_end.security.oauth2;

import Cri.Tpme.Back_end.entity.User;
import Cri.Tpme.Back_end.exception.OAuth2AuthenticationProcessingException;
import Cri.Tpme.Back_end.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        try {
            return processOAuth2User(userRequest, oAuth2User);
        } catch (AuthenticationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest request, OAuth2User oAuth2User) {
        String         registrationId = request.getClientRegistration().getRegistrationId();
        OAuth2UserInfo userInfo        = OAuth2UserInfoFactory.getOAuth2UserInfo(
                registrationId, oAuth2User.getAttributes());

        if (!StringUtils.hasText(userInfo.getEmail())) {
            throw new OAuth2AuthenticationProcessingException(
                    "Email not found from OAuth2 provider");
        }

        Optional<User> existing = userRepository.findByEmail(userInfo.getEmail());
        User user;

        if (existing.isPresent()) {
            user = existing.get();
            if (!user.getProvider().name().equalsIgnoreCase(registrationId)) {
                throw new OAuth2AuthenticationProcessingException(
                        "You already registered with " + user.getProvider() +
                        ". Please use that account.");
            }
            user.setName(userInfo.getName());
            user.setImageUrl(userInfo.getImageUrl());
            user = userRepository.save(user);
        } else {
            user = userRepository.save(User.builder()
                    .provider(User.AuthProvider.valueOf(registrationId.toUpperCase()))
                    .providerId(userInfo.getId())
                    .name(userInfo.getName())
                    .email(userInfo.getEmail())
                    .imageUrl(userInfo.getImageUrl())
                    .build());
        }

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                oAuth2User.getAttributes(),
                "email");
    }
}
