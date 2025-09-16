from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import vehiculos, proveedores, mantenciones, programar_mantenciones, reportes, direcciones

app = FastAPI(title="Fruselva API")

# Configuración CORS para permitir el frontend React en localhost:5000
origins = [
    "http://localhost:5000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "¡API funcionando correctamente!"}

app.include_router(vehiculos.router)
app.include_router(proveedores.router)
app.include_router(mantenciones.router)
app.include_router(programar_mantenciones.router)
app.include_router(reportes.router)
app.include_router(direcciones.router) 

