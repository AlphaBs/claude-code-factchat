from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse, Response
import httpx

app = FastAPI()

# 전역 AsyncClient 인스턴스
http_client = httpx.AsyncClient()

@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 HTTP 클라이언트 정리"""
    await http_client.aclose()

@app.post("/v1/messages")
async def messages_non_stream(request: Request):
    """일반 HTTP 응답을 처리하는 엔드포인트"""
    apiKey = request.headers.get("x-api-key")
    if not apiKey:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    body = await request.body()
    print(str(body))

    response = httpx.post(
        "https://factchat-cloud.mindlogic.ai/v1/api/anthropic/messages", 
        headers={
            "Authorization": f"Bearer {apiKey}",
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }, 
        content=body
    )

    content = response.content
    
    # 필요한 헤더만 필터링
    allowed_headers = {
        'content-type',
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
        'anthropic-version',
        'anthropic-request-id'
    }
    
    filtered_headers = {}
    for key, value in response.headers.items():
        if key.lower() in allowed_headers:
            filtered_headers[key] = value
    
    print(f"Status Code: {response.status_code}")
    print(f"Original Headers: {response.headers}")
    print(f"Filtered Headers: {filtered_headers}")
    print(f"Content: {content}")
    
    return Response(
        content=content,
        status_code=response.status_code,
        headers=filtered_headers
    )