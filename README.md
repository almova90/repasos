# Repasos

PWA instalable para repasar conceptos con tarjetas, respuestas `yes`/`nope`, pistas, estadísticas y repetición espaciada.

## Modo arcade

La versión 0.27 unifica las etiquetas «Difícil» y «Muy difícil» con la distribución de dominio, reserva los efectos de tarjeta para los ítems de dominio muy bajo y corrige Prisma con una capa sobredimensionada que cubre siempre la tarjeta. Añade controles para el multiplicador de dificultad, respuesta rápida, tamaños y cromatismo de niveles, título de ronda relámpago y nuevas velocidades de coronas. También sincroniza texto y fondo al subir de nivel, adapta los mensajes de progreso a cada sesión y convierte Atrás de Android en navegación interna mientras no se esté en la portada.

## Publicación en GitHub Pages

1. Sube el contenido de esta carpeta a la rama principal de un repositorio.
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama principal y la carpeta raíz (`/`).
5. Abre la dirección HTTPS que muestre GitHub Pages.

En Android, abre esa dirección en Chrome y usa **Instalar aplicación**. La base de datos permanece en IndexedDB y no se sustituye al actualizar el código.

## Actualizaciones

Para publicar una versión nueva, actualiza los archivos y cambia `APP_VERSION` y `CACHE_NAME` en `sw.js`. Cuando el móvil detecte el nuevo *service worker*, la aplicación mostrará la franja verde **Actualización disponible**. Al tocar **Actualizar**, se activa la versión nueva y se recarga la interfaz sin borrar las tarjetas ni el progreso.
