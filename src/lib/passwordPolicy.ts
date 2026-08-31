import { createHash } from "crypto";

export function validatePasswordComplexity(password: string): string | null {
  if (password.length < 8) return "Wachtwoord moet minimaal 8 tekens bevatten";
  if (!/[A-Z]/.test(password)) return "Wachtwoord moet minimaal 1 hoofdletter bevatten";
  if (!/[0-9]/.test(password)) return "Wachtwoord moet minimaal 1 cijfer bevatten";
  if (!/[^A-Za-z0-9]/.test(password)) return "Wachtwoord moet minimaal 1 speciaal teken bevatten";
  return null;
}

// Have I Been Pwned k-anonymity check: alleen de eerste 5 tekens van de SHA-1
// hash worden verstuurd, nooit het wachtwoord zelf. Faalt "open" (blokkeert
// registratie niet) als de externe API niet bereikbaar is.
async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return false;

    const body = await res.text();
    return body.split("\n").some((line) => line.split(":")[0].trim() === suffix);
  } catch {
    return false;
  }
}

export async function validatePassword(password: string): Promise<string | null> {
  const complexityError = validatePasswordComplexity(password);
  if (complexityError) return complexityError;
  if (await isPasswordPwned(password)) {
    return "Dit wachtwoord is bekend uit eerdere datalekken. Kies een ander wachtwoord.";
  }
  return null;
}
