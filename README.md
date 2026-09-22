# Repasos

PWA instalable para repasar conceptos con tarjetas, respuestas `yes`/`nope`, pistas, estadísticas y repetición espaciada.

## Modo arcade

La versión 0.24 refuerza la persistencia de los ajustes arcade, añade controles de posición de la pantalla inicial, acceso opcional a Ajustes desde «Repaso terminado», trayectorias y ángulos configurables para los mensajes, una superrotación corregida y tres temas nuevos: Neón azul, Pulso y Pop eléctrico. La capa arcade sigue disponible tanto en Estándar como en Scroll, con XP, niveles, combos, rondas relámpago, dificultad, música, vibración y resumen detallado.

## Publicación en GitHub Pages

1. Sube el contenido de esta carpeta a la rama principal de un repositorio.
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama principal y la carpeta raíz (`/`).
5. Abre la dirección HTTPS que muestre GitHub Pages.

En Android, abre esa dirección en Chrome y usa **Instalar aplicación**. La base de datos permanece en IndexedDB y no se sustituye al actualizar el código.

## Actualizaciones

Para publicar una versión nueva, actualiza los archivos y cambia `APP_VERSION` y `CACHE_NAME` en `sw.js`. Cuando el móvil detecte el nuevo *service worker*, la aplicación mostrará la franja verde **Actualización disponible**. Al tocar **Actualizar**, se activa la versión nueva y se recarga la interfaz sin borrar las tarjetas ni el progreso.
