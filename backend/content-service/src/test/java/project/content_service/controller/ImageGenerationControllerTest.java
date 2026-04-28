package project.content_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import project.content_service.AbstractTest;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;
import project.content_service.entity.Role;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ImageGenerationControllerTest extends AbstractTest {

    private static final String GENERATE_URL = "/v1/content/image-generations/generate";

    @Test
    void when_generateWithUserToken_then_SaveGeneratedImageAndReturnExternalUrl() throws Exception {
        UUID userId = UUID.randomUUID();

        when(pollinationsImageClient.generateImage(any())).thenReturn(jpegBytes());
        when(s3Client.putObject(any(software.amazon.awssdk.services.s3.model.PutObjectRequest.class), any(software.amazon.awssdk.core.sync.RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().eTag("etag").build());

        String response = mockMvc.perform(post(GENERATE_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(userId, Role.USER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "prompt": "cat astronaut",
                                  "description": "generated image",
                                  "tags": ["space", "cat"]
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data").get("url").asText()).startsWith("http://cdn.local:9000/images/");
        assertThat(imageRepository.findAll()).hasSize(1);

        Image saved = imageRepository.findAll().getFirst();
        assertThat(saved.getSource()).isEqualTo(ImageSource.GENERATED);
        assertThat(saved.getUserId()).isEqualTo(userId);

        verify(pollinationsImageClient).generateImage(eq("cat astronaut, high quality, detailed, 4k, cinematic lighting"));
    }

    @Test
    void when_generateWithoutToken_then_ReturnUnauthorized() throws Exception {
        String response = mockMvc.perform(post(GENERATE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"cat\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Unauthorized");
    }

    @Test
    void when_generateWithAdminToken_then_ReturnForbidden() throws Exception {
        String response = mockMvc.perform(post(GENERATE_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"cat\"}"))
                .andExpect(status().isForbidden())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Forbidden");
    }

    @Test
    void when_generateWithBlankPrompt_then_ReturnBadRequest() throws Exception {
        String response = mockMvc.perform(post(GENERATE_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.USER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).contains("prompt");
    }

    @Test
    void when_generateAndAiClientFails_then_ReturnBadGateway() throws Exception {
        when(pollinationsImageClient.generateImage(any())).thenThrow(new RuntimeException("AI down"));

        String response = mockMvc.perform(post(GENERATE_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.USER))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"prompt\":\"cat\"}"))
                .andExpect(status().isBadGateway())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Сервис генерации изображений недоступен");
    }

    private byte[] jpegBytes() {
        return new byte[]{
                (byte) 0xFF,
                (byte) 0xD8,
                (byte) 0xFF,
                (byte) 0xE0,
                0x00,
                0x10,
                'J',
                'F',
                'I',
                'F',
                0x00
        };
    }
}
