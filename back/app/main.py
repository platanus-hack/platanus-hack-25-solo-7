from fastapi import FastAPI
from .core.database import engine, Base
from .routers import auth, pdf_parser, company

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(pdf_parser.router)
app.include_router(company.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the F22 Parser API"}
