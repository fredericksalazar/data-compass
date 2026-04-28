from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import cmmi

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4321"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cmmi.router, prefix="/api/v1", tags=["cmmi"])