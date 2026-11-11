import {
  useEffect,
  useState,
} from "react";

import {
  DAILY_LIMIT_OPTIONS,
  LOCK_CONFIG,
  RESTRICTABLE_FEATURES,
} from "./lockConfig";

import {
  useParentalLockContext,
} from "./ParentalLockProvider";

export default function ParentalLockPanel() {
  const {
    settings,
    restrictions,
    emergencyContacts,
    saving,
    error,
    dailyLimitMinutes,
    saveSettings,
    toggleFeature,
    lockNow,
    addContact,
    removeContact,
  } =
    useParentalLockContext();

  const [enabled, setEnabled] =
    useState(
      Boolean(settings?.enabled),
    );

  const [limitMinutes, setLimitMinutes] =
    useState(
      dailyLimitMinutes ||
        LOCK_CONFIG.DEFAULT_DAILY_LIMIT_MINUTES,
    );

  const [lockOnLimit, setLockOnLimit] =
    useState(
      settings?.lock_on_limit ??
        true,
    );

  const [pin, setPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [contactName, setContactName] =
    useState("");

  const [contactPhone, setContactPhone] =
    useState("");

  const [contactEmail, setContactEmail] =
    useState("");

  useEffect(() => {
    if (!settings) {
      return;
    }

    setEnabled(
      Boolean(settings.enabled),
    );

    setLimitMinutes(
      settings.daily_limit_minutes ||
        LOCK_CONFIG.DEFAULT_DAILY_LIMIT_MINUTES,
    );

    setLockOnLimit(
      settings.lock_on_limit ??
        true,
    );
  }, [settings]);

  const handleSave =
    async (event) => {
      event.preventDefault();

      setSaveMessage("");

      if (
        pin &&
        pin !== confirmPin
      ) {
        setSaveMessage(
          "PIN confirmation does not match.",
        );
        return;
      }

      if (
        enabled &&
        !settings?.pin_hash &&
        !pin
      ) {
        setSaveMessage(
          "Please create a parent PIN.",
        );
        return;
      }

      try {
        await saveSettings({
          enabled,
          dailyLimitMinutes:
            limitMinutes,
          lockOnLimit,
          pin:
            pin || undefined,
          appLocked: false,
        });

        setPin("");
        setConfirmPin("");

        setSaveMessage(
          "Parental control settings saved.",
        );
      } catch (saveError) {
        setSaveMessage(
          saveError.message ||
            "Unable to save settings.",
        );
      }
    };

  const handleAddContact =
    async (event) => {
      event.preventDefault();

      if (!contactName.trim()) {
        return;
      }

      try {
        await addContact({
          name: contactName,
          phone: contactPhone,
          email: contactEmail,
        });

        setContactName("");
        setContactPhone("");
        setContactEmail("");
      } catch (contactError) {
        setSaveMessage(
          contactError.message ||
            "Unable to add contact.",
        );
      }
    };

  const isRestricted =
    (featureKey) =>
      restrictions.some(
        (restriction) =>
          restriction.feature_key ===
            featureKey &&
          restriction.restricted,
      );

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header>
        <p className="text-sm font-medium text-gray-500">
          Parental Controls
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Usage & Access Control
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Control daily Bodhya usage and
          restrict selected learning
          features.
        </p>
      </header>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold">
            Daily Usage Limit
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose whether Bodhya should
            automatically lock after a
            daily active-use limit.
          </p>

          <div className="mt-5 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-gray-50">
              <input
                type="radio"
                name="usage-limit"
                checked={!enabled}
                onChange={() =>
                  setEnabled(false)
                }
                className="mt-1"
              />

              <span>
                <span className="block font-medium">
                  No daily limit
                </span>

                <span className="mt-1 block text-sm text-gray-500">
                  Allow unlimited Bodhya
                  usage.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition hover:bg-gray-50">
              <input
                type="radio"
                name="usage-limit"
                checked={enabled}
                onChange={() =>
                  setEnabled(true)
                }
                className="mt-1"
              />

              <span className="flex-1">
                <span className="block font-medium">
                  Yes, set a daily limit
                </span>

                <span className="mt-1 block text-sm text-gray-500">
                  Lock Bodhya when the active
                  usage limit is reached.
                </span>
              </span>
            </label>
          </div>
        </div>

        {enabled ? (
          <div className="space-y-5 border-b py-6">
            <div>
              <label
                htmlFor="daily-limit"
                className="block text-sm font-medium"
              >
                Daily active-use limit
              </label>

              <select
                id="daily-limit"
                value={limitMinutes}
                onChange={(event) =>
                  setLimitMinutes(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-gray-900"
              >
                {DAILY_LIMIT_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4">
              <span>
                <span className="block font-medium">
                  Lock when limit is reached
                </span>

                <span className="mt-1 block text-sm text-gray-500">
                  Only active usage counts
                  toward the limit.
                </span>
              </span>

              <input
                type="checkbox"
                checked={lockOnLimit}
                onChange={(event) =>
                  setLockOnLimit(
                    event.target.checked,
                  )
                }
                className="h-5 w-5"
              />
            </label>
          </div>
        ) : null}

        <div className="border-b py-6">
          <h2 className="text-lg font-semibold">
            Parent PIN
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            The PIN is required to unlock
            Bodhya after a lock is triggered.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(event) =>
                setPin(
                  event.target.value.replace(
                    /\D/g,
                    "",
                  ),
                )
              }
              placeholder={
                settings?.pin_hash
                  ? "New PIN (optional)"
                  : "Create PIN"
              }
              className="rounded-xl border px-4 py-3 outline-none focus:border-gray-900"
            />

            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(event) =>
                setConfirmPin(
                  event.target.value.replace(
                    /\D/g,
                    "",
                  ),
                )
              }
              placeholder="Confirm PIN"
              className="rounded-xl border px-4 py-3 outline-none focus:border-gray-900"
            />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Use {LOCK_CONFIG.PIN_MIN_LENGTH}–
            {LOCK_CONFIG.PIN_MAX_LENGTH} digits.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gray-900 px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </button>

          {settings?.enabled ? (
            <button
              type="button"
              onClick={() =>
                void lockNow()
              }
              className="rounded-xl border px-5 py-3 font-medium transition hover:bg-gray-50"
            >
              Lock Now
            </button>
          ) : null}
        </div>

        {saveMessage ? (
          <p className="mt-4 text-sm text-gray-600">
            {saveMessage}
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-sm text-red-600">
            {error.message}
          </p>
        ) : null}
      </form>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Feature Restrictions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose individual features that
            should remain unavailable.
          </p>
        </div>

        <div className="space-y-3">
          {RESTRICTABLE_FEATURES.map(
            (feature) => (
              <label
                key={feature.key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 hover:bg-gray-50"
              >
                <span>
                  <span className="block font-medium">
                    {feature.label}
                  </span>

                  <span className="mt-1 block text-sm text-gray-500">
                    {feature.description}
                  </span>
                </span>

                <input
                  type="checkbox"
                  checked={isRestricted(
                    feature.key,
                  )}
                  onChange={(event) =>
                    void toggleFeature(
                      feature.key,
                      event.target
                        .checked,
                    )
                  }
                  className="h-5 w-5"
                />
              </label>
            ),
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Emergency Contacts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Contacts remain available from
            the lock screen.
          </p>
        </div>

        <form
          onSubmit={handleAddContact}
          className="grid gap-3 sm:grid-cols-2"
        >
          <input
            value={contactName}
            onChange={(event) =>
              setContactName(
                event.target.value,
              )
            }
            placeholder="Contact name"
            className="rounded-xl border px-4 py-3 outline-none focus:border-gray-900"
          />

          <input
            value={contactPhone}
            onChange={(event) =>
              setContactPhone(
                event.target.value,
              )
            }
            placeholder="Phone"
            className="rounded-xl border px-4 py-3 outline-none focus:border-gray-900"
          />

          <input
            value={contactEmail}
            onChange={(event) =>
              setContactEmail(
                event.target.value,
              )
            }
            placeholder="Email"
            className="rounded-xl border px-4 py-3 outline-none focus:border-gray-900 sm:col-span-2"
          />

          <button
            type="submit"
            className="rounded-xl border px-4 py-3 font-medium transition hover:bg-gray-50 sm:col-span-2"
          >
            Add Contact
          </button>
        </form>

        {emergencyContacts.length >
        0 ? (
          <div className="mt-5 space-y-3">
            {emergencyContacts.map(
              (contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-medium">
                      {contact.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {contact.phone ||
                        contact.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void removeContact(
                        contact.id,
                      )
                    }
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ),
            )}
          </div>
        ) : null}
      </section>
    </section>
  );
}