export const auth0Config = {
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', '').replace('http://', '') || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  baseUrl: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  callbackUrl: `${process.env.AUTH0_BASE_URL || 'http://localhost:3000'}/api/auth/callback`,
};

