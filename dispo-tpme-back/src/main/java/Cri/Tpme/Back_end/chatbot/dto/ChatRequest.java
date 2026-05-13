package Cri.Tpme.Back_end.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatRequest {
    @NotBlank(message = "Le message ne peut pas être vide")
    private String message;
}
