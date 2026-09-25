# CONTEXTO — Backend Fonda San Belarmino

Guía de trabajo por etapas, basada en el README del proyecto (secciones 2 a 7) y en las decisiones acordadas. Avanza en orden, marca cada casilla y haz el commit indicado. **Cada commit debe compilar**: el CI de GitHub Actions corre en cada push.

---

## 0. Contexto y objetivo

- DSY1104 · EA3: Integración y Comunicación REST (IL 3.1 e IL 3.2). Actividad sin nota, pero el docente puede pedirte explicar cualquier parte del código.
- Backend: Spring Boot 3.3.5 + Spring Data JPA, puerto `8080`, API bajo `/api`.
- Frontend: React + Vite + Tailwind, puerto `5173`. Es un proyecto aparte; al backend solo le toca habilitar CORS.
- BD: H2 en memoria por defecto, datos desde `data.sql`. Perfil `mysql` opcional (variables `DB_USER` / `DB_PASSWORD`).
- Plazo: 1,5 semanas para backend y frontend; el backend se integra primero.

## 1. Suposiciones de integración con el frontend

- JSON en `camelCase` (Jackson), fechas ISO-8601, campos nulos omitidos (`spring.jackson.default-property-inclusion=non_null`).
- `POST /api/ventas` recibe `{"bebidaId": 2, "unidades": 2}`.
- Formas de error que el frontend espera:
  - `400` → `{"error":"VALIDACION","campos":{"nombre":"no puede estar vacio", "...":"..."}}`
  - `404` → `{"error":"NO_ENCONTRADO","mensaje":"..."}`
  - `409` → `{"error":"LIMITE_EXCEDIDO","mensaje":"..."}` (motivos: `VENTA_RESTRINGIDA`, `LIMITE_EXCEDIDO`, `STOCK_INSUFICIENTE`)
- El listado del frontend muestra el `precio` calculado, por eso `BebidaResponse` lo incluye.

## 2. Decisiones acordadas

| Tema | Decisión |
|---|---|
| Lombok | Sí. Entidades `@Getter @Setter @NoArgsConstructor`; DTOs `@Data`; servicios/controladores `@RequiredArgsConstructor`. **Nunca `@Data` en entidades.** |
| DTOs | Clases con Lombok (no `record`) para mantener un solo estilo. |
| Validación condicional | En `BebidaService` lanzando `ValidacionException`; no se usa anotación custom. |
| Tests automatizados | No. Verificación con Postman/curl y el CI. |
| Docker / Flyway | No. Se mantiene H2 + `data.sql` y el perfil `mysql` provisto. |
| Mapeo DTO ↔ entidad | Manual, dentro del servicio. |
| Límite de unidades | Se lee de `fonda.limite-unidades-por-cliente`, nunca hardcodeado. |

---



### Paso 1 — Lombok

- [ ] Agregar al `pom.xml` los tres bloques (copiados de MediReservas):
  - dependencia `org.projectlombok:lombok` con `<optional>true</optional>`;
  - `maven-compiler-plugin` con `annotationProcessorPaths` para Lombok en `default-compile` y `default-testCompile`;
  - exclusión de Lombok en `spring-boot-maven-plugin`.

```bash
git add backend/pom.xml
git commit -m "build(backend): agrega Lombok y configuracion de anotaciones"
```

> No copiar de MediReservas: Boot 4, `starter-webmvc`, `war`, Flyway, Security, Eureka, Gateway, WebFlux, Actuator ni Swagger. Aquí no aplican.

### Paso 2 — `model`

- [ ] `TipoBebida`: `ALCOHOLICA`, `SIN_ALCOHOL`.
- [ ] `EstadoVenta`: `AUTORIZADA`, `RECHAZADA`.
- [ ] `Bebida`: `@Entity @Table(name = "bebida") @Getter @Setter @NoArgsConstructor`.

| Campo | Detalle |
|---|---|
| `id` | `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` |
| `tipo` | `@Enumerated(EnumType.STRING)` (obligatorio: `data.sql` guarda texto) |
| `volumenML` | `@Column(name = "volumen_ml")` **explícito**: `volumenML` no se traduce solo a `volumen_ml` |
| `gradosAlcohol` | `Double` (nulo si no aplica) |
| `certificada` | `Boolean` (nulo si no aplica) |
| `azucarPorLitro` | `Integer` (nulo si no aplica) |
| `ventaRestringida` | `boolean` |

- [ ] `Venta`: `@Entity @Table(name = "venta")` con `id`, `@ManyToOne @JoinColumn(name = "bebida_id") Bebida bebida`, `int unidades`, `int total`, `@Enumerated(EnumType.STRING) EstadoVenta estado`, `String motivo`, `LocalDateTime fecha`.
- [ ] Sin lógica de negocio en las entidades.

> Verificar después del paso: `data.sql` usa las columnas `nombre, tipo, volumen_ml, stock, grados_alcohol, certificada, azucar_por_litro, venta_restringida`. Si el mapeo no calza, el arranque falla con H2 y con MySQL.

```bash
git add backend/src/main/java/cl/dsy1104/fonda/model
git commit -m "feat(model): agrega entidades Bebida y Venta con enums"
```

### Paso 3 — `repository`

- [ ] `BebidaRepository extends JpaRepository<Bebida, Long>` con `List<Bebida> findByNombreContainingIgnoreCase(String nombre);`
- [ ] `VentaRepository extends JpaRepository<Venta, Long>` con `List<Venta> findAllByOrderByFechaDesc();` y `void deleteByBebidaId(Long bebidaId);` (para que el DELETE de bebidas no viole la FK).

```bash
git add backend/src/main/java/cl/dsy1104/fonda/repository
git commit -m "feat(repository): agrega repositorios Spring Data"
```

### Paso 4 — `exception`

- [ ] `RecursoNoEncontradoException extends RuntimeException`.
- [ ] `VentaRechazadaException extends RuntimeException` con atributo `motivo` (`String`) y `mensaje`.
- [ ] `ValidacionException extends RuntimeException` con `Map<String, String> campos` (validación condicional del servicio).
- [ ] `ErrorResponse` (puede ir en `dto`): `String error`, `String mensaje`, `Map<String, String> campos`, con `@JsonInclude(NON_NULL)`.
- [ ] `GlobalExceptionHandler` con `@RestControllerAdvice`:

| Excepción | HTTP | Cuerpo |
|---|---|---|
| `MethodArgumentNotValidException` | `400` | `error=VALIDACION`, `campos` con `getFieldErrors()` |
| `ValidacionException` | `400` | `error=VALIDACION`, `campos` |
| `RecursoNoEncontradoException` | `404` | `error=NO_ENCONTRADO`, `mensaje` |
| `VentaRechazadaException` | `409` | `error=motivo`, `mensaje` |
| `Exception` | `500` | `error=ERROR_INTERNO`, `mensaje` genérico |

```bash
git add backend/src/main/java/cl/dsy1104/fonda/exception backend/src/main/java/cl/dsy1104/fonda/dto
git commit -m "feat(exception): agrega excepciones y manejador global de errores"
```

### Paso 5 — `dto`

- [ ] `BebidaRequest` (`@Data`): `@NotBlank String nombre`; `@NotNull @Min(100) @Max(3000) Integer volumenML`; `@NotNull @PositiveOrZero Integer stock`; `@NotNull TipoBebida tipo`; `Double gradosAlcohol`; `Boolean certificada`; `Integer azucarPorLitro`; `Boolean ventaRestringida`.
- [ ] `BebidaResponse` (`@Data`): los campos de la entidad + `Integer precio`.
- [ ] `VentaRequest` (`@Data`): `@NotNull Long bebidaId`; `@NotNull @Min(1) Integer unidades`.
- [ ] `VentaResponse` (`@Data`): `id`, `bebidaId`, `nombre`, `unidades`, `total`, `estado`, `motivo`, `fecha`.
- [ ] `ErrorResponse` (si no quedó en el paso 4).

> La validación condicional (`gradosAlcohol` vs `azucarPorLitro` según `tipo`) no va como anotación: se chequea en `BebidaService` y se lanza `ValidacionException`, que el handler traduce a `400`.

```bash
git add backend/src/main/java/cl/dsy1104/fonda/dto
git commit -m "feat(dto): agrega DTOs con validaciones de entrada"
```

### Paso 6 — `BebidaService`

- [ ] `@Service @RequiredArgsConstructor`. Dependencias: `BebidaRepository`, `VentaRepository`.
- [ ] `listar(String nombre)`: si viene vacío → `findAll()`, si no → `findByNombreContainingIgnoreCase`.
- [ ] `obtener(Long id)`: `orElseThrow(() -> new RecursoNoEncontradoException(...))`.
- [ ] `crear`, `actualizar`, `eliminar` (borra ventas con `deleteByBebidaId` y luego la bebida), `marcarRestringida` (setea `true` y guarda).
- [ ] `validarPorTipo(BebidaRequest)` → lanza `ValidacionException` con los campos que fallen:
  - `ALCOHOLICA`: `gradosAlcohol` obligatorio y entre 0,5 y 45; `azucarPorLitro` debe ser nulo.
  - `SIN_ALCOHOL`: `azucarPorLitro` obligatorio y ≥ 0; `gradosAlcohol` debe ser nulo.
- [ ] `calcularPrecio(Bebida)` (Integer):
  - `ALCOHOLICA`: 3.500; si `certificada` no es `true` → ×1,20.
  - `SIN_ALCOHOL`: 2.000; si `azucarPorLitro > 80` → ×1,10.
- [ ] `toResponse(Bebida)` arma el DTO incluyendo `precio` (se usa al listar, obtener y en las respuestas de controller).
- [ ] Mapeo request → entidad manual (sin MapStruct).

```bash
git add backend/src/main/java/cl/dsy1104/fonda/service
git commit -m "feat(service): implementa CRUD y calculo de precio en BebidaService"
```

### Paso 7 — `VentaService`

- [ ] `@Service @RequiredArgsConstructor`, `@Transactional(noRollbackFor = VentaRechazadaException.class)`.
- [ ] Límite inyectado: `@Value("${fonda.limite-unidades-por-cliente}") private int limite;`
- [ ] `registrar(VentaRequest)`: obtiene la bebida y aplica **en este orden, deteniéndose en la primera falla**:
  1. `ventaRestringida` → motivo `VENTA_RESTRINGIDA`.
  2. `tipo == ALCOHOLICA && unidades > limite` → motivo `LIMITE_EXCEDIDO` (mensaje: `"X unidades superan el limite de N por cliente."`).
  3. `stock < unidades` → motivo `STOCK_INSUFICIENTE`.
  4. Nada falla: descuenta stock, `total = calcularPrecio(bebida) * unidades`, guarda `Venta` con estado `AUTORIZADA`.
- [ ] En los rechazos: persistir la `Venta` con estado `RECHAZADA`, `motivo`, `total = 0`, `fecha = now()`, y **luego** lanzar `VentaRechazadaException`. El `noRollbackFor` es clave: sin él, el `409` revierte la venta rechazada y el historial quedaría incompleto.
- [ ] `historial()`: `findAllByOrderByFechaDesc()` mapeado a `VentaResponse`.

```bash
git add backend/src/main/java/cl/dsy1104/fonda/service
git commit -m "feat(service): implementa registro de ventas con reglas de negocio"
```

### Paso 8 — `BebidaController`

- [ ] `@RestController @RequestMapping("/api/bebidas") @RequiredArgsConstructor`.

| Método | Ruta | Resultado |
|---|---|---|
| `GET` | `/api/bebidas?nombre=` | `200` lista |
| `GET` | `/api/bebidas/{id}` | `200` |
| `POST` | `/api/bebidas` (`@Valid`) | `201` + `Location` |
| `PUT` | `/api/bebidas/{id}` (`@Valid`) | `200` |
| `DELETE` | `/api/bebidas/{id}` | `204` (`ResponseEntity.noContent()`) |
| `PATCH` | `/api/bebidas/{id}/restriccion` | `200` |

- [ ] `Location` del POST: `ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(dto.getId()).toUri()`.

```bash
git add backend/src/main/java/cl/dsy1104/fonda/controller
git commit -m "feat(controller): expone endpoints REST de bebidas"
```

### Paso 9 — `VentaController`

- [ ] `POST /api/ventas` con `@Valid` → `201` + `Location: /api/ventas/{id}`.
- [ ] `GET /api/ventas` → `200` historial completo (autorizadas y rechazadas).

```bash
git add backend/src/main/java/cl/dsy1104/fonda/controller
git commit -m "feat(controller): expone endpoints REST de ventas"
```

### Paso 10 — `config` y serialización

- [ ] `CorsConfig implements WebMvcConfigurer`: `@Value("${fonda.cors.origen}")`, mapping `/api/**`, métodos `GET, POST, PUT, PATCH, DELETE, OPTIONS`, headers `*`.
- [ ] `application.properties`: agregar `spring.jackson.default-property-inclusion=non_null`.

```bash
git add backend/src/main/java/cl/dsy1104/fonda/config backend/src/main/resources/application.properties
git commit -m "feat(config): habilita CORS y serializacion JSON"
```

---

## 4. Verificación

- [ ] `cd backend && mvn spring-boot:run` levanta sin errores.
- [ ] `mvn compile` antes de cada commit.
- [ ] Probar en Postman y/o con curl (resultados esperados del README):

```bash
# Precios calculados: 4200 (chicha alcohólica sin certificar) y 2200 (chicha con 95 g/L)
curl -s "http://localhost:8080/api/bebidas?nombre=Chicha"

# Venta autorizada: 201 + Location, total 7000
curl -si -X POST http://localhost:8080/api/ventas \
  -H "Content-Type: application/json" -d '{"bebidaId": 2, "unidades": 2}'

# Límite excedido: 409 LIMITE_EXCEDIDO
curl -si -X POST http://localhost:8080/api/ventas \
  -H "Content-Type: application/json" -d '{"bebidaId": 2, "unidades": 5}'

# Validación: 400 VALIDACION con campos
curl -si -X POST http://localhost:8080/api/bebidas \
  -H "Content-Type: application/json" -d '{"nombre": "", "volumenML": 50, "stock": 0}'

# Bebida restringida: 409 VENTA_RESTRINGIDA (chicha alcohólica, id 1)
curl -si -X POST http://localhost:8080/api/ventas \
  -H "Content-Type: application/json" -d '{"bebidaId": 1, "unidades": 1}'
```

- [ ] `GET /api/ventas` muestra la venta rechazada con su motivo.
- [ ] Consola H2: `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:fonda`).

## 5. Checklist de entrega

- [ ] Sin `target/`, `.idea/` ni credenciales reales en el repo.
- [ ] Commits de todos los integrantes durante la semana (no una sola carga al final).
- [ ] Cada integrante puede explicar cualquier capa, no solo la suya.
- [ ] Si algo no compila, guardar la traza de Spring Boot y consultarla antes de descartar el avance.

## 6. Errores comunes

| Síntoma | Causa probable |
|---|---|
| `Column "VOLUMENML" not found` o `volumen_m_l` | Falta `@Column(name = "volumen_ml")` en `volumenML`. |
| `DataIntegrityViolationException` al borrar una bebida | Hay ventas asociadas: borrarlas antes con `deleteByBebidaId` dentro de la transacción. |
| `409` responde pero el historial no tiene la rechazada | Falta `noRollbackFor = VentaRechazadaException.class` en el `@Transactional`. |
| Navegador bloquea las peticiones del frontend | Falta `CorsConfig` o el origen no coincide con `fonda.cors.origen`. |
| El límite responde 3 siempre aunque cambies la propiedad | El valor está hardcodeado; debe venir de `fonda.limite-unidades-por-cliente`. |
