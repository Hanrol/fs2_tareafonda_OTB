import { useEffect, useState } from "react";
import { eliminarBebida, listarBebidas, restringirVenta } from "../services/api.js";
import BebidaForm from "./BebidaForm.jsx";

const moneda = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
});

export default function BebidaList() {
    const [nombre, setNombre] = useState("");
    const [consulta, setConsulta] = useState({ nombre: "", intento: 0 });
    const [bebidas, setBebidas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [formulario, setFormulario] = useState(null);
    const [ocupado, setOcupado] = useState(false);
    const [aviso, setAviso] = useState("");
    const [errorAccion, setErrorAccion] = useState("");

    function recargar() {
        setConsulta((actual) => ({ ...actual, intento: actual.intento + 1 }));
    }

    async function ejecutar(bebida, eliminar = false) {
        if (eliminar && !window.confirm(`¿Eliminar ${bebida.nombre}? También se eliminarán sus ventas del historial.`)) return;
        setOcupado(true);
        setErrorAccion("");
        setAviso("");
        try {
            if (eliminar) await eliminarBebida(bebida.id);
            else await restringirVenta(bebida.id);
            setAviso(eliminar ? "Bebida eliminada." : "Venta restringida.");
            recargar();
        } catch (fallo) {
            setErrorAccion(fallo.mensaje || "No se pudo completar la operación.");
        } finally {
            setOcupado(false);
        }
    }

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError("");
        listarBebidas(consulta.nombre)
            .then((datos) => {
                if (vigente) setBebidas(datos);
            })
            .catch((fallo) => {
                if (vigente) setError(fallo.mensaje || "No se pudo cargar el catálogo.");
            })
            .finally(() => {
                if (vigente) setCargando(false);
            });
        return () => {
            vigente = false;
        };
    }, [consulta]);

    function buscar(evento) {
        evento.preventDefault();
        setConsulta((actual) => ({ nombre: nombre.trim(), intento: actual.intento + 1 }));
    }

    function limpiar() {
        setNombre("");
        setConsulta((actual) => ({ nombre: "", intento: actual.intento + 1 }));
    }

    return (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="catalogo-titulo">
                <h2 id="catalogo-titulo" className="mb-4 text-xl font-semibold">Catálogo de bebidas</h2>
                <button type="button" disabled={ocupado || formulario !== null} onClick={() => { setFormulario({}); setAviso(""); setErrorAccion(""); }} className="mb-4 rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">Nueva bebida</button>
                {aviso && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-emerald-800">{aviso}</p>}
                {errorAccion && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-800">{errorAccion}</p>}
                {formulario !== null && <BebidaForm key={formulario.id ?? "nueva"} bebida={formulario.id ? formulario : null}
                    onCancelar={() => setFormulario(null)} onGuardar={() => { setFormulario(null); setAviso("Bebida guardada."); recargar(); }} />}
                <form onSubmit={buscar} className="mb-4">
                    <label className="mb-2 block text-sm font-medium" htmlFor="filtro-nombre">Buscar por nombre</label>
                    <div className="flex flex-wrap gap-2">
                        <input
                            id="filtro-nombre"
                            value={nombre}
                            onChange={(evento) => setNombre(evento.target.value)}
                            placeholder="Ejemplo: Chicha"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-blue-600"
                        />
                        <button className="rounded-lg bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800" type="submit" disabled={cargando}>Buscar</button>
                        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100" onClick={limpiar} disabled={cargando}>
                            Limpiar
                        </button>
                    </div>
                </form>

                {cargando ? (
                    <div role="status" className="flex items-center gap-2 py-4 text-slate-600">
                        <span className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-700" aria-hidden="true" />
                        Cargando bebidas…
                    </div>
                ) : error ? (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        <p>{error}</p>
                        <button type="button" className="mt-3 rounded-lg border border-red-300 px-3 py-2 hover:bg-red-100" onClick={() => setConsulta((actual) => ({
                            ...actual, intento: actual.intento + 1,
                        }))}>
                            Reintentar
                        </button>
                    </div>
                ) : bebidas.length === 0 ? (
                    <div role="status" className="rounded-lg bg-blue-50 p-4 text-blue-800">
                        {consulta.nombre ? "No se encontraron bebidas con ese nombre." : "No hay bebidas registradas."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Bebidas disponibles en el catálogo</caption>
                        <thead className="bg-slate-100 text-slate-700">
                            <tr>
                                <th scope="col">Nombre</th>
                                <th scope="col">Tipo</th>
                                <th scope="col">Volumen</th>
                                <th scope="col">Stock</th>
                                <th scope="col">Precio</th>
                                <th scope="col">Venta</th>
                                <th scope="col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bebidas.map((bebida) => (
                                <tr key={bebida.id} className="border-b border-slate-100 even:bg-slate-50 hover:bg-blue-50">
                                    <td>{bebida.nombre}</td>
                                    <td>{bebida.tipo === "ALCOHOLICA" ? "Alcohólica" : "Sin alcohol"}</td>
                                    <td>{bebida.volumenML} ml</td>
                                    <td>{bebida.stock}</td>
                                    <td>{moneda.format(bebida.precio)}</td>
                                    <td>
                                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${bebida.ventaRestringida ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                                            {bebida.ventaRestringida ? "Restringida" : "Permitida"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" disabled={ocupado || formulario !== null} onClick={() => { setFormulario(bebida); setAviso(""); setErrorAccion(""); }} className="rounded border border-blue-300 px-2 py-1 text-blue-800">Editar</button>
                                            <button type="button" disabled={ocupado || formulario !== null || bebida.ventaRestringida} onClick={() => ejecutar(bebida)} className="rounded border border-amber-300 px-2 py-1 text-amber-800">Restringir</button>
                                            <button type="button" disabled={ocupado || formulario !== null} onClick={() => ejecutar(bebida, true)} className="rounded border border-red-300 px-2 py-1 text-red-800">Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
        </section>
    );
}
