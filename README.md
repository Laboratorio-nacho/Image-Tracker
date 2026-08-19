# Image Tracker

Extensión de VS Code que escanea tu workspace en busca de imágenes y las muestra en un panel lateral dedicado, organizadas por carpeta. Rastrea qué imágenes están referenciadas en tu código y cuáles están sin usar.

## Características

- **Panel lateral** en el Explorer con todas las imágenes del workspace
- **Detección de uso** — imágenes referenciadas en código se marcan en verde, las sin usar en rojo
- **Seguimiento de referencias** — expandí un nodo para ver qué archivos la referencian, con número de línea
- **Auto-actualización** — el árbol se actualiza automáticamente al cambiar archivos
- **Click para abrir** — hacé click en una imagen para abrirla, o en una referencia para saltar a esa línea

## Uso

1. Abrí un workspace con imágenes
2. El panel "Image Tracker" aparece en el Explorer
3. Hacé click en el botón refresh (o se actualiza solo) para escanear imágenes
4. Navegá las imágenes agrupadas por carpeta, expandí para ver referencias

## Tipos de imagen soportados

`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.bmp`, `.ico`

## Comandos

| Comando | Descripción |
|---------|-------------|
| `Refresh Images` | Re-escanear el workspace buscando imágenes |
