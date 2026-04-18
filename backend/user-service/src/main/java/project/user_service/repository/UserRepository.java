package project.user_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.user_service.entity.User;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
}
