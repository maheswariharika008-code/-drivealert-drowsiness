import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import * as authApi from "../api/authApi";
import { AuthShell, FieldError, inputClass } from "./AuthShell";

interface ResetForm {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>();

  const onSubmit = async (data: ResetForm) => {
    setServerError(null);
    if (!token) {
      setServerError("Missing or invalid reset link.");
      return;
    }
    try {
      await authApi.resetPassword(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Reset failed. Please request a new link.");
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for your account.">
      {success ? (
        <p className="text-safe text-sm text-center py-4">
          Password reset successfully. Redirecting to sign in…
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!token && (
            <p className="text-sm text-danger">
              No reset token found in the link.{" "}
              <Link to="/forgot-password" className="underline">
                Request a new one
              </Link>
              .
            </p>
          )}
          <div>
            <label className="text-sm text-cockpit-textMuted">New password</label>
            <input
              type="password"
              className={inputClass}
              placeholder="At least 8 characters"
              {...register("newPassword", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })}
            />
            <FieldError message={errors.newPassword?.message} />
          </div>
          <div>
            <label className="text-sm text-cockpit-textMuted">Confirm new password</label>
            <input
              type="password"
              className={inputClass}
              placeholder="Re-enter password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) => value === watch("newPassword") || "Passwords do not match",
              })}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </div>
          {serverError && <p className="text-sm text-danger">{serverError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-safe text-cockpit-bg font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            {isSubmitting ? "Resetting…" : "Reset password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
