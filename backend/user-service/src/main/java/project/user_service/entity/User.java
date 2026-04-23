package project.user_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Locale;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    private UUID id;

    private String loginName;

    private String firstName;

    private String secondName;

    @Column(unique = true)
    private String nickname;

    private String email;

    private String phoneNumber;

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (nickname != null) {
            nickname = nickname.toLowerCase(Locale.ROOT);
        }
    }
}
