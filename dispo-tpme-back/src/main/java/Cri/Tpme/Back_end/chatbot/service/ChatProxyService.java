package Cri.Tpme.Back_end.chatbot.service;

import Cri.Tpme.Back_end.chatbot.dto.ChatRequest;
import Cri.Tpme.Back_end.chatbot.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class ChatProxyService {

    private final RestTemplate restTemplate;

    @Value("${chatbot.service.url}")
    private String chatbotServiceUrl;

    public ChatResponse forwardMessage(ChatRequest request) {
        String endpoint = chatbotServiceUrl + "/api/chat";
        return restTemplate.postForObject(endpoint, request, ChatResponse.class);
    }
}
