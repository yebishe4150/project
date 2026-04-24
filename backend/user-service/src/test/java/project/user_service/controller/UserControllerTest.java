package project.user_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import project.user_service.AbstractTest;
import project.user_service.entity.Role;
import project.user_service.entity.User;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerTest extends AbstractTest {

    private static final String ME_URL = "/v1/users/me";
    private static final String USERS_URL = "/v1/users";
    private static final String LOGIN_NAME = "test_user";
    private static final String FIRST_NAME = "Test";
    private static final String SECOND_NAME = "User";
    private static final String NICKNAME = "TesterNick";
    private static final String NORMALIZED_NICKNAME = "testernick";
    private static final String EMAIL = "test@example.com";
    private static final String PHONE_NUMBER = "+79990000000";
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
        assertThat(data.get("firstName").asText()).isEqualTo(FIRST_NAME);
        assertThat(data.get("secondName").asText()).isEqualTo(SECOND_NAME);
        assertThat(data.get("nickname").asText()).isEqualTo(NORMALIZED_NICKNAME);
        assertThat(data.get("email").asText()).isEqualTo(EMAIL);
        assertThat(data.get("phoneNumber").asText()).isEqualTo(PHONE_NUMBER);

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
        assertThat(data.get("firstName").asText()).isEqualTo(FIRST_NAME);
        assertThat(data.get("secondName").asText()).isEqualTo(SECOND_NAME);
        assertThat(data.get("nickname").asText()).isEqualTo(NORMALIZED_NICKNAME);
        assertThat(data.get("email").asText()).isEqualTo(EMAIL);
        assertThat(data.get("phoneNumber").asText()).isEqualTo(PHONE_NUMBER);
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
        assertThat(data.has("firstName")).isTrue();
        assertThat(data.has("secondName")).isTrue();
        assertThat(data.has("nickname")).isTrue();
        assertThat(data.has("email")).isTrue();
        assertThat(data.has("phoneNumber")).isTrue();
    }

    @Test
    void when_updateMe_withNullAndEmptyFields_then_UpdateOnlyNotEmptyFields() throws Exception {
        User user = saveUser();
        String token = jwtService.generateToken(user.getId(), Role.USER);

        ObjectNode request = objectMapper.createObjectNode();
        request.put("firstName", "Updated");
        request.put("secondName", "");
        request.putNull("nickname");
        request.put("email", "");
        request.put("phoneNumber", "   ");

        String response = mockMvc.perform(put(ME_URL)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode data = objectMapper.readTree(response).get("data");

        assertThat(data.get("firstName").asText()).isEqualTo("Updated");
        assertThat(data.get("secondName").asText()).isEqualTo(SECOND_NAME);
        assertThat(data.get("nickname").asText()).isEqualTo(NORMALIZED_NICKNAME);
        assertThat(data.get("email").asText()).isEqualTo(EMAIL);
        assertThat(data.get("phoneNumber").asText()).isEqualTo(PHONE_NUMBER);
    }

    @Test
    void when_updateMe_withOccupiedNickname_then_ReturnConflict() throws Exception {
        User currentUser = saveUserWithNickname("CurrentNick");
        saveUserWithNickname("BusyNick");

        String token = jwtService.generateToken(currentUser.getId(), Role.USER);

        ObjectNode request = objectMapper.createObjectNode();
        request.put("nickname", "BUSYNICK");

        String response = mockMvc.perform(put(ME_URL)
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isConflict())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);

        assertThat(error.get("status").asInt()).isEqualTo(409);
        assertThat(error.get("message").asText()).isEqualTo("Никнейм уже занят");
        assertThat(error.get("path").asText()).isEqualTo(ME_URL);
    }

    @Test
    void when_createUser_then_GenerateRandomNickname() throws Exception {
        UUID userId = UUID.randomUUID();

        ObjectNode request = objectMapper.createObjectNode();
        request.put("id", userId.toString());
        request.put("loginName", "new_user");
        request.put("email", "new@example.com");
        request.put("phoneNumber", "+79991111111");

        String response = mockMvc.perform(post(USERS_URL)
                        .header("X-Internal-Token", INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode data = objectMapper.readTree(response).get("data");
        String nickname = data.get("nickname").asText();

        assertThat(nickname).startsWith("good_user_");
        int number = Integer.parseInt(nickname.substring("good_user_".length()));
        assertThat(number).isBetween(1, 123_123);

        User saved = userRepository.findById(userId).orElseThrow();
        assertThat(saved.getNickname()).isEqualTo(nickname);
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
        return saveUserWithNickname(NICKNAME);
    }

    private User saveUserWithNickname(String nickname) {
        return userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .loginName(LOGIN_NAME)
                .firstName(FIRST_NAME)
                .secondName(SECOND_NAME)
                .nickname(nickname)
                .email(EMAIL)
                .phoneNumber(PHONE_NUMBER)
                .build());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
