import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  const secretFilePath = path.join(process.cwd(), 'jwt_secret.txt');
  
  if (fs.existsSync(secretFilePath)) {
    return fs.readFileSync(secretFilePath, 'utf-8').trim();
  }

  console.warn("Generating ephemeral secret for JWT. Instance-isolated!");
  const secret = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(secretFilePath, secret, 'utf-8');
  } catch (error) {
    console.error("Failed to persist ephemeral JWT secret key:", error);
  }
  
  return secret;
}
