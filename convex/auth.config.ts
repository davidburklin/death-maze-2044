// Configures JWT validation for Convex.
// Convex fetches {domain}/.well-known/openid-configuration to discover the JWKS endpoint.
// The applicationID is checked against the JWT aud (audience) claim.
// For Google OAuth, the audience is your Client ID.
export default {
  providers: [
    {
      domain: "https://accounts.google.com",
      applicationID: process.env.AUTH_GOOGLE_CLIENT_ID,
    },
  ],
};
