package project.auth_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.auth_service.entity.UserSyncTask;

import java.util.List;
import java.util.UUID;

public interface UserSyncTaskRepository extends JpaRepository<UserSyncTask, UUID> {

    List<UserSyncTask> findTop100ByOrderByCreateTimeAsc();
}
