from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from datetime import date
from sqlalchemy.orm import joinedload


# --- VEHÍCULOS ---

def get_vehiculo_por_patente(db: Session, patente: str) -> Optional[models.Vehiculo]:
    return db.query(models.Vehiculo).filter(models.Vehiculo.patente == patente).first()

def obtener_vehiculos(db: Session) -> List[models.Vehiculo]:
    return db.query(models.Vehiculo).all()

def crear_vehiculo(db: Session, vehiculo: schemas.VehiculoCreate) -> models.Vehiculo:
    db_vehiculo = models.Vehiculo(**vehiculo.dict())
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

def actualizar_vehiculo(db: Session, id: int, datos: schemas.VehiculoCreate) -> Optional[models.Vehiculo]:
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id == id).first()
    if not vehiculo:
        return None
    for key, value in datos.dict().items():
        setattr(vehiculo, key, value)
    db.commit()
    db.refresh(vehiculo)
    return vehiculo

def eliminar_vehiculo(db: Session, id: int) -> bool:
    vehiculo = db.query(models.Vehiculo).filter(models.Vehiculo.id == id).first()
    if not vehiculo:
        return False
    db.delete(vehiculo)
    db.commit()
    return True

# --- PROVEEDORES ---

def obtener_proveedores(db: Session) -> List[schemas.ProveedorOut]:
    proveedores = db.query(models.Proveedor).options(joinedload(models.Proveedor.direccion)).all()
    return [schemas.ProveedorOut.model_validate(p, from_attributes=True) for p in proveedores]

def crear_proveedor(db: Session, proveedor_in: schemas.ProveedorCreate) -> models.Proveedor:
    existing = db.query(models.Proveedor).filter(models.Proveedor.nombre == proveedor_in.nombre).first()
    if existing:
        raise ValueError("Proveedor ya existe")

    direccion_obj = None
    if proveedor_in.direccion_nueva:
        direccion_obj = models.Direccion(**proveedor_in.direccion_nueva.model_dump())
        db.add(direccion_obj)
        db.flush()

    proveedor = models.Proveedor(
        nombre=proveedor_in.nombre,
        telefono=proveedor_in.telefono,
        email=proveedor_in.email,
        direccion_id=direccion_obj.id if direccion_obj else proveedor_in.direccion_id
    )
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor

def actualizar_proveedor(db: Session, id: int, proveedor_in: schemas.ProveedorUpdate) -> Optional[models.Proveedor]:
    proveedor = db.query(models.Proveedor).filter(models.Proveedor.id == id).first()
    if not proveedor:
        return None

    if proveedor_in.nombre != proveedor.nombre:
        exists = db.query(models.Proveedor).filter(
            models.Proveedor.nombre == proveedor_in.nombre,
            models.Proveedor.id != id
        ).first()
        if exists:
            raise ValueError("Proveedor con ese nombre ya existe")

    proveedor.nombre = proveedor_in.nombre
    proveedor.telefono = proveedor_in.telefono
    proveedor.email = proveedor_in.email

    if proveedor_in.direccion_nueva:
        direccion_obj = models.Direccion(**proveedor_in.direccion_nueva.model_dump())
        db.add(direccion_obj)
        db.flush()
        proveedor.direccion_id = direccion_obj.id
    elif proveedor_in.direccion_id is not None:
        proveedor.direccion_id = proveedor_in.direccion_id

    db.commit()
    db.refresh(proveedor)
    return proveedor

def delete_proveedor(db: Session, id: int) -> bool:
    proveedor = db.query(models.Proveedor).options(joinedload(models.Proveedor.mantenciones)).filter(models.Proveedor.id == id).first()
    if not proveedor:
        return False
    if proveedor.mantenciones and len(proveedor.mantenciones) > 0:
        return False
    db.delete(proveedor)
    db.commit()
    return True

# --- MANTENCIONES ---

def crear_mantencion(db: Session, mantencion: schemas.MantencionCreate) -> models.Mantencion:
    db_mantencion = models.Mantencion(**mantencion.dict())
    db.add(db_mantencion)
    db.commit()
    db.refresh(db_mantencion)
    return db_mantencion

def obtener_mantenciones(
    db: Session, 
    fecha_desde: Optional[date] = None, 
    fecha_hasta: Optional[date] = None
) -> List[models.Mantencion]:
    query = db.query(models.Mantencion)
    if fecha_desde:
        query = query.filter(models.Mantencion.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(models.Mantencion.fecha <= fecha_hasta)
    return query.all()

def get_mantencion(db: Session, id: int) -> Optional[models.Mantencion]:
    return db.query(models.Mantencion).filter(models.Mantencion.id == id).first()

def obtener_tipos_mantencion(db: Session):
    return db.query(models.TipoMantencion).all()

def actualizar_mantencion(db: Session, id: int, datos: schemas.MantencionCreate) -> Optional[models.Mantencion]:
    mantencion = get_mantencion(db, id)
    if not mantencion:
        return None
    for key, value in datos.dict().items():
        setattr(mantencion, key, value)
    db.commit()
    db.refresh(mantencion)
    return mantencion


# --- PROGRAMACIÓN MANTENCIONES ---

def crear_programacion(db: Session, programacion: schemas.ProgramarMantencionCreate) -> models.ProgramarMantencion:
    db_prog = models.ProgramarMantencion(**programacion.dict())
    db.add(db_prog)
    db.commit()
    db.refresh(db_prog)
    return db_prog

def obtener_programaciones(db: Session) -> List[models.ProgramarMantencion]:
    return db.query(models.ProgramarMantencion).all()

def get_programacion(db: Session, id: int) -> Optional[models.ProgramarMantencion]:
    return db.query(models.ProgramarMantencion).filter(models.ProgramarMantencion.id == id).first()

def actualizar_programacion(db: Session, id: int, datos: schemas.ProgramarMantencionCreate) -> Optional[models.ProgramarMantencion]:
    prog = get_programacion(db, id)
    if not prog:
        return None
    for key, value in datos.dict().items():
        setattr(prog, key, value)
    db.commit()
    db.refresh(prog)
    return prog

def eliminar_programacion(db: Session, id: int) -> bool:
    prog = get_programacion(db, id)
    if not prog:
        return False
    db.delete(prog)
    db.commit()
    return True

# --- REPORTES DE MANTENCIONES ---

def generar_reporte_mantenciones(
    db: Session,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    patente: Optional[str] = None,
    tipo_mantencion: Optional[str] = None,
    proveedor: Optional[str] = None
) -> List[schemas.MantencionReporte]:
    query = db.query(models.Mantencion).join(models.Vehiculo).join(models.TipoMantencion).join(models.Proveedor)

    if fecha_desde:
        query = query.filter(models.Mantencion.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(models.Mantencion.fecha <= fecha_hasta)
    if patente:
        query = query.filter(models.Vehiculo.patente == patente)
    if tipo_mantencion:
        query = query.filter(models.TipoMantencion.nombre == tipo_mantencion)
    if proveedor:
        query = query.filter(models.Proveedor.nombre == proveedor)

    resultados = query.all()

    reportes = []
    for m in resultados:
        reporte = schemas.MantencionReporte(
            id=m.id,
            vehiculoPatente=m.vehiculo.patente,
            tipoMantencion=m.tipo.nombre,
            proveedor=m.proveedor.nombre if m.proveedor else "Sin proveedor",
            fecha=m.fecha,
            costo=m.costo or 0
        )
        reportes.append(reporte)

    return reportes
