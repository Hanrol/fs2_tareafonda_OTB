-- Datos iniciales de la fonda.
-- Se cargan automaticamente al arrancar, despues de que JPA crea las tablas.
-- Ajusta los nombres de columna si tu entidad usa otros.

INSERT INTO bebida (nombre, tipo, volumen_ml, stock, grados_alcohol, certificada, azucar_por_litro, venta_restringida)
SELECT 'Chicha', 'ALCOHOLICA', 1000, 40, 12.0, false, NULL, true
WHERE NOT EXISTS (SELECT 1 FROM bebida);

INSERT INTO bebida (nombre, tipo, volumen_ml, stock, grados_alcohol, certificada, azucar_por_litro, venta_restringida)
SELECT 'Pisco Sour', 'ALCOHOLICA', 500, 25, 18.0, true, NULL, false
WHERE NOT EXISTS (SELECT 1 FROM bebida WHERE nombre = 'Pisco Sour');

INSERT INTO bebida (nombre, tipo, volumen_ml, stock, grados_alcohol, certificada, azucar_por_litro, venta_restringida)
SELECT 'Chicha', 'SIN_ALCOHOL', 1000, 60, NULL, NULL, 95, false
WHERE NOT EXISTS (SELECT 1 FROM bebida WHERE nombre = 'Chicha' AND tipo = 'SIN_ALCOHOL');

INSERT INTO bebida (nombre, tipo, volumen_ml, stock, grados_alcohol, certificada, azucar_por_litro, venta_restringida)
SELECT 'Mote con Huesillo', 'SIN_ALCOHOL', 400, 50, NULL, NULL, 70, false
WHERE NOT EXISTS (SELECT 1 FROM bebida WHERE nombre = 'Mote con Huesillo');
