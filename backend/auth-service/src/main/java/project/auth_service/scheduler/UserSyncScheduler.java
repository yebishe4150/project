package project.auth_service.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import project.auth_service.service.UserSyncService;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserSyncScheduler {

    private final UserSyncService userSyncService;

    @Scheduled(
            fixedDelayString = "${user-sync.retry-delay-ms:3600000}",
            initialDelayString = "${user-sync.initial-delay-ms:60000}"
    )
    public void retryPendingUsers() {
        log.info("Запущен scheduler синхронизации пользователей");
        userSyncService.retryPendingSync();
    }
}
