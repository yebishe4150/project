package project.auth_service.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import project.auth_service.AbstractWireMockTest;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.ErrorResponse;
import project.auth_service.dto.login.LoginRequest;
import project.auth_service.dto.login.LoginResponse;
import project.auth_service.dto.password.ChangePasswordRequest;
import project.auth_service.dto.password.ChangePasswordResponse;
import project.auth_service.dto.register.RegisterRequest;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(OutputCaptureExtension.class)
class PasswordControllerTest extends AbstractWireMockTest {

    private static final String REGISTER_URL = "/v1/auth/register";
    private static final String LOGIN_URL = "/v1/auth/login";
    private static final String CHANGE_PASSWORD_URL = "/v1/auth/change-password";
    private static final String USER_SERVICE_URL = "/v1/users";
    private static final String REFRESH_COOKIE = "refreshToken";

    private static final String LOGIN = "test_user";
    private static final String PASSWORD = "1234sAsD";
    private static final String NEW_PASSWORD = "5678sAsD";
    private static final String EMAIL = "test@example.com";
    private static final String PHONE_NUMBER = "+79990000000";

    @Test
    void when_changePassword_then_ReturnNewAccessToken_and_UpdatePassword() throws Exception {

        registerUser();
        TestSession session = loginAndGetSession(PASSWORD);

        String response = mockMvc.perform(post(CHANGE_PASSWORD_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .cookie(new Cookie(REFRESH_COOKIE, session.refreshToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createChangePasswordRequest())))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        BaseResponse<ChangePasswordResponse> changePasswordResult =
                objectMapper.readValue(response, new TypeReference<>() {});

        assertThat(changePasswordResult.getData()).isNotNull();
        assertThat(changePasswordResult.getData().getAccessToken()).isNotBlank();

        TestSession newSession = loginAndGetSession(NEW_PASSWORD);

        assertThat(newSession.accessToken()).isNotBlank();
        assertThat(newSession.refreshToken()).isNotBlank();
    }

    @Test
    void when_changePassword_withWrongCurrentPassword_then_ReturnUnauthorized() throws Exception {

        registerUser();
        TestSession session = loginAndGetSession(PASSWORD);

        ChangePasswordRequest request = createChangePasswordRequest();
        request.setCurrentPassword("wrong-password");

        String response = mockMvc.perform(post(CHANGE_PASSWORD_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .cookie(new Cookie(REFRESH_COOKIE, session.refreshToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(401);
        assertThat(error.getPath()).isEqualTo(CHANGE_PASSWORD_URL);
    }

    @Test
    void when_changePasswordFails_then_MaskPasswordsInHttpLog(CapturedOutput output) throws Exception {

        registerUser();
        TestSession session = loginAndGetSession(PASSWORD);

        ChangePasswordRequest request = createChangePasswordRequest();
        request.setCurrentPassword("WrongSecret123");
        request.setNewPassword("NewSecret456");

        mockMvc.perform(post(CHANGE_PASSWORD_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .cookie(new Cookie(REFRESH_COOKIE, session.refreshToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isUnauthorized());

        assertThat(output).contains("\"currentPassword\":\"***\"");
        assertThat(output).contains("\"newPassword\":\"***\"");
        assertThat(output).doesNotContain("WrongSecret123");
        assertThat(output).doesNotContain("NewSecret456");
    }

    @Test
    void when_changePassword_withoutRefreshCookie_then_ReturnUnauthorized() throws Exception {

        registerUser();
        TestSession session = loginAndGetSession(PASSWORD);

        String response = mockMvc.perform(post(CHANGE_PASSWORD_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createChangePasswordRequest())))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(401);
        assertThat(error.getPath()).isEqualTo(CHANGE_PASSWORD_URL);
    }

    @Test
    void when_changePassword_withoutAccessToken_then_ReturnForbidden() throws Exception {

        registerUser();
        TestSession session = loginAndGetSession(PASSWORD);

        mockMvc.perform(post(CHANGE_PASSWORD_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, session.refreshToken()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createChangePasswordRequest())))
                .andExpect(status().isForbidden());
    }

    private void registerUser() throws Exception {
        stubCreateUserSuccess();

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createRegisterRequest())))
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

    private TestSession loginAndGetSession(String password) throws Exception {
        MockHttpServletResponse loginResponse = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest(password))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        BaseResponse<LoginResponse> result =
                objectMapper.readValue(loginResponse.getContentAsString(), new TypeReference<>() {});

        assertThat(result.getData()).isNotNull();
        return new TestSession(
                result.getData().getAccessToken(),
                extractCookieValue(loginResponse.getHeader(HttpHeaders.SET_COOKIE))
        );
    }

    private RegisterRequest createRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setLoginName(LOGIN);
        request.setPassword(PASSWORD);
        request.setEmail(EMAIL);
        request.setPhoneNumber(PHONE_NUMBER);
        return request;
    }

    private LoginRequest createLoginRequest(String password) {
        LoginRequest request = new LoginRequest();
        request.setLoginName(LOGIN);
        request.setPassword(password);
        return request;
    }

    private ChangePasswordRequest createChangePasswordRequest() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword(PASSWORD);
        request.setNewPassword(NEW_PASSWORD);
        return request;
    }

    private String extractCookieValue(String setCookieHeader) {
        assertThat(setCookieHeader).isNotBlank();
        assertThat(setCookieHeader).startsWith(REFRESH_COOKIE + "=");
        return setCookieHeader.substring((REFRESH_COOKIE + "=").length(), setCookieHeader.indexOf(';'));
    }

    private record TestSession(String accessToken, String refreshToken) {
    }
}
