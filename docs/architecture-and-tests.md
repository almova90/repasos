# Revisión de arquitectura y pruebas

Revisión de `main` hasta `15029ba` (0.34.3) y corrección local candidata 0.34.4.
No se publica mediante esta revisión ni mediante el workflow de pruebas.

## Arquitectura actual

- `index.html` concentra estilos, renderizado mediante plantillas, navegación,
  estado de sesiones, algoritmo de repaso, IndexedDB, importación/exportación,
  sincronización con Drive y registro del service worker. Un error síncrono en
  la inicialización detiene las instrucciones posteriores, incluido el registro.
- `$` devuelve un elemento; `$$` devuelve una lista. No hay comprobación estática
  de esos tipos, de modo que la sintaxis puede ser válida y el arranque fallar.
- IndexedDB contiene `repaso-slick-db` y `repaso-slick-demo-db`, versión 1,
  almacén `items`, clave `id`. El progreso directo está en la tarjeta y el
  inverso en `reverseProgress`. Ajustes, estadísticas agregadas y marcadores
  de migración se guardan en localStorage. La caché del worker es independiente.
- `sw.js` precarga HTML y recursos, mantiene una caché por versión y otra de
  audio, prioriza la red para navegación y permite recuperar HTML sin conexión.
  Su activación automática también intenta recuperar ventanas cuyo JS falló.
- `reparar.html` funciona sin depender de la interfaz principal: actualiza el
  worker y refresca HTML/cachés. No corrige errores del HTML publicado.

## Fallos corregidos localmente

1. Cinco selecciones múltiples usaban `$` en lugar de `$$`: arranque, apertura,
   confirmación y habilitación del selector de mazos, y ajuste de idiomas.
   El arranque de 0.34.3 falla con `$(...).forEach is not a function`.
2. La activación del worker esperaba `client.navigate()` dentro de `waitUntil`.
   La navegación puede esperar la finalización de esa misma activación. Las
   pruebas mostraban ventanas esperando la carga y activación sin terminar.
   Se inicia la navegación sin retener por ella el evento de activación.
3. La página recargaba en `controllerchange` mientras el worker ya navegaba
   las ventanas, provocando navegaciones concurrentes. El worker se encarga de
   la recuperación; la página deja de ordenar otra recarga.

La candidata usa 0.34.4 de forma coherente en HTML, worker y version.json para
que una futura publicación pueda reemplazar las cachés de 0.34.3.

## Riesgos restantes detectados por lectura

No son causas demostradas del bloqueo actual y no se modifican en este parche:

- Importar un JSON sustituye toda la base después de confirmar; no fusiona
  historiales más recientes. Una exportación antigua puede sobrescribir progreso.
- La fusión de Drive conserva el progreso local directo/inverso para IDs
  existentes; requiere pruebas específicas de conflictos, eliminaciones y fallos
  de red. No se han usado credenciales ni datos personales para probar Drive.
- La precarga usa `allSettled` para recursos secundarios; puede activarse una
  versión con un recurso faltante. `demo-data.js` y el catálogo merecen una
  clasificación explícita como dependencias funcionales al ampliar el offline.
- La activación elimina cachés ajenas a los dos nombres permitidos, en todo el
  origen. Conviene limitarla a prefijos propios si otras PWA comparten origen.
- El HTML de navegación puede ser más nuevo que el worker durante un despliegue
  parcial. Se necesita probar despliegues interrumpidos y compatibilidad entre
  versiones, además de mantener el respaldo de la versión anterior.
- El arranque declara la portada lista antes de terminar la inicialización
  asíncrona y oculta errores de esa inicialización. Las pruebas esperan también
  `startupReadyPromise` para no confundir una portada visible con datos listos.

## Cobertura y siguientes pasos

`npm test` usa Chromium real, servidor HTTP local y contextos aislados. Incluye
una copia del worker publicado de 0.34.3 como fixture; el HTML antiguo se simula
reintroduciendo el fallo real de selector. No es una copia completa de la versión
antigua. Comprueba tanto la transición con el worker antiguo como la recuperación
manual, el arranque offline y la igualdad exacta de la tarjeta de prueba en la
base real activa. No altera perfiles de usuario ni hace peticiones a Drive.

Prioridades para ampliar la suite:

1. Importación/exportación: cancelar, JSON inválido, transacción abortada,
   restauración exacta de IDs e historiales, advertencia ante una copia antigua.
2. Migraciones: fixtures de cada formato anterior, ejecución repetida sin cambios,
   fallo del catálogo y ausencia de pérdida de tarjetas; apertura simultánea de
   dos pestañas, IndexedDB bloqueada y cuota agotada.
3. PWA: pérdida de red durante install, recurso esencial 404, transición con dos
   pestañas y un repaso abierto, caché antigua contaminada por reparar.html,
   actualización repetida sin bucles y audio offline con peticiones Range.
4. Núcleo de repaso y fusión: extraer gradualmente funciones puras y probar reloj
   fijo, direcciones independientes y conflictos con progreso local más reciente.
   Evitar una reescritura del fichero completo para este arreglo urgente.
5. Antes de publicar: suite Chromium verde, comprobación manual en Chrome Android
   instalado, exportación privada de respaldo y posibilidad de volver al commit
   anterior. El workflow de CI solo comprueba; no despliega ni hace push.
