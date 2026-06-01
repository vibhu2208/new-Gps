/**
 * MongoDB connection string helpers.
 * Passwords with @ must use %40 or the host is parsed as "2003" (ENOTFOUND _mongodb._tcp.2003).
 */

export function getMongoUriFromEnv(): string | undefined {
  return process.env.MONGODB_URI?.trim();
}

/** True if URI has multiple @ before the host (unencoded password @). */
export function isMongoUriMalformed(uri: string): boolean {
  const withoutProtocol = uri.replace(/^mongodb\+srv:\/\//i, '').replace(/^mongodb:\/\//i, '');
  const atCount = (withoutProtocol.match(/@/g) || []).length;
  return atCount > 1;
}

export function getMongoUriValidationError(uri: string): string | null {
  if (!uri) return 'MONGODB_URI is not set';

  if (isMongoUriMalformed(uri)) {
    return (
      'MONGODB_URI is invalid: the password contains "@" which must be encoded as %40. ' +
      'Example: Gps%402003 not Gps@2003'
    );
  }

  return null;
}

export function getMongoConnectionHint(errorMessage: string): string {
  if (errorMessage.includes('_mongodb._tcp.2003') || errorMessage.includes('ENOTFOUND _mongodb._tcp.2003')) {
    return (
      'Your MONGODB_URI password likely has a raw @ symbol. In Vercel, set the URI exactly like: ' +
      'mongodb+srv://gps-tracking:Gps%402003@gpstracking.ivtvtuj.mongodb.net/ ' +
      '(use %40 instead of @ in the password).'
    );
  }

  if (isMongoUriMalformed(getMongoUriFromEnv() || '')) {
    return getMongoUriValidationError(getMongoUriFromEnv() || '') || '';
  }

  return (
    'Check MONGODB_URI on Vercel, Atlas Network Access (0.0.0.0/0), and run npm run db:push to upload routes.'
  );
}
