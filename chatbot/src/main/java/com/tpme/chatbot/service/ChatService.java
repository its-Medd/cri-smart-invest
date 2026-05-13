package com.tpme.chatbot.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tpme.chatbot.dto.ChatRequest;
import com.tpme.chatbot.dto.ChatResponse;

@Service
public class ChatService {

    private static final Pattern FRENCH_GREETING_PATTERN = Pattern.compile("(?iu)^\\s*(bonjour|salut|bonsoir|coucou|salam)\\s*[!?.]*\\s*$");
    private static final Pattern ENGLISH_GREETING_PATTERN = Pattern.compile("(?iu)^\\s*(hello|hi|hey)\\s*[!?.]*\\s*$");
    private static final Pattern ARABIC_GREETING_PATTERN = Pattern.compile("(?u)^\\s*(مرحبا|مرحباً|السلام عليكم|اهلا|أهلا)\\s*[!؟.]*\\s*$");
    private static final Pattern DEFINITION_HINT_PATTERN = Pattern.compile("(?iu)\\b(c.?est quoi|c.?est quoi un|que veut dire|veut dire|signifie|definition|definir|meaning|means|what is|what does)\\b");
    private static final Pattern TPME_DOMAIN_PATTERN = Pattern.compile("(?iu)\\b(tpme|tpe|pme|entreprise|soci[eé]t[eé]|startup|projet|investissement|financement|cr[eé]dit|banque|tr[eé]sorerie|cash|facture|client|fournisseur|imp[oô]t|fiscal|taxe|cnss|emploi|recrutement|business|commerce|maroc|cri|laayoune|appui|subvention|prime|aide|registre|statut|ice|if|patente|comptabilit[eé])\\b");
    private static final Pattern TREASURY_PATTERN = Pattern.compile("(?iu)\\b(tr[eé]sorerie|cash|liquidit[eé]|liquidit[eé]s|encaissement|d[eé]caissement|facture|factures|paiement|paiements)\\b");
    private static final Pattern FUNDING_PATTERN = Pattern.compile("(?iu)\\b(financement|cr[eé]dit|banque|pr[eê]t|subvention|prime|appui|aide|investisseur)\\b");
    private static final Pattern CREATION_PATTERN = Pattern.compile("(?iu)\\b(cr[eé]er|cr[eé]ation|ouvrir|lancer|immatriculer|registre|statut|ice|identifiant|patente|rc)\\b");
    private static final Pattern PRIMES_QUESTION_PATTERN = Pattern.compile("(?iu)\\b(3|trois)?\\s*(prime|primes)\\b|\\bprime\\s+(emploi|territoriale|activit[eé]s?|prioritaires?)\\b");
    private static final Pattern TERRITORIAL_QUESTION_PATTERN = Pattern.compile("(?iu)\\b(boujdour|tarfaya|smara|laayoune|la[aâ]youne|territoriale|categorie\\s*[ab])\\b");
    private static final Pattern ELIGIBILITY_QUESTION_PATTERN = Pattern.compile("(?iu)([eé]ligib|condition|crit[eè]re|b[eé]n[eé]ficier|qui\\s+est|qui\\s+peut|peut\\s+b[eé]n[eé]ficier|auto.?entrepreneur|chiffre\\s+d.?affaires)");
    private static final Pattern DOSSIER_QUESTION_PATTERN = Pattern.compile("(?iu)\\b(dossier|document|documents|pi[eè]ces?|justificatif|statuts?|cnss|attestation|mod[eè]le\\s*j|registre\\s+du\\s+commerce)\\b");
    private static final Pattern DIGITAL_PRIORITY_PATTERN = Pattern.compile("(?iu)\\b(digital|num[eé]rique|ia|intelligence\\s+artificielle|cloud|cyber|cybers[eé]curit[eé]|e.?commerce|blockchain|web|logiciel|application\\s+mobile|iot|centre\\s+d.?appels?)\\b");
    private static final Pattern TPME_PATTERN = Pattern.compile("(?iu)\\btpme\\b");
    private static final Pattern TPE_PATTERN = Pattern.compile("(?iu)\\btpe\\b");
    private static final Pattern PME_PATTERN = Pattern.compile("(?iu)\\bpme\\b");
    private static final int DEFAULT_CONTEXT_MATCH_LIMIT = 3;
    private static final String TPME_LABEL = "TPME";
    private static final String TPME_EXPANSION = "Tres Petites, Petites et Moyennes Entreprises";
    private static final String TPE_LABEL = "TPE";
    private static final String TPE_EXPANSION = "Tres Petites Entreprises";
    private static final String PME_LABEL = "PME";
    private static final String PME_EXPANSION = "Petites et Moyennes Entreprises";

    private static final String SYSTEM_PROMPT = """
            Tu es Assistant TPME Invest Maroc, conseiller virtuel du dispositif de soutien specifique
            aux TPME pour la region Laayoune-Sakia El Hamra.

            Ton domaine : investissement TPME, primes, eligibilite, dossier, secteurs eligibles,
            procedure CRUI, plateforme www.cri-invest.ma et contact du CRI Laayoune-Sakia El Hamra.

            Regles imperatives :
            1. Base d'abord ta reponse sur les informations verifiees fournies dans le contexte.
            2. Si le contexte contient la reponse, donne les chiffres, seuils et conditions exactement.
            3. Ne dis pas qu'une information manque si elle est presente dans le contexte.
            4. Ne promets jamais l'octroi d'une prime : la decision appartient a la CRUI.
            5. Ne donne pas de conseil juridique ou fiscal specifique.
            6. Ne mentionne jamais source, document interne, fichier, README ou contexte interne.
            7. Reponds dans un francais clair par defaut, avec des phrases courtes et utiles.
            8. Pour une question d'eligibilite, donne les criteres essentiels et invite a verifier/simuler.
            9. Pour les primes, explique les 3 primes et le plafond de cumul si pertinent.
            10. Pour un dossier, liste les pieces importantes et rappelle la soumission sur www.cri-invest.ma.
            11. Termine par une action concrete : simuler la prime, verifier l'eligibilite, preparer/deposer
                le dossier, ou contacter le CRI.
            12. Si la question sort clairement du dispositif TPME/investissement, recentre poliment.
            """;

    private final RestClient restClient;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final DocumentService documentService;
    private final String model;
    private final Double temperature;
    private final Integer maxTokens;

    public ChatService(
            RestClient.Builder restClientBuilder,
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            DocumentService documentService,
            @Value("${spring.ai.openai.base-url}") String baseUrl,
            @Value("${spring.ai.openai.api-key}") String apiKey,
            @Value("${spring.ai.openai.chat.options.model}") String model,
            @Value("${spring.ai.openai.chat.options.temperature:0.1}") Double temperature,
            @Value("${app.chat.max-tokens:220}") Integer maxTokens
    ) {
        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.objectMapper = objectMapper;
        this.documentService = documentService;
        this.model = model;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
    }

    public ChatResponse chat(ChatRequest request) {
        PreparedReply preparedReply = prepareReply(request.getMessage());
        if (preparedReply.hasDirectReply()) {
            return new ChatResponse(preparedReply.directReply());
        }

        try {
            LmStudioResponse response = restClient.post()
                    .uri("/chat/completions")
                    .body(new LmStudioRequest(
                            model,
                            preparedReply.messages(),
                            null,
                            temperature,
                            maxTokens
                    ))
                    .retrieve()
                    .body(LmStudioResponse.class);

            String reply = extractReply(response);
            return new ChatResponse(reply);
        } catch (RestClientException | IllegalStateException exception) {
            return new ChatResponse(buildFallbackReply(request.getMessage()));
        }
    }

    public SseEmitter streamChat(ChatRequest request) {
        PreparedReply preparedReply = prepareReply(request.getMessage());
        if (preparedReply.hasDirectReply()) {
            return streamDirectReply(preparedReply.directReply());
        }

        SseEmitter emitter = new SseEmitter(0L);
        AtomicBoolean finished = new AtomicBoolean(false);
        StreamReplySanitizer sanitizer = new StreamReplySanitizer();

        webClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(new LmStudioRequest(
                        model,
                        preparedReply.messages(),
                        true,
                        temperature,
                        maxTokens
                ))
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})
                .subscribe(
                        event -> forwardStreamEvent(emitter, event.data(), finished, sanitizer),
                        error -> completeWithFallback(emitter, request.getMessage(), finished),
                        () -> completeStream(emitter, finished, sanitizer)
                );

        emitter.onTimeout(emitter::complete);
        emitter.onCompletion(() -> { });
        return emitter;
    }

    public String health() {
        return "ok";
    }

    private PreparedReply prepareReply(String userMessage) {
        if (isGreetingOnly(userMessage)) {
            return PreparedReply.direct(buildGreetingReply(userMessage));
        }

        String glossaryReply = findGlossaryReply(userMessage);
        if (glossaryReply != null) {
            return PreparedReply.direct(glossaryReply);
        }

        String dispositifReply = findDispositifDirectReply(userMessage);
        if (dispositifReply != null) {
            return PreparedReply.direct(dispositifReply);
        }

        GroundedContext groundedContext = resolveGroundedContext(userMessage);
        if (!groundedContext.hasContext()) {
            return PreparedReply.prompt(buildGeneralMessages(userMessage));
        }

        return PreparedReply.prompt(buildMessages(userMessage, groundedContext));
    }

    private String findGlossaryReply(String userMessage) {
        if (!isDefinitionQuestion(userMessage)) {
            return null;
        }

        if (TPME_PATTERN.matcher(userMessage).find()) {
            return buildDefinitionReply(userMessage, TPME_LABEL, TPME_EXPANSION);
        }

        if (TPE_PATTERN.matcher(userMessage).find()) {
            return buildDefinitionReply(userMessage, TPE_LABEL, TPE_EXPANSION);
        }

        if (PME_PATTERN.matcher(userMessage).find()) {
            return buildDefinitionReply(userMessage, PME_LABEL, PME_EXPANSION);
        }

        return null;
    }

    private boolean isDefinitionQuestion(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return false;
        }

        String trimmed = userMessage.trim();
        return DEFINITION_HINT_PATTERN.matcher(trimmed).find()
                || TPME_PATTERN.matcher(trimmed).matches()
                || TPE_PATTERN.matcher(trimmed).matches()
                || PME_PATTERN.matcher(trimmed).matches()
                || trimmed.length() <= 12 && (TPME_PATTERN.matcher(trimmed).find()
                || TPE_PATTERN.matcher(trimmed).find()
                || PME_PATTERN.matcher(trimmed).find());
    }

    private String buildDefinitionReply(String userMessage, String acronym, String expansion) {
        if (containsArabic(userMessage)) {
            return "%s تعني %s.".formatted(acronym, expansion);
        }
        if (looksEnglish(userMessage)) {
            return "%s stands for %s.".formatted(acronym, expansion);
        }
        return "%s signifie %s.".formatted(acronym, expansion);
    }

    private String findDispositifDirectReply(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return null;
        }

        if (containsArabic(userMessage)) {
            return findArabicDispositifDirectReply(userMessage);
        }

        if (DOSSIER_QUESTION_PATTERN.matcher(userMessage).find()) {
            return buildDossierReply();
        }
        if (ELIGIBILITY_QUESTION_PATTERN.matcher(userMessage).find()) {
            return buildEligibilityReply();
        }
        if (TERRITORIAL_QUESTION_PATTERN.matcher(userMessage).find()
                && PRIMES_QUESTION_PATTERN.matcher(userMessage).find()) {
            return buildTerritorialReply(userMessage);
        }
        if (DIGITAL_PRIORITY_PATTERN.matcher(userMessage).find()) {
            return buildDigitalPriorityReply();
        }
        if (PRIMES_QUESTION_PATTERN.matcher(userMessage).find()) {
            return buildPrimesReply();
        }
        if (TERRITORIAL_QUESTION_PATTERN.matcher(userMessage).find()) {
            return buildTerritorialReply(userMessage);
        }

        return null;
    }

    private String findArabicDispositifDirectReply(String userMessage) {
        String normalized = QuerySupport.normalizeForSearch(userMessage);

        if (containsAny(normalized, "ملف", "وثائق", "وثيقه", "مستند", "مستندات", "اداع", "ايداع", "الطلب")) {
            return buildArabicDossierReply();
        }
        if (containsAny(normalized, "اهليه", "شروط", "شرط", "معايير", "معيار", "مؤهل", "مؤهله", "يستفيد", "الاستفاده")) {
            return buildArabicEligibilityReply();
        }
        if (containsAny(normalized, "بوجدور", "طرفايه", "السماره", "سماره", "العيون", "ترابيه", "اقليم", "فئه")) {
            return buildArabicTerritorialReply(normalized);
        }
        if (containsAny(normalized, "رقمي", "الرقمي", "ذكاء اصطناعي", "الذكاء الاصطناعي", "سحابه", "امن سيبراني", "تجاره الكترونيه", "موقع", "تطبيق", "برمجيات")) {
            return buildArabicDigitalPriorityReply();
        }
        if (containsAny(normalized, "مكافاه", "مكافات", "منحه", "منح", "دعم", "برايم", "استثمار", "استثماريه")) {
            return buildArabicPrimesReply();
        }

        return null;
    }

    private boolean containsAny(String normalizedText, String... terms) {
        for (String term : terms) {
            if (normalizedText.contains(QuerySupport.normalizeForSearch(term))) {
                return true;
            }
        }
        return false;
    }

    private String buildPrimesReply() {
        return """
                Le dispositif TPME prevoit 3 primes cumulables, plafonnees a 30% du montant d'investissement primable :
                1. Prime a la creation d'emplois stables : 5%, 7% ou 10% selon le ratio d'emplois.
                2. Prime territoriale : 10% en categorie A, 15% en categorie B.
                3. Prime activites prioritaires : 10% si le projet releve d'une activite prioritaire.
                Vous pouvez ensuite simuler votre prime ou verifier votre eligibilite sur la plateforme.
                """;
    }

    private String buildArabicPrimesReply() {
        return """
                يوفر جهاز دعم TPME ثلاث مكافآت استثمارية قابلة للجمع، في حدود سقف 30% من مبلغ الاستثمار القابل للدعم:
                1. مكافأة خلق مناصب شغل قارة: 5% أو 7% أو 10% حسب نسبة مناصب الشغل.
                2. المكافأة الترابية: 10% في الفئة A و15% في الفئة B.
                3. مكافأة الأنشطة ذات الأولوية: 10% إذا كان المشروع ضمن نشاط ذي أولوية.
                يمكنك بعد ذلك محاكاة مبلغ الدعم أو التحقق من الأهلية على المنصة.
                """;
    }

    private String buildTerritorialReply(String userMessage) {
        String normalized = userMessage == null ? "" : userMessage.toLowerCase();
        if (normalized.contains("boujdour")) {
            return "Boujdour est en categorie B : la prime territoriale est de 15% du montant d'investissement primable. Vous pouvez l'integrer dans votre simulation de prime.";
        }
        if (normalized.contains("tarfaya")) {
            return "Tarfaya est en categorie B : la prime territoriale est de 15% du montant d'investissement primable. Vous pouvez l'integrer dans votre simulation de prime.";
        }
        if (normalized.contains("smara")) {
            return "Smara est en categorie B : la prime territoriale est de 15% du montant d'investissement primable. Vous pouvez l'integrer dans votre simulation de prime.";
        }
        if (normalized.contains("laayoune") || normalized.contains("laâyoune")) {
            return "Laayoune est en categorie A : la prime territoriale est de 10% du montant d'investissement primable. Vous pouvez l'integrer dans votre simulation de prime.";
        }
        return "Dans la region Laayoune-Sakia El Hamra, Laayoune est en categorie A avec 10%, tandis que Boujdour, Tarfaya et Smara sont en categorie B avec 15%. Vous pouvez simuler votre prime selon la province du projet.";
    }

    private String buildArabicTerritorialReply(String normalizedMessage) {
        if (normalizedMessage.contains(QuerySupport.normalizeForSearch("بوجدور"))) {
            return "بوجدور مصنفة في الفئة B، لذلك تبلغ المكافأة الترابية 15% من مبلغ الاستثمار القابل للدعم. يمكنك إدخالها في محاكاة الدعم.";
        }
        if (normalizedMessage.contains(QuerySupport.normalizeForSearch("طرفاية"))) {
            return "طرفاية مصنفة في الفئة B، لذلك تبلغ المكافأة الترابية 15% من مبلغ الاستثمار القابل للدعم. يمكنك إدخالها في محاكاة الدعم.";
        }
        if (normalizedMessage.contains(QuerySupport.normalizeForSearch("السمارة")) || normalizedMessage.contains(QuerySupport.normalizeForSearch("سمارة"))) {
            return "السمارة مصنفة في الفئة B، لذلك تبلغ المكافأة الترابية 15% من مبلغ الاستثمار القابل للدعم. يمكنك إدخالها في محاكاة الدعم.";
        }
        if (normalizedMessage.contains(QuerySupport.normalizeForSearch("العيون"))) {
            return "العيون مصنفة في الفئة A، لذلك تبلغ المكافأة الترابية 10% من مبلغ الاستثمار القابل للدعم. يمكنك إدخالها في محاكاة الدعم.";
        }
        return "في جهة العيون الساقية الحمراء: العيون في الفئة A بمكافأة 10%، بينما بوجدور وطرفاية والسمارة في الفئة B بمكافأة 15%. يمكنك محاكاة الدعم حسب إقليم المشروع.";
    }

    private String buildEligibilityReply() {
        return """
                Pour etre eligible, l'entreprise doit etre une personne morale de droit prive marocain, avec un chiffre d'affaires entre 1 M MAD et 200 M MAD HT sur au moins un des 3 derniers exercices. Les entreprises creees depuis moins de 3 ans sont dispensees de cette condition de chiffre d'affaires.
                Le projet doit aussi respecter 4 criteres : investissement >= 1 M MAD et < 50 M MAD, financement propre >= 10%, ratio d'emplois stables >= 1,5 emploi par million MAD investi (>= 1 pour le tourisme), et activite eligible dans la region.
                Vous pouvez verifier votre eligibilite avec le simulateur ou preparer votre dossier sur www.cri-invest.ma.
                """;
    }

    private String buildArabicEligibilityReply() {
        return """
                للاستفادة، يجب أن تكون الشركة شخصا معنويا خاضعا للقانون المغربي، ورقم معاملاتها بين 1 مليون و200 مليون درهم دون احتساب الضريبة خلال واحد من آخر 3 تمارين على الأقل. الشركات المحدثة منذ أقل من 3 سنوات معفاة من شرط رقم المعاملات.
                ويجب أن يحترم المشروع 4 شروط: استثمار لا يقل عن 1 مليون درهم وأقل من 50 مليون درهم، تمويل ذاتي لا يقل عن 10%، نسبة مناصب شغل قارة لا تقل عن 1.5 منصب لكل مليون درهم مستثمر (1 في السياحة)، ونشاط مؤهل في الجهة.
                يمكنك التحقق من الأهلية أو تحضير الملف عبر www.cri-invest.ma.
                """;
    }

    private String buildDossierReply() {
        return """
                Le dossier comprend notamment : statuts de l'entreprise et dernier PV, certificat d'immatriculation au registre du commerce modele J de moins de 6 mois, attestation fiscale de moins de 6 mois, attestation CNSS de moins de 6 mois, etats financiers disponibles, declaration du projet, justificatif du bien immobilier affecte au projet et pieces d'identite du representant legal.
                La soumission se fait en ligne sur www.cri-invest.ma. Vous pouvez aussi contacter le CRI de Laayoune pour vous faire accompagner.
                """;
    }

    private String buildArabicDossierReply() {
        return """
                يتضمن الملف أساسا: مستخرج من النظام الأساسي وآخر محضر، شهادة السجل التجاري نموذج J لا تتجاوز 6 أشهر، شهادة الوضعية الجبائية لا تتجاوز 6 أشهر، شهادة CNSS لا تتجاوز 6 أشهر، القوائم المالية المتوفرة، تصريح المشروع، وثيقة العقار المخصص للمشروع، ونسخ بطائق تعريف الممثل القانوني.
                يتم إيداع الملف إلكترونيا عبر www.cri-invest.ma. ويمكنك أيضا التواصل مع CRI العيون للمواكبة.
                """;
    }

    private String buildDigitalPriorityReply() {
        return """
                Oui, un projet digital a Laayoune peut entrer dans le secteur Information et communication, qui fait partie des activites prioritaires : IA, cloud, cybersecurite, big data, e-commerce, blockchain, conception web, logiciels, applications mobiles, IoT ou centres d'appels.
                Si les autres criteres sont respectes, il peut beneficier de la prime activites prioritaires de 10%. Verifiez ensuite l'eligibilite complete et simulez la prime.
                """;
    }

    private String buildArabicDigitalPriorityReply() {
        return """
                نعم، يمكن لمشروع رقمي في العيون أن يندرج ضمن قطاع الإعلام والاتصال، وهو من الأنشطة ذات الأولوية: الذكاء الاصطناعي، السحابة، الأمن السيبراني، البيانات الضخمة، التجارة الإلكترونية، البلوكشين، تصميم الويب، البرمجيات، تطبيقات الهاتف، إنترنت الأشياء أو مراكز النداء.
                إذا احترم المشروع باقي الشروط، يمكنه الاستفادة من مكافأة الأنشطة ذات الأولوية بنسبة 10%. تحقق بعد ذلك من الأهلية الكاملة وحاك مبلغ الدعم.
                """;
    }

    private GroundedContext resolveGroundedContext(String userMessage) {
        List<DocumentService.MatchedDocument> matches = documentService.findBestMatches(userMessage, DEFAULT_CONTEXT_MATCH_LIMIT);
        if (matches.isEmpty()) {
            return GroundedContext.empty();
        }

        String titles = matches.stream()
                .map(match -> match.document().getTitle())
                .distinct()
                .reduce((left, right) -> left + ", " + right)
                .orElse("");
        String context = matches.stream()
                .map(match -> "Document: %s\n%s".formatted(match.document().getTitle(), match.promptContext()))
                .reduce((left, right) -> left + "\n\n---\n\n" + right)
                .orElse("");
        return GroundedContext.document(context, titles);
    }

    private String buildFallbackReply(String userMessage) {
        if (!isTpmeRelated(userMessage)) {
            if (containsArabic(userMessage)) {
                return "أنا مخصص لمواضيع المقاولات الصغيرة والمتوسطة، مثل الإنشاء والتمويل والتسيير.";
            }
            if (looksEnglish(userMessage)) {
                return "I can help with SME topics such as business creation, financing, management, taxes, and employment.";
            }
            return "Je peux vous aider sur les sujets TPME : creation d'entreprise, financement, gestion, fiscalite de base et emploi.";
        }

        if (TREASURY_PATTERN.matcher(userMessage).find()) {
            if (containsArabic(userMessage)) {
                return "لتحسين الخزينة، تابع المداخيل والمصاريف أسبوعيا، سرع استخلاص الفواتير، تفاوض على آجال الدفع، وخطط للمصاريف المهمة مسبقا.";
            }
            if (looksEnglish(userMessage)) {
                return "To improve cash flow, track inflows and outflows weekly, speed up invoice collection, negotiate payment terms, and plan major expenses in advance.";
            }
            return "Pour ameliorer la tresorerie, suivez les entrees et sorties chaque semaine, relancez les factures, negociez les delais de paiement et anticipez les grosses depenses.";
        }

        if (FUNDING_PATTERN.matcher(userMessage).find()) {
            if (containsArabic(userMessage)) {
                return "للبحث عن تمويل، جهز خطة عمل واضحة، تقدير الميزانية، وثائق الشركة، وبيانات مالية حديثة، ثم قارن بين البنك وبرامج الدعم والمستثمرين.";
            }
            if (looksEnglish(userMessage)) {
                return "For financing, prepare a clear business plan, budget, company documents, and recent financial data, then compare banks, support programs, and investors.";
            }
            return "Pour le dispositif TPME, commencez par verifier l'eligibilite du projet, simuler les primes possibles, puis preparez le dossier a deposer sur www.cri-invest.ma ou contactez le CRI de Laayoune.";
        }

        if (CREATION_PATTERN.matcher(userMessage).find()) {
            if (containsArabic(userMessage)) {
                return "لإنشاء مقاولة، حدد النشاط والشكل القانوني، حضر الوثائق، سجل الشركة لدى الجهات المختصة، ثم افتح حسابا بنكيا ونظم المحاسبة منذ البداية.";
            }
            if (looksEnglish(userMessage)) {
                return "To create a business, define the activity and legal form, prepare the documents, register with the competent authorities, then set up banking and accounting from the start.";
            }
            return "Pour creer une entreprise, definissez l'activite et la forme juridique, preparez les documents, immatriculez la structure, puis organisez la banque et la comptabilite des le depart.";
        }

        if (containsArabic(userMessage)) {
            return "بشكل عام، ابدأ بتحديد الهدف، جمع الوثائق والمعطيات المالية، طلب رأي مختص عند الحاجة، ثم تتبع التنفيذ بمؤشرات بسيطة وواضحة.";
        }
        if (looksEnglish(userMessage)) {
            return "In general, define the goal, gather the key documents and financial data, ask a qualified adviser when needed, then track progress with simple indicators.";
        }
        return "En general, definissez l'objectif, rassemblez les documents et donnees financieres utiles, demandez conseil si necessaire, puis suivez l'avancement avec des indicateurs simples.";
    }

    private boolean isTpmeRelated(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return false;
        }
        return TPME_DOMAIN_PATTERN.matcher(userMessage).find()
                || QuerySupport.containsArabic(userMessage);
    }

    private List<LmMessage> buildMessages(String userMessage, GroundedContext groundedContext) {
        List<LmMessage> messages = new ArrayList<>();
        messages.add(new LmMessage("system", SYSTEM_PROMPT));
        messages.add(new LmMessage("system", buildLanguageInstruction(userMessage)));
        if (groundedContext.hasContext()) {
            messages.add(new LmMessage("system", """
                    Informations verifiees de reference :
                    Documents selectionnes: %s
                    Utilise d'abord le contenu suivant pour repondre a la question.
                    Si ces informations suffisent, reponds avec precision.
                    Si elles ne suffisent pas et que la question reste liee au dispositif TPME, complete seulement
                    avec une orientation prudente.
                    Ne fabrique jamais de montant officiel, de condition juridique precise ou de procedure sensible.

                    %s
                    """.formatted(groundedContext.title(), groundedContext.promptContext())));
        }

        messages.add(new LmMessage("user", userMessage));
        return messages;
    }

    private List<LmMessage> buildGeneralMessages(String userMessage) {
        List<LmMessage> messages = new ArrayList<>();
        messages.add(new LmMessage("system", SYSTEM_PROMPT));
        messages.add(new LmMessage("system", buildLanguageInstruction(userMessage)));
        messages.add(new LmMessage("system", """
                Aucun contexte verifie specifique n'a ete trouve pour cette question.
                Si la question est liee au dispositif TPME, aux primes, a l'investissement, au dossier,
                a l'eligibilite, a la plateforme ou au CRI, reponds avec une orientation generale utile et prudente.
                Ne dis pas que tu n'as pas trouve d'information confirmee.
                Pour les montants, delais, criteres officiels, obligations juridiques ou procedures administratives
                precises, indique qu'il faut verifier aupres du site officiel ou d'un conseiller competent.
                Si la question sort clairement du sujet TPME, dis brievement que tu es limite aux sujets TPME.
                """));
        messages.add(new LmMessage("user", userMessage));
        return messages;
    }

    private String buildLanguageInstruction(String userMessage) {
        if (containsArabic(userMessage)) {
            return """
                    Reponds uniquement en arabe clair.
                    Reponds directement a la question.
                    N'ecris pas de phrase d'introduction inutile.
                    Donne une reponse courte, utile et naturelle.
                    """;
        }
        return """
                Reponds dans la langue de la question.
                Reponds en francais par defaut.
                Reponds en anglais uniquement si la question est en anglais.
                Reponds directement a la question.
                N'ecris pas de phrase d'introduction inutile.
                Donne une reponse courte, utile et naturelle.
                """;
    }

    private boolean containsArabic(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        for (int i = 0; i < text.length(); i++) {
            Character.UnicodeBlock block = Character.UnicodeBlock.of(text.charAt(i));
            if (block == Character.UnicodeBlock.ARABIC
                    || block == Character.UnicodeBlock.ARABIC_PRESENTATION_FORMS_A
                    || block == Character.UnicodeBlock.ARABIC_PRESENTATION_FORMS_B
                    || block == Character.UnicodeBlock.ARABIC_SUPPLEMENT
                    || block == Character.UnicodeBlock.ARABIC_EXTENDED_A) {
                return true;
            }
        }

        return false;
    }

    private boolean isGreetingOnly(String text) {
        if (text == null) {
            return false;
        }

        return FRENCH_GREETING_PATTERN.matcher(text).matches()
                || ENGLISH_GREETING_PATTERN.matcher(text).matches()
                || ARABIC_GREETING_PATTERN.matcher(text).matches();
    }

    private String buildGreetingReply(String userMessage) {
        if (containsArabic(userMessage)) {
            return "مرحبا، كيف يمكنني مساعدتك بخصوص المقاولات الصغيرة والمتوسطة؟";
        }
        if (looksEnglish(userMessage)) {
            return "Hello, how can I help you with SMEs?";
        }
        return "Bonjour, comment puis-je vous aider sur les TPME ?";
    }

    private boolean looksEnglish(String text) {
        if (text == null || text.isBlank() || containsArabic(text)) {
            return false;
        }

        String normalized = text.toLowerCase();
        return normalized.contains(" how ")
                || normalized.contains(" what ")
                || normalized.contains(" where ")
                || normalized.contains(" when ")
                || normalized.contains(" can ")
                || normalized.contains(" help ")
                || normalized.startsWith("hello")
                || normalized.startsWith("hi")
                || normalized.startsWith("what")
                || normalized.startsWith("how");
    }

    private String extractReply(LmStudioResponse response) {
        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new IllegalStateException("LM Studio returned no choices");
        }

        LmChoice firstChoice = response.choices().get(0);
        if (firstChoice.message() == null || firstChoice.message().content() == null || firstChoice.message().content().isBlank()) {
            throw new IllegalStateException("LM Studio returned an empty message");
        }

        return normalizeReply(firstChoice.message().content());
    }

    private void forwardStreamEvent(SseEmitter emitter, String data, AtomicBoolean finished, StreamReplySanitizer sanitizer) {
        if (data == null || data.isBlank()) {
            return;
        }

        if ("[DONE]".equals(data.trim())) {
            completeStream(emitter, finished, sanitizer);
            return;
        }

        try {
            LmStudioStreamResponse response = objectMapper.readValue(data, LmStudioStreamResponse.class);
            if (response.choices() == null || response.choices().isEmpty()) {
                return;
            }

            LmDelta delta = response.choices().get(0).delta();
            if (delta == null || delta.content() == null || delta.content().isBlank()) {
                return;
            }

            for (String segment : sanitizer.accept(delta.content())) {
                if (segment.isEmpty()) {
                    continue;
                }

                emitter.send(
                        SseEmitter.event()
                                .name("token")
                                .data(new ChatResponse(segment))
                );
            }
        } catch (Exception exception) {
            completeWithError(emitter, exception, finished);
        }
    }

    private void completeStream(SseEmitter emitter, AtomicBoolean finished, StreamReplySanitizer sanitizer) {
        if (!finished.compareAndSet(false, true)) {
            return;
        }

        try {
            for (String segment : sanitizer.flush()) {
                if (!segment.isEmpty()) {
                    emitter.send(SseEmitter.event().name("token").data(new ChatResponse(segment)));
                }
            }
            emitter.send(SseEmitter.event().name("done").data("done"));
        } catch (IOException ignored) {
        } finally {
            emitter.complete();
        }
    }

    private void completeWithError(SseEmitter emitter, Throwable error, AtomicBoolean finished) {
        if (!finished.compareAndSet(false, true)) {
            return;
        }

        try {
            emitter.send(SseEmitter.event().name("error").data(error.getMessage()));
        } catch (IOException ignored) {
        } finally {
            emitter.completeWithError(error);
        }
    }

    private void completeWithFallback(SseEmitter emitter, String userMessage, AtomicBoolean finished) {
        if (!finished.compareAndSet(false, true)) {
            return;
        }

        try {
            emitter.send(SseEmitter.event().name("token").data(new ChatResponse(buildFallbackReply(userMessage))));
            emitter.send(SseEmitter.event().name("done").data("done"));
            emitter.complete();
        } catch (IOException exception) {
            emitter.completeWithError(exception);
        }
    }

    private SseEmitter streamDirectReply(String reply) {
        SseEmitter emitter = new SseEmitter(0L);
        try {
            emitter.send(SseEmitter.event().name("token").data(new ChatResponse(normalizeReply(reply))));
            emitter.send(SseEmitter.event().name("done").data("done"));
            emitter.complete();
        } catch (IOException exception) {
            emitter.completeWithError(exception);
        }
        return emitter;
    }

    private String normalizeReply(String reply) {
        String cleaned = reply == null ? "" : reply.trim();
        cleaned = stripLeadingIntro(cleaned);
        cleaned = sanitizeFormatting(cleaned);
        cleaned = cleaned.replaceAll("(?m)^\\s*[-•]+\\s*", "");
        cleaned = cleaned.replaceAll("(?m)^\\s*\\d+[.)]\\s*", "");
        cleaned = cleaned.replaceAll("[ \\t]{2,}", " ");
        cleaned = cleaned.replaceAll("\\n{3,}", "\n\n");
        return cleaned.trim();
    }

    private String sanitizeChunk(String text) {
        return sanitizeFormatting(text == null ? "" : text)
                .replace("\r", "")
                .replaceAll("\\n{3,}", "\n\n");
    }

    private String sanitizeFormatting(String text) {
        return text
                .replace("**", "")
                .replace("*", "")
                .replace("`", "")
                .replace("“", "")
                .replace("”", "")
                .replace("\"", "");
    }

    private String stripLeadingIntro(String text) {
        String cleaned = text;
        cleaned = cleaned.replaceFirst("(?is)^\\s*(bonjour|salut|bonsoir)\\s*!?\\s*je\\s+suis[^.?!]*[.?!]\\s*", "");
        cleaned = cleaned.replaceFirst("(?is)^\\s*(bonjour|salut|bonsoir)\\s*!?\\s*", "");
        cleaned = cleaned.replaceFirst("(?is)^\\s*i\\s+am\\s+[^.?!]*assistant[^.?!]*[.?!]\\s*", "");
        cleaned = cleaned.replaceFirst("(?u)^\\s*(مرحبا|مرحباً|السلام عليكم)\\s*[!؟]?\\s*", "");
        return cleaned.trim();
    }

    private final class StreamReplySanitizer {
        private final StringBuilder buffer = new StringBuilder();
        private boolean released = false;

        private List<String> accept(String segment) {
            buffer.append(sanitizeChunk(segment));

            if (!released) {
                String buffered = buffer.toString();
                boolean ready = buffered.length() >= 80
                        || buffered.contains(".")
                        || buffered.contains("!")
                        || buffered.contains("?")
                        || buffered.contains("؟")
                        || buffered.contains("\n");

                if (!ready) {
                    return List.of();
                }

                String normalized = sanitizeChunk(stripLeadingIntro(buffered));
                buffer.setLength(0);
                buffer.append(normalized);
                released = true;
            }

            return emitCompleteSegments(false);
        }

        private List<String> flush() {
            if (buffer.isEmpty()) {
                return List.of();
            }

            String normalized = released
                    ? sanitizeChunk(buffer.toString())
                    : normalizeReply(buffer.toString());
            buffer.setLength(0);
            return normalized.isEmpty() ? List.of() : List.of(normalized);
        }

        private List<String> emitCompleteSegments(boolean finalFlush) {
            if (buffer.isEmpty()) {
                return List.of();
            }

            if (finalFlush) {
                String output = buffer.toString();
                buffer.setLength(0);
                return output.isEmpty() ? List.of() : List.of(output);
            }

            int splitIndex = findLastSafeBoundary(buffer);
            if (splitIndex < 0) {
                return List.of();
            }

            String output = buffer.substring(0, splitIndex + 1);
            String remaining = buffer.substring(splitIndex + 1);
            buffer.setLength(0);
            buffer.append(remaining);
            return output.isEmpty() ? List.of() : List.of(output);
        }

        private int findLastSafeBoundary(CharSequence text) {
            for (int i = text.length() - 1; i >= 0; i--) {
                char ch = text.charAt(i);
                if (Character.isWhitespace(ch)
                        || ch == '.'
                        || ch == ','
                        || ch == ';'
                        || ch == ':'
                        || ch == '!'
                        || ch == '?'
                        || ch == '؟'
                        || ch == '،') {
                    return i;
                }
            }
            return -1;
        }
    }

    private record LmStudioRequest(
            String model,
            List<LmMessage> messages,
            Boolean stream,
            Double temperature,
            Integer max_tokens
    ) {}

    private record LmMessage(String role, String content) {}

    private record LmStudioResponse(List<LmChoice> choices) {}

    private record LmChoice(LmMessage message) {}

    private record LmStudioStreamResponse(List<LmStreamChoice> choices) {}

    private record LmStreamChoice(LmDelta delta) {}

    private record LmDelta(String content) {}

    private record PreparedReply(String directReply, List<LmMessage> messages) {
        private static PreparedReply direct(String reply) {
            return new PreparedReply(reply, List.of());
        }

        private static PreparedReply prompt(List<LmMessage> messages) {
            return new PreparedReply(null, messages);
        }

        private boolean hasDirectReply() {
            return directReply != null;
        }
    }

    private record GroundedContext(String promptContext, String title) {
        private static GroundedContext empty() {
            return new GroundedContext("", "");
        }

        private static GroundedContext document(String promptContext, String title) {
            return new GroundedContext(promptContext, title);
        }

        private boolean hasContext() {
            return !promptContext.isBlank();
        }
    }
}
