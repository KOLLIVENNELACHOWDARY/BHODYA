import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";

import {
  useTimeTracking,
} from "../time-tracking";

import {
  addEmergencyContact,
  createPinSalt,
  deleteEmergencyContact,
  fetchEmergencyContacts,
  fetchLockSettings,
  fetchRestrictions,
  hashPin,
  setFeatureRestriction,
  upsertLockSettings,
  verifyPin,
} from "./api";

import {
  clampDailyLimit,
  LOCK_CONFIG,
  LOCK_MESSAGES,
} from "./lockConfig";

export function useParentalLock() {
  const { user } = useAuth();

  const {
    stats,
    refreshToday,
  } = useTimeTracking();

  const [settings, setSettings] =
    useState(null);

  const [
    restrictions,
    setRestrictions,
  ] = useState([]);

  const [
    emergencyContacts,
    setEmergencyContacts,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState(null);

  const load = useCallback(
    async () => {
      if (!user?.id) {
        setSettings(null);
        setRestrictions([]);
        setEmergencyContacts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [
          nextSettings,
          nextRestrictions,
          nextContacts,
        ] = await Promise.all([
          fetchLockSettings(
            user.id,
          ),
          fetchRestrictions(
            user.id,
          ),
          fetchEmergencyContacts(
            user.id,
          ),
        ]);

        setSettings(
          nextSettings,
        );

        setRestrictions(
          nextRestrictions,
        );

        setEmergencyContacts(
          nextContacts,
        );

        setError(null);
      } catch (loadError) {
        console.error(
          "[ParentalLock] Failed to load controls.",
          loadError,
        );

        setError(loadError);
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const activeSeconds =
    stats?.activeSeconds ?? 0;

  const dailyLimitMinutes =
    Number(
      settings?.daily_limit_minutes,
    ) || 0;

  const dailyLimitSeconds =
    dailyLimitMinutes * 60;

  const overrideActive =
    Boolean(
      settings?.limit_override_until,
    ) &&
    new Date(
      settings.limit_override_until,
    ).getTime() > Date.now();

  const limitReached =
    Boolean(
      settings?.enabled &&
        settings?.lock_on_limit &&
        dailyLimitMinutes > 0 &&
        activeSeconds >=
          dailyLimitSeconds &&
        !overrideActive,
    );

  const manuallyLocked =
    Boolean(
      settings?.enabled &&
        settings?.app_locked,
    );

  const locked =
    manuallyLocked ||
    limitReached;

  const remainingSeconds =
    dailyLimitSeconds > 0
      ? Math.max(
          0,
          dailyLimitSeconds -
            activeSeconds,
        )
      : null;

  const isFeatureRestricted =
    useCallback(
      (featureKey) => {
        if (!featureKey) {
          return false;
        }

        return restrictions.some(
          (restriction) =>
            restriction.feature_key ===
              featureKey &&
            restriction.restricted,
        );
      },
      [restrictions],
    );

  /**
   * Save the main parental settings.
   */
  const saveSettings =
    useCallback(
      async ({
        enabled,
        dailyLimitMinutes,
        lockOnLimit,
        pin,
        appLocked = false,
      }) => {
        if (!user?.id) {
          throw new Error(
            "You must be authenticated.",
          );
        }

        setSaving(true);

        try {
          let pinHash;
          let pinSalt;

          /*
           * A new PIN is generated only when
           * the user provides one.
           */
          if (pin) {
            if (
              !/^\d+$/.test(pin) ||
              pin.length <
                LOCK_CONFIG.PIN_MIN_LENGTH ||
              pin.length >
                LOCK_CONFIG.PIN_MAX_LENGTH
            ) {
              throw new Error(
                `PIN must contain ${LOCK_CONFIG.PIN_MIN_LENGTH}-${LOCK_CONFIG.PIN_MAX_LENGTH} digits.`,
              );
            }

            pinSalt =
              createPinSalt();

            pinHash =
              await hashPin(
                pin,
                pinSalt,
              );
          }

          const saved =
            await upsertLockSettings({
              userId: user.id,
              enabled,
              appLocked,
              dailyLimitMinutes:
                enabled
                  ? clampDailyLimit(
                      dailyLimitMinutes,
                    )
                  : null,
              lockOnLimit:
                enabled &&
                Boolean(lockOnLimit),
              pinHash,
              pinSalt,
              limitOverrideUntil:
                null,
            });

          setSettings(saved);
          setError(null);

          return saved;
        } catch (saveError) {
          console.error(
            "[ParentalLock] Failed to save settings.",
            saveError,
          );

          setError(saveError);
          throw saveError;
        } finally {
          setSaving(false);
        }
      },
      [user?.id],
    );

  /**
   * Change a feature restriction.
   */
  const toggleFeature =
    useCallback(
      async (
        featureKey,
        restricted,
      ) => {
        if (!user?.id) {
          throw new Error(
            "You must be authenticated.",
          );
        }

        const saved =
          await setFeatureRestriction({
            userId: user.id,
            featureKey,
            restricted,
          });

        setRestrictions(
          (current) => {
            const filtered =
              current.filter(
                (item) =>
                  item.feature_key !==
                  featureKey,
              );

            return [
              ...filtered,
              saved,
            ];
          },
        );

        return saved;
      },
      [user?.id],
    );

  /**
   * Lock the application immediately.
   */
  const lockNow =
    useCallback(async () => {
      if (!settings) {
        return;
      }

      const saved =
        await upsertLockSettings({
          userId: user.id,
          enabled: true,
          appLocked: true,
          dailyLimitMinutes:
            settings.daily_limit_minutes,
          lockOnLimit:
            settings.lock_on_limit,
          limitOverrideUntil: null,
        });

      setSettings(saved);
    }, [
      settings,
      user?.id,
    ]);

  /**
   * Verify parent PIN.
   *
   * If the daily limit has already been reached,
   * a successful PIN verification creates a
   * temporary usage override.
   */
  const unlockWithPin =
    useCallback(
      async (pin) => {
        if (
          !user?.id ||
          !settings
        ) {
          return {
            success: false,
            message:
              LOCK_MESSAGES.PIN_REQUIRED,
          };
        }

        try {
          const valid =
            await verifyPin(
              pin,
              settings.pin_salt,
              settings.pin_hash,
            );

          if (!valid) {
            return {
              success: false,
              message:
                LOCK_MESSAGES.INVALID_PIN,
            };
          }

          const hasReachedLimit =
            limitReached;

          const overrideUntil =
            hasReachedLimit
              ? new Date(
                  Date.now() +
                    LOCK_CONFIG.UNLOCK_DURATION_MINUTES *
                      60_000,
                ).toISOString()
              : null;

          const saved =
            await upsertLockSettings({
              userId: user.id,
              enabled:
                settings.enabled,
              appLocked: false,
              dailyLimitMinutes:
                settings.daily_limit_minutes,
              lockOnLimit:
                settings.lock_on_limit,
              limitOverrideUntil:
                overrideUntil,
            });

          setSettings(saved);

          return {
            success: true,
            message: hasReachedLimit
              ? `Unlocked for ${LOCK_CONFIG.UNLOCK_DURATION_MINUTES} minutes.`
              : "Bodhya unlocked.",
          };
        } catch (unlockError) {
          console.error(
            "[ParentalLock] Unlock failed.",
            unlockError,
          );

          setError(unlockError);

          return {
            success: false,
            message:
              unlockError.message ||
              "Unable to unlock.",
          };
        }
      },
      [
        user?.id,
        settings,
        limitReached,
      ],
    );

  const addContact =
    useCallback(
      async (contact) => {
        const saved =
          await addEmergencyContact({
            userId: user.id,
            ...contact,
          });

        setEmergencyContacts(
          (current) => [
            ...current,
            saved,
          ],
        );

        return saved;
      },
      [user?.id],
    );

  const removeContact =
    useCallback(
      async (contactId) => {
        await deleteEmergencyContact({
          userId: user.id,
          contactId,
        });

        setEmergencyContacts(
          (current) =>
            current.filter(
              (contact) =>
                contact.id !==
                contactId,
            ),
        );
      },
      [user?.id],
    );

  const refresh =
    useCallback(async () => {
      await Promise.all([
        load(),
        refreshToday(),
      ]);
    }, [
      load,
      refreshToday,
    ]);

  const value = useMemo(
    () => ({
      settings,
      restrictions,
      emergencyContacts,

      loading,
      saving,
      error,

      locked,
      manuallyLocked,
      limitReached,

      activeSeconds,
      dailyLimitMinutes,
      dailyLimitSeconds,
      remainingSeconds,

      overrideActive,

      isFeatureRestricted,

      saveSettings,
      toggleFeature,
      lockNow,
      unlockWithPin,

      addContact,
      removeContact,

      refresh,
    }),
    [
      settings,
      restrictions,
      emergencyContacts,
      loading,
      saving,
      error,
      locked,
      manuallyLocked,
      limitReached,
      activeSeconds,
      dailyLimitMinutes,
      dailyLimitSeconds,
      remainingSeconds,
      overrideActive,
      isFeatureRestricted,
      saveSettings,
      toggleFeature,
      lockNow,
      unlockWithPin,
      addContact,
      removeContact,
      refresh,
    ],
  );

  return value;
}