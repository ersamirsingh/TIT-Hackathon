import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAppController } from "../../controllers/AppController.jsx";
import MotionPage from "../components/MotionPage.jsx";
import { InputField, SelectField } from "../components/FormField.jsx";
import BrowserLocationField from "../components/BrowserLocationField.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAppController();
  const [form, setForm] = useState({
    Name: "",
    emailId: "",
    password: "",
    confirmPassword: "",
    contact: "",
    preferredLanguage: "Hindi",
    activeMode: "customer",
    upiId: "",
    locationText: "",
  });
  const [coordinates, setCoordinates] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!form.Name || !form.emailId || !form.contact || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        ...form,
        location: coordinates,
        languages: [form.preferredLanguage],
        workerProfile: {
          categories: [],
          languages: [form.preferredLanguage],
        },
      });
      navigate(
        user.role === "admin"
          ? "/app/admin/overview"
          : user.activeMode === "worker"
            ? "/app/worker/feed"
            : "/app/customer/dashboard",
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionPage className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="panel-warm rounded-[2.5rem] p-8 md:p-12">
          <p className="section-label">Create a new identity</p>
          <h1 className="display-font mt-4 text-5xl leading-tight text-base-100">
            Open one account, then switch between customer and karigar workflows.
          </h1>
          <p className="mt-5 text-base leading-8 text-base-content/68">
            Start in whichever mode you need today. The app lets you flip between finding
            workers and working as one.
          </p>
        </section>

        <section className="glass-panel rounded-[2.5rem] p-8 md:p-10">
          <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="md:col-span-2">
              <p className="section-label">Registration</p>
              <h2 className="mt-3 text-3xl font-semibold text-base-100">
                Set up your Karigar profile
              </h2>
            </div>

            <InputField
              label="Full name"
              value={form.Name}
              onChange={(event) =>
                setForm((current) => ({ ...current, Name: event.target.value }))
              }
              required
            />
            <InputField
              label="Phone"
              value={form.contact}
              onChange={(event) =>
                setForm((current) => ({ ...current, contact: event.target.value }))
              }
              required
            />
            <div className="md:col-span-2">
              <InputField
                label="Email"
                type="email"
                value={form.emailId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, emailId: event.target.value }))
                }
                required
              />
            </div>

            <div className="relative flex flex-col space-y-3">
              <span className="text-sm font-medium text-base-content/80">Password</span>
              <div className="relative w-full">
                <input
                  className="k-input pr-10"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="relative flex flex-col space-y-3">
              <span className="text-sm font-medium text-base-content/80">Confirm Password</span>
              <div className="relative w-full">
                <input
                  className="k-input pr-10"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <InputField
              label="UPI ID"
              placeholder="name@bank"
              value={form.upiId}
              onChange={(event) =>
                setForm((current) => ({ ...current, upiId: event.target.value }))
              }
            />

            <InputField
              label="Location label / Address"
              placeholder="e.g. Indiranagar, Bengaluru"
              value={form.locationText}
              onChange={(event) =>
                setForm((current) => ({ ...current, locationText: event.target.value }))
              }
            />

            <SelectField
              label="Preferred language"
              value={form.preferredLanguage}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  preferredLanguage: event.target.value,
                }))
              }
            >
              {["Hindi", "English", "Urdu", "Telugu", "Bengali", "Bhojpuri", "Marathi"].map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Role"
              value={form.activeMode}
              onChange={(event) =>
                setForm((current) => ({ ...current, activeMode: event.target.value }))
              }
            >
              <option value="customer">Customer (Employer)</option>
              <option value="worker">Karigar (Worker)</option>
            </SelectField>

            <div className="md:col-span-2">
              <BrowserLocationField
                label="GPS Location"
                value={coordinates}
                onChange={setCoordinates}
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <button className="k-btn w-full" disabled={submitting} type="submit">
                {submitting ? "Creating account..." : "Create account"}
              </button>
              <p className="text-sm text-base-content/60">
                Already have an account?{" "}
                <Link className="link-accent" to="/login">
                  Sign in instead
                </Link>
              </p>
            </div>
          </form>
        </section>
      </div>
    </MotionPage>
  );
}
