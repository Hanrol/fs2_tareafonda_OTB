import { useEffect, useState } from "react";
import { listarBebidas, registrarVenta } from "../services/api.js";

const moneda = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

export default function VentaForm({ revision, onCambio }) {
    const [bebidas, setBebidas] = useState([]);
    const [bebidaId, setBebidaId] = useState("");
    const [unidades, setUnidades] = useState("1");
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [errorCarga, setErrorCarga] = useState("");
    const [intento, setIntento] = useState(0);
    const [resultado, setResultado] = useState(null);
    const [campos, setCampos] = useState({});

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setErrorCarga("");
        listarBebidas().then((datos) => {
            if (!vigente) return;
            setBebidas(datos);
            setBebidaId((actual) => datos.some((b) => String(b.id) === actual) ? actual : "");
        }).catch((fallo) => {
            if (vigente) setErrorCarga(fallo.mensaje || "No se pudieron cargar las bebidas.");
        }).finally(() => {
            if (vigente) setCargando(false);
        });
        return () => { vigente = false; };
    }, [revision, intento]);

    async function vender(evento) {
        evento.preventDefault();
        setEnviando(true);
        setResultado(null);
        setCampos({});
        try {
            const venta = await registrarVenta(bebidaId === "" ? null : Number(bebidaId), unidades === "" ? null : Number(unidades));
            setResultado({ exito: true, mensaje: `Venta autorizada. Total cobrado: ${moneda.format(venta.total)}.` });
            setUnidades("1");
            onCambio();
        } catch (fallo) {
            setCampos(fallo.campos || {});
            setResultado({ exito: false, mensaje: fallo.status === 409 ? `${fallo.error}: ${fallo.mensaje}` : fallo.mensaje || "No se pudo registrar la venta." });
            if (fallo.status === 409) onCambio();
        } finally {
            setEnviando(false);
        }
    }

    return (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="venta-titulo">
            <h2 id="venta-titulo" className="mb-4 text-xl font-semibold">Registrar venta</h2>
            {resultado && <p role={resultado.exito ? "status" : "alert"} className={`mb-4 rounded-lg p-3 ${resultado.exito ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{resultado.mensaje}</p>}
            {cargando ? <p role="status">Cargando bebidas…</p> : errorCarga ? (
                <div role="alert" className="text-red-800">
                    <p>{errorCarga}</p>
                    <button type="button" onClick={() => setIntento((actual) => actual + 1)} className="mt-2 rounded border px-3 py-2">Reintentar</button>
                </div>
            ) : bebidas.length === 0 ? <p>No hay bebidas disponibles para registrar ventas.</p> : (
                <form onSubmit={vender} noValidate>
                    <fieldset disabled={enviando} className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="venta-bebida" className="mb-1 block font-medium">Bebida</label>
                            <select id="venta-bebida" value={bebidaId} onChange={(e) => setBebidaId(e.target.value)} aria-invalid={Boolean(campos.bebidaId)} aria-describedby={campos.bebidaId ? "venta-error-bebida" : undefined} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                                <option value="">Selecciona una bebida</option>
                                {bebidas.map((b) => <option key={b.id} value={b.id}>{b.nombre} · {b.tipo === "ALCOHOLICA" ? "Alcohólica" : "Sin alcohol"} · {b.volumenML} ml · Stock: {b.stock}{b.ventaRestringida ? " · Restringida" : ""}</option>)}
                            </select>
                            {campos.bebidaId && <p id="venta-error-bebida" className="text-sm text-red-700">{campos.bebidaId}</p>}
                        </div>
                        <div>
                            <label htmlFor="venta-unidades" className="mb-1 block font-medium">Unidades</label>
                            <input id="venta-unidades" type="number" step="1" value={unidades} onChange={(e) => setUnidades(e.target.value)} aria-invalid={Boolean(campos.unidades)} aria-describedby={campos.unidades ? "venta-error-unidades" : undefined} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                            {campos.unidades && <p id="venta-error-unidades" className="text-sm text-red-700">{campos.unidades}</p>}
                        </div>
                        <button type="submit" className="w-fit rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">{enviando ? "Registrando…" : "Registrar venta"}</button>
                    </fieldset>
                </form>
            )}
        </section>
    );
}
