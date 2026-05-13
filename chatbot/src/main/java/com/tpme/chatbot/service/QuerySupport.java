package com.tpme.chatbot.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

final class QuerySupport {

    private static final Pattern ARABIC_SCRIPT_PATTERN = Pattern.compile("[\\p{InArabic}]");
    private static final Pattern ARABIC_DIACRITICS_PATTERN = Pattern.compile("[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]");
    private static final Pattern TATWEEL_PATTERN = Pattern.compile("ـ");
    private static final Pattern NON_WORD_PATTERN = Pattern.compile("[^\\p{L}\\p{Nd}]+");

    private static final List<QueryExpansionRule> ARABIC_EXPANSION_RULES = List.of(
            new QueryExpansionRule(
                    List.of("tpme", "مقاولة", "مقاولات", "المقاولات", "شركة", "شركات", "مشروع", "مشاريع"),
                    "TPME TPE PME entreprise entreprises"
            ),
            new QueryExpansionRule(
                    List.of("صغيرة", "الصغيرة", "متوسطة", "المتوسطة", "صغيرة جدا", "الصغيرة جدا"),
                    "tres petites petites moyennes"
            ),
            new QueryExpansionRule(
                    List.of("دعم", "الدعم", "منحة", "منح", "اعانة", "إعانة", "تحفيز", "مساعدة"),
                    "dispositif soutien prime primes subvention appui"
            ),
            new QueryExpansionRule(
                    List.of("استثمار", "الاستثمار", "استثمارات", "استثماري"),
                    "investissement investissements"
            ),
            new QueryExpansionRule(
                    List.of("شروط", "شرط", "معايير", "معيار", "اهلية", "أهلية", "مؤهل", "مؤهلة"),
                    "eligibilite conditions criteres"
            ),
            new QueryExpansionRule(
                    List.of("ملف", "الملف", "وثيقة", "وثائق", "مستند", "مستندات", "مرفقات"),
                    "dossier documents pieces justificatives"
            ),
            new QueryExpansionRule(
                    List.of("خطوة", "خطوات", "مرحلة", "مراحل", "اجراء", "إجراء", "اجراءات", "إجراءات", "كيف"),
                    "etapes demarches procedure"
            ),
            new QueryExpansionRule(
                    List.of("شغل", "تشغيل", "عمل", "مناصب", "وظائف", "وظيفة"),
                    "emploi emplois creation"
            ),
            new QueryExpansionRule(
                    List.of("جهة", "جهوي", "إقليم", "اقليم", "منطقة", "مناطق", "ترابي"),
                    "territoriale territoire region"
            ),
            new QueryExpansionRule(
                    List.of("قطاع", "قطاعات", "اولوية", "أولوية", "اولويات", "أولويات"),
                    "activites prioritaires secteurs prioritaires"
            ),
            new QueryExpansionRule(
                    List.of("اتصال", "تواصل", "العنوان", "عنوان", "هاتف", "الهاتف", "رقم", "بريد", "ايميل", "إيميل", "موقع"),
                    "contact adresse telephone email site web"
            ),
            new QueryExpansionRule(
                    List.of("المركز الجهوي للاستثمار", "العيون", "laayoune", "cri"),
                    "CRI Laayoune Centre Regional d Investissement"
            ),
            new QueryExpansionRule(
                    List.of("موعد", "ميعاد", "حجز", "رنديفو"),
                    "rendez vous e rendez vous"
            )
    );

    private QuerySupport() {
    }

    static boolean containsArabic(String text) {
        return text != null && ARABIC_SCRIPT_PATTERN.matcher(text).find();
    }

    static String normalizeForSearch(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String normalized = normalizeArabic(text).toLowerCase(Locale.ROOT);
        return NON_WORD_PATTERN.matcher(normalized).replaceAll(" ").trim();
    }

    static String expandQuestionForRetrieval(String question) {
        if (question == null || question.isBlank()) {
            return "";
        }

        if (!containsArabic(question)) {
            return question.trim();
        }

        String normalizedQuestion = normalizeForSearch(question);
        Set<String> parts = new LinkedHashSet<>();
        parts.add(question.trim());

        for (QueryExpansionRule rule : ARABIC_EXPANSION_RULES) {
            if (rule.matches(normalizedQuestion)) {
                parts.add(rule.expansion());
            }
        }

        String expanded = String.join(" ", parts).trim();
        return expanded.length() <= 450 ? expanded : expanded.substring(0, 450).trim();
    }

    private static String normalizeArabic(String text) {
        String normalized = ARABIC_DIACRITICS_PATTERN.matcher(text).replaceAll("");
        normalized = TATWEEL_PATTERN.matcher(normalized).replaceAll("");
        return normalized
                .replace('أ', 'ا')
                .replace('إ', 'ا')
                .replace('آ', 'ا')
                .replace('ٱ', 'ا')
                .replace('ى', 'ي')
                .replace('ؤ', 'و')
                .replace('ئ', 'ي')
                .replace('ة', 'ه');
    }

    private record QueryExpansionRule(List<String> triggers, String expansion) {
        private boolean matches(String normalizedQuestion) {
            for (String trigger : triggers) {
                if (!trigger.isBlank() && normalizedQuestion.contains(QuerySupport.normalizeForSearch(trigger))) {
                    return true;
                }
            }
            return false;
        }
    }
}
