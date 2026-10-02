import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BebidaForm from "../components/BebidaForm.jsx";
import BebidaList from "../components/BebidaList.jsx";
import App from "../App.jsx";
import * as api from "../services/api.js";

vi.mock("../services/api.js", () => ({
    listarBebidas: vi.fn(), listarVentas: vi.fn(), crearBebida: vi.fn(),
    actualizarBebida: vi.fn(), eliminarBebida: vi.fn(), restringirVenta: vi.fn(), registrarVenta: vi.fn(),
}));

const bebida = { id: 2, nombre: "Pisco Sour", tipo: "ALCOHOLICA", volumenML: 500, stock: 25, precio: 3500, certificada: true, gradosAlcohol: 18, ventaRestringida: false };

beforeEach(() => {
    vi.resetAllMocks();
    api.listarBebidas.mockResolvedValue([bebida]);
    api.listarVentas.mockResolvedValue([]);
});

describe("Catálogo y formulario", () => {
    it("envía el filtro al servidor", async () => {
        const user = userEvent.setup();
        render(<BebidaList />);
        await screen.findByText("Pisco Sour");
        await user.type(screen.getByLabelText("Buscar por nombre"), "Chicha");
        await user.click(screen.getByRole("button", { name: "Buscar", exact: true }));
        await waitFor(() => expect(api.listarBebidas).toHaveBeenLastCalledWith("Chicha"));
    });

    it("muestra el error de conexión y permite reintentar", async () => {
        api.listarBebidas.mockRejectedValueOnce({ mensaje: "Servidor no disponible" });
        const user = userEvent.setup();
        render(<BebidaList />);
        expect(await screen.findByRole("alert")).toHaveTextContent("Servidor no disponible");
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(await screen.findByText("Pisco Sour")).toBeInTheDocument();
    });

    it("muestra validaciones por campo sin cerrar el formulario", async () => {
        api.crearBebida.mockRejectedValue({ mensaje: "Datos inválidos", campos: { nombre: "no puede estar vacío" } });
        const onGuardar = vi.fn();
        const user = userEvent.setup();
        render(<BebidaForm onGuardar={onGuardar} onCancelar={vi.fn()} />);
        await user.click(screen.getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("no puede estar vacío")).toBeInTheDocument();
        expect(screen.getByLabelText("Nombre")).toHaveAttribute("aria-invalid", "true");
        expect(onGuardar).not.toHaveBeenCalled();
    });

    it("al cambiar a sin alcohol envía atributos alcohólicos nulos", async () => {
        api.actualizarBebida.mockResolvedValue({});
        const user = userEvent.setup();
        const onGuardar = vi.fn();
        render(<BebidaForm bebida={bebida} onGuardar={onGuardar} onCancelar={vi.fn()} />);
        await user.selectOptions(screen.getByLabelText("Tipo"), "SIN_ALCOHOL");
        await user.type(screen.getByLabelText("Azúcar (g/L)"), "70");
        await user.click(screen.getByRole("button", { name: "Guardar" }));
        await waitFor(() => expect(api.actualizarBebida).toHaveBeenCalledWith(2, expect.objectContaining({ gradosAlcohol: null, certificada: null, azucarPorLitro: 70 })));
        expect(onGuardar).toHaveBeenCalledOnce();
    });

    it("cancelar la confirmación no elimina una bebida", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);
        const user = userEvent.setup();
        render(<BebidaList />);
        await screen.findByText("Pisco Sour");
        await user.click(screen.getByRole("button", { name: "Eliminar" }));
        expect(api.eliminarBebida).not.toHaveBeenCalled();
    });
});

describe("Sincronización de ventas", () => {
    it.each([false, true])("refresca catálogo e historial después de una venta, rechazada=%s", async (rechazada) => {
        const venta = { id: 1, nombre: "Pisco Sour", fecha: "2026-10-02T12:00:00", unidades: 2, total: rechazada ? 0 : 7000, estado: rechazada ? "RECHAZADA" : "AUTORIZADA", motivo: rechazada ? "LIMITE_EXCEDIDO" : null };
        api.registrarVenta.mockImplementation(async () => {
            api.listarVentas.mockResolvedValue([venta]);
            api.listarBebidas.mockResolvedValue([{ ...bebida, stock: rechazada ? 25 : 23 }]);
            if (rechazada) throw { status: 409, error: "LIMITE_EXCEDIDO", mensaje: "Límite excedido" };
            return venta;
        });
        const user = userEvent.setup();
        render(<App />);
        await screen.findByRole("option", { name: /Pisco Sour/ });
        await user.selectOptions(screen.getByLabelText("Bebida"), "2");
        await user.clear(screen.getByLabelText("Unidades"));
        await user.type(screen.getByLabelText("Unidades"), "2");
        await user.click(screen.getByRole("button", { name: "Registrar venta" }));
        expect(await screen.findByText(rechazada ? "Rechazada" : "Autorizada")).toBeInTheDocument();
        expect(api.registrarVenta).toHaveBeenCalledWith(2, 2);
        await waitFor(() => expect(api.listarBebidas.mock.calls.length).toBeGreaterThanOrEqual(4));
        expect(api.listarVentas.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText(rechazada ? /LIMITE_EXCEDIDO: Límite/ : /Venta autorizada. Total/)).toBeInTheDocument();
    });
});
