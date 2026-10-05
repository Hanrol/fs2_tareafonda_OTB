import BebidaList from "./components/BebidaList.jsx";
import { useState } from "react";
import VentaForm from "./components/VentaForm.jsx";
import VentaHistorial from "./components/VentaHistorial.jsx";

export default function App() {
  const [revision, setRevision] = useState(0);
  const actualizar = () => setRevision((actual) => actual + 1);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-3xl font-bold">Fonda San Belarmino</h1>
      <p className="text-slate-600">Control de bebidas y ventas</p>

      <BebidaList revision={revision} onCambio={actualizar} />
      <VentaForm revision={revision} onCambio={actualizar} />
      <VentaHistorial revision={revision} />
    </main>
  );
}
