# HeyGen API Endpoints Documentation

**Discovered via HeyGen MCP and Official Documentation**

## Base Configuration

- **Base URL**: `https://api.heygen.com`
- **Authentication**: `X-Api-Key` header (NOT `X-API-KEY`)
- **Content-Type**: `application/json`

## Core Endpoints

### 1. Get Remaining Credits
**Endpoint**: `GET /v1/user/remaining_quota`

**Purpose**: Check available HeyGen credits before video generation

**Headers**:
```
X-Api-Key: <api_key>
```

**Response**:
```json
{
  "remaining_quota": <integer>
}
```

---

### 2. List Avatars
**Endpoint**: `GET /v2/avatars`

**Purpose**: Get list of available avatars

**Headers**:
```
X-Api-Key: <api_key>
```

**Response**:
```json
{
  "data": {
    "avatars": [
      {
        "avatar_id": "string",
        "avatar_name": "string",
        "preview_image_url": "string"
      }
    ]
  }
}
```

---

### 3. List Voices
**Endpoint**: `GET /v2/voices`

**Purpose**: Get list of available voices

**Headers**:
```
X-Api-Key: <api_key>
```

**Response**:
```json
{
  "data": {
    "voices": [
      {
        "voice_id": "string",
        "language": "string",
        "gender": "string",
        "name": "string",
        "preview_audio": "string|null"  // Can be null, empty string, or URL
      }
    ]
  }
}
```

**Note**: `preview_audio` field is optional and can be:
- `null`
- Empty string `""`
- Valid HTTP/HTTPS URL
- S3 URL (not directly accessible)
- Relative path (not directly accessible)

---

### 4. Generate Video
**Endpoint**: `POST /v2/video/generate`

**Purpose**: Create avatar video with script

**Headers**:
```
X-Api-Key: <api_key>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "string",
  "aspect_ratio": "16:9",
  "caption": false,
  "dimension": {
    "width": 1920,
    "height": 1080
  },
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "string",
        "scale": 1,
        "avatar_style": "normal",
        "offset": {
          "x": 0,
          "y": 0
        }
      },
      "voice": {
        "type": "text",
        "voice_id": "string",
        "input_text": "string"
      }
    }
  ]
}
```

**Response**:
```json
{
  "data": {
    "video_id": "string"
  }
}
```

---

### 5. Check Video Status
**Endpoint**: `GET /v1/video_status.get?video_id=<video_id>`

**Purpose**: Poll video generation status and get download URL

**Headers**:
```
X-Api-Key: <api_key>
```

**Query Parameters**:
- `video_id`: The video ID returned from generate endpoint

**Response (Processing)**:
```json
{
  "data": {
    "video_id": "string",
    "status": "processing",
    "video_url": null,
    "thumbnail_url": null
  }
}
```

**Response (Completed)**:
```json
{
  "data": {
    "video_id": "string",
    "status": "completed",
    "video_url": "https://...",
    "thumbnail_url": "https://...",
    "duration": 10.5
  }
}
```

**Response (Failed)**:
```json
{
  "data": {
    "video_id": "string",
    "status": "failed",
    "error": {
      "code": "string",
      "message": "string"
    }
  }
}
```

**Status Values**:
- `pending`: Video generation queued
- `processing`: Video being generated
- `completed`: Video ready for download
- `failed`: Generation failed

---

## Error Responses

All endpoints may return error responses:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

**Common Error Codes**:
- `401`: Invalid or missing API key
- `402`: Insufficient credits
- `404`: Resource not found (invalid avatar_id, voice_id, or video_id)
- `429`: Rate limit exceeded
- `500`: Internal server error

---

## Implementation Notes

1. **Authentication Header**: Use `X-Api-Key` (case-sensitive), not `X-API-KEY`
2. **Credit Verification**: Always check credits BEFORE calling `/v2/video/generate`
3. **Polling Pattern**: Poll `/v1/video_status.get` every 5-10 seconds until status is `completed` or `failed`
4. **Video Storage**: Download video from `video_url` and upload to Supabase `videos-raw` bucket
5. **Optional Fields**: Handle `preview_audio` as optional (can be null, empty, or various URL formats)
6. **Error Handling**: Map HeyGen error codes to user-friendly messages (never expose technical details)

---

## References

- [HeyGen API Documentation](https://docs.heygen.com/docs/api-reference)
- [Authentication Guide](https://docs.heygen.com/reference/authentication-1)
- [Video Generation Guide](https://docs.heygen.com/docs/create-video)
