

public class JwtUtils {
    public static String generateAccessToken(String userId, String role, String email, String refreshToken){
        return "Generate token";
    }

    public static String generateRefreshToken(String userId, String superSecretKey){
        return "Generate refresh token";
    }

    public static Boolean validateAccessToken(String accessToken, String refreshToken){
        return true;
    }

    public static Boolean checkExpiredRefreshToken(String refreshToken){
        return false;
    }

    public String getUserId(String accessToken){
        return "123";
    }

    public String getUserRole(String accessToken){
        return "123";
    }

    // public Payload getPayLoad(String accessToken){

    // }
}