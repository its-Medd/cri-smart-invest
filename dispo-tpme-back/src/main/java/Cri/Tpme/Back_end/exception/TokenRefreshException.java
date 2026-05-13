package Cri.Tpme.Back_end.exception;

public class TokenRefreshException extends RuntimeException {
    public TokenRefreshException(String token, String message) {
        super("Failed for token [" + token + "]: " + message);
    }
}
