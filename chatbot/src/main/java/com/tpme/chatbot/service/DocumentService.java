package com.tpme.chatbot.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpme.chatbot.dto.DocumentRequest;
import com.tpme.chatbot.model.ChatDocument;

import jakarta.annotation.PostConstruct;

@Service
public class DocumentService {
    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);
    private static final Pattern NON_WORD_PATTERN = Pattern.compile("[^\\p{L}\\p{Nd}]+");
    private static final Set<String> STOP_WORDS = Set.of(
            "a", "au", "aux", "avec", "ce", "ces", "dans", "de", "des", "du", "en", "et",
            "la", "le", "les", "ma", "mon", "pour", "que", "qui", "sur", "un", "une",
            "je", "me", "mes", "nous", "vous", "il", "elle", "ils", "elles",
            "how", "what", "where", "when", "the", "and", "for", "with", "من", "في", "على", "ما", "كيف"
    );
    private static final List<PhraseBoost> PHRASE_BOOSTS = List.of(
            new PhraseBoost("trois primes", "primes-investissement", 18),
            new PhraseBoost("3 primes", "primes-investissement", 18),
            new PhraseBoost("prime emploi", "primes-investissement", 14),
            new PhraseBoost("creation emplois", "primes-investissement", 10),
            new PhraseBoost("prime territoriale", "prime-territoriale", 16),
            new PhraseBoost("activites prioritaires", "activites-prioritaires", 16),
            new PhraseBoost("activité prioritaire", "activites-prioritaires", 16),
            new PhraseBoost("eligibilite", "eligibilite-entreprise", 12),
            new PhraseBoost("conditions", "eligibilite-projet", 8),
            new PhraseBoost("dossier", "dossier-demande", 16),
            new PhraseBoost("documents", "dossier-demande", 12),
            new PhraseBoost("pieces", "dossier-demande", 12),
            new PhraseBoost("cri invest", "procedure-contact", 16),
            new PhraseBoost("cri-invest", "procedure-contact", 16),
            new PhraseBoost("boujdour", "prime-territoriale", 16),
            new PhraseBoost("tarfaya", "prime-territoriale", 16),
            new PhraseBoost("smara", "prime-territoriale", 16),
            new PhraseBoost("laayoune", "prime-territoriale", 8),
            new PhraseBoost("ia", "activites-prioritaires", 14),
            new PhraseBoost("digital", "activites-prioritaires", 14),
            new PhraseBoost("developpement web", "activites-prioritaires", 14)
    );

    private final ObjectMapper objectMapper;
    private final Path storagePath;
    private final int maxContextChars;
    private final List<ChatDocument> documents = new ArrayList<>();

    public DocumentService(
            ObjectMapper objectMapper,
            @Value("${app.documents.storage-path:./data/documents.json}") String storagePath,
            @Value("${app.documents.max-context-chars:2500}") int maxContextChars
    ) {
        this.objectMapper = objectMapper;
        this.storagePath = Path.of(storagePath).toAbsolutePath().normalize();
        this.maxContextChars = Math.max(500, maxContextChars);
    }

    @PostConstruct
    public synchronized void initialize() {
        try {
            Files.createDirectories(storagePath.getParent());
            if (Files.notExists(storagePath) || Files.size(storagePath) == 0) {
                seedDocuments();
            }
            documents.clear();
            documents.addAll(readDocuments());
            log.info("Loaded {} chatbot documents from {}", documents.size(), storagePath);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to initialize chatbot documents", exception);
        }
    }

    public synchronized List<ChatDocument> listDocuments() {
        return documents.stream()
                .map(this::copyDocument)
                .sorted(Comparator.comparing(ChatDocument::getTitle, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public synchronized ChatDocument save(DocumentRequest request) {
        ChatDocument document = new ChatDocument(
                UUID.randomUUID().toString(),
                clean(request.getTitle()),
                clean(request.getCategory()),
                cleanKeywords(request.getKeywords()),
                clean(request.getContent())
        );
        documents.add(document);
        persist();
        return copyDocument(document);
    }

    public synchronized Optional<ChatDocument> update(String id, DocumentRequest request) {
        for (ChatDocument document : documents) {
            if (document.getId().equals(id)) {
                document.setTitle(clean(request.getTitle()));
                document.setCategory(clean(request.getCategory()));
                document.setKeywords(cleanKeywords(request.getKeywords()));
                document.setContent(clean(request.getContent()));
                persist();
                return Optional.of(copyDocument(document));
            }
        }
        return Optional.empty();
    }

    public synchronized boolean delete(String id) {
        boolean removed = documents.removeIf(document -> document.getId().equals(id));
        if (removed) {
            persist();
        }
        return removed;
    }

    public synchronized Optional<MatchedDocument> findBestMatch(String question) {
        return findBestMatches(question, 1).stream().findFirst();
    }

    public synchronized List<MatchedDocument> findBestMatches(String question, int limit) {
        if (question == null || question.isBlank() || documents.isEmpty()) {
            return List.of();
        }

        // The document set is intentionally tiny, so lexical matching is faster and simpler than embeddings.
        String expandedQuestion = QuerySupport.expandQuestionForRetrieval(question);
        List<String> questionTokens = tokenize(expandedQuestion);
        if (questionTokens.isEmpty()) {
            return List.of();
        }

        String normalizedQuestion = normalize(expandedQuestion);
        List<MatchedDocument> matches = new ArrayList<>();
        for (ChatDocument document : documents) {
            int score = countMatches(document, questionTokens) + countPhraseBoosts(document, normalizedQuestion);
            if (score <= 0) {
                continue;
            }
            matches.add(new MatchedDocument(copyDocument(document), buildPromptContext(document), score));
        }

        List<MatchedDocument> selected = matches.stream()
                .sorted(Comparator.comparingInt(MatchedDocument::matchCount).reversed()
                        .thenComparing(match -> match.document().getTitle(), String.CASE_INSENSITIVE_ORDER))
                .limit(Math.max(1, limit))
                .toList();

        if (!selected.isEmpty()) {
            log.info("Selected {} chatbot documents for question: {}", selected.size(),
                    selected.stream().map(match -> match.document().getTitle()).toList());
        } else {
            log.info("No matching document found for question; using general TPME prompt");
        }
        return selected;
    }

    private int countMatches(ChatDocument document, List<String> questionTokens) {
        Set<String> titleTokens = new LinkedHashSet<>(tokenize(document.getTitle()));
        Set<String> categoryTokens = new LinkedHashSet<>(tokenize(document.getCategory()));
        Set<String> keywordTokens = new LinkedHashSet<>();
        for (String keyword : document.getKeywords()) {
            keywordTokens.addAll(tokenize(keyword));
        }
        Set<String> contentTokens = new LinkedHashSet<>(tokenize(document.getContent()));

        int matches = 0;
        for (String token : questionTokens) {
            if (keywordTokens.contains(token)) {
                matches += 5;
            }
            if (categoryTokens.contains(token)) {
                matches += 4;
            }
            if (titleTokens.contains(token)) {
                matches += 3;
            }
            if (contentTokens.contains(token)) {
                matches += 1;
            }
        }
        return matches;
    }

    private int countPhraseBoosts(ChatDocument document, String normalizedQuestion) {
        int score = 0;
        for (PhraseBoost boost : PHRASE_BOOSTS) {
            if (boost.appliesTo(document, normalizedQuestion)) {
                score += boost.score();
            }
        }
        return score;
    }

    private String buildPromptContext(ChatDocument document) {
        String context = """
                Titre: %s
                Categorie: %s
                Mots-cles: %s

                %s
                """.formatted(
                document.getTitle(),
                document.getCategory(),
                String.join(", ", document.getKeywords()),
                document.getContent()
        ).trim();

        if (context.length() <= maxContextChars) {
            return context;
        }
        int boundary = context.lastIndexOf(' ', maxContextChars);
        if (boundary < maxContextChars / 2) {
            boundary = maxContextChars;
        }
        return context.substring(0, boundary).trim();
    }

    private List<String> tokenize(String text) {
        String normalized = normalize(text);
        if (normalized.isBlank()) {
            return List.of();
        }
        List<String> tokens = new ArrayList<>();
        for (String token : normalized.split("\\s+")) {
            if (token.length() > 1 && !STOP_WORDS.contains(token)) {
                tokens.add(token);
            }
        }
        return tokens;
    }

    private String normalize(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        return NON_WORD_PATTERN.matcher(normalized).replaceAll(" ").trim();
    }

    private String clean(String value) {
        return value == null ? "" : value.replace("\u0000", " ").replaceAll("\\s+", " ").trim();
    }

    private List<String> cleanKeywords(List<String> keywords) {
        if (keywords == null) {
            return List.of();
        }
        return keywords.stream()
                .map(this::clean)
                .filter(keyword -> !keyword.isBlank())
                .distinct()
                .toList();
    }

    private void seedDocuments() throws IOException {
        ClassPathResource seedResource = new ClassPathResource("seed-documents.json");
        try (InputStream inputStream = seedResource.getInputStream()) {
            Files.copy(inputStream, storagePath);
        }
        log.info("Seeded chatbot documents at {}", storagePath);
    }

    private List<ChatDocument> readDocuments() throws IOException {
        return objectMapper.readValue(storagePath.toFile(), new TypeReference<List<ChatDocument>>() {});
    }

    private void persist() {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(storagePath.toFile(), documents);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to persist chatbot documents", exception);
        }
    }

    private ChatDocument copyDocument(ChatDocument document) {
        return new ChatDocument(
                document.getId(),
                document.getTitle(),
                document.getCategory(),
                document.getKeywords(),
                document.getContent()
        );
    }

    public record MatchedDocument(ChatDocument document, String promptContext, int matchCount) {
    }

    private record PhraseBoost(String phrase, String documentId, int score) {
        private boolean appliesTo(ChatDocument document, String normalizedQuestion) {
            return documentId.equals(document.getId()) && normalizedQuestion.contains(normalizePhrase(phrase));
        }

        private static String normalizePhrase(String phrase) {
            String normalized = Normalizer.normalize(phrase, Normalizer.Form.NFD)
                    .replaceAll("\\p{M}", "")
                    .toLowerCase(Locale.ROOT);
            return NON_WORD_PATTERN.matcher(normalized).replaceAll(" ").trim();
        }
    }
}
