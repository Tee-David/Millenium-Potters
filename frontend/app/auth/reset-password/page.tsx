import React, { Suspense } from "react";
import ResetPasswordPage from "./reset-password-page";

export default function ResetPasswordWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
