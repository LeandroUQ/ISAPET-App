from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers import afiliacion_ctrl
from models.database import engine, Base

# Crea las tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ISAPET API",
    description="Backend para gestión de afiliaciones veterinarias",
    version="1.0.0"
)

# Configuración CORS (Obligatorio para que React se pueda conectar)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, aquí pones la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Integración del router
app.include_router(afiliacion_ctrl.router, prefix="/api/v1")


@app.get("/")
def home():
    return {"mensaje": "Bienvenido a la API de ISAPET. Sistema en línea."}
