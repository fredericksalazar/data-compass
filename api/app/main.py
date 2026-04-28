import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import cmmi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4321", "http://127.0.0.1:4321"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cmmi.router, prefix="/api/v1", tags=["cmmi"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

print("API deployed successfully")
