# Chatbot TPME

## Migration note: RAG to lightweight documents

The chatbot no longer uses vector retrieval, embeddings, chunking, cosine similarity, website crawling, or RAG pipelines.

New flow:

`User question -> keyword/category document match -> prompt context -> LM Studio -> response`

This is intentionally small and fast for a local LM Studio setup with Gemma 3 1B and a small document set.

## Local model

The service calls the LM Studio OpenAI-compatible endpoint:

- Base URL: `http://localhost:1234/v1`
- Default model: `gemma-3-1b`

Override with:

```powershell
$env:LM_STUDIO_MODEL="your-local-model-name"
```

## Document storage

Documents are stored as JSON at:

```text
./data/documents.json
```

On first startup, the file is seeded from `src/main/resources/seed-documents.json`.

Each document has:

- `id`
- `title`
- `category`
- `keywords`
- `content`

## Admin endpoints

- `GET /documents`
- `POST /documents`
- `PUT /documents/{id}`
- `DELETE /documents/{id}`

Example body:

```json
{
  "title": "Financement des TPME",
  "category": "financement",
  "keywords": ["financement", "credit", "banque"],
  "content": "Texte court utilise comme contexte du prompt."
}
```

## Chat endpoints

- `POST /api/chat`
- `POST /api/chat/stream`
- `GET /api/chat/health`
