package project.content_service.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import project.content_service.AbstractTest;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;
import project.content_service.entity.Role;
import project.content_service.entity.Tag;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GalleryControllerTest extends AbstractTest {

    private static final String GALLERY_TAGS_URL = "/v1/content/gallery/tags";

    @Test
    void when_galleryHasNoTags_then_ReturnEmptyList() throws Exception {
        String response = mockMvc.perform(get(GALLERY_TAGS_URL)
                        .header(HttpHeaders.AUTHORIZATION, bearer(Role.USER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(0);
    }

    @Test
    void when_galleryHasTags_then_ReturnTags() throws Exception {
        Tag cat = tagRepository.save(Tag.builder().name("cat").build());
        Tag art = tagRepository.save(Tag.builder().name("art").build());
        Tag empty = tagRepository.save(Tag.builder().name("empty").build());

        String response = mockMvc.perform(get(GALLERY_TAGS_URL)
                        .header(HttpHeaders.AUTHORIZATION, bearer(Role.USER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode data = objectMapper.readTree(response).get("data");
        assertThat(data).hasSize(3);

        assertTag(data, art.getId().toString(), "art");
        assertTag(data, cat.getId().toString(), "cat");
        assertTag(data, empty.getId().toString(), "empty");
    }

    @Test
    void when_galleryTagsRequestedWithAdminToken_then_ReturnTags() throws Exception {
        tagRepository.save(Tag.builder().name("cat").build());

        String response = mockMvc.perform(get(GALLERY_TAGS_URL)
                        .header(HttpHeaders.AUTHORIZATION, bearer(Role.ADMIN)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(1);
    }

    @Test
    void when_galleryTagsRequestedWithoutToken_then_ReturnUnauthorized() throws Exception {
        String response = mockMvc.perform(get(GALLERY_TAGS_URL))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("status").asInt()).isEqualTo(401);
        assertThat(error.get("message").asText()).isEqualTo("Unauthorized");
        assertThat(error.get("path").asText()).isEqualTo(GALLERY_TAGS_URL);
    }

    @Test
    void when_galleryTagHasImages_then_ReturnImageUrls() throws Exception {
        Tag cat = tagRepository.save(Tag.builder().name("cat").build());
        Tag art = tagRepository.save(Tag.builder().name("art").build());
        saveImageWithTags("cat-one", "http://localhost:9000/images/cat-one.jpg", cat);
        saveImageWithTags("cat-art", "http://localhost:9000/images/cat-art.jpg", cat, art);
        saveImageWithTags("art-only", "http://localhost:9000/images/art-only.jpg", art);

        String response = mockMvc.perform(get(GALLERY_TAGS_URL + "/" + cat.getId() + "/images")
                        .header(HttpHeaders.AUTHORIZATION, bearer(Role.USER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode data = objectMapper.readTree(response).get("data");
        assertThat(data).hasSize(2);
        assertThat(data.findValuesAsText("url"))
                .containsExactlyInAnyOrder(
                        "http://cdn.local:9000/images/cat-one.jpg",
                        "http://cdn.local:9000/images/cat-art.jpg"
                );
    }

    @Test
    void when_galleryTagHasNoImages_then_ReturnEmptyImageList() throws Exception {
        Tag empty = tagRepository.save(Tag.builder().name("empty").build());

        String response = mockMvc.perform(get(GALLERY_TAGS_URL + "/" + empty.getId() + "/images")
                        .header(HttpHeaders.AUTHORIZATION, bearer(Role.USER)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        assertThat(json.get("data")).hasSize(0);
    }

    @Test
    void when_galleryTagDoesNotExist_then_ReturnNotFound() throws Exception {
        String response = mockMvc.perform(get(GALLERY_TAGS_URL + "/" + UUID.randomUUID() + "/images")
                        .header(HttpHeaders.AUTHORIZATION, bearer(Role.USER)))
                .andExpect(status().isNotFound())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("status").asInt()).isEqualTo(404);
        assertThat(error.get("message").asText()).isEqualTo("Тег не найден");
    }

    @Test
    void when_galleryTagImagesRequestedWithoutToken_then_ReturnUnauthorized() throws Exception {
        String url = GALLERY_TAGS_URL + "/" + UUID.randomUUID() + "/images";

        String response = mockMvc.perform(get(url))
                .andExpect(status().isUnauthorized())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode error = objectMapper.readTree(response);
        assertThat(error.get("status").asInt()).isEqualTo(401);
        assertThat(error.get("message").asText()).isEqualTo("Unauthorized");
        assertThat(error.get("path").asText()).isEqualTo(url);
    }

    private String bearer(Role role) {
        return "Bearer " + bearerToken(UUID.randomUUID(), role);
    }

    private void saveImageWithTags(String description, String url, Tag... tags) {
        imageRepository.save(Image.builder()
                .url(url)
                .userId(UUID.randomUUID())
                .description(description)
                .source(ImageSource.UPLOAD)
                .tags(new HashSet<>(Set.of(tags)))
                .build());
    }

    private void assertTag(JsonNode tags, String id, String name) {
        JsonNode tag = null;

        for (JsonNode current : tags) {
            if (current.get("name").asText().equals(name)) {
                tag = current;
                break;
            }
        }

        assertThat(tag).isNotNull();

        assertThat(tag.get("id").asText()).isEqualTo(id);
        assertThat(tag.has("imageCount")).isFalse();
    }
}
