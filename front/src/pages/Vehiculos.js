import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const currentYear = new Date().getFullYear();

const Vehiculos = () => {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ patente: '', marca: '', modelo: '', anio: '', kilometraje: '' });
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [originalKilometraje, setOriginalKilometraje] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [patenteError, setPatenteError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const navigate = useNavigate();

  const patenteRegex = /^[A-Z]{2}[0-9]{4}$|^[A-Z]{3}[0-9]{2}$/;

  const fetchVehicles = () => {
    fetch('http://localhost:8000/vehiculos/')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => a.patente.localeCompare(b.patente));
        setVehicles(sorted);
      })
      .catch(err => console.error('Error cargando vehículos:', err));
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle =>
      vehicle.patente.toLowerCase().includes(search.toLowerCase())
    );
  }, [vehicles, search]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormErrors(prev => ({ ...prev, [name]: '' })); 

    if (name === 'patente') {
      const upperValue = value.toUpperCase().slice(0, 6);
      if (upperValue === '' || patenteRegex.test(upperValue)) {
        setPatenteError('');
      } else {
        setPatenteError();
      }
      setForm(prev => ({ ...prev, [name]: upperValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Función que valida la patente con GetAPI al momento de submit
  const checkPatenteGetAPI = async (patente) => {
    try {
      const resp = await fetch(`https://chile.getapi.cl/v1/vehicles/plate/${patente}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!resp.ok) {
        // Puede ser 400, 404, etc. => patente no encontrada
        return null;
      }
      const data = await resp.json();
      return data; // objeto con info de vehículo
    } catch (error) {
      console.error('Error usando GetAPI:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { patente, marca, modelo, anio, kilometraje } = form;

    // Validación de campos vacíos
    const newErrors = {};
    if (!patente) newErrors.patente = 'Rellenar este campo';
    if (!marca) newErrors.marca = 'Rellenar este campo';
    if (!modelo) newErrors.modelo = 'Rellenar este campo';
    if (!anio) newErrors.anio = 'Rellenar este campo';
    if (!kilometraje) newErrors.kilometraje = 'Rellenar este campo';

    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Validar formato patente
    if (!patenteRegex.test(patente)) {
      alert('Patente inválida. Debe ser formato válido chileno, por ejemplo: AB1234 o ABC12');
      return;
    }

    // Aquí validamos la patente con GetAPI al enviar
    const externalData = await checkPatenteGetAPI(patente);
    if (!externalData) {
      setPatenteError('Patente no encontrada en la base externa gratuita (GetAPI).');
      return;
    } else {
      // Opcional: completar automáticamente algunos campos si vienen vacíos
      setForm(prev => ({
        ...prev,
        marca: prev.marca || externalData.make || externalData.manufacturer || '',
        modelo: prev.modelo || externalData.model || '',
        anio: prev.anio || externalData.year || ''
      }));
      setPatenteError('');
    }

    // Validaciones restantes: año, km, etc.
    const parsedAnio = parseInt(anio, 10);
    const parsedKm = parseFloat(kilometraje);

    if (isNaN(parsedAnio) || parsedAnio < 1950 || parsedAnio > currentYear) {
      alert(`El año debe estar entre 1950 y ${currentYear}`);
      return;
    }

    if (isNaN(parsedKm) || parsedKm < 0) {
      alert('El kilometraje debe ser un número positivo.');
      return;
    }

    if (editingId !== null && parsedKm < originalKilometraje) {
      alert('El kilometraje nuevo debe ser mayor o igual al actual.');
      return;
    }

    if (editingId !== null && !window.confirm('¿Deseas guardar los cambios en el kilometraje?')) {
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `http://localhost:8000/vehiculos/${editingId}`
      : 'http://localhost:8000/vehiculos/';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patente, marca, modelo, anio, kilometraje }),
    });

    if (res.ok) {
      fetchVehicles();
      setForm({ patente: '', marca: '', modelo: '', anio: '', kilometraje: '' });
      setFormErrors({});
      setEditingId(null);
      setOriginalKilometraje(null);
      setPatenteError('');
      setSuccessMessage(editingId ? '✅ Datos actualizados correctamente.' : '✅ Vehículo agregado exitosamente.');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowForm(false);
    } else if (res.status === 409) {
      alert('Ya existe un vehículo con esa patente.');
    } else {
      alert('Error al guardar el vehículo.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este vehículo?')) return;

    const res = await fetch(`http://localhost:8000/vehiculos/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchVehicles();
    } else if (res.status === 400 || res.status === 403) {
      alert('No se puede eliminar el vehículo porque tiene mantenciones asociadas.');
    } else {
      alert('Error al eliminar vehículo.');
    }
  };

  const handleEdit = (vehiculo) => {
    setForm({ ...vehiculo });
    setEditingId(vehiculo.id);
    setOriginalKilometraje(parseFloat(vehiculo.kilometraje));
    setPatenteError('');
    setShowForm(true);
  };

  const handleNewVehicleClick = () => {
    setForm({ patente: '', marca: '', modelo: '', anio: '', kilometraje: '' });
    setFormErrors({});
    setEditingId(null);
    setOriginalKilometraje(null);
    setPatenteError('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setForm({ patente: '', marca: '', modelo: '', anio: '', kilometraje: '' });
    setFormErrors({});
    setEditingId(null);
    setOriginalKilometraje(null);
    setPatenteError('');
    setShowForm(false);
  };

  return (
    <div className="p-6 w-full max-w-5xl mx-auto relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded"
      >
        ← Volver al inicio
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center">🚗 Gestión de Vehículos</h2>

      {successMessage && (
        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded text-center">
          {successMessage}
        </div>
      )}

      {!showForm && (
        <button
          onClick={handleNewVehicleClick}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Agregar nuevo vehículo
        </button>
      )}

      {/* Búsqueda */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar por patente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 pl-10 border rounded w-full"
        />
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">
            {editingId ? '✏️ Editar vehículo' : '➕ Agregar nuevo vehículo'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {['patente', 'marca', 'modelo', 'anio', 'kilometraje'].map((field) => (
              <div key={field} className="flex flex-col">
                <input
                  type={field === 'anio' || field === 'kilometraje' ? 'number' : 'text'}
                  name={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={form[field]}
                  onChange={handleChange}
                  className={`border p-2 rounded ${
                    field === 'patente' && patenteError ? 'border-red-500' : ''
                  }`}
                  disabled={editingId !== null && ['patente', 'marca', 'modelo', 'anio'].includes(field)}
                  maxLength={field === 'patente' ? 6 : undefined}
                />
                {formErrors[field] && (
                  <span className="text-red-500 text-sm mt-1">{formErrors[field]}</span>
                )}
                {field === 'patente' && patenteError && (
                  <span className="text-red-500 text-sm mt-1">{patenteError}</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex space-x-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!!patenteError}
              className={`px-4 py-2 rounded text-white ${
                patenteError
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingId ? 'Guardar cambios' : 'Agregar vehículo'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla de vehículos */}
      {filteredVehicles.length === 0 ? (
        <p className="text-center text-gray-500">No hay vehículos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded shadow">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3 border-b">Patente</th>
                <th className="p-3 border-b">Marca</th>
                <th className="p-3 border-b">Modelo</th>
                <th className="p-3 border-b">Año</th>
                <th className="p-3 border-b">Kilometraje (km)</th>
                <th className="p-3 border-b text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(vehicle => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{vehicle.patente}</td>
                  <td className="p-3 border-b">{vehicle.marca}</td>
                  <td className="p-3 border-b">{vehicle.modelo}</td>
                  <td className="p-3 border-b">{vehicle.anio}</td>
                  <td className="p-3 border-b">{vehicle.kilometraje}</td>
                  <td className="p-3 border-b text-center space-x-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;
