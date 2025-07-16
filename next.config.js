/** @type {import('next').NextConfig} */
const nextConfig = {
  // AÑADE ESTA LÍNEA PARA EXPORTAR EL SITIO:
  output: 'export',
  
  // Esta línea ya no es necesaria, pero no estorba
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;