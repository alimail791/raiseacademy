// Tells the YNeet backend to grant or remove a student's institute access right
// away (server-to-server, shared INTERNAL_SERVICE_KEY). Best-effort: YNeet also
// re-syncs from /api/auth/me on every SSO login, so a failed call here only
// delays the change until the student's next login.
export const syncYneetAccess = async (studentId, institute) => {
  const base = process.env.YNEET_API_URL; // e.g. https://<yneet-backend>/api/v1
  const key = process.env.INTERNAL_SERVICE_KEY;
  if (!base || !key) return false;
  const live = !!institute && institute.status === "active" && institute.endDate > new Date();
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/internal/institute-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-key": key },
      body: JSON.stringify({
        userId: String(studentId),
        active: live,
        endDate: live ? institute.endDate.toISOString() : null,
      }),
    });
    return res.ok;
  } catch (e) {
    console.warn("YNeet institute sync failed:", e.message);
    return false;
  }
};

// What /api/auth/me reports so YNeet can apply the institute plan on login.
export const instituteAccessFor = (institute) =>
  institute && institute.status === "active" && institute.endDate > new Date()
    ? { instituteId: String(institute._id), name: institute.name, endDate: institute.endDate.toISOString() }
    : null;

// Server-to-server read from YNeet (progress data for the institute panel).
export const yneetPost = async (path, body) => {
  const base = process.env.YNEET_API_URL;
  const key = process.env.INTERNAL_SERVICE_KEY;
  if (!base || !key) throw new Error("YNeet connection is not configured");
  const res = await fetch(`${base.replace(/\/$/, "")}/internal/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `YNeet returned ${res.status}`);
  return data;
};
