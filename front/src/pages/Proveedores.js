import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  const [regiones, setRegiones] = useState([]);   // solo nombres
  const [comunas, setComunas] = useState([]);     // solo nombres

  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion_id: '',
    usarNuevaDireccion: false,
    nuevaCalle: '',
    nuevaRegion: '',
    nuevaComuna: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [alerta, setAlerta] = useState(null);

  const navigate = useNavigate();

  // Cargar proveedores
  const fetchProveedores = async () => {
    try {
      const res = await fetch('http://localhost:8000/proveedores/');
      if (!res.ok) {
        console.error('Error al obtener proveedores', res.status);
        return;
      }
      const data = await res.json();
      setProveedores(data);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    }
  };

  // Cargar direcciones existentes
  const fetchDirecciones = async () => {
    try {
      const res = await fetch('http://localhost:8000/direcciones/');
      if (!res.ok) {
        console.error('Error al obtener direcciones', res.status);
        return;
      }
      const data = await res.json();
      setDirecciones(data);
    } catch (err) {
      console.error('Error cargando direcciones:', err);
    }
  };

  // Cargar regiones (solo nombres)
  const fetchRegiones = async () => {
    try {
      const res = await fetch('https://corsproxy.io/?https://apis.digital.gob.cl/dpa/regiones');
      if (!res.ok) {
        console.error('Error al obtener regiones', res.status);
        return;
      }
      const data = await res.json();
      // extraer solo los nombres
      const nombresRegiones = data.map(r => r.nombre);
      setRegiones(nombresRegiones);
    } catch (err) {
      console.error('Error cargando regiones:', err);
    }
  };

  // Cargar comunas según la región seleccionada por nombre
  const fetchComunas = async (regionNombre) => {
    try {
      if (!regionNombre) {
        setComunas([]);
        return;
      }
      // Primero obtener el objeto de región para conseguir su código
      const resRegs = await fetch('https://corsproxy.io/?https://apis.digital.gob.cl/dpa/regiones');
      if (!resRegs.ok) {
        console.error('Error al obtener regiones para comunas', resRegs.status);
        setComunas([]);
        return;
      }
      const regionesData = await resRegs.json();
      const regionObj = regionesData.find(r => r.nombre === regionNombre);
      if (!regionObj) {
        console.error('Región no encontrada al buscar comunas');
        setComunas([]);
        return;
      }

      // Con el código de región obtenido, traer comunas
      const regionCodigo = regionObj.codigo;
      const res = await fetch(`https://corsproxy.io/?https://apis.digital.gob.cl/dpa/regiones/${regionCodigo}/comunas`);
      if (!res.ok) {
        console.error('Error al obtener comunas', res.status);
        setComunas([]);
        return;
      }
      const data = await res.json();
      // extraer solo nombres de comuna
      const nombresComunas = data.map(c => c.nombre);
      setComunas(nombresComunas);
    } catch (err) {
      console.error('Error cargando comunas:', err);
      setComunas([]);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchProveedores();
    fetchDirecciones();
    fetchRegiones();
  }, []);

  // Manejo de cambios en formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'telefono') {
      let val = value;
      if (val.startsWith('+56')) {
        val = val.slice(3);
      }
      val = val.replace(/\D/g, '').slice(0, 9);
      setForm(prev => ({ ...prev, telefono: val }));
      setError(null);
      return;
    }

    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: checked }));
      if (name === 'usarNuevaDireccion' && !checked) {
        setForm(prev => ({
          ...prev,
          nuevaCalle: '',
          nuevaRegion: '',
          nuevaComuna: '',
        }));
        setComunas([]);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
      if (name === 'nuevaRegion') {
        // Cuando la región nueva cambia, limpiar comuna y fetch comunas basado en nombre
        setForm(prev => ({ ...prev, nuevaComuna: '' }));
        fetchComunas(value);
      }
    }
    setError(null);
  };

  // Guardar o editar proveedor
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.telefono || !form.email) {
      setError('Por favor completa nombre, teléfono y correo.');
      return;
    }

    if (form.telefono.length !== 9) {
      setError('El teléfono debe tener 9 dígitos después del +56.');
      return;
    }

    if (form.usarNuevaDireccion) {
      if (!form.nuevaCalle || !form.nuevaRegion || !form.nuevaComuna) {
        setError('Por favor completa todos los datos de la nueva dirección.');
        return;
      }
    } else {
      if (!form.direccion_id) {
        setError('Selecciona una dirección existente o crea una nueva.');
        return;
      }
    }

    const nombreLower = form.nombre.trim().toLowerCase();
    const nombreExiste = proveedores.some(p =>
      p.nombre.trim().toLowerCase() === nombreLower &&
      p.id !== editingId
    );
    if (nombreExiste) {
      setError('Ya existe un proveedor con ese nombre.');
      return;
    }

    // Construir el body para enviar al backend
    let body = {
      nombre: form.nombre,
      telefono: '+56' + form.telefono,
      email: form.email,
    };

    if (form.usarNuevaDireccion) {
      body = {
        ...body,
        direccion_nueva: {
          calle: form.nuevaCalle,
          region: form.nuevaRegion,   // guardando nombre
          comuna: form.nuevaComuna,   // guardando nombre
        },
      };
    } else {
      body = {
        ...body,
        direccion_id: form.direccion_id,
      };
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `http://localhost:8000/proveedores/${editingId}`
      : 'http://localhost:8000/proveedores/';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        fetchProveedores();
        setForm({
          nombre: '',
          telefono: '',
          email: '',
          direccion_id: '',
          usarNuevaDireccion: false,
          nuevaCalle: '',
          nuevaRegion: '',
          nuevaComuna: '',
        });
        setComunas([]);
        setEditingId(null);
        setError(null);
        setMostrarFormulario(false);
        setAlerta({ tipo: 'success', mensaje: editingId ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.' });
      } else {
        const data = await res.json();
        setError(data.message || `Error al guardar proveedor (status ${res.status})`);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al guardar proveedor');
    }
  };

  // Editar proveedor
  const handleEdit = (p) => {
    let telefonoSinPrefijo = p.telefono || '';
    if (telefonoSinPrefijo.startsWith('+56')) {
      telefonoSinPrefijo = telefonoSinPrefijo.slice(3);
    }

    // Para región / comuna existentes en p.direccion, ya deben ser nombres
    setForm({
      nombre: p.nombre || '',
      telefono: telefonoSinPrefijo,
      email: p.email || '',
      direccion_id: p.direccion?.id || '',
      usarNuevaDireccion: false,
      nuevaCalle: '',
      nuevaRegion: p.direccion?.region || '',
      nuevaComuna: p.direccion?.comuna || '',
    });

    // Si quieres que comunas carguen al editar con la región ya asignada:
    if (p.direccion?.region) {
      fetchComunas(p.direccion.region);
    } else {
      setComunas([]);
    }

    setEditingId(p.id);
    setError(null);
    setMostrarFormulario(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      const res = await fetch(`http://localhost:8000/proveedores/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProveedores();
        setAlerta({ tipo: 'success', mensaje: 'Proveedor eliminado correctamente.' });
      } else {
        const data = await res.json();
        if (data.code === 'DEPENDENCY_ERROR') {
          alert('No se puede eliminar el proveedor porque tiene mantenciones activas.');
        } else {
          alert('Error al eliminar proveedor');
        }
      }
    } catch (err) {
      alert('Error de conexión al eliminar proveedor');
    }
  };

  const filteredProveedores = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 w-full max-w-5xl mx-auto relative">
      {alerta && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-xs px-5 py-3 rounded shadow-lg text-white flex justify-between items-center
            ${alerta.tipo === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          role="alert"
        >
          <span>{alerta.mensaje}</span>
          <button
            onClick={() => setAlerta(null)}
            className="ml-4 font-bold text-xl leading-none focus:outline-none"
            aria-label="Cerrar alerta"
          >
            ×
          </button>
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded"
      >
        ← Volver al inicio
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center">🏭 Proveedores</h2>

      {!mostrarFormulario && (
        <button
          onClick={() => {
            setMostrarFormulario(true);
            setEditingId(null);
            setForm({
              nombre: '',
              telefono: '',
              email: '',
              direccion_id: '',
              usarNuevaDireccion: false,
              nuevaCalle: '',
              nuevaRegion: '',
              nuevaComuna: '',
            });
            setComunas([]);
            setError(null);
          }}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + Agregar nuevo proveedor
        </button>
      )}

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 pl-10 border rounded w-full"
        />
      </div>

      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">
            {editingId ? 'Editar proveedor' : 'Agregar nuevo proveedor'}
          </h3>

          {error && <p className="text-red-600 mb-2">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre *"
              value={form.nombre}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="telefono"
              placeholder="Teléfono *"
              value={'+56' + form.telefono}
              onChange={handleChange}
              className="border p-2 rounded"
              maxLength={12}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            {!form.usarNuevaDireccion && (
              <select
                name="direccion_id"
                value={form.direccion_id}
                onChange={handleChange}
                className="border p-2 rounded"
                required={!form.usarNuevaDireccion}
              >
                <option value="">Seleccione dirección existente</option>
                {direcciones.map(d => (
                  <option key={d.id} value={d.id}>
                    {`${d.calle}, ${d.comuna}, ${d.region}`}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                name="usarNuevaDireccion"
                checked={form.usarNuevaDireccion}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Crear nueva dirección</label>
            </div>
          </div>

          {form.usarNuevaDireccion && (
            <div className="mt-4 bg-gray-100 p-4 rounded">
              <h4 className="font-medium mb-2">Datos nueva dirección</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="nuevaCalle"
                  placeholder="Calle *"
                  value={form.nuevaCalle}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required={form.usarNuevaDireccion}
                />
                <select
                  name="nuevaRegion"
                  value={form.nuevaRegion}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required={form.usarNuevaDireccion}
                >
                  <option value="">Seleccione Región *</option>
                  {regiones.map(nombre => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
                <select
                  name="nuevaComuna"
                  value={form.nuevaComuna}
                  onChange={handleChange}
                  className="border p-2 rounded"
                  required={form.usarNuevaDireccion}
                  disabled={!form.nuevaRegion}
                >
                  <option value="">Seleccione Comuna *</option>
                  {comunas.map(nombre => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex space-x-2 mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {editingId ? 'Guardar cambios' : 'Agregar proveedor'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(false);
                setEditingId(null);
                setError(null);
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {filteredProveedores.length === 0 ? (
        <p>No hay proveedores registrados.</p>
      ) : (
        <ul className="space-y-2">
          {filteredProveedores.map(p => (
            <li
              key={p.id}
              className="bg-white p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <strong>{p.nombre}</strong>
                <br />
                📞 {p.telefono}
                <br />
                ✉️ {p.email}
                <br />
                📍{' '}
                {p.direccion ? (
                  <em>{`${p.direccion.calle}, ${p.direccion.comuna}, ${p.direccion.region}`}</em>
                ) : (
                  <em style={{ color: 'red' }}>Dirección no disponible</em>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(p)}
                  className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Proveedores;
