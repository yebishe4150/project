package project.content_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import project.content_service.client.PollinationsImageClient;
import project.content_service.client.TranslateClient;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;
import project.content_service.entity.LandingFeed;
import project.content_service.entity.Role;
import project.content_service.entity.Tag;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.ImageLikeRepository;
import project.content_service.repository.LandingFeedRepository;
import project.content_service.repository.TagRepository;
import software.amazon.awssdk.services.s3.S3Client;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = true)
@AutoConfigureWireMock(port = 0)
@ActiveProfiles("test")
@Transactional
public abstract class AbstractTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected SecretKey key;

    @Autowired
    protected ImageRepository imageRepository;

    @Autowired
    protected ImageLikeRepository imageLikeRepository;

    @Autowired
    protected LandingFeedRepository landingFeedRepository;

    @Autowired
    protected TagRepository tagRepository;

    @MockitoBean
    protected S3Client s3Client;

    @MockitoBean
    protected PollinationsImageClient pollinationsImageClient;

    @MockitoBean
    protected TranslateClient translateClient;

    protected String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }

    protected byte[] jpegBytes() {
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

    protected String bearerToken(UUID userId, Role role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(key)
                .compact();
    }

    protected Image saveImage(UUID userId, ImageSource source, String url, String description, String... tagNames) {
        Set<Tag> tags = new HashSet<>();

        if (tagNames != null && tagNames.length > 0) {
            List<Tag> savedTags = tagRepository.saveAll(
                    java.util.Arrays.stream(tagNames)
                            .map(name -> Tag.builder().name(name.toLowerCase()).build())
                            .toList()
            );
            tags.addAll(savedTags);
        }

        return imageRepository.save(Image.builder()
                .url(url)
                .userId(userId)
                .description(description)
                .source(source)
                .tags(tags)
                .build());
    }

    protected LandingFeed saveLandingFeed(UUID imageId) {
        LandingFeed landingFeed = new LandingFeed();
        landingFeed.setImageId(imageId);
        return landingFeedRepository.save(landingFeed);
    }
}
