const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zqtvbzcsyrragrtqpsgn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;