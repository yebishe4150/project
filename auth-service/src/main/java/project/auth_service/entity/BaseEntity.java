package project.auth_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Column(insertable = false, updatable = false)
    private LocalDateTime createTime;

    @Column(insertable = false)
    private LocalDateTime updateTime;
}