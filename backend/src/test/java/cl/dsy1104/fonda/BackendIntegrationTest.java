package cl.dsy1104.fonda;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import cl.dsy1104.fonda.dto.BebidaRequest;
import cl.dsy1104.fonda.dto.VentaRequest;
import cl.dsy1104.fonda.exception.ValidacionException;
import cl.dsy1104.fonda.exception.VentaRechazadaException;
import cl.dsy1104.fonda.model.TipoBebida;
import cl.dsy1104.fonda.repository.BebidaRepository;
import cl.dsy1104.fonda.repository.VentaRepository;
import cl.dsy1104.fonda.service.BebidaService;
import cl.dsy1104.fonda.service.VentaService;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:backend-tests;DB_CLOSE_DELAY=-1",
    "spring.sql.init.mode=never",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class BackendIntegrationTest {
    @Autowired BebidaService bebidas;
    @Autowired VentaService ventas;
    @Autowired BebidaRepository bebidaRepository;
    @Autowired VentaRepository ventaRepository;
    @Autowired MockMvc mvc;

    @BeforeEach
    void limpiar() {
        ventaRepository.deleteAll();
        bebidaRepository.deleteAll();
    }

    private BebidaRequest bebida(TipoBebida tipo, int stock) {
        BebidaRequest dto = new BebidaRequest();
        dto.setNombre("  Prueba  ");
        dto.setTipo(tipo);
        dto.setVolumenML(500);
        dto.setStock(stock);
        if (tipo == TipoBebida.ALCOHOLICA) {
            dto.setGradosAlcohol(18.0);
            dto.setCertificada(true);
        } else dto.setAzucarPorLitro(70);
        return dto;
    }

    private VentaRequest venta(Long id, int unidades) {
        VentaRequest dto = new VentaRequest();
        dto.setBebidaId(id);
        dto.setUnidades(unidades);
        return dto;
    }

    @ParameterizedTest
    @CsvSource({"true,3500", "false,4200", "null,4200"})
    void precioAlcoholica(String certificada, int precio) {
        BebidaRequest dto = bebida(TipoBebida.ALCOHOLICA, 5);
        dto.setCertificada(certificada.equals("null") ? null : Boolean.valueOf(certificada));
        var creada = bebidas.crear(dto);
        assertEquals(precio, creada.getPrecio());
        assertEquals("Prueba", creada.getNombre());
    }

    @ParameterizedTest
    @CsvSource({"0,2000", "80,2000", "81,2200"})
    void precioAzucar(int azucar, int precio) {
        BebidaRequest dto = bebida(TipoBebida.SIN_ALCOHOL, 5);
        dto.setAzucarPorLitro(azucar);
        assertEquals(precio, bebidas.crear(dto).getPrecio());
    }

    @ParameterizedTest
    @CsvSource({"0.4,false", "0.5,true", "45,true", "45.1,false"})
    void limitesAlcohol(double grados, boolean valido) {
        BebidaRequest dto = bebida(TipoBebida.ALCOHOLICA, 5);
        dto.setGradosAlcohol(grados);
        if (valido) assertDoesNotThrow(() -> bebidas.crear(dto));
        else assertTrue(assertThrows(ValidacionException.class, () -> bebidas.crear(dto)).getCampos().containsKey("gradosAlcohol"));
    }

    @Test
    void atributosIncompatiblesNoSeGuardan() {
        BebidaRequest dto = bebida(TipoBebida.SIN_ALCOHOL, 5);
        dto.setGradosAlcohol(18.0);
        dto.setCertificada(false);
        dto.setAzucarPorLitro(-1);
        var ex = assertThrows(ValidacionException.class, () -> bebidas.crear(dto));
        assertEquals(3, ex.getCampos().size());
        assertEquals(0, bebidaRepository.count());
    }

    @ParameterizedTest
    @CsvSource({"true,5,VENTA_RESTRINGIDA", "false,5,LIMITE_EXCEDIDO", "false,2,STOCK_INSUFICIENTE"})
    void rechazosRespetanOrdenYSePersisten(boolean restringida, int unidades, String motivo) {
        BebidaRequest dto = bebida(TipoBebida.ALCOHOLICA, 0);
        dto.setVentaRestringida(restringida);
        Long id = bebidas.crear(dto).getId();
        assertEquals(motivo, assertThrows(VentaRechazadaException.class, () -> ventas.registrar(venta(id, unidades))).getMotivo());
        var historial = ventas.historial();
        assertEquals(1, historial.size());
        assertEquals(motivo, historial.getFirst().getMotivo());
        assertEquals(0, historial.getFirst().getTotal());
        assertEquals(0, bebidas.obtener(id).getStock());
    }

    @Test
    void sinAlcoholNoTieneLimiteYEliminarBorraVentasAsociadas() {
        Long id = bebidas.crear(bebida(TipoBebida.SIN_ALCOHOL, 10)).getId();
        assertEquals(8000, ventas.registrar(venta(id, 4)).getTotal());
        assertEquals(6, bebidas.obtener(id).getStock());
        bebidas.eliminar(id);
        assertFalse(bebidaRepository.existsById(id));
        assertEquals(0, ventaRepository.count());
    }

    @Test
    void ventasConcurrentesNoSobrevenden() throws Exception {
        Long id = bebidas.crear(bebida(TipoBebida.SIN_ALCOHOL, 3)).getId();
        CountDownLatch listas = new CountDownLatch(2);
        CountDownLatch inicio = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<String> vender = () -> {
                listas.countDown();
                assertTrue(inicio.await(5, TimeUnit.SECONDS));
                try {
                    ventas.registrar(venta(id, 2));
                    return "AUTORIZADA";
                } catch (VentaRechazadaException ex) { return ex.getMotivo(); }
            };
            var primera = executor.submit(vender);
            var segunda = executor.submit(vender);
            assertTrue(listas.await(5, TimeUnit.SECONDS));
            inicio.countDown();
            var resultados = Stream.of(primera.get(10, TimeUnit.SECONDS), segunda.get(10, TimeUnit.SECONDS)).sorted().toList();
            assertEquals(java.util.List.of("AUTORIZADA", "STOCK_INSUFICIENTE"), resultados);
        }
        assertEquals(1, bebidas.obtener(id).getStock());
        assertEquals(2, ventaRepository.count());
    }

    @Test
    void validacionHttpDevuelveCampos() throws Exception {
        mvc.perform(post("/api/bebidas").contentType(MediaType.APPLICATION_JSON)
            .content("{\"nombre\":\"\",\"tipo\":\"SIN_ALCOHOL\",\"volumenML\":50,\"stock\":-1}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("VALIDACION"))
            .andExpect(jsonPath("$.campos.nombre").exists()).andExpect(jsonPath("$.campos.volumenML").exists())
            .andExpect(jsonPath("$.campos.stock").exists());
    }

    @Test
    void jsonInvalidoYRecursoAusenteRespondenCorrectamente() throws Exception {
        mvc.perform(post("/api/ventas").contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/bebidas/999999")).andExpect(status().isNotFound());
    }
}
