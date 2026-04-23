package project.content_service.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import project.content_service.dto.ErrorResponse;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class SecurityErrorResponseWriter {

    private final ObjectMapper objectMapper;

    public void writeUnauthorized(HttpServletRequest request, HttpServletResponse response) throws IOException {
        writeError(request, response, HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
    }

    public void writeForbidden(HttpServletRequest request, HttpServletResponse response) throws IOException {
        writeError(request, response, HttpServletResponse.SC_FORBIDDEN, "Forbidden");
    }

    private void writeError(HttpServletRequest request,
                            HttpServletResponse response,
                            int status,
                            String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ErrorResponse.builder()
                .message(message)
                .status(status)
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build());
    }
}
