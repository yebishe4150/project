package project.content_service.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import project.content_service.entity.Image;
import project.content_service.entity.ImageSource;
import project.content_service.repository.ImageRepository;
import project.content_service.repository.TagRepository;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImageStorageServiceTest {

    private static final String BUCKET = "images";
    private static final String ENDPOINT = "http://localhost:9000";

    @Test
    void when_transactionRollsBackAfterS3Upload_then_DeleteUploadedObject() {
        TestFixture fixture = createFixture();
        startTransactionSynchronization();

        try {
            fixture.imageStorageService().save(
                    jpegBytes(),
                    "image/jpeg",
                    "jpg",
                    UUID.randomUUID(),
                    "rollback test",
                    null,
                    ImageSource.UPLOAD
            );

            PutObjectRequest putRequest = capturePutRequest(fixture.s3Client());

            completeTransaction(TransactionSynchronization.STATUS_ROLLED_BACK);

            var deleteCaptor = org.mockito.ArgumentCaptor.forClass(DeleteObjectRequest.class);
            verify(fixture.s3Client()).deleteObject(deleteCaptor.capture());

            assertThat(deleteCaptor.getValue().bucket()).isEqualTo(putRequest.bucket());
            assertThat(deleteCaptor.getValue().key()).isEqualTo(putRequest.key());
        } finally {
            clearTransactionSynchronization();
        }
    }

    @Test
    void when_transactionCommitsAfterS3Upload_then_KeepUploadedObject() {
        TestFixture fixture = createFixture();
        startTransactionSynchronization();

        try {
            fixture.imageStorageService().save(
                    jpegBytes(),
                    "image/jpeg",
                    "jpg",
                    UUID.randomUUID(),
                    "commit test",
                    null,
                    ImageSource.UPLOAD
            );

            completeTransaction(TransactionSynchronization.STATUS_COMMITTED);

            verify(fixture.s3Client(), never()).deleteObject(any(DeleteObjectRequest.class));
        } finally {
            clearTransactionSynchronization();
        }
    }

    @Test
    void when_deleteObjectFailsDuringRollback_then_DoNotPropagateCleanupFailure() {
        TestFixture fixture = createFixture();
        startTransactionSynchronization();
        doThrow(new RuntimeException("S3 delete failed"))
                .when(fixture.s3Client())
                .deleteObject(any(DeleteObjectRequest.class));

        try {
            fixture.imageStorageService().save(
                    jpegBytes(),
                    "image/jpeg",
                    "jpg",
                    UUID.randomUUID(),
                    "rollback cleanup failure test",
                    null,
                    ImageSource.UPLOAD
            );

            completeTransaction(TransactionSynchronization.STATUS_ROLLED_BACK);

            verify(fixture.s3Client()).deleteObject(any(DeleteObjectRequest.class));
        } finally {
            clearTransactionSynchronization();
        }
    }

    @Test
    void when_noTransactionSynchronization_then_DoNotRegisterRollbackCleanup() {
        TestFixture fixture = createFixture();

        fixture.imageStorageService().save(
                jpegBytes(),
                "image/jpeg",
                "jpg",
                UUID.randomUUID(),
                "no transaction test",
                null,
                ImageSource.UPLOAD
        );

        verify(fixture.s3Client(), never()).deleteObject(any(DeleteObjectRequest.class));
    }

    private TestFixture createFixture() {
        ImageRepository imageRepository = mock(ImageRepository.class);
        TagRepository tagRepository = mock(TagRepository.class);
        S3Client s3Client = mock(S3Client.class);

        ImageStorageService imageStorageService = new ImageStorageService(imageRepository, tagRepository, s3Client);
        ReflectionTestUtils.setField(imageStorageService, "bucket", BUCKET);
        ReflectionTestUtils.setField(imageStorageService, "endpoint", ENDPOINT);

        when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenReturn(PutObjectResponse.builder().eTag("etag").build());
        when(imageRepository.save(any(Image.class))).thenAnswer(invocation -> {
            Image image = invocation.getArgument(0);
            image.setId(UUID.randomUUID());
            return image;
        });

        return new TestFixture(s3Client, imageStorageService);
    }

    private void startTransactionSynchronization() {
        TransactionSynchronizationManager.initSynchronization();
    }

    private void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    private PutObjectRequest capturePutRequest(S3Client s3Client) {
        var putCaptor = org.mockito.ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(putCaptor.capture(), any(RequestBody.class));
        return putCaptor.getValue();
    }

    private void completeTransaction(int status) {
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(synchronization -> synchronization.afterCompletion(status));
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

    private record TestFixture(
            S3Client s3Client,
            ImageStorageService imageStorageService
    ) {
    }
}
