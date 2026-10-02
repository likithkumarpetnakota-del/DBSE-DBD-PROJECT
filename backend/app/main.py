from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import (
    client,
    database
)

from app.routes.auth import (
    router as auth_router
)

from app.routes.exams import (
    router as exams_router
)

from app.routes.questions import (
    router as questions_router
)

from app.routes.submissions import (
    router as submissions_router
)

from app.routes.requests import (
    router as requests_router
)

from app.routes.sessions import (
    router as sessions_router
)


from app.routes.notifications import router as notifications_router
from app.routes.health import router as health_router
from app.routes.analytics import router as analytics_router


app = FastAPI(
    title="Online Examination & AI-Assisted Proctoring Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Online Examination & Proctoring API is running"
    }


# ============================================================
# DATABASE TEST
# ============================================================

@app.get("/api/test-db")
def test_database():
    try:
        client.admin.command("ping")
        return {
            "status": "success",
            "message": "MongoDB connected successfully",
            "database": database.name
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth_router)
app.include_router(exams_router)
app.include_router(questions_router)
app.include_router(submissions_router)
app.include_router(requests_router)
app.include_router(sessions_router)
app.include_router(notifications_router)
app.include_router(health_router)
app.include_router(analytics_router)

