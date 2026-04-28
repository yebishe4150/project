package project.user_service.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import project.user_service.AbstractTest;
import project.user_service.entity.Role;
import project.user_service.entity.User;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:user-rate-limit-test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
        "rate-limit.enabled=true",
        "rate-limit.me.limit=1",
        "rate-limit.me.window-seconds=60",
        "rate-limit.update-me.limit=1",
        "rate-limit.update-me.window-seconds=60",
        "rate-limit.internal-create.limit=1",
        "rate-limit.internal-create.window-seconds=60"
})
class UserRateLimitTest extends AbstractTest {

    private static final String INTERNAL_TOKEN = "super-secret";

    @Test
    void when_meLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        User user = saveUser("me_user");
        String auth = "Bearer " + jwtService.generateToken(user.getId(), Role.USER);

        mockMvc.perform(get("/v1/users/me")
                        .header("X-Forwarded-For", "10.2.0.1")
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk());

        mockMvc.perform(get("/v1/users/me")
                        .header("X-Forwarded-For", "10.2.0.1")
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void when_updateMeLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        User user = saveUser("update_user");
        String auth = "Bearer " + jwtService.generateToken(user.getId(), Role.USER);

        ObjectNode request = objectMapper.createObjectNode();
        request.put("firstName", "Updated");

        mockMvc.perform(put("/v1/users/me")
                        .header("X-Forwarded-For", "10.2.0.2")
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/v1/users/me")
                        .header("X-Forwarded-For", "10.2.0.2")
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(request)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void when_internalCreateLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        mockMvc.perform(post("/v1/users")
                        .header("X-Forwarded-For", "10.2.0.3")
                        .header("X-Internal-Token", INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody(UUID.randomUUID(), "new_user_1")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/v1/users")
                        .header("X-Forwarded-For", "10.2.0.3")
                        .header("X-Internal-Token", INTERNAL_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createUserBody(UUID.randomUUID(), "new_user_2")))
                .andExpect(status().isTooManyRequests());
    }

    private User saveUser(String loginName) {
        return userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .loginName(loginName)
                .firstName("Test")
                .secondName("User")
                .nickname(loginName + "_nick")
                .email(loginName + "@example.com")
                .phoneNumber("+79990000000")
                .build());
    }

    private String createUserBody(UUID userId, String loginName) throws Exception {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("id", userId.toString());
        request.put("loginName", loginName);
        request.put("email", loginName + "@example.com");
        request.put("phoneNumber", "+79991111111");
        return toJson(request);
    }
}
