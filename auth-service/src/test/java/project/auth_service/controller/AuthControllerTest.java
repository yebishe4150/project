package project.auth_service.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import project.auth_service.AbstractWireMockTest;
import project.auth_service.dto.BaseResponse;
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
                        WireMock.equalTo(user.getUserId().toString()))));
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

    private RegisterRequest createRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setLoginName(LOGIN);
        request.setPassword(PASSWORD);
        return request;
    }
}
