package Cri.Tpme.Back_end.chatbot.controller;

import Cri.Tpme.Back_end.chatbot.dto.ChatRequest;
import Cri.Tpme.Back_end.chatbot.dto.ChatResponse;
import Cri.Tpme.Back_end.chatbot.service.ChatProxyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatProxyController {

    private final ChatProxyService chatProxyService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatProxyService.forwardMessage(request));
    }
}
