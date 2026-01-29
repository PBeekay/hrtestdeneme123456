
class MonitorTarget(BaseModel):
    target_id: int
    name: string
    url: string
    status: str
    latency_ms: float
    last_check: str
    history_preview: List[float]
