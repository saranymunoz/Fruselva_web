import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Mantenciones = () => {
  const [mantenciones, setMantenciones] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  
  const [form, setForm] = useState({
    vehiculo_id: '',
    tipo_id: '',
    descripcion: '',
    fecha: '',
    kilometraje: '',
    costo: '',
    proveedor_id: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/mantenciones')
      .then(res => res.json())
      .then(setMantenciones)
      .catch(err => {
        console.error('Error fetching mantenciones:', err);
        setMantenciones([]);
      });

    fetch('http://localhost:8000/vehiculos')
      .then(res => res.json())
      .then(setVehiculos)
      .catch(err => {
        console.error('Error fetching vehiculos:', err);
        setVehiculos([]);
      });

    fetch('http://localhost:8000/mantenciones/tipos_mantencion')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTipos(data);
        } else if (Array.isArray(data.tipos)) {
          setTipos(data.tipos);
        } else {
          console.error('Tipos mantencion no es un array:', data);
          setTipos([]);
        }
      })
      .catch(err => {
        console.error('Error fetching tipos mantencion:', err);
        setTipos([]);
      });

    fetch('http://localhost:8000/proveedores')
      .then(res => res.json())
      .then(setProveedores)
      .catch(err => {
        console.error('Error fetching proveedores:', err);
        setProveedores([]);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!form.vehiculo_id) errors.vehiculo_id = 'Obligatorio';
    if (!form.tipo_id) errors.tipo_id = 'Obligatorio';
    if (!form.fecha) errors.fecha = 'Obligatorio';
    else if (form.fecha > today) errors.fecha = 'La fecha no puede ser futura';
    if (!form.kilometraje) errors.kilometraje = 'Obligatorio';
    else if (isNaN(Number(form.kilometraje)) || Number(form.kilometraje) <= 0) errors.kilometraje = 'Debe ser un número positivo';
    if (!form.costo) errors.costo = 'Obligatorio';
    else if (isNaN(Number(form.costo)) || Number(form.costo) <= 0) errors.costo = 'Debe ser un número positivo';
    if (!form.proveedor_id) errors.proveedor_id = 'Obligatorio';

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const action = editingId ? 'editar' : 'registrar';

    if (!window.confirm(`¿Confirma ${action} la mantención?`)) return;

    const payload = {
      ...form,
      vehiculo_id: Number(form.vehiculo_id),
      tipo_id: Number(form.tipo_id),
      proveedor_id: Number(form.proveedor_id),
      kilometraje: Number(form.kilometraje),
      costo: Number(form.costo)
    };

    try {
      const res = await fetch(
        editingId
          ? `http://localhost:8000/mantenciones/${editingId}`
          : 'http://localhost:8000/mantenciones',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        const data = await res.json();
        const updatedMantenciones = editingId
          ? mantenciones.map(m => (m.id === editingId ? data : m))
          : [...mantenciones, data];
        setMantenciones(updatedMantenciones);
        resetForm();
        setShowForm(false);
      } else {
        alert('Error al guardar mantención');
      }
    } catch {
      alert('Error de conexión con el servidor');
    }
  };

  const resetForm = () => {
    setForm({
      vehiculo_id: '',
      tipo_id: '',
      descripcion: '',
      fecha: '',
      kilometraje: '',
      costo: '',
      proveedor_id: ''
    });
    setEditingId(null);
    setFormErrors({});
  };

  const handleNewVehicleClick = () => {
    setShowForm(true);
  };

  const handleEdit = (m) => {
    setEditingId(m.id);
    setForm({
      vehiculo_id: m.vehiculo_id,
      tipo_id: m.tipo_id,
      descripcion: m.descripcion,
      fecha: m.fecha,
      kilometraje: m.kilometraje,
      costo: m.costo,
      proveedor_id: m.proveedor_id
    });
    setShowForm(true);
  };

  return (
    <div className="p-6 w-full max-w-6xl mx-auto relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded"
      >
        ← Volver al inicio
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center">Mantenciones</h2>

      {!showForm && (
        <button
          onClick={handleNewVehicleClick}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Agregar nueva Mantención
        </button>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mt-6 bg-white p-6 border rounded shadow-lg">
          <h3 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar Mantención' : 'Registrar Nueva Mantención'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="vehiculo_id" className="block font-semibold">Vehículo</label>
              <select
                id="vehiculo_id"
                name="vehiculo_id"
                value={form.vehiculo_id}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              >
                <option value="">Seleccione un vehículo</option>
                {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.patente}</option>
                ))}
              </select>
              {formErrors.vehiculo_id && <span className="text-red-500">{formErrors.vehiculo_id}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="tipo_id" className="block font-semibold">Tipo de Mantención</label>
              <select
                id="tipo_id"
                name="tipo_id"
                value={form.tipo_id}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              >
                <option value="">Seleccione un tipo</option>
                {tipos.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              {formErrors.tipo_id && <span className="text-red-500">{formErrors.tipo_id}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="fecha" className="block font-semibold">Fecha</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              />
              {formErrors.fecha && <span className="text-red-500">{formErrors.fecha}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="descripcion" className="block font-semibold">Descripción</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="border rounded p-2 w-full"
                maxLength="500"
                placeholder="Descripción de la mantención (máximo 500 caracteres)"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="kilometraje" className="block font-semibold">Kilometraje</label>
              <input
                type="number"
                id="kilometraje"
                name="kilometraje"
                value={form.kilometraje}
                onChange={handleChange}
                className="border rounded p-2 w-full"
                placeholder="Kilometraje actual"
                min="1"
              />
              {formErrors.kilometraje && <span className="text-red-500">{formErrors.kilometraje}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="costo" className="block font-semibold">Costo</label>
              <input
                type="number"
                id="costo"
                name="costo"
                value={form.costo}
                onChange={handleChange}
                className="border rounded p-2 w-full"
                placeholder="Costo de la mantención"
                min="1"
              />
              {formErrors.costo && <span className="text-red-500">{formErrors.costo}</span>}
            </div>

            <div className="mb-4">
              <label htmlFor="proveedor_id" className="block font-semibold">Proveedor</label>
              <select
                id="proveedor_id"
                name="proveedor_id"
                value={form.proveedor_id}
                onChange={handleChange}
                className="border rounded p-2 w-full"
              >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              {formErrors.proveedor_id && <span className="text-red-500">{formErrors.proveedor_id}</span>}
            </div>

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {editingId ? 'Guardar cambios' : 'Registrar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded ml-2 hover:bg-gray-600"
            >
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Tabla de mantenciones */}
      {mantenciones.length === 0 ? (
        <p className="text-center text-gray-500">No hay mantenciones registradas</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded shadow">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="border px-4 py-2">Patente</th>
                <th className="border px-4 py-2">Tipo de mantención</th>
                <th className="border px-4 py-2">Fecha</th>
                <th className="border px-4 py-2">Kilometraje</th>
                <th className="border px-4 py-2">Costo ($)</th>
                <th className="border px-4 py-2">Descripción</th>
                <th className="border px-4 py-2">Proveedor</th>
                <th className="border px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mantenciones.map(m => {
                const vehiculo = vehiculos.find(v => v.id === m.vehiculo_id);
                const tipo = tipos.find(t => t.id === m.tipo_id);
                const proveedor = proveedores.find(p => p.id === m.proveedor_id);

                return (
                  <tr key={m.id} className="hover:bg-blue-100">
                    <td className="border px-4 py-2">{vehiculo?.patente || 'Desconocido'}</td>
                    <td className="border px-4 py-2">{tipo?.nombre || 'Desconocido'}</td>
                    <td className="border px-4 py-2">{m.fecha}</td>
                    <td className="border px-4 py-2">{m.kilometraje}</td>
                    <td className="border px-4 py-2">${m.costo}</td>
                    <td className="border px-4 py-2">{m.descripcion?.slice(0, 500) || 'Sin descripción'}</td>
                    <td className="border px-4 py-2">{proveedor?.nombre || 'Desconocido'}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleEdit(m)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Mantenciones;
