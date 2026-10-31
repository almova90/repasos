# Guía operativa de Aprendizaje (Repasos)

## Alcance y fuentes

Leer este archivo y `README.md` antes de modificar el proyecto. Mantener esta guía
cuando cambien reglas, arquitectura o procedimientos permanentes. Distinguir en los
informes lo verificado de lo inferido; no convertir riesgos pendientes en requisitos
inventados. Consultar `version.json`, código e historial actuales, sin asumir una versión
por esta documentación. `docs/architecture-and-tests.md` explica decisiones de recuperación
PWA y límites de cobertura; es una revisión histórica, no una especificación actual completa.

## Arquitectura confirmada

- Repositorio público `almova90/repasos`. Aplicación estática instalable, alojada en
  GitHub Pages desde `main`, raíz `/`. No hay compilación ni backend local obligatorio.
- `index.html` concentra HTML, CSS, navegación, plantillas, gestos, repetición espaciada,
  IndexedDB, estadísticas, ajustes, Arcade/Pokémon y sincronización con Drive.
  `$` selecciona un elemento; `$$` devuelve una lista. No intercambiarlos.
- `sw.js` gestiona instalación, actualización y cachés; `version.json` declara la versión.
  `manifest-v5.webmanifest`, iconos, `fonts/` y `assets/pokemon/` son recursos de la PWA.
  Los manifiestos e iconos anteriores siguen en el repositorio: comprobar referencias
  antes de retirarlos. Mantener rutas relativas compatibles con el subdirectorio de Pages.
- `music-catalog.json` y `music/` proporcionan títulos y audio; `demo-data.js` contiene
  datos de demostración. Respetar nombres, espacios, caracteres Unicode y rutas de audio.
- `reparar.html` recupera el worker y HTML sin depender del arranque de la aplicación.
  `lecturas-bridge.html` integra Lecturas mediante mensajes y Google Apps Script;
  las escrituras deben completarse antes de responder. No modificar protocolos externos
  sin inspeccionar ambos extremos y probar la integración correspondiente.
- `package.json`/`package-lock.json`: Node se usa para pruebas con `playwright-core`.
  `tests/browser.cjs` sirve la aplicación y usa Chromium real; `.github/workflows/`
  ejecuta la suite en Ubuntu 24.04 con Node 22, sin desplegar.

## Datos: invariantes de conservación

- IndexedDB: `repaso-slick-db` (real), `repaso-slick-demo-db` (demo), versión 1,
  almacén `items`, clave `id`. Ajustes, uso, progreso Arcade y marcadores de migración
  se guardan en localStorage. Las cachés del worker son independientes de estos datos.
- Conservar IDs, fechas, historiales, planificación, contadores y `reverseProgress`.
  Las unidades de repaso `id::f`/`id::r` son vistas de una tarjeta: no duplicar tarjetas
  persistidas ni mezclar progreso directo e inverso. Respetar tarjetas pausadas.
- Nunca borrar IndexedDB/localStorage como solución a un error de arranque o caché.
  Una actualización visual o del worker no debe reinicializar la base ni el progreso.
  Mantener un error de arranque visible y la recuperación independiente.
- Importación JSON confirmada: valida tarjetas y **sustituye** la base activa tras
  confirmación; no fusiona historiales. Importar ajustes conserva el modo demo activo.
  Exportaciones incluyen datos, ajustes, uso y Arcade según modalidad. Cualquier cambio
  aquí exige fixtures privadas/sintéticas y comprobación exacta de ida y vuelta.
- Drive es una operación manual con vista previa/confirmación. La fusión conserva
  progreso local directo/inverso e IDs existentes; ausencia remota no implica borrado.
  Los borrados se declaran explícitamente mediante `deletedIds`. No sustituir esta
  semántica por reemplazo ciego ni inventar credenciales.
- Nunca subir exportaciones personales, historiales reales, credenciales o datos de
  navegación a este repositorio público. No usar perfiles de navegador personales
  para pruebas; no asumir que datos proporcionados en chat están publicados.

## Reglas funcionales y convenciones establecidas

- Español de España; interfaz compacta y controles claros. Preferir cambios pequeños
  y localizados frente a reescribir el archivo principal.
- Cuatro mazos: Música, Literatura, Miscelánea y Sistemas de escritura. El selector
  admite varios, confirma explícitamente y recuerda el subconjunto elegido.
- Mantener las dos direcciones de repaso cuando corresponde; las nuevas tarjetas con
  respuesta son bidireccionales por defecto. Literatura contiene obras/títulos y autores,
  no biografías. Música usa título ↔ audio; ambas direcciones deben girar con tap,
  reproducir audio y permitir volver al título sin registrar una respuesta por girar.
- Sistemas de escritura incluye hiragana, katakana, ruso, ucraniano y hebreo, con
  transliteraciones y nombres hebreos. Japonés y hebreo no tienen mayúsculas.
- Idiomas: Banderas por defecto o Texto, indicadores compactos en segunda línea.
  La ruta origen → destino corresponde a la cara visible; al girar se invierte,
  también cuando la unidad de repaso ya es inversa. No modificar el contenido guardado
  para resolver una cuestión de presentación.
- Conservar texto literal, griego y formato permitido (`<small>(sin.)</small>`,
  `<small>(ant.)</small>`, `<i>…</i>`). En sinónimos la marca `(sin.)` va en ambas
  caras; no añadirla a definiciones en prosa. Usar los renderizadores existentes.
- Mantener repaso estándar y desplazamiento, yes/nope, deshacer, edición por pulsación
  larga y gestos configurables sin interferir con audio ni botones. La planificación
  es independiente de recompensas visuales Arcade/Pokémon.
- Conservar ajustes de temas, apariencia, sonido y XP. En resultados, el multiplicador
  de mejor racha usa `x` minúscula; Seguir queda a la izquierda, Terminar a la derecha
  y solo Terminar es verde entre las acciones. Ajustes, si aparece, queda entre ambos.

## Desarrollo y validación

```sh
npm ci
# Solo si no hay Chromium instalado:
npx playwright-core install --with-deps chromium
npm test
# Servidor de desarrollo, desde la raíz del repositorio:
python3 -m http.server 8000 --bind 127.0.0.1
```

Node >=18; la suite prefiere `/usr/bin/chromium` y admite `CHROMIUM_PATH`. Usa el
checkout existente; las tareas cloud ya están aisladas, no crear worktrees salvo
petición explícita. Respetar proxy y verificación TLS del entorno.

Antes de editar, revisar estado Git, instrucciones, funciones afectadas y commits
relevantes. No sobrescribir trabajo ajeno. Usar instalación con lockfile y no actualizar
dependencias por una corrección de interfaz.

Añadir regresiones relevantes a la suite existente. Probar páginas renderizadas,
no solo sintaxis: arranque normal, Arcade y móvil táctil, ajustes, multiselección,
giro, audio, offline y recuperación/actualización. La suite comprueba sintaxis/versiones,
espera también `startupReadyPromise` y verifica conservación exacta de una tarjeta
sintética real con ambos historiales y localStorage. Confirmar salida y código de retorno;
no considerar un puerto abierto o cero pruebas como validación funcional.

Para cambios de datos, ampliar pruebas de importación, migraciones y conflictos de
sincronización antes de afirmar compatibilidad. Revisar diff y estado al terminar.

## Versionado y publicación

1. Incrementar coherentemente versión visible de `index.html`, `APP_VERSION` de
   `sw.js` (de ella deriva `CACHE_NAME`) y `version.json` para cambios de aplicación.
   No cambiar el formato de exportación ni versión IndexedDB por cambios visuales.
2. Mantener navegación network-first y fallback de HTML en caché activa; nunca
   guardar `reparar.html` como entrada principal ni buscar HTML en cachés antiguas.
   Audio tiene caché propia y respuestas Range. No esperar `client.navigate()` dentro
   de activación: puede bloquearla. Evitar recargas simultáneas del worker y la página.
3. Ejecutar la suite antes de subir. Preferir rama y PR con problema, cambio y pruebas.
   No fusionar/publicar sin autorización; una solicitud explícita de subir cambios
   autoriza el push, no implica haber verificado un despliegue remoto.
4. Pages usa `main` y `/` según README; el workflow de pruebas no publica. Antes de
   publicar, revisar copia privada de datos y rollback al commit anterior. Probar
   Chrome Android instalado cuando sea posible y declarar cuando no se haya probado.
   Un rollback también requiere planificar la versión del worker/caché, no borrar datos.

## Límites y cuestiones pendientes

La suite Chromium no demuestra compatibilidad universal, instalación Android real,
OAuth/Drive ni funcionamiento del servicio externo Lecturas. La transición heredada
simula el HTML roto y usa un worker fixture; no reproduce todo un despliegue histórico.
No hay garantía deducible de fusión de importaciones, sincronización automática o
compatibilidad con todos los navegadores. No afirmarlas sin pruebas.

La precarga de recursos secundarios tolera fallos; la activación elimina cachés distintas
de las dos permitidas en el origen. Despliegues parciales, varios clientes, audio offline
con Range, cuotas/bloqueos IndexedDB y conflictos remotos requieren pruebas específicas
si se modifican. No ampliar esta actualización a esas áreas sin necesidad.
