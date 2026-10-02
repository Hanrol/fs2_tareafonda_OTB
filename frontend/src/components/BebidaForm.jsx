import { useState } from "react";
import { actualizarBebida, crearBebida } from "../services/api.js";

export default function BebidaForm({ bebida, onGuardar, onCancelar }) {
    const [datos, setDatos] = useState({
        nombre: bebida?.nombre ?? "",
        tipo: bebida?.tipo ?? "SIN_ALCOHOL",
        volumenML: bebida?.volumenML ?? "",
        stock: bebida?.stock ?? "",
        gradosAlcohol: bebida?.gradosAlcohol ?? "",
        certificada: bebida?.certificada ?? false,
        azucarPorLitro: bebida?.azucarPorLitro ?? "",
        ventaRestringida: bebida?.ventaRestringida ?? false,
    });
    const [guardando, setGuardando] = useState(false);
    const [campos, setCampos] = useState({});
    const [error, setError] = useState("");
    const alcoholica = datos.tipo === "ALCOHOLICA";

    function cambiar(evento) {
        const { name, value, type, checked } = evento.target;
        setDatos((actual) => ({ ...actual, [name]: type === "checkbox" ? checked : value }));
    }

    async function guardar(evento) {
        evento.preventDefault();
        setGuardando(true);
        setError("");
        setCampos({});
        const numero = (valor) => valor === "" ? null : Number(valor);
        const solicitud = {
            nombre: datos.nombre,
            tipo: datos.tipo,
            volumenML: numero(datos.volumenML),
            stock: numero(datos.stock),
            gradosAlcohol: alcoholica ? numero(datos.gradosAlcohol) : null,
            certificada: alcoholica ? datos.certificada : null,
            azucarPorLitro: alcoholica ? null : numero(datos.azucarPorLitro),
            ventaRestringida: datos.ventaRestringida,
        };
        try {
            if (bebida) await actualizarBebida(bebida.id, solicitud);
            else await crearBebida(solicitud);
            onGuardar();
        } catch (fallo) {
            setCampos(fallo.campos || {});
            setError(fallo.mensaje || "No se pudo guardar la bebida.");
        } finally {
            setGuardando(false);
        }
    }

    function campo(name, etiqueta, type = "number", step = "1") {
        return (
            <div>
                <label htmlFor={`bebida-${name}`} className="mb-1 block text-sm font-medium">{etiqueta}</label>
                <input id={`bebida-${name}`} name={name} type={type} step={step}
                    value={datos[name]} onChange={cambiar}
                    aria-invalid={Boolean(campos[name])} aria-describedby={campos[name] ? `error-${name}` : undefined}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-blue-600" />
                {campos[name] && <p id={`error-${name}`} className="mt-1 text-sm text-red-700">{campos[name]}</p>}
            </div>
        );
    }

    return (
        <form onSubmit={guardar} noValidate className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-labelledby="form-bebida-titulo">
            <h3 id="form-bebida-titulo" className="mb-3 text-lg font-semibold">{bebida ? "Editar bebida" : "Nueva bebida"}</h3>
            {error && <p role="alert" className="mb-3 text-red-700">{error}</p>}
            <fieldset disabled={guardando}>
                <div className="grid gap-4 sm:grid-cols-2">
                    {campo("nombre", "Nombre", "text")}
                    <div>
                        <label htmlFor="bebida-tipo" className="mb-1 block text-sm font-medium">Tipo</label>
                        <select id="bebida-tipo" name="tipo" value={datos.tipo} onChange={cambiar} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2">
                            <option value="SIN_ALCOHOL">Sin alcohol</option>
                            <option value="ALCOHOLICA">Alcohólica</option>
                        </select>
                        {campos.tipo && <p className="text-sm text-red-700">{campos.tipo}</p>}
                    </div>
                    {campo("volumenML", "Volumen (ml)")}
                    {campo("stock", "Stock")}
                    {alcoholica ? campo("gradosAlcohol", "Grados de alcohol", "number", "0.1") : campo("azucarPorLitro", "Azúcar (g/L)")}
                </div>
                <div className="my-4 flex flex-wrap gap-4">
                    {alcoholica && <label className="flex items-center gap-2"><input type="checkbox" name="certificada" checked={datos.certificada} onChange={cambiar} />Certificada por el proveedor</label>}
                    <label className="flex items-center gap-2"><input type="checkbox" name="ventaRestringida" checked={datos.ventaRestringida} onChange={cambiar} />Venta restringida</label>
                </div>
                <div className="flex gap-2">
                    <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">{guardando ? "Guardando…" : "Guardar"}</button>
                    <button type="button" onClick={onCancelar} className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100">Cancelar</button>
                </div>
            </fieldset>
        </form>
    );
}
