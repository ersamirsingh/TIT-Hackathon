import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppController } from "../../controllers/AppController.jsx";
import MotionPage from "../components/MotionPage.jsx";
import { InputField, SelectField } from "../components/FormField.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAppController();
  const [form, setForm] = useState({
    Name: "",
    emailId: "",
    password: "",
    contact: "",
    preferredLanguage: "Hindi",
    activeMode: "customer",
    upiId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await register({
        ...form,
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
            />
            <InputField
              label="Phone"
              value={form.contact}
              onChange={(event) =>
                setForm((current) => ({ ...current, contact: event.target.value }))
              }
            />
            <div className="md:col-span-2">
              <InputField
                label="Email"
                type="email"
                value={form.emailId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, emailId: event.target.value }))
                }
              />
            </div>
            <InputField
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
            <InputField
              label="UPI ID"
              placeholder="name@bank"
              value={form.upiId}
              onChange={(event) =>
                setForm((current) => ({ ...current, upiId: event.target.value }))
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
              {["Hindi", "Bhojpuri", "English", "Marathi", "Bengali"].map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Start in mode"
              value={form.activeMode}
              onChange={(event) =>
                setForm((current) => ({ ...current, activeMode: event.target.value }))
              }
            >
              <option value="customer">Find a Worker</option>
              <option value="worker">Work as a Karigar</option>
            </SelectField>

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
