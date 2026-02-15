from enum import Enum

class Plan(str, Enum):
    free = "free"
    starter = "starter"
    pro = "pro"

class VideoStatus(str, Enum):
    draft = "draft"
    processing = "processing"
    ready = "ready"
    failed = "failed"
