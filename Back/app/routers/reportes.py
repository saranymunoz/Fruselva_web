from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app import crud, schemas
from app.database import get_db
import pandas as pd
import matplotlib.pyplot as plt
import io

router = APIRouter(prefix="/reportes", tags=["Reportes"])

@router.post("/", response_model=List[schemas.MantencionReporte])
def generar_reporte(
    filtros: schemas.ReporteFiltros,
    exportar_excel: Optional[bool] = Query(False),
    generar_grafico: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
):
    data = crud.generar_reporte_mantenciones(
        db,
        fecha_desde=filtros.fecha_desde,
        fecha_hasta=filtros.fecha_hasta,
        patente=filtros.patente,
        tipo_mantencion=filtros.tipo_mantencion,
        proveedor=filtros.proveedor,
    )

    # Convertimos a lista de dicts
    data_dicts = [d.dict() for d in data]

    if exportar_excel:
        df = pd.DataFrame(data_dicts)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            df.to_excel(writer, index=False, sheet_name="Reporte")
        output.seek(0)
        filename = f"reporte_mantenciones_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

    if generar_grafico:
        df = pd.DataFrame(data_dicts)
        if df.empty:
            return JSONResponse(content={"detail": "No hay datos para graficar"}, status_code=404)
        grouped = df.groupby("tipoMantencion")["costo"].sum()
        plt.figure(figsize=(8, 6))
        grouped.plot(kind="bar", color="skyblue")
        plt.title("Costos por Tipo de Mantención")
        plt.ylabel("Costo Total")
        plt.xlabel("Tipo de Mantención")
        plt.tight_layout()

        img_bytes = io.BytesIO()
        plt.savefig(img_bytes, format="png")
        plt.close()
        img_bytes.seek(0)

        return StreamingResponse(img_bytes, media_type="image/png")

    return data
