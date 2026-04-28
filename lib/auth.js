import { SignJWT, jwtVerify } from 'jose';

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error('JWT_SECRET environment variable is not set.');
  }
  return secret;
};

export const signJwt = async (payload) => {
  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
  } catch (error) {
    throw new Error('Failed to sign JWT');
  }
};

export const verifyJwt = async (token) => {
  try {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
};

export const extractTokenFromRequest = (request) => {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...val] = c.split('=');
      return [key, val.join('=')];
    })
  );
  
  return cookies.playzone_token || null;
};

export const getAuthUser = async (request) => {
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  
  const payload = await verifyJwt(token);
  if (!payload) return null;
  
  return {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    role: payload.role,
  };
};