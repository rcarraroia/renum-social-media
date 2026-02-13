from pydantic import BaseModel
from typing import Optional, List

class TestMetricoolRequest(BaseModel):
    user_token: str
    user_id: str
    blog_id: Optional[int] = None

class MetricoolStatusResponse(BaseModel):
    connected: bool
    user_id: Optional[str]
    blog_id: Optional[int]
    last_sync: Optional[str]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str