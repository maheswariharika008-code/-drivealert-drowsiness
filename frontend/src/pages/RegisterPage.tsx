import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthShell, FieldError, inputClass } from "./AuthShell";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  vehicleNumber: string;
}

export function RegisterPage() {
  const { register: registerDriver } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await registerDriver({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        vehicleNumber: data.vehicleNumber,
      });
      navigate("/dashboard");
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setServerError(apiErrors.map((e: any) => e.msg).join(" "));
      } else {
        setServerError(err?.response?.data?.message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Register as a driver to enable monitoring.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm text-cockpit-textMuted">Full name</label>
          <input className={inputClass} placeholder="Jane Doe" {...register("name", { required: "Name is required" })} />
          <FieldError message={errors.name?.message} />
        </div>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-cockpit-textMuted">Phone number</label>
            <input className={inputClass} placeholder="+91 98765 43210" {...register("phone", { required: "Phone is required" })} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div>
            <label className="text-sm text-cockpit-textMuted">Vehicle number</label>
            <input className={inputClass} placeholder="TS09AB1234" {...register("vehicleNumber", { required: "Vehicle number is required" })} />
            <FieldError message={errors.vehicleNumber?.message} />
          </div>
        </div>
        <div>
          <label className="text-sm text-cockpit-textMuted">Password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="At least 8 characters"
            {...register("password", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <label className="text-sm text-cockpit-textMuted">Confirm password</label>
          <input
            type="password"
            className={inputClass}
            placeholder="Re-enter password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) => value === watch("password") || "Passwords do not match",
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="text-sm text-cockpit-textMuted mt-5 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-safe hover:brightness-110">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
