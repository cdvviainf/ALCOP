import type { NextConfig } from "next";

// `output: 'standalone'` solo en builds de producción empaquetados en Docker.
// El Dockerfile de producción pasa BUILD_STANDALONE=true (ver alcop-web/Dockerfile).
// En desarrollo NO se fuerza standalone.
const nextConfig: NextConfig = {
  // Next 16 regenera CLAUDE.md/AGENTS.md en la raíz del proyecto en cada arranque;
  // lo desactivamos — el contrato técnico vive en el CLAUDE.md raíz de ALCOP, no acá.
  agentRules: false,
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
