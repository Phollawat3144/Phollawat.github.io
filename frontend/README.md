# React + Vite

## Maps

Maps use Leaflet with Esri World Imagery satellite tiles and a reference-label
overlay. No Google Maps API key is required. The map tiles are loaded from Esri
and require an internet connection.

## Photo location metadata

When members upload JPG/JPEG photos, the backend reads GPS coordinates and
capture time from EXIF metadata when available. Photos without this metadata
are still accepted; the activity's saved location is used as the map fallback.
To enable per-photo locations on an existing database, apply
`backend/migrations/20261101_add_activity_image_metadata.sql`. The gallery map
then displays each photo's recorded position.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
