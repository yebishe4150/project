package project.content_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import project.content_service.AbstractTest;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;
import project.content_service.entity.Role;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ImageLikeControllerTest extends AbstractTest {

    @Test
    void when_likeImageTwice_then_CreateSingleLikeAndReturnCount() throws Exception {
        UUID userId = UUID.randomUUID();
        Image image = saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/liked.jpg", "liked");
        String auth = "Bearer " + bearerToken(userId, Role.USER);

        JsonNode first = objectMapper.readTree(mockMvc.perform(put(likeUrl(image))
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());

        JsonNode second = objectMapper.readTree(mockMvc.perform(put(likeUrl(image))
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());

        assertThat(first.get("data").get("imageId").asText()).isEqualTo(image.getId().toString());
        assertThat(first.get("data").get("liked").asBoolean()).isTrue();
        assertThat(first.get("data").get("likesCount").asLong()).isEqualTo(1);
        assertThat(second.get("data").get("liked").asBoolean()).isTrue();
        assertThat(second.get("data").get("likesCount").asLong()).isEqualTo(1);
        assertThat(imageLikeRepository.count()).isEqualTo(1);
    }

    @Test
    void when_unlikeImage_then_RemoveLikeAndReturnCount() throws Exception {
        UUID userId = UUID.randomUUID();
        Image image = saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/liked.jpg", "liked");
        String auth = "Bearer " + bearerToken(userId, Role.USER);

        mockMvc.perform(put(likeUrl(image))
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk());

        JsonNode response = objectMapper.readTree(mockMvc.perform(delete(likeUrl(image))
                        .header(HttpHeaders.AUTHORIZATION, auth))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());

        assertThat(response.get("data").get("imageId").asText()).isEqualTo(image.getId().toString());
        assertThat(response.get("data").get("liked").asBoolean()).isFalse();
        assertThat(response.get("data").get("likesCount").asLong()).isEqualTo(0);
        assertThat(imageLikeRepository.count()).isZero();
    }

    @Test
    void when_likeMissingImage_then_ReturnNotFound() throws Exception {
        String response = mockMvc.perform(put("/v1/content/images/" + UUID.randomUUID() + "/like")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.USER)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("message").asText()).isEqualTo("Изображение не найдено");
    }

    @Test
    void when_likeWithoutToken_then_ReturnUnauthorized() throws Exception {
        Image image = saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/liked.jpg", "liked");

        JsonNode error = objectMapper.readTree(mockMvc.perform(put(likeUrl(image)))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString());

        assertThat(error.get("message").asText()).isEqualTo("Unauthorized");
    }

    @Test
    void when_likeWithAdminToken_then_ReturnForbidden() throws Exception {
        Image image = saveImage(UUID.randomUUID(), ImageSource.UPLOAD, "http://localhost:9000/images/liked.jpg", "liked");

        JsonNode error = objectMapper.readTree(mockMvc.perform(put(likeUrl(image))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken(UUID.randomUUID(), Role.ADMIN)))
                .andExpect(status().isForbidden())
                .andReturn()
                .getResponse()
                .getContentAsString());

        assertThat(error.get("message").asText()).isEqualTo("Forbidden");
    }

    private String likeUrl(Image image) {
        return "/v1/content/images/" + image.getId() + "/like";
    }
}
