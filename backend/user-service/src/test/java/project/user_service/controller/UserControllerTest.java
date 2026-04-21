package project.user_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import project.user_service.AbstractTest;
import project.user_service.entity.Role;
import project.user_service.entity.User;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerTest extends AbstractTest {

    private static final String ME_URL = "/v1/users/me";
    private static final String LOGIN_NAME = "test_user";
    private static final String NAME = "Test User";
    private static final String INTERNAL_TOKEN = "super-secret";

    @Test
    void when_me_withUserRole_then_ReturnCurrentUser() throws Exception {
        User user = saveUser();
        String token = jwtService.generateToken(user.getId(), Role.USER);

        JsonNode json = performRequest(token, null, 200);

        JsonNode data = json.get("data");

        assertThat(data).isNotNull();
        assertThat(data.get("id").asText()).isEqualTo(user.getId().toString());
        assertThat(data.get("loginName").asText()).isEqualTo(LOGIN_NAME);
        assertThat(data.get("name").asText()).isEqualTo(NAME);

        assertThat(json.get("message").asText()).isEqualTo("Текущий пользователь");
    }

    @Test
    void when_me_withAdminRole_then_ReturnCurrentUser() throws Exception {
        User user = saveUser();
        String token = jwtService.generateToken(user.getId(), Role.ADMIN);

        JsonNode json = performRequest(token, null, 200);

        JsonNode data = json.get("data");

        assertThat(data.get("id").asText()).isEqualTo(user.getId().toString());
        assertThat(data.get("loginName").asText()).isEqualTo(LOGIN_NAME);
        assertThat(data.get("name").asText()).isEqualTo(NAME);
    }

    @Test
    void when_me_withoutToken_then_Unauthorized() throws Exception {
        JsonNode json = performRequest(null, null, 401);

        assertError(json, 401, "Unauthorized");
    }

    @Test
    void when_me_withInvalidToken_then_Unauthorized() throws Exception {
        JsonNode json = performRawHeader("Bearer invalid", null, 401);

        assertError(json, 401, "Unauthorized");
    }

    @Test
    void when_me_withMalformedHeader_then_Unauthorized() throws Exception {
        JsonNode json = performRawHeader("invalid-token", null, 401);

        assertError(json, 401, "Unauthorized");
    }

    @Test
    void when_me_withEmptyBearer_then_Unauthorized() throws Exception {
        JsonNode json = performRawHeader("Bearer ", null, 401);

        assertError(json, 401, "Unauthorized");
    }

    @Test
    void when_me_withExpiredToken_then_Unauthorized() throws Exception {
        String expiredToken = jwtService.generateExpiredToken();

        JsonNode json = performRequest(expiredToken, null, 401);

        assertError(json, 401, "Unauthorized");
    }

    @Test
    void when_me_withSystemRole_then_Forbidden() throws Exception {
        JsonNode json = performRequest(null, INTERNAL_TOKEN, 403);

        assertError(json, 403, "Доступ запрещён");
    }

    @Test
    void when_me_withWrongRole_then_Forbidden() throws Exception {
        User user = saveUser();
        String token = jwtService.generateToken(user.getId(), Role.SYSTEM);

        JsonNode json = performRequest(token, null, 403);

        assertError(json, 403, "Доступ запрещён");
    }

    @Test
    void when_bothInternalAndBearer_then_internalWins() throws Exception {
        User user = saveUser();
        String token = jwtService.generateToken(user.getId(), Role.USER);

        JsonNode json = performRequest(token, INTERNAL_TOKEN, 403);

        assertError(json, 403, "Доступ запрещён");
    }

    @Test
    void when_me_userNotFound_then_NotFound() throws Exception {
        String token = jwtService.generateToken(UUID.randomUUID(), Role.USER);

        JsonNode json = performRequest(token, null, 404);

        assertError(json, 404, "Пользователь не найден");
    }

    @Test
    void when_twoRequests_then_ContextIsIsolated() throws Exception {
        User user = saveUser();
        String token = jwtService.generateToken(user.getId(), Role.USER);

        performRequest(token, null, 200);

        JsonNode json = performRequest(null, null, 401);

        assertError(json, 401, "Unauthorized");
    }

    @Test
    void when_me_success_then_ResponseStructureIsValid() throws Exception {
        User user = saveUser();
        String token = jwtService.generateToken(user.getId(), Role.USER);

        JsonNode json = performRequest(token, null, 200);

        assertThat(json.has("data")).isTrue();
        assertThat(json.has("message")).isTrue();

        JsonNode data = json.get("data");

        assertThat(data.has("id")).isTrue();
        assertThat(data.has("loginName")).isTrue();
        assertThat(data.has("name")).isTrue();
    }

    private JsonNode performRequest(String token, String internal, int expectedStatus) throws Exception {
        var request = get(ME_URL);

        if (token != null) {
            request.header(HttpHeaders.AUTHORIZATION, bearer(token));
        }

        if (internal != null) {
            request.header("X-Internal-Token", internal);
        }

        String response = mockMvc.perform(request)
                .andExpect(status().is(expectedStatus))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return response.isEmpty() ? objectMapper.createObjectNode() : objectMapper.readTree(response);
    }

    private JsonNode performRawHeader(String header, String internal, int expectedStatus) throws Exception {
        var request = get(ME_URL)
                .header(HttpHeaders.AUTHORIZATION, header);

        if (internal != null) {
            request.header("X-Internal-Token", internal);
        }

        String response = mockMvc.perform(request)
                .andExpect(status().is(expectedStatus))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return response.isEmpty() ? objectMapper.createObjectNode() : objectMapper.readTree(response);
    }

    private void assertError(JsonNode json, int status, String message) {
        assertThat(json).isNotNull();
        assertThat(json.get("status").asInt()).isEqualTo(status);
        assertThat(json.get("message").asText()).isEqualTo(message);
        assertThat(json.get("timestamp")).isNotNull();
        assertThat(json.get("path").asText()).isEqualTo(ME_URL);
    }

    private User saveUser() {
        return userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .loginName(LOGIN_NAME)
                .name(NAME)
                .build());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}