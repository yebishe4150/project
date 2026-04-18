package project.common.logging.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;
import project.common.logging.mask.JsonMaskingService;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@RequiredArgsConstructor
public class LoggingFilter extends OncePerRequestFilter {

    private final JsonMaskingService maskingService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();

        ContentCachingRequestWrapper wrappedRequest =
                new ContentCachingRequestWrapper(request);

        ContentCachingResponseWrapper wrappedResponse =
                new ContentCachingResponseWrapper(response);

        long start = System.currentTimeMillis();

        filterChain.doFilter(wrappedRequest, wrappedResponse);

        long duration = System.currentTimeMillis() - start;
        int status = wrappedResponse.getStatus();

        if (uri.contains("swagger") || uri.contains("v3/api-docs")) {
            wrappedResponse.copyBodyToResponse();
            return;
        }

        String requestBody = getBody(wrappedRequest.getContentAsByteArray());
        String responseBody = getBody(wrappedResponse.getContentAsByteArray());

        String maskedRequest = maskingService.mask(requestBody);
        String maskedResponse = maskingService.mask(responseBody);

        if (status >= 400) {
            log.error(
                    "HTTP {} {} | status={} | duration={}ms | request={} | response={}",
                    request.getMethod(),
                    uri,
                    status,
                    duration,
                    maskedRequest,
                    maskedResponse
            );
        } else if (log.isDebugEnabled()) {
            log.debug(
                    "HTTP {} {} | status={} | duration={}ms | request={} | response={}",
                    request.getMethod(),
                    uri,
                    status,
                    duration,
                    maskedRequest,
                    maskedResponse
            );
        }

        wrappedResponse.copyBodyToResponse();
    }

    private String getBody(byte[] content) {
        if (content == null || content.length == 0) {
            return "";
        }

        if (content.length > 10_000) {
            return "[TOO LARGE BODY]";
        }

        return new String(content, StandardCharsets.UTF_8);
    }
}