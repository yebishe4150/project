package project.auth_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.auth_service.entity.UserCredentials;

import java.util.Optional;
import java.util.UUID;

public interface UserCredentialsRepository extends JpaRepository<UserCredentials, UUID> {

    Optional<UserCredentials> findByLoginName(String loginName);
}
