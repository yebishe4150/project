package project.content_service.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import project.content_service.AbstractTest;
import project.content_service.entity.Role;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "rate-limit.enabled=true",
        "rate-limit.upload.limit=1",
        "rate-limit.upload.window-seconds=60",
        "rate-limit.image-generation.limit=1",
        "rate-limit.image-generation.window-seconds=60"
})
class ContentRateLimitTest extends AbstractTest {

    @Test
    void when_uploadLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        String auth = "Bearer " + bearerToken(UUID.randomUUID(), Role.USER);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(fakeImage())
                        .header("X-Forwarded-For", "10.1.0.1")
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isBadRequest());

        mockMvc.perform(MockMvcRequestBuilders.multipart("/v1/content/images")
                        .file(fakeImage())
                        .header("X-Forwarded-For", "10.1.0.1")
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void when_imageGenerationLimitExceeded_then_ReturnTooManyRequests() throws Exception {
        String auth = "Bearer " + bearerToken(UUID.randomUUID(), Role.USER);

        mockMvc.perform(post("/v1/content/image-generations/generate")
                        .header("X-Forwarded-For", "10.1.0.2")
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"   \"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/v1/content/image-generations/generate")
                        .header("X-Forwarded-For", "10.1.0.2")
                        .header(HttpHeaders.AUTHORIZATION, auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"   \"}"))
                .andExpect(status().isTooManyRequests());
    }

    private MockMultipartFile fakeImage() {
        return new MockMultipartFile(
                "file",
                "cat.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "not-an-image".getBytes()
        );
    }
}
