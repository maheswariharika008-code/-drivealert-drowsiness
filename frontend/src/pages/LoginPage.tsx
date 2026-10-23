import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, FieldError, inputClass } from "./AuthShell";

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to start your monitored driving session.">
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
        <div>
          <label className="text-sm text-cockpit-textMuted">Password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="••••••••"
            {...register("password", { required: "Password is required" })}
          />
          <FieldError message={errors.password?.message} />
        </div>
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-safe text-cockpit-bg font-semibold hover:brightness-110 transition disabled:opacity-50"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="flex items-center justify-between mt-5 text-sm">
        <Link to="/forgot-password" className="text-cockpit-textMuted hover:text-safe">
          Forgot password?
        </Link>
        <Link to="/register" className="text-safe hover:brightness-110">
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
