package project.user_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import project.user_service.dto.user.CreateUserRequest;
import project.user_service.dto.user.UserResponse;
import project.user_service.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);

    @Mapping(target = "firstName", ignore = true)
    @Mapping(target = "secondName", ignore = true)
    @Mapping(target = "nickname", ignore = true)
    User toEntity(CreateUserRequest request);
}
