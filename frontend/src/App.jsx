import BebidaList from "./components/BebidaList.jsx";

export default function App() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-3xl font-bold">Fonda San Belarmino</h1>
      <p className="text-slate-600">Control de bebidas y ventas</p>

      <BebidaList />
    </main>
  );
}
