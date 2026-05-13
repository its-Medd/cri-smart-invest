package com.tpme.chatbot.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public class DocumentRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String title;
    private String category;
    private List<String> keywords;
    @NotBlank(message = "Le contenu est obligatoire")
    private String content;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public List<String> getKeywords() {
        return keywords;
    }

    public void setKeywords(List<String> keywords) {
        this.keywords = keywords;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
