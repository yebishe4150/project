package project.content_service.service;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import project.content_service.exception.FileUploadException;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

@Component
public class ImageFileValidator {

    public ValidatedImage validate(byte[] bytes, String contentType, String originalName) {
        if (bytes == null || bytes.length == 0) {
            throw new FileUploadException("Файл пустой");
        }

        ImageType detectedType = ImageType.detect(bytes)
                .orElseThrow(() -> new FileUploadException("Поддерживаются только изображения JPEG, PNG, WEBP и GIF"));

        String normalizedContentType = normalizeContentType(contentType);
        if (!detectedType.contentType.equals(normalizedContentType)) {
            throw new FileUploadException("Content-Type файла не соответствует содержимому");
        }

        String extension = extractExtension(originalName)
                .orElseThrow(() -> new FileUploadException("Не удалось определить расширение файла"));

        if (!detectedType.extension.equals(extension)) {
            throw new FileUploadException("Расширение файла не соответствует содержимому");
        }

        return new ValidatedImage(detectedType.contentType, detectedType.extension);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            throw new FileUploadException("Content-Type файла не указан");
        }

        return contentType.toLowerCase(Locale.ROOT);
    }

    private Optional<String> extractExtension(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return Optional.empty();
        }

        String filename = StringUtils.getFilename(originalName);
        if (filename == null || filename.isBlank()) {
            return Optional.empty();
        }

        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return Optional.empty();
        }

        String extension = filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        return Optional.of("jpeg".equals(extension) ? "jpg" : extension);
    }

    public record ValidatedImage(String contentType, String extension) {
    }

    private enum ImageType {
        JPEG("image/jpeg", "jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF}),
        PNG("image/png", "png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}),
        GIF_87A("image/gif", "gif", new byte[]{0x47, 0x49, 0x46, 0x38, 0x37, 0x61}),
        GIF_89A("image/gif", "gif", new byte[]{0x47, 0x49, 0x46, 0x38, 0x39, 0x61}),
        WEBP("image/webp", "webp", null);

        private final String contentType;
        private final String extension;
        private final byte[] signature;

        ImageType(String contentType, String extension, byte[] signature) {
            this.contentType = contentType;
            this.extension = extension;
            this.signature = signature;
        }

        private static Optional<ImageType> detect(byte[] bytes) {
            if (matchesWebp(bytes)) {
                return Optional.of(WEBP);
            }

            return Arrays.stream(values())
                    .filter(type -> type.signature != null)
                    .filter(type -> startsWith(bytes, type.signature))
                    .findFirst();
        }

        private static boolean startsWith(byte[] bytes, byte[] signature) {
            if (bytes.length < signature.length) {
                return false;
            }

            for (int i = 0; i < signature.length; i++) {
                if (bytes[i] != signature[i]) {
                    return false;
                }
            }

            return true;
        }

        private static boolean matchesWebp(byte[] bytes) {
            return bytes.length >= 12
                    && bytes[0] == 'R'
                    && bytes[1] == 'I'
                    && bytes[2] == 'F'
                    && bytes[3] == 'F'
                    && bytes[8] == 'W'
                    && bytes[9] == 'E'
                    && bytes[10] == 'B'
                    && bytes[11] == 'P';
        }
    }
}
