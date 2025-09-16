import React, { useEffect, useState } from 'react';

const ProgramarMantencion = () => {
  const [programaciones, setProgramaciones] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/programar-mantenciones') 
      .then(res => res.json())
      .then(data => setProgramaciones(data))
      .catch(err => console.error('Error cargando programación:', err));
  }, []);

  return (
    <div className="p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📅 Programación de Mantenciones</h2>
      {programaciones.length === 0 ? (
        <p>No hay mantenciones programadas.</p>
      ) : (
        <ul className="space-y-2">
          {programaciones.map(p => (
            <li key={p.id} className="bg-white p-4 rounded shadow">
              {p.vehiculoPatente} - {p.fechaProgramada} - {p.descripcion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProgramarMantencion;
