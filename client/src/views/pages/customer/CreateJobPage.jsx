import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createJobRequest } from "../../../models/job.model.js";
import { uploadMediaRequest } from "../../../models/media.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import { InputField, SelectField, TextAreaField } from "../../components/FormField.jsx";
import BrowserLocationField from "../../components/BrowserLocationField.jsx";
import VoiceComposerField from "../../components/VoiceComposerField.jsx";
import SingleMediaUploadField from "../../components/SingleMediaUploadField.jsx";

const categories = ["General", "Electrical", "Plumbing", "Painting", "Cleaning", "Appliance", "Carpentry", "Other"];
const standardServices = [
  ["fan-installation", "Fan Installation", "Electrical"],
  ["switchboard-repair", "Switchboard Repair", "Electrical"],
  ["tap-replacement", "Tap Replacement", "Plumbing"],
  ["pipe-leak-fix", "Pipe Leak Fix", "Plumbing"],
  ["ac-service-basic", "AC Service (Basic)", "Appliance"],
  ["deep-cleaning-room", "Deep Cleaning (1 Room)", "Cleaning"],
  ["door-lock-repair", "Door Lock Repair", "Carpentry"],
];

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    locationText: "",
    address: "",
    skills: "inspection, urgent response",
    pricingModel: "inspection",
    serviceCode: "",
    rocketMode: false,
    voiceTranscript: "",
    language: "Hindi",
    coordinates: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [contextFile, setContextFile] = useState(null);

  const onCategoryChange = (cat) => {
    setForm((current) => {
      const firstService = standardServices.find(([_, __, c]) => c === cat);
      return {
        ...current,
        category: cat,
        serviceCode: current.pricingModel === "standard" && firstService ? firstService[0] : "",
      };
    });
  };

  const onPricingModelChange = (model) => {
    setForm((current) => {
      const firstService = standardServices.find(([_, __, c]) => c === current.category);
      return {
        ...current,
        pricingModel: model,
        serviceCode: model === "standard" && firstService ? firstService[0] : "",
      };
    });
  };

  const onServiceCodeChange = (code) => {
    setForm((current) => {
      const service = standardServices.find(([val]) => val === code);
      return {
        ...current,
        serviceCode: code,
        ...(service ? { category: service[2] } : {}),
      };
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    if (form.pricingModel === "standard" && !form.serviceCode) {
      toast.error("Please select a standard service for fixed-price jobs");
      setSubmitting(false);
      return;
    }
    try {
      const response = await createJobRequest({
        title: form.title,
        description: form.description,
        category: form.category,
        locationText: form.locationText,
        address: form.address,
        pricingModel: form.pricingModel,
        serviceCode: form.pricingModel === "standard" ? form.serviceCode : "",
        rocketMode: form.rocketMode,
        skills: form.skills
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        voiceInput: {
          transcript: form.voiceTranscript,
          language: form.language,
          speakerRole: "customer",
        },
        coordinates: form.coordinates || undefined,
      });

      const createdJob = response.data.job;

      if (contextFile) {
        await uploadMediaRequest(createdJob._id, {
          file: contextFile,
          stage: "customer_context",
        });
      }

      toast.success(
        contextFile ? "Job created with context media" : "Job created and broadcast",
      );
      navigate(`/app/customer/jobs/${createdJob._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Create booking"
        title="Turn a repair request into a live nearby broadcast"
        description="Choose fixed pricing or inspection-first booking, add your voice note transcript, and optionally enable Rocket Mode for emergency dispatch."
      />

      <SectionPanel className="max-w-5xl">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          <InputField
            label="Job title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>

          <div className="md:col-span-2">
            <TextAreaField
              label="Problem description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </div>

          <InputField
            label="Location label"
            value={form.locationText}
            onChange={(event) =>
              setForm((current) => ({ ...current, locationText: event.target.value }))
            }
          />
          <InputField
            label="Address"
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
          />

          <div className="md:col-span-2">
            <BrowserLocationField
              label="Dispatch location"
              description="Capture your current location so nearby verified workers can be matched automatically. If you skip this, we fall back to any saved profile location."
              value={form.coordinates}
              onChange={(coordinates) =>
                setForm((current) => ({ ...current, coordinates }))
              }
            />
          </div>

          <SelectField
            label="Pricing model"
            value={form.pricingModel}
            onChange={(event) => onPricingModelChange(event.target.value)}
          >
            <option value="inspection">Inspection-first</option>
            <option value="standard">Standard rate card</option>
          </SelectField>

          <SelectField
            label="Standard service"
            disabled={form.pricingModel !== "standard"}
            value={form.serviceCode}
            onChange={(event) => onServiceCodeChange(event.target.value)}
          >
            <option value="">Select a service</option>
            {standardServices
              .filter(([_, __, cat]) => form.category === "General" || form.category === cat)
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </SelectField>

          <div className="md:col-span-2">
            <InputField
              label="Skills needed"
              value={form.skills}
              onChange={(event) =>
                setForm((current) => ({ ...current, skills: event.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2 grid gap-5 md:grid-cols-[1fr_220px]">
            <VoiceComposerField
              label="Voice transcript"
              value={form.voiceTranscript}
              language={form.language}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  voiceTranscript: value,
                  description: !current.description || current.description === current.voiceTranscript ? value : current.description
                }))
              }
            />
            <SelectField
              label="Voice language"
              value={form.language}
              onChange={(event) =>
                setForm((current) => ({ ...current, language: event.target.value }))
              }
            >
              {["Hindi", "English", "Urdu", "Telugu", "Bengali", "Bhojpuri", "Marathi"].map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="md:col-span-2">
            <SingleMediaUploadField
              label="Problem image or video"
              helperText="Upload one image or video so workers can understand the condition of the job before they accept it."
              file={contextFile}
              onChange={setContextFile}
            />
          </div>

          <div className="md:col-span-2 rounded-[1.5rem] border border-white/6 bg-white/3 px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-medium text-base-100">Enable Rocket Mode</p>
                <p className="mt-1 text-sm text-base-content/60">
                  Add the emergency siren so nearby workers see this request first.
                </p>
              </div>
              <input
                id="rocket-mode-toggle"
                checked={form.rocketMode}
                className="toggle toggle-warning"
                type="checkbox"
                onChange={(event) =>
                  setForm((current) => ({ ...current, rocketMode: event.target.checked }))
                }
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <button className="k-btn" disabled={submitting} type="submit">
              {submitting ? "Broadcasting..." : "Create and broadcast job"}
            </button>
          </div>
        </form>
      </SectionPanel>
    </MotionPage>
  );
}
