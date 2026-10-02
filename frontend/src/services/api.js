const API = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:8080/api").replace(/\/+$/, "");

export class ApiError extends Error {
    constructor(status, datos = {}) {
        super(datos.mensaje || "No se pudo completar la solicitud.");
        this.name = "ApiError";
        this.status = status;
        this.error = datos.error || "ERROR_HTTP";
        this.mensaje = this.message;
        this.campos = datos.campos || {};
    }
}

async function pedir(ruta, opciones = {}) {
    let res;
    try {
        res = await fetch(`${API}${ruta}`, {
            ...opciones,
            headers: {
                Accept: "application/json",
                ...(opciones.body ? { "Content-Type": "application/json" } : {}),
                ...opciones.headers,
            },
        });
    } catch {
        throw new ApiError(0, {
            error: "ERROR_CONEXION",
            mensaje: "No se pudo conectar con el servidor. Intenta nuevamente.",
        });
    }
    if (!res.ok) {
        const datos = await res.json().catch(() => ({}));
        throw new ApiError(res.status, datos || {});
    }
    return res.status === 204 ? null : res.json();
}

export function listarBebidas(nombre = "") {
    const filtro = nombre.trim();
    const query = filtro ? `?${new URLSearchParams({ nombre: filtro })}` : "";
    return pedir(`/bebidas${query}`);
}

export function crearBebida(datos) {
    return pedir("/bebidas", { method: "POST", body: JSON.stringify(datos) });
}

export function actualizarBebida(id, datos) {
    return pedir(`/bebidas/${id}`, { method: "PUT", body: JSON.stringify(datos) });
}

export function eliminarBebida(id) {
    return pedir(`/bebidas/${id}`, { method: "DELETE" });
}

export function restringirVenta(id) {
    return pedir(`/bebidas/${id}/restriccion`, { method: "PATCH" });
}

export function registrarVenta(bebidaId, unidades) {
    return pedir("/ventas", {
        method: "POST",
        body: JSON.stringify({ bebidaId, unidades }),
    });
}

export function listarVentas() {
    return pedir("/ventas");
}
