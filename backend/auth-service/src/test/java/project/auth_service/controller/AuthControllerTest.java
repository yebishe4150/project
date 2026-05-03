package project.auth_service.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import project.auth_service.AbstractWireMockTest;
import project.auth_service.dto.BaseResponse;
import project.auth_service.dto.ErrorResponse;
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
    private static final String USER_SERVICE_URL = "/v1/users";

    private static final String LOGIN = "test_user";
    private static final String PASSWORD = "1234sAsD";
    private static final String EMAIL = "test@example.com";
    private static final String PHONE_NUMBER = "+79990000000";

    @Test
    void when_register_then_PersistUser_and_CallUserService() throws Exception {

        RegisterRequest request = createRegisterRequest();

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
        assertThat(userSyncTaskRepository.findById(user.getUserId())).isEmpty();

        WireMock.verify(postRequestedFor(urlEqualTo(USER_SERVICE_URL))
                .withRequestBody(WireMock.matchingJsonPath("$.id",
                        WireMock.equalTo(user.getUserId().toString())))
                .withRequestBody(WireMock.matchingJsonPath("$.email",
                        WireMock.equalTo(EMAIL)))
                .withRequestBody(WireMock.matchingJsonPath("$.phoneNumber",
                        WireMock.equalTo(PHONE_NUMBER))));
    }

    @Test
    void when_register_whenUserServiceSlow_then_PersistPendingSyncTask() throws Exception {

        RegisterRequest request = createRegisterRequest();

        stubTimeout(USER_SERVICE_URL, HttpMethod.POST, 100);

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
        assertThat(userSyncTaskRepository.findById(user.getUserId())).isPresent();
    }

    @Test
    void when_register_whenFirstCallFails_thenRetryAndSuccess() throws Exception {

        RegisterRequest request = createRegisterRequest();

        String scenario = "USER_SERVICE_RETRY";
        String secondCall = "SECOND_CALL";

        WireMock.stubFor(WireMock.post(USER_SERVICE_URL)
                .inScenario(scenario)
                .whenScenarioStateIs(STARTED)
                .willReturn(WireMock.aResponse()
                        .withFixedDelay(100))
                .willSetStateTo(secondCall));

        WireMock.stubFor(WireMock.post(USER_SERVICE_URL)
                .inScenario(scenario)
                .whenScenarioStateIs(secondCall)
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
    void when_syncTaskExists_then_SchedulerRetriesAndRemovesTask() throws Exception {

        RegisterRequest request = createRegisterRequest();

        stubTimeout(USER_SERVICE_URL, HttpMethod.POST, 100);

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk());

        UserCredentials user = userCredentialsRepository
                .findByLoginName(LOGIN)
                .orElseThrow();

        assertThat(userSyncTaskRepository.findById(user.getUserId())).isPresent();

        stubCreateUserSuccess();

        userSyncService.retryPendingSync();

        assertThat(userSyncTaskRepository.findById(user.getUserId())).isEmpty();
        WireMock.verify(3, postRequestedFor(urlEqualTo(USER_SERVICE_URL)));
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
        assertThat(error.getPath()).isEqualTo(REGISTER_URL);

        WireMock.verify(1, postRequestedFor(urlEqualTo(USER_SERVICE_URL)));
    }

    @Test
    void when_register_withBlankLogin_then_ReturnBadRequest_and_DoNotCallUserService() throws Exception {

        RegisterRequest request = createRegisterRequest();
        request.setLoginName("   ");

        String response = mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(400);
        assertThat(error.getMessage()).contains("loginName");
        assertThat(error.getPath()).isEqualTo(REGISTER_URL);
        assertThat(userCredentialsRepository.findByLoginName(LOGIN)).isEmpty();
        WireMock.verify(0, postRequestedFor(urlEqualTo(USER_SERVICE_URL)));
    }

    @Test
    void when_register_withInvalidEmail_then_ReturnBadRequest_and_DoNotCallUserService() throws Exception {

        RegisterRequest request = createRegisterRequest();
        request.setEmail("not-an-email");

        String response = mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        ErrorResponse error = objectMapper.readValue(response, ErrorResponse.class);

        assertThat(error.getStatus()).isEqualTo(400);
        assertThat(error.getMessage()).contains("email");
        assertThat(error.getPath()).isEqualTo(REGISTER_URL);
        assertThat(userCredentialsRepository.findByLoginName(LOGIN)).isEmpty();
        WireMock.verify(0, postRequestedFor(urlEqualTo(USER_SERVICE_URL)));
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
}
