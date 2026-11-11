import { supabase } from "../../lib/supabaseClient";

const SETTINGS_COLUMNS = `
  id,
  user_id,
  pin_hash,
  pin_salt,
  enabled,
  app_locked,
  daily_limit_minutes,
  lock_on_limit,
  limit_override_until,
  created_at,
  updated_at
`;

const RESTRICTION_COLUMNS = `
  id,
  user_id,
  feature_key,
  restricted,
  created_at,
  updated_at
`;

const CONTACT_COLUMNS = `
  id,
  user_id,
  name,
  phone,
  email,
  created_at
`;

/**
 * Fetch the current parental lock configuration.
 */
export async function fetchLockSettings(
  userId,
) {
  assertUserId(userId);

  const { data, error } =
    await supabase
      .from(
        "parental_lock_settings",
      )
      .select(SETTINGS_COLUMNS)
      .eq("user_id", userId)
      .maybeSingle();

  if (error) {
    throw normalizeError(
      error,
      "fetchLockSettings",
    );
  }

  return data;
}

/**
 * Create or update parental lock settings.
 */
export async function upsertLockSettings({
  userId,
  enabled,
  appLocked,
  dailyLimitMinutes,
  lockOnLimit,
  pinHash,
  pinSalt,
  limitOverrideUntil,
}) {
  assertUserId(userId);

  const payload = {
    user_id: userId,
    enabled: Boolean(enabled),
    app_locked: Boolean(appLocked),
    daily_limit_minutes:
      Number(dailyLimitMinutes) || null,
    lock_on_limit: Boolean(lockOnLimit),
    limit_override_until:
      limitOverrideUntil ?? null,
    updated_at:
      new Date().toISOString(),
  };

  if (pinHash !== undefined) {
    payload.pin_hash =
      pinHash || null;
  }

  if (pinSalt !== undefined) {
    payload.pin_salt =
      pinSalt || null;
  }

  const { data, error } =
    await supabase
      .from(
        "parental_lock_settings",
      )
      .upsert(payload, {
        onConflict: "user_id",
      })
      .select(SETTINGS_COLUMNS)
      .single();

  if (error) {
    throw normalizeError(
      error,
      "upsertLockSettings",
    );
  }

  return data;
}

/**
 * Fetch feature restrictions.
 */
export async function fetchRestrictions(
  userId,
) {
  assertUserId(userId);

  const { data, error } =
    await supabase
      .from("feature_restrictions")
      .select(RESTRICTION_COLUMNS)
      .eq("user_id", userId)
      .order("feature_key", {
        ascending: true,
      });

  if (error) {
    throw normalizeError(
      error,
      "fetchRestrictions",
    );
  }

  return data ?? [];
}

/**
 * Create/update a feature restriction.
 */
export async function setFeatureRestriction({
  userId,
  featureKey,
  restricted,
}) {
  assertUserId(userId);

  if (!featureKey) {
    throw new Error(
      "Feature key is required.",
    );
  }

  const { data, error } =
    await supabase
      .from("feature_restrictions")
      .upsert(
        {
          user_id: userId,
          feature_key: featureKey,
          restricted: Boolean(
            restricted,
          ),
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "user_id,feature_key",
        },
      )
      .select(RESTRICTION_COLUMNS)
      .single();

  if (error) {
    throw normalizeError(
      error,
      "setFeatureRestriction",
    );
  }

  return data;
}

/**
 * Fetch emergency contacts.
 */
export async function fetchEmergencyContacts(
  userId,
) {
  assertUserId(userId);

  const { data, error } =
    await supabase
      .from("emergency_contacts")
      .select(CONTACT_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    throw normalizeError(
      error,
      "fetchEmergencyContacts",
    );
  }

  return data ?? [];
}

/**
 * Add an emergency contact.
 */
export async function addEmergencyContact({
  userId,
  name,
  phone,
  email,
}) {
  assertUserId(userId);

  if (!name?.trim()) {
    throw new Error(
      "Contact name is required.",
    );
  }

  if (!phone?.trim() && !email?.trim()) {
    throw new Error(
      "Phone or email is required.",
    );
  }

  const { data, error } =
    await supabase
      .from("emergency_contacts")
      .insert({
        user_id: userId,
        name: name.trim(),
        phone:
          phone?.trim() || null,
        email:
          email?.trim() || null,
      })
      .select(CONTACT_COLUMNS)
      .single();

  if (error) {
    throw normalizeError(
      error,
      "addEmergencyContact",
    );
  }

  return data;
}

/**
 * Delete an emergency contact.
 */
export async function deleteEmergencyContact({
  userId,
  contactId,
}) {
  assertUserId(userId);

  const { error } =
    await supabase
      .from("emergency_contacts")
      .delete()
      .eq("id", contactId)
      .eq("user_id", userId);

  if (error) {
    throw normalizeError(
      error,
      "deleteEmergencyContact",
    );
  }
}

/**
 * Create a cryptographically random salt.
 */
export function createPinSalt() {
  if (
    typeof crypto === "undefined" ||
    !crypto.getRandomValues
  ) {
    throw new Error(
      "Secure browser cryptography is unavailable.",
    );
  }

  const bytes =
    new Uint8Array(16);

  crypto.getRandomValues(bytes);

  return bytesToHex(bytes);
}

/**
 * Hash a PIN using PBKDF2.
 *
 * The browser never stores the plaintext PIN.
 */
export async function hashPin(
  pin,
  salt,
) {
  if (!pin || !salt) {
    throw new Error(
      "PIN and salt are required.",
    );
  }

  if (
    typeof crypto === "undefined" ||
    !crypto.subtle
  ) {
    throw new Error(
      "Secure browser cryptography is unavailable.",
    );
  }

  const encoder =
    new TextEncoder();

  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

  const derivedBits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: hexToBytes(salt),
        iterations: 120_000,
        hash: "SHA-256",
      },
      keyMaterial,
      256,
    );

  return bytesToHex(
    new Uint8Array(derivedBits),
  );
}

/**
 * Verify a PIN against a stored hash.
 */
export async function verifyPin(
  pin,
  salt,
  expectedHash,
) {
  if (
    !pin ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const calculatedHash =
    await hashPin(
      pin,
      salt,
    );

  return constantTimeEqual(
    calculatedHash,
    expectedHash,
  );
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

function hexToBytes(hex) {
  if (
    typeof hex !== "string" ||
    hex.length % 2 !== 0
  ) {
    throw new Error(
      "Invalid cryptographic salt.",
    );
  }

  const bytes =
    new Uint8Array(
      hex.length / 2,
    );

  for (
    let index = 0;
    index < bytes.length;
    index += 1
  ) {
    bytes[index] =
      Number.parseInt(
        hex.slice(
          index * 2,
          index * 2 + 2,
        ),
        16,
      );
  }

  return bytes;
}

function constantTimeEqual(
  left,
  right,
) {
  if (
    typeof left !== "string" ||
    typeof right !== "string" ||
    left.length !== right.length
  ) {
    return false;
  }

  let result = 0;

  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {
    result |=
      left.charCodeAt(index) ^
      right.charCodeAt(index);
  }

  return result === 0;
}

function assertUserId(userId) {
  if (!userId) {
    throw new Error(
      "Authenticated user is required.",
    );
  }
}

function normalizeError(
  error,
  operation,
) {
  const normalized =
    new Error(
      error?.message ||
        `Parental lock operation failed: ${operation}`,
    );

  normalized.code =
    error?.code;

  normalized.details =
    error?.details;

  normalized.hint =
    error?.hint;

  normalized.operation =
    operation;

  return normalized;
}