import { expect, it, vi } from "vitest";
import { actualizarBebida, crearBebida, eliminarBebida, listarBebidas, listarVentas, registrarVenta, restringirVenta } from "../services/api.js";

it("codifica el filtro y conserva la respuesta", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [{ id: 1 }] });
    vi.stubGlobal("fetch", fetchMock);
    await expect(listarBebidas("  Té & agua  ")).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock.mock.calls[0][0]).toContain("?nombre=T%C3%A9+%26+agua");
});

it("conserva el motivo de un rechazo HTTP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "STOCK_INSUFICIENTE", mensaje: "Sin stock" }) }));
    await expect(registrarVenta(2, 3)).rejects.toMatchObject({ status: 409, error: "STOCK_INSUFICIENTE", mensaje: "Sin stock" });
});

it("conserva los errores por campo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "VALIDACION", campos: { unidades: "debe ser al menos 1" } }) }));
    await expect(registrarVenta(2, 0)).rejects.toMatchObject({ status: 400, campos: { unidades: "debe ser al menos 1" } });
});

it("no intenta leer JSON en una eliminación 204", async () => {
    const json = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204, json }));
    await expect(eliminarBebida(2)).resolves.toBeNull();
    expect(json).not.toHaveBeenCalled();
});

it("traduce un fallo de red a un mensaje de conexión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(listarBebidas()).rejects.toMatchObject({ status: 0, error: "ERROR_CONEXION" });
});

it.each([
    [crearBebida, [{ nombre: "Agua" }], "/bebidas", "POST", { nombre: "Agua" }],
    [actualizarBebida, [2, { stock: 5 }], "/bebidas/2", "PUT", { stock: 5 }],
    [restringirVenta, [2], "/bebidas/2/restriccion", "PATCH", undefined],
    [listarVentas, [], "/ventas", undefined, undefined],
])("envía la ruta, método y cuerpo de %s", async (operacion, argumentos, ruta, metodo, cuerpo) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 2 }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(operacion(...argumentos)).resolves.toEqual({ id: 2 });
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`${ruta}$`));
    expect(opciones.method).toBe(metodo);
    expect(opciones.body).toBe(cuerpo === undefined ? undefined : JSON.stringify(cuerpo));
    expect(opciones.headers.Accept).toBe("application/json");
    expect(opciones.headers["Content-Type"]).toBe(cuerpo === undefined ? undefined : "application/json");
});

it("usa un error genérico cuando el servidor no responde con JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new SyntaxError(); } }));
    await expect(listarVentas()).rejects.toMatchObject({ status: 500, error: "ERROR_HTTP", campos: {}, mensaje: "No se pudo completar la solicitud." });
});
