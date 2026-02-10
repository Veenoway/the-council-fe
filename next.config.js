/** @type {import('next').NextConfig} */
const nextConfig = {
  // Utilise Turbopack (Next.js 16 default)
  turbopack: {},
  
  // Garde webpack config pour compatibilité si besoin
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

module.exports = nextConfig;