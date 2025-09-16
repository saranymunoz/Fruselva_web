from pydantic import BaseModel
from typing import Optional
from datetime import date

# --- Dirección ---

class DireccionBase(BaseModel):
    calle: str
    comuna: str
    region: str

class DireccionOut(DireccionBase):
    id: int

    class Config:
        from_attributes = True  

# --- Vehículo ---

class VehiculoBase(BaseModel):
    patente: str
    marca: str
    modelo: str
    anio: int
    kilometraje: Optional[int] = 0

class VehiculoCreate(VehiculoBase):
    pass

class Vehiculo(VehiculoBase):
    id: int
    

    class Config:
        from_attributes = True

# --- Proveedor ---

class ProveedorBase(BaseModel):
    nombre: str
    telefono: str
    email: str

class ProveedorCreate(ProveedorBase):
    direccion_id: Optional[int] = None
    direccion_nueva: Optional[DireccionBase] = None

class ProveedorUpdate(ProveedorBase):
    direccion_id: Optional[int] = None
    direccion_nueva: Optional[DireccionBase] = None

class ProveedorOut(ProveedorBase):
    id: int
    direccion: Optional[DireccionOut] = None

    class Config:
        from_attributes = True

# --- Tipo de Mantención ---

class TipoMantencion(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


# --- Mantención ---

class MantencionBase(BaseModel):
    vehiculo_id: int
    tipo_id: int
    descripcion: Optional[str]
    fecha: date
    kilometraje: int  
    costo: float      
    proveedor_id: int

    class Config:
        from_attributes = True

class MantencionCreate(MantencionBase):
    pass

class Mantencion(MantencionBase):
    id: int

# --- Programar Mantención ---

class ProgramarMantencionBase(BaseModel):
    vehiculo_id: int
    tipo_id: int
    frecuencia_km: Optional[int]
    frecuencia_meses: Optional[int]
    ultima_fecha: Optional[date]
    ultima_kilometraje: Optional[int]
    siguiente_fecha_estimada: Optional[date]
    siguiente_kilometraje_estimado: Optional[int]

class ProgramarMantencionCreate(ProgramarMantencionBase):
    pass

class ProgramarMantencion(ProgramarMantencionBase):
    id: int

    class Config:
        from_attributes = True

# --- Reportes ---

class MantencionReporte(BaseModel):
    id: int
    vehiculoPatente: str
    tipoMantencion: str
    proveedor: str
    fecha: date
    costo: float

    class Config:
        from_attributes = True 

class ReporteFiltros(BaseModel):
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    patente: Optional[str] = None
    tipo_mantencion: Optional[str] = None
    proveedor: Optional[str] = None
