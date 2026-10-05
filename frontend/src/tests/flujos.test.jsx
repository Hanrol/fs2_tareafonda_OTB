import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BebidaForm from "../components/BebidaForm.jsx";
import BebidaList from "../components/BebidaList.jsx";
import VentaForm from "../components/VentaForm.jsx";
import VentaHistorial from "../components/VentaHistorial.jsx";
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

describe("Acciones del catálogo", () => {
    it("limpia el filtro y vuelve a consultar sin nombre", async () => {
        const user = userEvent.setup();
        render(<BebidaList />);
        await screen.findByText("Pisco Sour");
        await user.type(screen.getByLabelText("Buscar por nombre"), "Pisco");
        await user.click(screen.getByRole("button", { name: "Buscar", exact: true }));
        await waitFor(() => expect(api.listarBebidas).toHaveBeenLastCalledWith("Pisco"));
        await user.click(screen.getByRole("button", { name: "Limpiar" }));
        await waitFor(() => expect(api.listarBebidas).toHaveBeenLastCalledWith(""));
        expect(screen.getByLabelText("Buscar por nombre")).toHaveValue("");
    });

    it.each([false, true])("confirma la acción y refresca el catálogo, eliminar=%s", async (eliminar) => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        const onCambio = vi.fn();
        const operacion = eliminar ? api.eliminarBebida : api.restringirVenta;
        operacion.mockImplementation(async () => {
            api.listarBebidas.mockResolvedValue(eliminar ? [] : [{ ...bebida, ventaRestringida: true }]);
        });
        const user = userEvent.setup();
        render(<BebidaList onCambio={onCambio} />);
        await screen.findByText("Pisco Sour");
        await user.click(screen.getByRole("button", { name: eliminar ? "Eliminar" : "Restringir" }));
        expect(await screen.findByText(eliminar ? "Bebida eliminada." : "Venta restringida.")).toBeInTheDocument();
        expect(operacion).toHaveBeenCalledWith(2);
        expect(onCambio).toHaveBeenCalledOnce();
        if (eliminar) expect(await screen.findByText("No hay bebidas registradas.")).toBeInTheDocument();
        else expect(await screen.findByRole("button", { name: "Restringir" })).toBeDisabled();
    });

    it("muestra el fallo de una acción y permite reintentar", async () => {
        api.restringirVenta.mockRejectedValueOnce({ mensaje: "No se pudo restringir" }).mockResolvedValue({});
        const onCambio = vi.fn();
        const user = userEvent.setup();
        render(<BebidaList onCambio={onCambio} />);
        await screen.findByText("Pisco Sour");
        await user.click(screen.getByRole("button", { name: "Restringir" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo restringir");
        expect(onCambio).not.toHaveBeenCalled();
        await user.click(screen.getByRole("button", { name: "Restringir" }));
        expect(await screen.findByText("Venta restringida.")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("abre, cancela y guarda un formulario nuevo desde el catálogo", async () => {
        api.crearBebida.mockResolvedValue({});
        const onCambio = vi.fn();
        const user = userEvent.setup();
        render(<BebidaList onCambio={onCambio} />);
        await screen.findByText("Pisco Sour");
        await user.click(screen.getByRole("button", { name: "Nueva bebida" }));
        await user.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Nueva bebida" }));
        await user.type(screen.getByLabelText("Nombre"), "Agua");
        await user.type(screen.getByLabelText("Volumen (ml)"), "500");
        await user.type(screen.getByLabelText("Stock"), "10");
        await user.type(screen.getByLabelText("Azúcar (g/L)"), "0");
        await user.click(screen.getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("Bebida guardada.")).toBeInTheDocument();
        expect(api.crearBebida).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Agua", stock: 10, volumenML: 500, azucarPorLitro: 0 }));
        expect(onCambio).toHaveBeenCalledOnce();
        expect(screen.queryByLabelText("Nombre")).not.toBeInTheDocument();
    });

    it("edita una bebida desde el catálogo", async () => {
        api.actualizarBebida.mockResolvedValue({});
        const user = userEvent.setup();
        render(<BebidaList />);
        await screen.findByText("Pisco Sour");
        await user.click(screen.getByRole("button", { name: "Editar" }));
        expect(screen.getByLabelText("Nombre")).toHaveValue("Pisco Sour");
        await user.click(screen.getByLabelText("Certificada por el proveedor"));
        await user.click(screen.getByRole("button", { name: "Guardar" }));
        expect(await screen.findByText("Bebida guardada.")).toBeInTheDocument();
        expect(api.actualizarBebida).toHaveBeenCalledWith(2, expect.objectContaining({ certificada: false, gradosAlcohol: 18, azucarPorLitro: null }));
    });
});

describe("Carga y errores de ventas", () => {
    it("reintenta la carga de bebidas para vender", async () => {
        api.listarBebidas.mockRejectedValueOnce({ mensaje: "Sin conexión" });
        const user = userEvent.setup();
        render(<VentaForm onCambio={vi.fn()} />);
        expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
        await user.click(screen.getByRole("button", { name: "Reintentar" }));
        expect(await screen.findByRole("option", { name: /Pisco Sour/ })).toBeInTheDocument();
    });

    it("muestra validaciones de venta sin refrescar por un error 400", async () => {
        api.registrarVenta.mockRejectedValue({ status: 400, mensaje: "Datos inválidos", campos: { bebidaId: "Selecciona una bebida", unidades: "Indica las unidades" } });
        const onCambio = vi.fn();
        const user = userEvent.setup();
        render(<VentaForm onCambio={onCambio} />);
        await screen.findByLabelText("Bebida");
        await user.clear(screen.getByLabelText("Unidades"));
        await user.click(screen.getByRole("button", { name: "Registrar venta" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Datos inválidos");
        expect(screen.getByLabelText("Bebida")).toHaveAttribute("aria-invalid", "true");
        expect(screen.getByLabelText("Unidades")).toHaveAccessibleDescription("Indica las unidades");
        expect(api.registrarVenta).toHaveBeenCalledWith(null, null);
        expect(onCambio).not.toHaveBeenCalled();
    });

    it("actualiza el historial después de un error de carga", async () => {
        api.listarVentas.mockRejectedValueOnce({ mensaje: "Historial no disponible" });
        const user = userEvent.setup();
        render(<VentaHistorial />);
        expect(await screen.findByRole("alert")).toHaveTextContent("Historial no disponible");
        await user.click(screen.getByRole("button", { name: "Actualizar" }));
        expect(await screen.findByText("No hay ventas registradas.")).toBeInTheDocument();
        expect(api.listarVentas).toHaveBeenCalledTimes(2);
    });
});
