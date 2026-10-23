import { useForm } from "react-hook-form";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as authApi from "../api/authApi";
import { inputClass } from "./AuthShell";

interface ProfileForm {
  name: string;
  phone: string;
  vehicleNumber: string;
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      vehicleNumber: user?.vehicleNumber || "",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setMessage(null);
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    setMessage("Profile updated.");
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-1">Profile</h1>
      <p className="text-sm text-cockpit-textMuted mb-6">Manage your driver details.</p>

      <div className="glass-panel p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-safe/15 border border-safe/30 flex items-center justify-center text-2xl font-display font-bold text-safe">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-sm text-cockpit-textMuted">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm text-cockpit-textMuted">Full name</label>
            <input className={inputClass} {...register("name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-cockpit-textMuted">Phone number</label>
              <input className={inputClass} {...register("phone")} />
            </div>
            <div>
              <label className="text-sm text-cockpit-textMuted">Vehicle number</label>
              <input className={inputClass} {...register("vehicleNumber")} />
            </div>
          </div>
          {message && <p className="text-sm text-safe">{message}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="px-6 py-2.5 rounded-xl bg-safe text-cockpit-bg font-semibold hover:brightness-110 transition disabled:opacity-40"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
