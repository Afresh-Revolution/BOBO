/**
 * Password strength rules for admin accounts (MASTER PROMPT).
 */
export function validatePasswordStrength(password: string): {
  ok: boolean;
  message?: string;
} {
  if (password.length < 10) {
    return { ok: false, message: "Password must be at least 10 characters." };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, message: "Password must include a lowercase letter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, message: "Password must include an uppercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: "Password must include a number." };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      ok: false,
      message: "Password must include a special character.",
    };
  }
  return { ok: true };
}
