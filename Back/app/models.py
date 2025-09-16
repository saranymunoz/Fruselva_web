from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Direccion(Base):
    __tablename__ = "direcciones"

    id = Column(Integer, primary_key=True, index=True)
    calle = Column(String, nullable=False)
    comuna = Column(String, nullable=False)
    region = Column(String, nullable=False)

    proveedores = relationship("Proveedor", back_populates="direccion")

class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    patente = Column(String, unique=True, index=True, nullable=False)
    marca = Column(String, nullable=False)
    modelo = Column(String, nullable=False)
    anio = Column(Integer, nullable=False)
    kilometraje = Column(Integer, default=0)
    

    mantenciones = relationship("Mantencion", back_populates="vehiculo")
    programaciones = relationship("ProgramarMantencion", back_populates="vehiculo")


class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False, unique=True)
    telefono = Column(String, nullable=False)
    email = Column(String, nullable=False)

    direccion_id = Column(Integer, ForeignKey("direcciones.id"), nullable=True)
    direccion = relationship("Direccion", back_populates="proveedores")

    mantenciones = relationship("Mantencion", back_populates="proveedor")


class TipoMantencion(Base):
    __tablename__ = "tipos_mantencion"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)

    mantenciones = relationship("Mantencion", back_populates="tipo")

class Mantencion(Base):
    __tablename__ = "mantenciones"

    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    tipo_id = Column(Integer, ForeignKey("tipos_mantencion.id"))
    descripcion = Column(Text)
    fecha = Column(Date, nullable=False)
    kilometraje = Column(Integer)
    costo = Column(Integer)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))

    vehiculo = relationship("Vehiculo", back_populates="mantenciones")
    tipo = relationship("TipoMantencion", back_populates="mantenciones")
    proveedor = relationship("Proveedor", back_populates="mantenciones")

class ProgramarMantencion(Base):
    __tablename__ = "programar_mantencion"

    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    tipo_id = Column(Integer, ForeignKey("tipos_mantencion.id"))
    frecuencia_km = Column(Integer)
    frecuencia_meses = Column(Integer)
    ultima_fecha = Column(Date)
    ultima_kilometraje = Column(Integer)
    siguiente_fecha_estimada = Column(Date)
    siguiente_kilometraje_estimado = Column(Integer)

    vehiculo = relationship("Vehiculo", back_populates="programaciones")
    tipo = relationship("TipoMantencion")
