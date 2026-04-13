from fastapi import FastAPI
from pydantic import BaseModel, Field
from logic import generate_content
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SocioMee Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContentRequest(BaseModel):
    keyword: str = Field(..., min_length=1)
    platform: str = Field(..., min_length=1)
    content_type: str = Field(..., min_length=1)
    tone: str = Field(..., min_length=1)


@app.get("/")
def home():
    return {"message": "SocioMee Backend Running 🚀"}


@app.post("/generate-content")
def generate_content_api(data: ContentRequest):
    return generate_content(
        keyword=data.keyword.strip(),
        platform=data.platform.strip(),
        content_type=data.content_type.strip(),
        tone=data.tone.strip(),
    )