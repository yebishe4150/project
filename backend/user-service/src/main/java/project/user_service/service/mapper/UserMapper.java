package project.user_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import project.user_service.dto.user.CreateUserRequest;
import project.user_service.dto.user.UpdateUserRequest;
import project.user_service.dto.user.UserResponse;
import project.user_service.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserResponse toResponse(User user);

    @Mapping(target = "id", source = "id")
    @Mapping(target = "loginName", source = "loginName")
    @Mapping(target = "name", source = "name")
    User toEntity(CreateUserRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "loginName", ignore = true)
    @Mapping(target = "createTime", ignore = true)
    @Mapping(target = "updateTime", ignore = true)
    void updateUserFromDto(UpdateUserRequest request, @MappingTarget User user);
}
