package project.auth_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.auth_service.dto.client.CreateUserRequest;
import project.auth_service.entity.UserCredentials;
import project.auth_service.entity.UserSyncTask;
import project.auth_service.exception.ExternalServiceException;
import project.auth_service.repository.UserSyncTaskRepository;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSyncService {

    private static final int MAX_ERROR_LENGTH = 1000;

    private final UserSyncTaskRepository userSyncTaskRepository;
    private final UserClientService userClientService;

    @Transactional
    public void schedule(UserCredentials user) {
        userSyncTaskRepository.save(UserSyncTask.builder()
                .userId(user.getUserId())
                .loginName(user.getLoginName())
                .build());
    }

    @Transactional
    public void trySyncNow(CreateUserRequest request) {
        trySyncTask(request, "instant");
    }

    @Transactional
    public void retryPendingSync() {
        List<UserSyncTask> tasks = userSyncTaskRepository.findTop100ByOrderByCreateTimeAsc();

        if (tasks.isEmpty()) {
            return;
        }

        log.info("Запущена отложенная синхронизация пользователей с user-service: pendingCount={}", tasks.size());

        for (UserSyncTask task : tasks) {
            trySyncTask(CreateUserRequest.from(task.getUserId(), task.getLoginName()), "scheduled");
        }
    }

    private void trySyncTask(CreateUserRequest request, String mode) {
        userSyncTaskRepository.findById(request.getId()).ifPresent(task -> {
            try {
                userClientService.createUser(request);
                userSyncTaskRepository.delete(task);
                log.info("Синхронизация пользователя с user-service завершена успешно: userId={}, mode={}",
                        request.getId(), mode);
            } catch (ExternalServiceException ex) {
                task.setErrorCount(task.getErrorCount() + 1);
                task.setLastAttemptAt(LocalDateTime.now());
                task.setLastError(truncate(ex.getMessage()));
                userSyncTaskRepository.save(task);
                log.warn("Синхронизация пользователя с user-service не удалась, задача оставлена в очереди: userId={}, mode={}, attempts={}, message={}",
                        task.getUserId(), mode, task.getErrorCount(), ex.getMessage());
            }
        });
    }

    private String truncate(String value) {
        if (value == null || value.length() <= MAX_ERROR_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_ERROR_LENGTH);
    }
}
