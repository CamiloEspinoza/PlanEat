import { api } from "encore.dev/api";

// Servir la landing page en la raíz
export const serveApp = api.static(
  {
    expose: true,
    path: "/!path",
    dir: "./dist",
  }
);

