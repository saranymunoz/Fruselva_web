import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Vehiculos from './pages/Vehiculos';
import Mantenciones from './pages/Mantenciones';
import ProgramarMantencion from './pages/ProgramarMantencion';
import Reportes from './pages/Reportes';
import Proveedores from './pages/Proveedores';




const App = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta principal (inicio) */}
        <Route path="/" element={<Home />} />

        {/* Rutas de cada módulo */}
        <Route path="/vehiculos" element={<Vehiculos />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/mantenciones" element={<Mantenciones />} />
        <Route path="/programacion" element={<ProgramarMantencion />} />
        <Route path="/reportes" element={<Reportes />} />

      </Routes>
    </Router>
  );
};

// Componente de la portada principal
const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🚗 Sistema de Mantención Vehicular</h1>
        <p className="text-gray-600 mb-10">Accede rápidamente a todos los módulos del sistema</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card title="Gestión de Vehículos" path="/vehiculos" />
          <Card title="Gestión de Proveedores" path="/proveedores" />
          <Card title="Registro de Mantenciones" path="/mantenciones" />
          <Card title="Programación" path="/programacion" />
          <Card title="Historial y Reportes" path="/reportes" />

        </div>
      </div>
    </div>
  );
};

// Tarjetas de navegación
const Card = ({ title, path }) => (
  <Link to={path}>
    <div className="bg-white shadow-md hover:shadow-lg transition duration-300 rounded-xl p-6 border border-gray-200 cursor-pointer">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Ir al módulo
      </button>
    </div>
  </Link>
);

export default App;
