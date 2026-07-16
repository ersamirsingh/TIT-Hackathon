import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAppController } from "../../controllers/AppController.jsx";
import MotionPage from "../../views/components/MotionPage.jsx";
import { InputField } from "../../views/components/FormField.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAppController();
  const [form, setForm] = useState({ emailId: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form);
      const nextPath =
        location.state?.from?.pathname ||
        (user.role === "admin"
          ? "/app/admin/overview"
          : user.activeMode === "worker"
            ? "/app/worker/feed"
            : "/app/employer/dashboard");
      navigate(nextPath, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionPage className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_0.78fr]">
        <section className="hero-veil rounded-[2.5rem] p-8 md:p-12">
          <p className="section-label">Return to dispatch</p>
          <h1 className="display-font mt-4 text-5xl leading-tight text-base-100 md:text-6xl">
            Sign in to manage jobs, wallets, dispatch timing, and trust flows.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-base-content/68">
            Customers, workers, and admins all share one workspace. The UI adapts the moment
            your session loads.
          </p>
        </section>

        <section className="glass-panel rounded-[2.5rem] p-8 md:p-10">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <p className="section-label">Login</p>
              <h2 className="mt-3 text-3xl font-semibold text-base-100">Welcome back</h2>
            </div>

            <InputField
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.emailId}
              onChange={(event) =>
                setForm((current) => ({ ...current, emailId: event.target.value }))
              }
            />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-base-content/80">Password</span>
              <div className="relative">
                <input
                  className="k-input pr-12 w-full"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <button className="k-btn w-full" disabled={submitting} type="submit">
              {submitting ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-sm text-base-content/60">
              New here?{" "}
              <Link className="link-accent" to="/register">
                Create your account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </MotionPage>
  );
}
