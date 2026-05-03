package project.auth_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import project.auth_service.repository.RefreshTokenRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshSessionRevocationService {

    private final RefreshTokenRepository refreshRepo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void revokeAllExceptCurrent(UUID userId, String currentRefreshToken) {
        refreshRepo.deleteAllByUserIdAndTokenNot(userId, currentRefreshToken);
    }
}
