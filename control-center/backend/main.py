from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Pulse")

app = FastAPI(title="Pulse Control Center", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Database (For Simplicity & Speed) ---
# In a real scenario, use SQLite. For this "control center", in-memory is fine for now 
# as long as we don't need persistent history across restarts immediately.
TARGETS = [
    {"id": 1, "name": "HR Backend API", "url": "http://localhost:8000/health", "type": "api", "interval": 10},
    {"id": 2, "name": "HR Frontend", "url": "http://localhost:3000", "type": "web", "interval": 15},
]

MONITOR_STATUS = {
    1: {"status": "unknown", "latency": 0, "last_check": None, "history": []},
    2: {"status": "unknown", "latency": 0, "last_check": None, "history": []}
}

class MonitorResult(BaseModel):
    target_id: int
    name: str
    url: str
    status: str # up, down, degraded
    latency_ms: float
    last_check: Optional[datetime]
    history_preview: List[int] # Last 10 latency points

# --- Background Monitor Task ---
async def monitor_service(target: Dict):
    async with httpx.AsyncClient() as client:
        try:
            start_time = datetime.now()
            response = await client.get(target['url'], timeout=5.0)
            end_time = datetime.now()
            
            latency = (end_time - start_time).total_seconds() * 1000
            
            status = "up" if response.status_code < 400 else "down"
            
            # Update State
            state = MONITOR_STATUS[target['id']]
            state['status'] = status
            state['latency'] = latency
            state['last_check'] = end_time
            state['history'].append(latency)
            if len(state['history']) > 20: state['history'].pop(0)
            
            logger.info(f"Checked {target['name']}: {status} ({latency:.1f}ms)")
            
        except Exception as e:
            logger.error(f"Failed to check {target['name']}: {e}")
            state = MONITOR_STATUS[target['id']]
            state['status'] = "down"
            state['latency'] = 0
            state['last_check'] = datetime.now()
            state['history'].append(0)

async def start_monitoring_loop():
    while True:
        tasks = []
        for target in TARGETS:
            tasks.append(monitor_service(target))
        await asyncio.gather(*tasks)
        await asyncio.sleep(5) # Global check interval

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(start_monitoring_loop())

# --- API Endpoints ---

@app.get("/")
def read_root():
    return {"system": "Pulse Control Center", "status": "active"}

@app.get("/api/status", response_model=List[MonitorResult])
def get_system_status():
    results = []
    for target in TARGETS:
        state = MONITOR_STATUS[target['id']]
        results.append({
            "target_id": target['id'],
            "name": target['name'],
            "url": target['url'],
            "status": state['status'],
            "latency_ms": state['latency'],
            "last_check": state['last_check'],
            "history_preview": [int(l) for l in state['history']]
        })
    return results

@app.post("/api/targets")
def add_target(name: str, url: str):
    new_id = len(TARGETS) + 1
    TARGETS.append({"id": new_id, "name": name, "url": url, "type": "custom", "interval": 10})
    MONITOR_STATUS[new_id] = {"status": "unknown", "latency": 0, "last_check": None, "history": []}
    return {"message": "Target added", "id": new_id}

if __name__ == "__main__":
    import uvicorn
    # Run on Port 9000
    uvicorn.run(app, host="0.0.0.0", port=9000)
