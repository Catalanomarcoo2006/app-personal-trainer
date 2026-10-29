const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // il pallino "N" di Next in basso a sinistra finirebbe sotto il tasto del Coach
  devIndicators: false,
  // indirizzi corti delle tre demo (la pagina principale le elenca insieme alle tre versioni vere)
  async redirects() {
    return [
      { source: "/demo/trainer", destination: "/prototipo/trainer?computer", permanent: false },
      { source: "/demo/telefono", destination: "/prototipo/trainer?telefono", permanent: false },
      { source: "/demo/cliente", destination: "/prototipo/cliente", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
      },
    ],
  },
  webpack: (config, { webpack, isServer }) => {
    // Ignore MongoDB's optional dependencies to prevent build warnings
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(kerberos|@mongodb-js\/zstd|@aws-sdk\/credential-providers|gcp-metadata|snappy|socks|aws4|mongodb-client-encryption)$/,
        })
      );
    }

    return config;
  },
};

// Sviluppo e produzione in cartelle diverse: "next dev" non sovrascrive la versione compilata
// che gira con "next start", e i due server possono restare accesi insieme.
module.exports = (phase) => ({
  ...nextConfig,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});
