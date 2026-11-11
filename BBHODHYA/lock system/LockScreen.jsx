import {
  useState,
} from "react";

import {
  LOCK_MESSAGES,
} from "./lockConfig";

import {
  useParentalLockContext,
} from "./ParentalLockProvider";

export default function LockScreen() {
  const {
    limitReached,
    manuallyLocked,
    dailyLimitMinutes,
    remainingSeconds,
    unlockWithPin,
    emergencyContacts,
  } =
    useParentalLockContext();

  const [pin, setPin] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [unlocking, setUnlocking] =
    useState(false);

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!pin) {
        setMessage(
          LOCK_MESSAGES.PIN_REQUIRED,
        );
        return;
      }

      setUnlocking(true);
      setMessage("");

      const result =
        await unlockWithPin(pin);

      setUnlocking(false);

      if (!result.success) {
        setMessage(
          result.message,
        );
        setPin("");
        return;
      }

      setMessage(
        result.message,
      );
      setPin("");
    };

  const minutesRemaining =
    remainingSeconds !== null
      ? Math.ceil(
          remainingSeconds / 60,
        )
      : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
            🔒
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Bodhya is Locked
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {limitReached
              ? `The daily usage limit of ${dailyLimitMinutes} minutes has been reached.`
              : manuallyLocked
                ? "A parent or guardian has locked the application."
                : "Parent authorization is required to continue."}
          </p>
        </div>

        {limitReached &&
        minutesRemaining === 0 ? (
          <div className="mb-6 rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-600">
            Daily active usage limit
            reached.
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <label
            htmlFor="parental-lock-pin"
            className="block text-sm font-medium"
          >
            Parent PIN
          </label>

          <input
            id="parental-lock-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
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
            placeholder="Enter PIN"
            className="w-full rounded-xl border px-4 py-3 text-center text-lg tracking-[0.4em] outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
          />

          {message ? (
            <p
              role="alert"
              className="text-center text-sm text-red-600"
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              unlocking ||
              pin.length < 4
            }
            className="w-full rounded-xl bg-gray-900 px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {unlocking
              ? "Verifying..."
              : "Unlock Bodhya"}
          </button>
        </form>

        {emergencyContacts.length >
        0 ? (
          <div className="mt-8 border-t pt-6">
            <p className="mb-3 text-sm font-semibold">
              Emergency Contacts
            </p>

            <div className="space-y-3">
              {emergencyContacts.map(
                (contact) => (
                  <div
                    key={contact.id}
                    className="rounded-xl border p-3"
                  >
                    <p className="font-medium">
                      {contact.name}
                    </p>

                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm text-gray-600 hover:underline"
                      >
                        {contact.phone}
                      </a>
                    ) : null}

                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="block text-sm text-gray-600 hover:underline"
                      >
                        {contact.email}
                      </a>
                    ) : null}
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}