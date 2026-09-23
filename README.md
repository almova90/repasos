# Repasos

PWA instalable para repasar conceptos con tarjetas, respuestas `yes`/`nope`, pistas, estadísticas y repetición espaciada.

## Modo arcade

La versión 0.28 conserva todos los ajustes arcade y los agrupa bajo «Opciones para desarrolladores — modo arcade». La experiencia ya no usa separadores de millares.

## Modo Pokémon

El modo Pokémon añade cuatro temas, tres fondos de juego, la fuente Pokémon GB y sonidos contextuales para clics, fallos, bonus, niveles, transiciones, salida, ronda relámpago y final de repaso. En Apariencia se puede elegir el tema, el comportamiento de la melodía de portada, la música de partida, los volúmenes y el color del texto durante el juego.

## Publicación en GitHub Pages

1. Sube el contenido de esta carpeta a la rama principal de un repositorio.
2. En GitHub, abre **Settings → Pages**.
3. En **Build and deployment**, selecciona **Deploy from a branch**.
4. Elige la rama principal y la carpeta raíz (`/`).
5. Abre la dirección HTTPS que muestre GitHub Pages.

En Android, abre esa dirección en Chrome y usa **Instalar aplicación**. La base de datos permanece en IndexedDB y no se sustituye al actualizar el código.

## Actualizaciones

Para publicar una versión nueva, actualiza los archivos y cambia `APP_VERSION` y `CACHE_NAME` en `sw.js`. Cuando el móvil detecte el nuevo *service worker*, la aplicación mostrará la franja verde **Actualización disponible**. Al tocar **Actualizar**, se activa la versión nueva y se recarga la interfaz sin borrar las tarjetas ni el progreso.
