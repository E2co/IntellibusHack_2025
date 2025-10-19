// Centralized JWT secret resolver with a safe dev fallback
export function getJwtSecret() {
  const isProd = process.env.NODE_ENV === 'production';
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret.trim()) return envSecret.trim();
  if (!isProd) {
    // Development fallback to keep local setup unblocked
    return 'dev-secret-change-me';
  }
  // In production, do not proceed without a proper secret
  throw new Error('JWT_SECRET is not set. Please configure a strong secret in the environment.');
}

export default { getJwtSecret };