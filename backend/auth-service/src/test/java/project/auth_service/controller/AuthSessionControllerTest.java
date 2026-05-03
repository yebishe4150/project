package project.auth_service.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import project.auth_service.AbstractWireMockTest;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.ErrorResponse;
import project.auth_service.dto.login.LoginRequest;
import project.auth_service.dto.login.LoginResponse;
import project.auth_service.dto.refresh.RefreshResponse;
import project.auth_service.dto.register.RegisterRequest;
import project.auth_service.entity.RefreshToken;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthSessionControllerTest extends AbstractWireMockTest {

    private static final String REGISTER_URL = "/v1/auth/register";
    private static final String LOGIN_URL = "/v1/auth/login";
    private static final String REFRESH_URL = "/v1/auth/refresh";
    private static final String LOGOUT_URL = "/v1/auth/logout";
    private static final String USER_SERVICE_URL = "/v1/users";
    private static final String REFRESH_COOKIE = "refreshToken";

    private static final String LOGIN = "test_user";
    private static final String PASSWORD = "1234sAsD";
    private static final String EMAIL = "test@example.com";
    private static final String PHONE_NUMBER = "+79990000000";

    @Test
    void when_login_then_ReturnAccessToken_and_SetRefreshCookie() throws Exception {

        registerUser();

        MockHttpServletResponse loginResponse = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest())))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        BaseResponse<LoginResponse> result =
                objectMapper.readValue(loginResponse.getContentAsString(), new TypeReference<>() {});

        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getUserId()).isNotNull();
        assertThat(result.getData().getRole()).isEqualTo("USER");
        assertThat(result.getData().getAccessToken()).isNotBlank();
        assertThat(result.getData().getRefreshToken()).isNull();
        assertThat(loginResponse.getHeader(HttpHeaders.SET_COOKIE))
                .startsWith(REFRESH_COOKIE + "=");
    }

    @Test
    void when_refresh_then_ReturnNewAccessToken_and_RotateRefreshCookie() throws Exception {

        registerUser();
        String oldRefreshToken = loginAndGetRefreshToken();

        MockHttpServletResponse refreshResponse = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, oldRefreshToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        String newRefreshToken = extractCookieValue(refreshResponse.getHeader(HttpHeaders.SET_COOKIE));

        BaseResponse<RefreshResponse> result =
                objectMapper.readValue(refreshResponse.getContentAsString(), new TypeReference<>() {});

        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getAccessToken()).isNotBlank();
        assertThat(result.getData().getRefreshToken()).isNull();
        assertThat(newRefreshToken).isNotEqualTo(oldRefreshToken);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void when_refresh_withReusedToken_then_RevokeOtherSessions_and_ReturnUnauthorized() throws Exception {

        String loginName = "reused_token_user_" + UUID.randomUUID();
        registerUser(loginName);

        String oldRefreshToken = loginAndGetRefreshToken(loginName);
        MockHttpServletResponse refreshResponse = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, oldRefreshToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();
        String newRefreshToken = extractCookieValue(refreshResponse.getHeader(HttpHeaders.SET_COOKIE));

        String reusedResponse = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, oldRefreshToken)))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse reusedError = objectMapper.readValue(reusedResponse, ErrorResponse.class);
        assertThat(reusedError.getMessage()).isEqualTo("Refresh token already used");

        List<RefreshToken> remainingTokens = refreshTokenRepository.findAll()
                .stream()
                .filter(token -> token.getToken().equals(oldRefreshToken) || token.getToken().equals(newRefreshToken))
                .toList();

        assertThat(remainingTokens)
                .singleElement()
                .satisfies(token -> {
                    assertThat(token.getToken()).isEqualTo(oldRefreshToken);
                    assertThat(token.isUsed()).isTrue();
                });

        String revokedTokenResponse = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, newRefreshToken)))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse revokedTokenError = objectMapper.readValue(revokedTokenResponse, ErrorResponse.class);
        assertThat(revokedTokenError.getStatus()).isEqualTo(401);
        assertThat(revokedTokenError.getPath()).isEqualTo(REFRESH_URL);
    }

    @Test
    void when_logout_then_ClearRefreshCookie() throws Exception {

        registerUser();
        String refreshToken = loginAndGetRefreshToken();

        MockHttpServletResponse logoutResponse = mockMvc.perform(post(LOGOUT_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, refreshToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        BaseResponse<Void> result =
                objectMapper.readValue(logoutResponse.getContentAsString(), new TypeReference<>() {});

        assertThat(result.getMessage()).isNotBlank();
        assertThat(logoutResponse.getHeaders(HttpHeaders.SET_COOKIE))
                .anySatisfy(header -> assertThat(header)
                        .contains(REFRESH_COOKIE + "=")
                        .contains("Max-Age=0"));
    }

    @Test
    void when_login_whenInvalidCredentials_then_ReturnUnauthorized() throws Exception {

        registerUser();

        String response = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest("wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(401);
        assertThat(error.getPath()).isEqualTo(LOGIN_URL);
    }

    @Test
    void when_login_withBlankPassword_then_ReturnBadRequest() throws Exception {

        String response = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest("   "))))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(400);
        assertThat(error.getMessage()).contains("password");
        assertThat(error.getPath()).isEqualTo(LOGIN_URL);
    }

    @Test
    void when_refresh_withoutCookie_then_ReturnUnauthorized() throws Exception {

        String response = mockMvc.perform(post(REFRESH_URL))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(401);
        assertThat(error.getPath()).isEqualTo(REFRESH_URL);
    }

    @Test
    void when_refresh_withInvalidCookie_then_ReturnUnauthorized() throws Exception {

        String response = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, "invalid-refresh-token")))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(401);
        assertThat(error.getPath()).isEqualTo(REFRESH_URL);
    }

    private void registerUser() throws Exception {
        registerUser(LOGIN);
    }

    private void registerUser(String loginName) throws Exception {
        stubCreateUserSuccess();

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createRegisterRequest(loginName))))
                .andExpect(status().isOk());
    }

    private void stubCreateUserSuccess() throws Exception {
        stubSuccess(
                USER_SERVICE_URL,
                HttpMethod.POST,
                Map.of(
                        "id", UUID.randomUUID().toString(),
                        "loginName", LOGIN,
                        "email", EMAIL,
                        "phoneNumber", PHONE_NUMBER
                )
        );
    }

    private String loginAndGetRefreshToken() throws Exception {
        return loginAndGetRefreshToken(LOGIN);
    }

    private String loginAndGetRefreshToken(String loginName) throws Exception {
        MockHttpServletResponse loginResponse = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest(loginName, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        return extractCookieValue(loginResponse.getHeader(HttpHeaders.SET_COOKIE));
    }

    private RegisterRequest createRegisterRequest() {
        return createRegisterRequest(LOGIN);
    }

    private RegisterRequest createRegisterRequest(String loginName) {
        RegisterRequest request = new RegisterRequest();
        request.setLoginName(loginName);
        request.setPassword(PASSWORD);
        request.setEmail(EMAIL);
        request.setPhoneNumber(PHONE_NUMBER);
        return request;
    }

    private LoginRequest createLoginRequest() {
        return createLoginRequest(PASSWORD);
    }

    private LoginRequest createLoginRequest(String password) {
        return createLoginRequest(LOGIN, password);
    }

    private LoginRequest createLoginRequest(String loginName, String password) {
        LoginRequest request = new LoginRequest();
        request.setLoginName(loginName);
        request.setPassword(password);
        return request;
    }

    private String extractCookieValue(String setCookieHeader) {
        assertThat(setCookieHeader).isNotBlank();
        assertThat(setCookieHeader).startsWith(REFRESH_COOKIE + "=");
        return setCookieHeader.substring((REFRESH_COOKIE + "=").length(), setCookieHeader.indexOf(';'));
    }
}
