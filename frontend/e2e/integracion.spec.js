import { test, expect } from "@playwright/test";

const api = "http://localhost:8081/api";

test("CRUD, validación y restricción desde el navegador", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("cell", { name: "Pisco Sour", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Nueva bebida" }).click();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByText("no puede estar vacio", { exact: true })).toBeVisible();
    await page.getByLabel("Nombre", { exact: true }).fill("Prueba CRUD");
    await page.getByLabel("Volumen (ml)").fill("500");
    await page.getByLabel("Stock", { exact: true }).fill("10");
    await page.getByLabel("Azúcar (g/L)").fill("70");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    let fila = page.getByRole("row").filter({ has: page.getByRole("cell", { name: "Prueba CRUD", exact: true }) });
    await expect(fila).toBeVisible();
    await fila.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Nombre", { exact: true }).fill("Prueba editada");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    fila = page.getByRole("row").filter({ has: page.getByRole("cell", { name: "Prueba editada", exact: true }) });
    await expect(fila).toBeVisible();
    await fila.getByRole("button", { name: "Restringir", exact: true }).click();
    await expect(fila.getByText("Restringida", { exact: true })).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await fila.getByRole("button", { name: "Eliminar" }).click();
    await expect(fila).toHaveCount(0);
});

test("venta autorizada descuenta stock y rechazo queda en historial", async ({ page, request }) => {
    const creada = await request.post(`${api}/bebidas`, { data: { nombre: "Venta E2E", tipo: "ALCOHOLICA", volumenML: 500, stock: 5, gradosAlcohol: 18, certificada: true } });
    expect(creada.status()).toBe(201);
    const bebida = await creada.json();
    try {
        await page.goto("/");
        await expect(page.getByRole("option", { name: /Venta E2E/ })).toBeAttached();
        await page.getByLabel("Bebida", { exact: true }).selectOption(String(bebida.id));
        await page.getByLabel("Unidades", { exact: true }).fill("2");
        await page.getByRole("button", { name: "Registrar venta", exact: true }).click();
        await expect(page.getByText(/Venta autorizada. Total cobrado/)).toBeVisible();
        const fila = page.getByRole("row").filter({ has: page.getByRole("cell", { name: "Venta E2E", exact: true }) });
        await expect(fila.filter({ hasText: "Autorizada" })).toHaveCount(1);
        await expect.poll(async () => (await (await request.get(`${api}/bebidas/${bebida.id}`)).json()).stock).toBe(3);
        await page.getByLabel("Unidades", { exact: true }).fill("5");
        await page.getByRole("button", { name: "Registrar venta", exact: true }).click();
        await expect(page.getByRole("alert")).toContainText("LIMITE_EXCEDIDO");
        await expect(fila.filter({ hasText: "Rechazada" })).toHaveCount(1);
    } finally {
        await request.delete(`${api}/bebidas/${bebida.id}`);
    }
});

test("error de conexión permite reintentar", async ({ page }) => {
    await page.route("**/api/**", (route) => route.abort());
    await page.goto("/");
    await expect(page.getByRole("alert").first()).toContainText("No se pudo conectar");
    await page.unroute("**/api/**");
    await page.getByRole("button", { name: "Reintentar" }).first().click();
    await expect(page.getByRole("cell", { name: "Pisco Sour", exact: true })).toBeVisible();
});

test("vista móvil mantiene formularios y tablas dentro de la página", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("cell", { name: "Pisco Sour", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Nueva bebida" }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
