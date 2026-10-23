import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useState } from "react";
import * as authApi from "../api/authApi";
import { AuthShell, FieldError, inputClass } from "./AuthShell";

interface ForgotForm {
  email: string;
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    setServerError(null);
    setMessage(null);
    try {
      const msg = await authApi.forgotPassword(data.email);
      setMessage(msg);
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
      {message ? (
        <div className="text-center py-4">
          <p className="text-safe text-sm mb-4">{message}</p>
          <Link to="/login" className="text-sm text-cockpit-textMuted hover:text-safe">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm text-cockpit-textMuted">Email</label>
            <input
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
            />
            <FieldError message={errors.email?.message} />
          </div>
          {serverError && <p className="text-sm text-danger">{serverError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-safe text-cockpit-bg font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
          <p className="text-sm text-cockpit-textMuted text-center">
            <Link to="/login" className="hover:text-safe">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
