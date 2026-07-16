import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Phone, ArrowLeft, Send, HelpCircle } from "lucide-react";
import { useAppController } from "../../controllers/AppController.jsx";
import { submitContactQueryRequest } from "../../models/auth.model.js";
import MotionPage from "../components/MotionPage.jsx";
import SectionPanel from "../components/SectionPanel.jsx";
import { InputField, TextAreaField } from "../components/FormField.jsx";

export default function ContactPage() {
  const { user } = useAppController();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.Name || "",
    email: user?.emailId || "",
    phone: user?.contact || "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await submitContactQueryRequest(form);
      toast.success("Query submitted successfully!");
      setForm((prev) => ({
        ...prev,
        subject: "",
        message: "",
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit query");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionPage className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-base-content/60 hover:text-base-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <Link to="/" className="text-xl font-black text-warning tracking-wider">
          KARIGAR
        </Link>
      </div>

      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-base-100 sm:text-5xl">
          Contact Support & Queries
        </h1>
        <p className="max-w-xl mx-auto text-base text-base-content/60 leading-7">
          Have an issue with a booking, wallet recharge, or general feedback? Submit a query and our team will resolve it.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1.3fr] items-start">
        {/* Info panel */}
        <div className="space-y-6">
          <SectionPanel warm className="space-y-6">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-warning" />
              <h2 className="text-lg font-bold text-base-100">Contact Details</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-base-content/40">Email Us</p>
                  <a href="mailto:ersamirsingh@gmail.com" className="text-sm font-semibold text-base-100 hover:text-warning transition">
                    ersamirsingh@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-base-content/40">Call Us</p>
                  <a href="tel:7979079272" className="text-sm font-semibold text-base-100 hover:text-warning transition">
                    7979079272
                  </a>
                </div>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel>
            <h3 className="font-semibold text-base-100">Helpful tips</h3>
            <p className="mt-2 text-xs text-base-content/50 leading-5">
              • Inquiries are tracked in real-time by system admins.
              <br />
              • Include order or booking details in the message to help us verify disputes faster.
              <br />
              • Support is active 24/7.
            </p>
          </SectionPanel>
        </div>

        {/* Contact Form */}
        <SectionPanel>
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Your Name"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <InputField
                label="Contact Number"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <InputField
              label="Subject / Topic"
              placeholder="e.g. Wallet recharge not showing"
              value={form.subject}
              onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
            <TextAreaField
              label="Message / Details"
              placeholder="Describe your issue or query in detail..."
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              required
            />

            <button
              type="submit"
              className="k-btn w-full flex items-center justify-center gap-2 font-semibold"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </SectionPanel>
      </div>
    </MotionPage>
  );
}
