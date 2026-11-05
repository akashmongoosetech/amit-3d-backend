const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Return true only for non-empty strings (guards against NoSQL injection via objects)
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

// Strip MongoDB operator keys ($..., ...) from plain objects to mitigate NoSQL injection
const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === "object" && obj.constructor === Object) {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("$") || k.includes(".")) continue;
      clean[k] = sanitizeObject(v);
    }
    return clean;
  }
  return obj;
};

const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "name",
  "email",
  "mobile",
  "modelName",
  "modelSize",
  "status",
  "orderStatus",
  "firstName",
  "lastName",
  "username",
]);

const sanitizeSort = (sortBy, fallback = "createdAt") => {
  if (typeof sortBy === "string" && ALLOWED_SORT_FIELDS.has(sortBy)) return sortBy;
  return fallback;
};

// Single shared strong-password policy (H4). Returns error message or null.
const validateStrongPassword = (password, { firstName = "", lastName = "" } = {}) => {
  if (typeof password !== "string" || password.length < 8)
    return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain one number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain one special character";
  const lower = password.toLowerCase();
  if (firstName && typeof firstName === "string" && firstName.length >= 2 && lower.includes(firstName.toLowerCase()))
    return "Password must not contain your first name";
  if (lastName && typeof lastName === "string" && lastName.length >= 2 && lower.includes(lastName.toLowerCase()))
    return "Password must not contain your last name";
  return null;
};

module.exports = { escapeRegex, isNonEmptyString, sanitizeObject, sanitizeSort, validateStrongPassword };
