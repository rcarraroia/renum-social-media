# Tavily API Endpoints - Documentação

## Base URL
```
https://api.tavily.com
```

## Endpoints

### 1. Search (POST /search)

Endpoint principal para pesquisa web.

**Request:**
```json
{
  "query": "string (required)",
  "search_depth": "basic" | "advanced",
  "max_results": 5,
  "include_domains": ["example.com"],
  "exclude_domains": ["spam.com"],
  "include_answer": false,
  "include_raw_content": false,
  "include_images": false,
  "include_image_descriptions": false,
  "include_favicon": false,
  "topic": "general" | "news" | "research",
  "time_range": "day" | "week" | "month" | "year",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "country": "br"
}
```

**Response:**
```json
{
  "query": "string",
  "answer": "string (opcional)",
  "images": [],
  "results": [
    {
      "title": "string",
      "url": "string",
      "content": "string",
      "score": 0.95,
      "raw_content": null,
      "favicon": "string"
    }
  ],
  "response_time": "1.67",
  "auto_parameters": {
    "topic": "general",
    "search_depth": "basic"
  },
  "usage": {
    "credits": 1
  },
  "request_id": "uuid"
}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {API_KEY}
```

---

### 2. Extract (POST /extract)

Endpoint para extrair conteúdo de URLs específicas.

**Request:**
```json
{
  "urls": ["https://example.com"],
  "depth": "basic" | "advanced",
  "include_images": false,
  "extract_depth": "basic" | "advanced"
}
```

**Response:**
```json
{
  "results": [
    {
      "url": "string",
      "raw_content": "string",
      "images": [],
      "favicon": "string"
    }
  ],
  "failed_results": [],
  "response_time": 0.02,
  "usage": {
    "credits": 1
  },
  "request_id": "uuid"
}
```

---

### 3. Usage (GET /usage)

Endpoint para verificar uso da API e rate limits.

**Request:**
```
GET /usage
Authorization: Bearer {API_KEY}
```

**Response:**
```json
{
  "key": {
    "usage": 150,
    "limit": 1000,
    "search_usage": 100,
    "extract_usage": 25,
    "crawl_usage": 15,
    "map_usage": 7,
    "research_usage": 3
  },
  "account": {
    "current_plan": "Bootstrap",
    "plan_usage": 500,
    "plan_limit": 15000,
    "paygo_usage": 25,
    "paygo_limit": 100
  }
}
```

---

## Rate Limits

- **Free Tier:** 1000 credits/mês
- **Search:** 1 credit por requisição
- **Extract:** 1 credit por URL extraída
- **Crawl/Map:** 1 credit por requisição

---

## Implementação no TavilyService

```python
class TavilyService:
    BASE_URL = "https://api.tavily.com"
    API_KEY = settings.tavily_api_key
    TIMEOUT = 30.0
    
    async def search(
        self,
        query: str,
        search_depth: str = "basic",
        max_results: int = 5,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        # POST /search
        # Retorna: {results: [...], query: str}
    
    async def extract(self, urls: List[str]) -> Dict[str, Any]:
        # POST /extract
        # Retorna: {results: [...], failed_results: [...]}
```