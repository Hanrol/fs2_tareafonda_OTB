import { expect, it, vi } from "vitest";
import { eliminarBebida, listarBebidas, registrarVenta } from "../services/api.js";

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
