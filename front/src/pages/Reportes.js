import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Reportes = () => {
  const navigate = useNavigate();

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [patente, setPatente] = useState('');
  const [tipoMantencion, setTipoMantencion] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [proveedores, setProveedores] = useState([]);

  const [reportes, setReportes] = useState([]);
  const [graficoUrl, setGraficoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null); // Nuevo estado para mensajes info

  React.useEffect(() => {
    fetch('http://localhost:8000/proveedores/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProveedores(data);
        }
      })
      .catch(err => console.error('Error cargando proveedores:', err));
  }, []);

  const construirFiltros = () => ({
    fecha_desde: fechaDesde || null,
    fecha_hasta: fechaHasta || null,
    patente: patente.trim() || null,
    tipo_mantencion: tipoMantencion || null,
    proveedor: proveedor || null,
  });

  // Función que verifica si todos los filtros están vacíos
  const filtrosVacios = () => {
    return !fechaDesde && !fechaHasta && !patente.trim() && !tipoMantencion && !proveedor;
  };

  const handleBuscar = async () => {
    setError(null);
    setInfo(null);

    if (filtrosVacios()) {
      // No buscar si todos los filtros están vacíos
      setReportes([]);
      setGraficoUrl(null);
      setInfo('Por favor ingrese al menos un filtro para buscar.');
      return;
    }

    setLoading(true);
    try {
      const filtros = construirFiltros();
      const res = await fetch('http://localhost:8000/reportes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtros),
      });
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const data = await res.json();
      setReportes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error cargando reportes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = () => {
    setFechaDesde('');
    setFechaHasta('');
    setPatente('');
    setTipoMantencion('');
    setProveedor('');
    setReportes([]);
    setInfo(null);
    setError(null);
    if (graficoUrl) {
      URL.revokeObjectURL(graficoUrl);
      setGraficoUrl(null);
    }
  };

  const handleDescargarExcel = async () => {
    setError(null);
    try {
      const filtros = construirFiltros();
      const url = new URL('http://localhost:8000/reportes/');
      url.searchParams.append('exportar_excel', 'true');

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtros),
      });
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'reporte_mantenciones.xlsx';
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al descargar Excel: ' + err.message);
    }
  };

  const handleVerGrafico = async () => {
    setError(null);
    try {
      const filtros = construirFiltros();
      const url = new URL('http://localhost:8000/reportes/');
      url.searchParams.append('generar_grafico', 'true');

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtros),
      });
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      if (graficoUrl) URL.revokeObjectURL(graficoUrl);
      setGraficoUrl(imageUrl);
    } catch (err) {
      setError('Error al generar gráfico: ' + err.message);
    }
  };

  const handleDescargarGrafico = () => {
    if (!graficoUrl) return;
    const link = document.createElement('a');
    link.href = graficoUrl;
    link.download = 'grafico_mantenciones.png';
    link.click();
    link.remove();
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '-';
    return new Date(fechaStr).toLocaleDateString();
  };

  const formatCosto = (costo) => {
    if (costo == null) return '-';
    return costo.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
  };

  return (
    <div className="p-6 w-full max-w-5xl mx-auto relative">
      {/* Botón Volver */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-2 bg-gray-400 hover:bg-gray-500 text-white px-2 py-2 rounded"
      >
        ← Volver al inicio
      </button>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block font-semibold mb-1">Fecha desde:</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Fecha hasta:</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Patente:</label>
          <input
            type="text"
            value={patente}
            onChange={e => setPatente(e.target.value.toUpperCase())}
            className="border rounded px-2 py-1 w-full"
            placeholder="Ej: ABC123"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Tipo mantención:</label>
          <select
            value={tipoMantencion}
            onChange={e => setTipoMantencion(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">-- Todos --</option>
            <option value="preventiva">Preventiva</option>
            <option value="correctiva">Correctiva</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Proveedor:</label>
          <select
            value={proveedor}
            onChange={e => setProveedor(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">-- Todos --</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          disabled={loading}
          onClick={handleBuscar}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          🔍 Buscar
        </button>
        <button
          disabled={loading}
          onClick={handleLimpiar}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          🧹 Limpiar
        </button>
        <button
          disabled={loading || reportes.length === 0}
          onClick={handleDescargarExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          📥 Descargar Excel
        </button>
        <button
          disabled={loading || reportes.length === 0}
          onClick={handleVerGrafico}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          📈 Ver Gráfico
        </button>
        {graficoUrl && (
          <button
            onClick={handleDescargarGrafico}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
          >
            🖼️ Descargar Gráfico
          </button>
        )}
      </div>

      {/* Mostrar mensajes */}
      {info && <p className="text-blue-600 mb-4">{info}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {graficoUrl && reportes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Gráfico de Costos</h3>
          <img
            src={graficoUrl}
            alt="Gráfico de costos por tipo de mantención"
            className="rounded shadow max-w-full h-auto"
          />
        </div>
      )}

      {reportes.length === 0 && !loading && !info ? (
        <p>No hay reportes disponibles.</p>
      ) : (
        <ul className="space-y-2">
          {reportes.map(r => (
            <li key={r.id} className="bg-white p-4 rounded shadow text-left">
              <p><strong>🚗 Patente:</strong> {r.vehiculoPatente}</p>
              <p><strong>🔧 Tipo:</strong> {r.tipoMantencion}</p>
              <p><strong>🏭 Proveedor:</strong> {r.proveedor}</p>
              <p><strong>📅 Fecha:</strong> {formatFecha(r.fecha)}</p>
              <p><strong>💰 Costo:</strong> {formatCosto(r.costo)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Reportes;
