package project.user_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.user_service.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    boolean existsByNickname(String nickname);

    Optional<User> findByNickname(String nickname);
}
