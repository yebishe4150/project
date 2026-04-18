package project.common.logging.mask;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import project.common.logging.properties.MaskingProperties;

import java.util.Iterator;
import java.util.Map;

@RequiredArgsConstructor
public class JsonMaskingService {

    private final ObjectMapper objectMapper;
    private final MaskingProperties props;

    public String mask(String body) {
        if (body == null || body.isBlank()) {
            return body;
        }

        try {
            JsonNode root = objectMapper.readTree(body);

            maskFull(root);
            maskPartial(root);

            return objectMapper.writeValueAsString(root);

        } catch (Exception e) {
            return body;
        }
    }

    private void maskFull(JsonNode node) {
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();

            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();

                if (props.getFullMaskingJsonBodyPaths().contains(entry.getKey())) {
                    ((com.fasterxml.jackson.databind.node.ObjectNode) node)
                            .put(entry.getKey(), props.getMask());
                } else {
                    maskFull(entry.getValue());
                }
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                maskFull(child);
            }
        }
    }

    private void maskPartial(JsonNode node) {
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();

            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();

                if (props.getPartialMaskingJsonBodyPaths().contains(entry.getKey())
                        && entry.getValue().isTextual()) {

                    String value = entry.getValue().asText();

                    ((com.fasterxml.jackson.databind.node.ObjectNode) node)
                            .put(entry.getKey(), partialMask(value));

                } else {
                    maskPartial(entry.getValue());
                }
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                maskPartial(child);
            }
        }
    }

    private String partialMask(String value) {
        if (value.length() < props.getMinLengthForPartialMasking()) {
            return props.getMask();
        }

        int maskLength = (int) (value.length() * props.getPartialMaskPercents());

        return value.substring(0, value.length() - maskLength)
                + props.getMask();
    }
}