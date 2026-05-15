from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from routers import auth, foods, records, profile, announcements, admin

app = FastAPI(
    title="DDAS API",
    version="1.0.0",
    description="每日飲食記帳系統 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["認證"])
app.include_router(foods.router, prefix="/foods", tags=["食物"])
app.include_router(records.router, prefix="/records", tags=["飲食紀錄"])
app.include_router(profile.router, prefix="/profile", tags=["個人設定"])
app.include_router(announcements.router, prefix="/announcements", tags=["公告"])
app.include_router(admin.router, prefix="/admin", tags=["後台管理"])


@app.get("/", tags=["健康檢查"])
def root():
    return {"status": "ok", "message": "DDAS API is running"}
