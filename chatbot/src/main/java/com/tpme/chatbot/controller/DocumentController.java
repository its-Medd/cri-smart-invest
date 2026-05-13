package com.tpme.chatbot.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tpme.chatbot.dto.DocumentRequest;
import com.tpme.chatbot.model.ChatDocument;
import com.tpme.chatbot.service.DocumentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/documents")
public class DocumentController {
    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<ChatDocument> listDocuments() {
        return documentService.listDocuments();
    }

    @PostMapping
    public ResponseEntity<ChatDocument> saveDocument(@Valid @RequestBody DocumentRequest request) {
        return ResponseEntity.ok(documentService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChatDocument> updateDocument(@PathVariable String id, @Valid @RequestBody DocumentRequest request) {
        return documentService.update(id, request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        return documentService.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
