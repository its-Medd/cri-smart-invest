package com.tpme.chatbot.model;

import java.util.List;

public class ChatDocument {
    private String id;
    private String title;
    private String category;
    private List<String> keywords;
    private String content;

    public ChatDocument() {
    }

    public ChatDocument(String id, String title, String category, List<String> keywords, String content) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.keywords = keywords == null ? List.of() : List.copyOf(keywords);
        this.content = content;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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
        return keywords == null ? List.of() : keywords;
    }

    public void setKeywords(List<String> keywords) {
        this.keywords = keywords == null ? List.of() : List.copyOf(keywords);
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
