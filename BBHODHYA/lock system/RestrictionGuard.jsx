import {
  useParentalLockContext,
} from "./ParentalLockProvider";

export default function RestrictionGuard({
  feature,
  children,
  fallback,
}) {
  const {
    isFeatureRestricted,
  } =
    useParentalLockContext();

  const restricted =
    isFeatureRestricted(
      feature,
    );

  if (!restricted) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <section className="flex min-h-[300px] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl">
          🔒
        </div>

        <h2 className="text-xl font-semibold">
          Feature Restricted
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          This feature has been
          restricted by a parent or
          guardian.
        </p>
      </div>
    </section>
  );
}