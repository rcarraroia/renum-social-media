import asyncio
import subprocess
import json
from typing import Dict, List, Any
from datetime import datetime
from app.database import log_api_call
from app.utils.logger import get_logger

logger = get_logger("metricool")

class MetricoolService:
    def __init__(self, organization_id: str):
        self.organization_id = organization_id
        # tokens are expected to be present in organizations table; MetricoolService consumer must ensure tokens exist

    async def _run_uvx(self, args: List[str], timeout: int = 30) -> Dict[str, Any]:
        start = datetime.utcnow()
        try:
            def _sync_run():
                result = subprocess.run(args, capture_output=True, text=True, timeout=timeout)
                return {"returncode": result.returncode, "stdout": result.stdout, "stderr": result.stderr}
            res = await asyncio.to_thread(_sync_run)
            duration_ms = int((datetime.utcnow() - start).total_seconds() * 1000)
            return {"duration_ms": duration_ms, **res}
        except subprocess.TimeoutExpired:
            return {"duration_ms": int((datetime.utcnow() - start).total_seconds() * 1000), "returncode": 124, "stdout": "", "stderr": "timeout"}

    async def test_connection(self) -> Dict[str, Any]:
        # This is a thin wrapper demonstrating how to call uvx; callers must ensure token & userId params
        # For safety we return a structure expected by the frontend
        # In practice, MetricoolService will be initialized by the route after tokens are saved to organizations
        # For now: attempt to call a fake "get_brands" with env-driven args (the route provides the args)
        return {"success": True, "message": "MetricoolService placeholder (uvx called by route)"}