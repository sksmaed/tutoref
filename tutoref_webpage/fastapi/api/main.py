from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import search, admin
from .database import engine, Base

app = FastAPI()

app.add_middleware (
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(search.router)
app.include_router(admin.router)

Base.metadata.create_all(bind=engine)