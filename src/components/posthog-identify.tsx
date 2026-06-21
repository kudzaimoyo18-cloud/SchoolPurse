"use client";

import * as React from "react";
import { identifyUser } from "@/lib/analytics";

// Mounted in the dashboard layout so every signed-in session is identified in
// PostHog (who they are + which school/role).
export function PostHogIdentify({
  id,
  email,
  role,
  schoolName,
}: {
  id: string;
  email: string;
  role: string;
  schoolName: string | null;
}) {
  React.useEffect(() => {
    identifyUser(id, { email, role, school: schoolName });
  }, [id, email, role, schoolName]);

  return null;
}
