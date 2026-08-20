# Image Tracker

Extensión para VS Code que escanea tu workspace en busca de imágenes y las organiza en un panel lateral. Identifica qué imágenes están siendo usadas en tu código y cuáles no.

## Funcionalidades

- **Panel lateral** en el Explorer con todas las imágenes del proyecto
- **Detección de uso** — las imágenes que aparecen en código se marcan en verde, las que no se usan en rojo
- **Seguimiento de referencias** — expandí un nodo para ver qué archivos la mencionan, con número de línea
- **Actualización automática** — el árbol se refresca cuando cambian archivos
- **Navegación rápida** — hacé click en una imagen para abrirla, o en una referencia para ir a esa línea

## Cómo usar

1. Abrí un workspace que contenga imágenes
2. El panel "Image Tracker" aparece en el Explorer
3. Hacé click en el botón refresh (o se actualiza solo) para escanear
4. Navegá las imágenes agrupadas por carpeta, expandí para ver referencias

## Formatos de imagen soportados

`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.bmp`, `.ico`, `.avif`, `.tiff`, `.tif`

## Comandos

| Comando | Descripción |
|---------|-------------|
| `Refresh Images` | Volver a escanear el workspace |
