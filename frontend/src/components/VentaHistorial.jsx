import { useEffect, useState } from "react";
import { listarVentas } from "../services/api.js";

const moneda = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });
const fecha = new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short" });

export default function VentaHistorial({ revision }) {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [intento, setIntento] = useState(0);
    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError("");
        listarVentas().then((datos) => {
            if (vigente) setVentas(datos);
        }).catch((fallo) => {
            if (vigente) setError(fallo.mensaje || "No se pudo cargar el historial.");
        }).finally(() => {
            if (vigente) setCargando(false);
        });
        return () => { vigente = false; };
    }, [revision, intento]);

    return (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="historial-titulo">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 id="historial-titulo" className="text-xl font-semibold">Historial de ventas</h2>
                <button type="button" disabled={cargando} onClick={() => setIntento((actual) => actual + 1)} className="rounded-lg border border-slate-300 px-3 py-2">Actualizar</button>
            </div>
            {cargando ? <p role="status">Cargando historial…</p> : error ? <p role="alert" className="text-red-800">{error}</p> : ventas.length === 0 ? <p role="status">No hay ventas registradas.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Ventas autorizadas y rechazadas</caption>
                        <thead className="bg-slate-100"><tr>{["Bebida", "Fecha", "Unidades", "Total", "Estado", "Motivo"].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr></thead>
                        <tbody>{ventas.map((venta) => (
                            <tr key={venta.id} className="border-b border-slate-100 even:bg-slate-50">
                                <td>{venta.nombre}</td>
                                <td className="whitespace-nowrap">{fecha.format(new Date(venta.fecha))}</td>
                                <td>{venta.unidades}</td>
                                <td>{moneda.format(venta.total)}</td>
                                <td><span className={`rounded-full px-2 py-1 text-xs font-medium ${venta.estado === "AUTORIZADA" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{venta.estado === "AUTORIZADA" ? "Autorizada" : "Rechazada"}</span></td>
                                <td>{venta.motivo || "—"}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
