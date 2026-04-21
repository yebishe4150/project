package project.auth_service.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import jakarta.servlet.http.Cookie;
import project.auth_service.AbstractWireMockTest;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.ErrorResponse;
import project.auth_service.dto.login.LoginRequest;
import project.auth_service.dto.login.LoginResponse;
import project.auth_service.dto.refresh.RefreshResponse;
import project.auth_service.dto.register.RegisterRequest;
import project.auth_service.dto.register.RegisterResponse;
import project.auth_service.entity.UserCredentials;

import java.util.Map;
import java.util.UUID;

import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static com.github.tomakehurst.wiremock.stubbing.Scenario.STARTED;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest extends AbstractWireMockTest {

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
    void when_register_then_PersistUser_and_CallUserService() throws Exception {

        RegisterRequest request = createRequest();

        stubSuccess(
                USER_SERVICE_URL,
                HttpMethod.POST,
                Map.of(
                        "id", UUID.randomUUID().toString(),
                        "loginName", LOGIN
                )
        );

        String response = mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        UserCredentials user = userCredentialsRepository
                .findByLoginName(LOGIN)
                .orElseThrow();

        BaseResponse<RegisterResponse> result =
                objectMapper.readValue(response, new TypeReference<>() {});

        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getLoginName()).isEqualTo(LOGIN);

        WireMock.verify(postRequestedFor(urlEqualTo(USER_SERVICE_URL))
                .withRequestBody(WireMock.matchingJsonPath("$.id",
                        WireMock.equalTo(user.getUserId().toString())))
                .withRequestBody(WireMock.matchingJsonPath("$.email",
                        WireMock.equalTo(EMAIL)))
                .withRequestBody(WireMock.matchingJsonPath("$.phoneNumber",
                        WireMock.equalTo(PHONE_NUMBER))));
    }

    @Test
    void when_register_whenUserServiceSlow_then_ReturnBadGateway() throws Exception {

        RegisterRequest request = createRequest();

        stubTimeout(USER_SERVICE_URL, HttpMethod.POST, 100);

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadGateway());
    }

    @Test
    void when_register_whenFirstCallFails_thenRetryAndSuccess() throws Exception {

        RegisterRequest request = createRequest();

        String scenario = "USER_SERVICE_RETRY";
        String SECOND_CALL = "SECOND_CALL";

        WireMock.stubFor(WireMock.post(USER_SERVICE_URL)
                .inScenario(scenario)
                .whenScenarioStateIs(STARTED)
                .willReturn(WireMock.aResponse()
                        .withFixedDelay(100))
                .willSetStateTo(SECOND_CALL));

        WireMock.stubFor(WireMock.post(USER_SERVICE_URL)
                .inScenario(scenario)
                .whenScenarioStateIs(SECOND_CALL)
                .willReturn(WireMock.okJson("""
                        {
                          "data": {
                            "id": "a77c55e9-8b00-4d22-b740-273c38c252bf",
                            "loginName": "test_user"
                          },
                          "message": "ok"
                        }
                        """)));

        String response = mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        BaseResponse<RegisterResponse> result =
                objectMapper.readValue(response, new TypeReference<>() {});

        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getLoginName()).isEqualTo(LOGIN);

        WireMock.verify(2, postRequestedFor(urlEqualTo(USER_SERVICE_URL)));
    }

    @Test
    void when_register_whenUserAlreadyExists_then_ReturnConflict() throws Exception {

        RegisterRequest request = createRegisterRequest();
        stubCreateUserSuccess();

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk());

        String response = mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(409);
        assertThat(error.getMessage()).isNotBlank();

        WireMock.verify(1, postRequestedFor(urlEqualTo(USER_SERVICE_URL)));
    }

    @Test
    void when_login_then_ReturnAccessToken_and_SetRefreshCookie() throws Exception {

        registerUser();

        MockHttpServletResponse loginResponse = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest(LOGIN, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        String response = loginResponse.getContentAsString();

        BaseResponse<LoginResponse> result =
                objectMapper.readValue(response, new TypeReference<>() {});

        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getUserId()).isNotNull();
        assertThat(result.getData().getRole()).isEqualTo("USER");
        assertThat(result.getData().getAccessToken()).isNotBlank();
        assertThat(result.getData().getRefreshToken()).isNull();
        assertThat(loginResponse.getHeader(HttpHeaders.SET_COOKIE))
                .startsWith(REFRESH_COOKIE + "=");
    }

    @Test
    void when_login_whenInvalidCredentials_then_ReturnUnauthorized() throws Exception {

        registerUser();

        String response = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest(LOGIN, "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(401);
        assertThat(error.getMessage()).isNotBlank();
    }

    @Test
    void when_refresh_then_ReturnNewAccessToken_and_RotateRefreshCookie() throws Exception {

        registerUser();

        MockHttpServletResponse loginResponse = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest(LOGIN, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        String oldRefreshToken = extractCookieValue(loginResponse.getHeader(HttpHeaders.SET_COOKIE));

        MockHttpServletResponse refreshResponse = mockMvc.perform(post(REFRESH_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, oldRefreshToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        String response = refreshResponse.getContentAsString();
        String newRefreshToken = extractCookieValue(refreshResponse.getHeader(HttpHeaders.SET_COOKIE));

        BaseResponse<RefreshResponse> result =
                objectMapper.readValue(response, new TypeReference<>() {});

        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getAccessToken()).isNotBlank();
        assertThat(result.getData().getRefreshToken()).isNull();
        assertThat(newRefreshToken).isNotEqualTo(oldRefreshToken);
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
        assertThat(error.getMessage()).isNotBlank();
    }

    @Test
    void when_logout_then_ClearRefreshCookie() throws Exception {

        registerUser();

        MockHttpServletResponse loginResponse = mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(createLoginRequest(LOGIN, PASSWORD))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        String refreshToken = extractCookieValue(loginResponse.getHeader(HttpHeaders.SET_COOKIE));

        MockHttpServletResponse logoutResponse = mockMvc.perform(post(LOGOUT_URL)
                        .cookie(new Cookie(REFRESH_COOKIE, refreshToken)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();

        String response = logoutResponse.getContentAsString();

        BaseResponse<Void> result =
                objectMapper.readValue(response, new TypeReference<>() {});

        assertThat(result.getMessage()).isNotBlank();
        assertThat(logoutResponse.getHeaders(HttpHeaders.SET_COOKIE))
                .anySatisfy(header -> assertThat(header)
                        .contains(REFRESH_COOKIE + "=")
                        .contains("Max-Age=0"));
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

    private RegisterRequest createRegisterRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setLoginName(LOGIN);
        request.setPassword(PASSWORD);
        request.setEmail(EMAIL);
        request.setPhoneNumber(PHONE_NUMBER);
        return request;
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

    private RegisterRequest createRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setLoginName(LOGIN);
        request.setPassword(PASSWORD);
        request.setEmail(EMAIL);
        request.setPhoneNumber(PHONE_NUMBER);
        return request;
    }
}
