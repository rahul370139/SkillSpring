from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TrainPI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "PUT"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "TrainPI API is running", "status": "healthy", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TrainPI API", "timestamp": "2024-08-01"}

@app.get("/api/test")
async def test_endpoint():
    return {"message": "API is working correctly", "endpoint": "test"}

@app.get("/api/frameworks")
async def get_frameworks():
    return {
        "frameworks": [
            "React", "Vue", "Angular", "Node.js", "Python", "Java", "C#", "Go"
        ]
    } 