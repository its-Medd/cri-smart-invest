package Cri.Tpme.Back_end.security.oauth2;

import Cri.Tpme.Back_end.exception.OAuth2AuthenticationProcessingException;
import java.util.Map;

public class OAuth2UserInfoFactory {
    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId,
                                                    Map<String, Object> attributes) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return new GoogleOAuth2UserInfo(attributes);
        }
        throw new OAuth2AuthenticationProcessingException(
                "Login with " + registrationId + " is not supported yet.");
    }
}
