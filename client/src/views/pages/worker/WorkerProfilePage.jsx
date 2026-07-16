import { useState } from "react";
import toast from "react-hot-toast";
import { Star, ShieldCheck, MapPin, Compass, Briefcase, Wifi, Award } from "lucide-react";
import { useAppController } from "../../../controllers/AppController.jsx";
import {
  purchaseVerifiedProRequest,
  updateAvailabilityRequest,
  updateWorkerProfileRequest,
} from "../../../models/worker.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import { InputField, TextAreaField } from "../../components/FormField.jsx";
import BrowserLocationField from "../../components/BrowserLocationField.jsx";
import { formatDate } from "../../../models/format.model.js";

const CATEGORY_LIST = ["Electrical", "Plumbing", "AC Repair", "Cleaning", "Carpentry", "Painting", "General"];
const LANGUAGE_LIST = ["Hindi", "English", "Urdu", "Telugu", "Bengali", "Bhojpuri", "Marathi"];

export default function WorkerProfilePage() {
  const { user, refreshSession } = useAppController();
  const [profileForm, setProfileForm] = useState({
    headline: user?.workerProfile?.headline || "",
    about: user?.workerProfile?.about || "",
    categories: user?.workerProfile?.categories || [],
    languages: user?.workerProfile?.languages || [user?.preferredLanguage || "Hindi"],
    yearsExperience: user?.workerProfile?.yearsExperience || 0,
  });
  const [availabilityForm, setAvailabilityForm] = useState({
    isAvailable: Boolean(user?.workerProfile?.isAvailable),
    serviceRadiusKm: user?.workerProfile?.serviceRadiusKm || 5,
    coordinates: null,
    locationText: user?.locationText || "",
  });

  const toggleCategory = (cat) => {
    setProfileForm((prev) => {
      const exists = prev.categories.includes(cat);
      const categories = exists
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories };
    });
  };

  const toggleLanguage = (lang) => {
    setProfileForm((prev) => {
      const exists = prev.languages.includes(lang);
      const languages = exists
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages };
    });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await updateWorkerProfileRequest({
        headline: profileForm.headline,
        about: profileForm.about,
        categories: profileForm.categories,
        languages: profileForm.languages,
        yearsExperience: Number(profileForm.yearsExperience),
        serviceRadiusKm: Number(availabilityForm.serviceRadiusKm),
      });
      await refreshSession({ silent: true });
      toast.success("Worker profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update worker profile");
    }
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    try {
      await updateAvailabilityRequest({
        isAvailable: availabilityForm.isAvailable,
        serviceRadiusKm: Number(availabilityForm.serviceRadiusKm),
        coordinates: availabilityForm.coordinates || undefined,
        locationText: availabilityForm.locationText,
      });
      await refreshSession({ silent: true });
      toast.success("Availability and dispatch updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update availability");
    }
  };

  const activateVerifiedPro = async () => {
    try {
      await purchaseVerifiedProRequest();
      await refreshSession({ silent: true });
      toast.success("Verified Pro activated! Blue check badge unlocked.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not activate Verified Pro");
    }
  };

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Worker settings"
        title="Sharpen your worker profile"
        description="Tune your categories, radius, live availability, and premium subscription state so the dispatch engine surfaces you first."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionPanel>
          <form className="grid gap-5 md:grid-cols-2" onSubmit={saveProfile}>
            <div className="md:col-span-2 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-warning" />
              <h2 className="text-xl text-base-100 font-bold">Public Worker Presentation</h2>
            </div>
            
            <div className="md:col-span-2">
              <InputField
                label="Headline"
                placeholder="e.g. Expert electrician with 5+ years of experience"
                value={profileForm.headline}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, headline: event.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="About Me"
                placeholder="Tell customers about your skills, tools, and background..."
                value={profileForm.about}
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, about: event.target.value }))
                }
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-base-content/70">Categories / Skills</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_LIST.map((cat) => {
                  const selected = profileForm.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        selected
                          ? "border-warning bg-warning/10 text-warning"
                          : "border-white/6 bg-white/3 text-base-content/70 hover:bg-white/5"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-base-content/70">Languages Spoken</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_LIST.map((lang) => {
                  const selected = profileForm.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        selected
                          ? "border-warning bg-warning/10 text-warning"
                          : "border-white/6 bg-white/3 text-base-content/70 hover:bg-white/5"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <InputField
                label="Years of experience"
                type="number"
                value={profileForm.yearsExperience}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    yearsExperience: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <button className="k-btn w-full" type="submit">
                Save worker profile
              </button>
            </div>
          </form>
        </SectionPanel>

        <div className="space-y-6">
          <SectionPanel warm>
            <form className="space-y-4" onSubmit={saveAvailability}>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-warning" />
                <h2 className="text-xl text-base-100 font-bold">Live Dispatch Settings</h2>
              </div>
              
              <div className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-base-100 block">Open for jobs right now</span>
                  <span className="text-xs text-base-content/50 block mt-0.5">Toggle availability on map feed</span>
                </div>
                <input
                  checked={availabilityForm.isAvailable}
                  className="toggle toggle-warning"
                  type="checkbox"
                  onChange={(event) =>
                    setAvailabilityForm((current) => ({
                      ...current,
                      isAvailable: event.target.checked,
                    }))
                  }
                />
              </div>

              <InputField
                label="Service radius (km)"
                type="number"
                value={availabilityForm.serviceRadiusKm}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
                    ...current,
                    serviceRadiusKm: event.target.value,
                  }))
                }
              />
              <BrowserLocationField
                label="Worker live location"
                description="Share your current location from the browser so the matching engine can place you in nearby emergency searches."
                value={availabilityForm.coordinates}
                onChange={(coordinates) =>
                  setAvailabilityForm((current) => ({ ...current, coordinates }))
                }
              />
              <InputField
                label="Location label"
                value={availabilityForm.locationText}
                onChange={(event) =>
                  setAvailabilityForm((current) => ({
                    ...current,
                    locationText: event.target.value,
                  }))
                }
              />
              <button className="k-btn w-full" type="submit">
                Save availability
              </button>
            </form>
          </SectionPanel>

          <SectionPanel>
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-warning" />
              <h2 className="text-xl text-base-100 font-bold">Verified Pro</h2>
            </div>
            {user?.subscription?.status === "active" ? (
              <div className="rounded-2xl bg-gradient-to-r from-warning/20 to-amber-500/20 border border-warning/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-warning">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-bold text-sm">Verified Pro Active ⚡</span>
                </div>
                <p className="text-xs text-base-content/80 leading-5">
                  Your premium benefits are fully unlocked. You get a 10-second early access window on all new job opportunities, search rank prioritization, and a verified badge.
                </p>
                <p className="text-[10px] text-base-content/50 uppercase tracking-wider block mt-2">
                  Expires: {user.subscription.expiresAt ? formatDate(user.subscription.expiresAt) : "Never (Simulated)"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-base-content/65">
                  Pay ₹149/month to unlock a blue check, get a 10-second head start on new jobs,
                  and stand out before free workers even see the request.
                </p>
                <button className="k-btn w-full" onClick={activateVerifiedPro}>
                  Activate Verified Pro (₹149/mo)
                </button>
              </div>
            )}
          </SectionPanel>

          <SectionPanel>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-warning" />
              <h2 className="text-xl text-base-100 font-bold">Reviews & Ratings</h2>
            </div>
            <div className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4 mb-4">
              <p className="text-sm text-base-content/60">Average rating</p>
              <p className="mt-2 text-3xl font-black text-base-100">
                {Number(user?.rating || 0).toFixed(1)} / 5
              </p>
              <p className="mt-1 text-xs text-base-content/50">
                {user?.ratingCount || 0} total reviews
              </p>
            </div>

            <div className="space-y-4">
              {(user?.workerProfile?.recentReviews || []).length ? (
                user.workerProfile.recentReviews.map((review) => (
                  <div
                    key={review._id || `${review.jobId}-${review.createdAt}`}
                    className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base text-base-100 font-semibold">{review.reviewerName || "Customer"}</p>
                      <p className="text-sm text-warning font-semibold">{review.rating}/5</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-base-content/65">
                      {review.review || "No written review for this job."}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-base-content/40">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4 text-xs leading-5 text-base-content/60">
                  Reviews from completed jobs will appear here once customers confirm work and leave feedback.
                </div>
              )}
            </div>
          </SectionPanel>
        </div>
      </div>
    </MotionPage>
  );
}
