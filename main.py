from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import json

# ---- 如果你用 .env 文件存放 API key ----
# from dotenv import load_dotenv
# load_dotenv()

app = FastAPI(title="SkyTrace API")

# ---- CORS 配置 ----
# 允许前端 (localhost:5173) 访问后端 (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================================
# 数据模型 (Pydantic)
# ========================================

class ChatRequest(BaseModel):
    """AI聊天请求 — Page3用"""
    system: str
    messages: list


class LatLon(BaseModel):
    lat: float
    lon: float


class GridConfig(BaseModel):
    lat_step_deg: float = 0.5
    lon_step_deg: float = 0.5
    altitudes_ft: list = [30000, 34000, 38000]
    max_expansions: int = 8000


class OptimizeRequest(BaseModel):
    """路线优化请求 — Page5用（对应项目计划 Module 2 的输入）"""
    start: LatLon
    end: LatLon
    departure_time: str
    aircraft_type: str = "B738"
    lambda_value: float = 1.0  # 原字段名 lambda 是Python保留字，改名
    grid_config: Optional[GridConfig] = None

    # 兼容旧格式（你之前HTML中用的字段名）
    class Config:
        populate_by_name = True


# ========================================
# 路由 1: 健康检查
# ========================================

@app.get("/health")
async def health():
    return {"status": "ok", "service": "SkyTrace API"}


# ========================================
# 路由 2: AI 聊天代理 (Page3 用)
# ========================================

# 你的 Anthropic API Key — 放在环境变量中更安全
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "YOUR_KEY_HERE")


@app.post("/api/chat")
async def chat_proxy(request: ChatRequest):
    """
    代理 AI 聊天请求到 Anthropic API。
    这样前端不需要暴露 API key。
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "system": request.system,
                "messages": request.messages,
            },
        )
        data = response.json()

    # 提取文本回复
    text = data.get("content", [{}])[0].get("text", "Sorry, no response.")
    return {"response": text}


@app.post("/api/extract-flight")
async def extract_flight(request: ChatRequest):
    """
    用 AI 从对话历史中提取结构化航班数据。
    返回 JSON 字符串，前端解析。
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 300,
                "system": request.system,
                "messages": request.messages,
            },
        )
        data = response.json()

    text = data.get("content", [{}])[0].get("text", "{}")
    return {"response": text}


# ========================================
# 路由 3: 路线优化 (Page5 用)
# ========================================

# 你的路线优化后端地址 (Module 2)
# 如果Module 2跑在别的机器上，改这个URL
OPTIMIZER_URL = os.getenv(
    "OPTIMIZER_URL",
    "https://testfastapi-production-325b.up.railway.app/optimum_ef_route"
)


@app.post("/api/optimize")
async def optimize_route(request: OptimizeRequest):
    """
    接收前端的优化请求，转发给 Module 2 (Optimizer)。
    
    流程:
    1. 前端 → 这里 (POST /api/optimize)
    2. 这里 → Module 2 (POST /optimum_ef_route 或 /api/optimize)
    3. Module 2 返回 route_edges
    4. (可选) 这里 → Module 3 验证
    5. 返回给前端
    """
    # 构建发给 Module 2 的请求体
    # 这里需要匹配你的 Module 2 实际接受的格式
    optimizer_payload = {
        "grid_density": 6,
        "start_long": request.start.lon,
        "start_lat": request.start.lat,
        "end_long": request.end.lon,
        "end_lat": request.end.lat,
        "start_time": request.departure_time,
        "duration_hours": 2,  # 可以从 flightData 推算
        "fuel_cost_per_km": 0.15,
        "lambda_value": request.lambda_value,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OPTIMIZER_URL,
                json=optimizer_payload,
            )
            data = response.json()

        # ---- (可选) 调用 Module 3 验证 ----
        # verification_response = await verify_route(data)
        # return verification_response

        return data

    except httpx.TimeoutException:
        return {"error": "Optimizer timed out. Try reducing grid density."}
    except Exception as e:
        return {"error": str(e)}


# ========================================
# 路由 4: 路线验证 (Module 3)
# ========================================

VERIFY_URL = os.getenv("VERIFY_URL", "http://localhost:8001/api/verifyRoute")


@app.post("/api/verify")
async def verify_route(route_payload: dict):
    """
    (可选) 将路线发给 Module 3 验证。
    如果 Module 3 没跑，直接返回未验证结果。
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(VERIFY_URL, json=route_payload)
            return response.json()
    except Exception:
        # Module 3 不可用时的 fallback
        return {
            "status": "unverified",
            "verified_on_chain": False,
            "route_payload": route_payload,
        }


# ========================================
# 启动提示
# ========================================

if __name__ == "__main__":
    import uvicorn
    print("🛫 Starting SkyTrace API on http://localhost:8000")
    print("📖 Docs: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
