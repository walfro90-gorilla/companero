import type { NextConfig } from "next";

// Sin cacheComponents (docs/adr/0009): casi todas las pantallas dependen de la sesión, y ninguno de los
// proyectos del equipo lo usa (brotes, ketzal-OS). Volver a encenderlo obliga a envolver en Suspense cada
// lectura de cookies.
const nextConfig: NextConfig = {
  // `conocimiento/*.md` solo lo leen los scripts (sembrar demos); la app lee todo de Supabase.
  // Los archivos (PDF/Word) suben directo del navegador a Supabase Storage: en Vercel una función no acepta
  // cuerpos de más de 4.5 MB. Por Server Action solo viaja texto pegado.
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
