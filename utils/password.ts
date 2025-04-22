// utils/password.ts
import crypto from "crypto";

/**
 * Generates a salt and hashes a password
 * @param password The plain text password to hash
 * @returns An object containing the salt and hashed password
 */
export function saltAndHashPassword(password: string): {
  salt: string;
  hash: string;
} {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString("hex");

  // Hash the password with the salt
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");

  return { salt, hash };
}

/**
 * Verifies a password against a stored hash and salt
 * @param password The plain text password to verify
 * @param salt The salt used to hash the original password
 * @param storedHash The stored hash to compare against
 * @returns Boolean indicating if the password matches
 */
export function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): boolean {
  // Hash the input password with the stored salt
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");

  // Compare the newly generated hash with the stored hash
  return storedHash === hash;
}
