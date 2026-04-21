package project.user_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import project.user_service.repository.UserRepository;
import project.user_service.service.JwtService;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Transactional
public abstract class AbstractTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected JwtService jwtService;

    protected String toJson(Object obj) throws Exception {
        return objectMapper.writeValueAsString(obj);
    }
}
