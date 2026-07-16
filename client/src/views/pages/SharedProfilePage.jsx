import { useState } from "react";
import toast from "react-hot-toast";
import { Compass, Languages, MapPin, Wallet } from "lucide-react";
import { useAppController } from "../../controllers/AppController.jsx";
import MotionPage from "../components/MotionPage.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SectionPanel from "../components/SectionPanel.jsx";
import { InputField, SelectField, TextAreaField } from "../components/FormField.jsx";
import BrowserLocationField from "../components/BrowserLocationField.jsx";

export default function SharedProfilePage() {
  const { user, updateLocation, updateProfile } = useAppController();
  const [profileForm, setProfileForm] = useState({
    Name: user?.Name || "",
    contact: user?.contact || "",
    preferredLanguage: user?.preferredLanguage || "Hindi",
    upiId: user?.upiId || "",
    locationText: user?.locationText || "",
    skills: (user?.skills || []).join(", "),
    workerHeadline: user?.workerProfile?.headline || "",
    workerAbout: user?.workerProfile?.about || "",
    coordinates: null,
  });

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await updateProfile({
        Name: profileForm.Name,
        contact: profileForm.contact,
        preferredLanguage: profileForm.preferredLanguage,
        languages: [profileForm.preferredLanguage],
        upiId: profileForm.upiId,
        locationText: profileForm.locationText,
        skills: profileForm.skills
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        workerProfile: {
          headline: profileForm.workerHeadline,
          about: profileForm.workerAbout,
        },
      });

      if (profileForm.coordinates) {
        await updateLocation({
          coordinates: profileForm.coordinates,
          locationText: profileForm.locationText,
        });
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
    }
  };

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Identity"
        title="Profile, language, and location"
        description="Keep your personal details fresh so job discovery, wallet recharges, and trust flows stay accurate across both customer and worker modes."
      />

      <form className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]" onSubmit={saveProfile}>
        <SectionPanel>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2 flex items-center gap-3">
              <Languages className="h-5 w-5 text-warning" />
              <h2 className="text-xl text-base-100">Core profile</h2>
            </div>
            <InputField
              label="Name"
              value={profileForm.Name}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, Name: event.target.value }))
              }
            />
            <InputField
              label="Phone"
              value={profileForm.contact}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, contact: event.target.value }))
              }
            />
            <SelectField
              label="Preferred language"
              value={profileForm.preferredLanguage}
              onChange={(event) =>
                setProfileForm((current) => ({
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
            <InputField
              label="UPI ID"
              value={profileForm.upiId}
              onChange={(event) =>
                setProfileForm((current) => ({ ...current, upiId: event.target.value }))
              }
            />
            <div className="md:col-span-2">
              <InputField
                label="Location label"
                value={profileForm.locationText}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    locationText: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <InputField
                label="Skills"
                value={profileForm.skills}
                placeholder="Electrical, Plumbing, AC, Cleaning"
                onChange={(event) =>
                  setProfileForm((current) => ({ ...current, skills: event.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <InputField
                label="Worker headline"
                value={profileForm.workerHeadline}
                placeholder="Reliable electrician for same-day fixes"
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    workerHeadline: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <TextAreaField
                label="Worker about"
                value={profileForm.workerAbout}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    workerAbout: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <button className="k-btn w-full" type="submit">
                Save profile
              </button>
            </div>
          </div>
        </SectionPanel>

        <div className="space-y-6">
          <SectionPanel warm>
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-warning" />
              <h2 className="text-xl text-base-100">GPS sync</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-base-content/65">
              Sync your location once from the browser so nearby matching and dispatch can work
              without forcing you to type coordinates. Location coordinates are saved only when you click "Save profile".
            </p>
            <div className="mt-6">
              <BrowserLocationField
                label="Profile location"
                description="Use your current browser location for faster matching."
                value={profileForm.coordinates}
                onChange={async (coordinates) => {
                  setProfileForm((current) => ({ ...current, coordinates }));
                  try {
                    await updateLocation({
                      coordinates,
                      locationText: profileForm.locationText,
                    });
                    toast.success("Coordinates captured and saved to database!");
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to save coordinates");
                  }
                }}
              />
            </div>
          </SectionPanel>

          <SectionPanel>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-warning" />
                <h3 className="text-lg text-base-100">Current identity snapshot</h3>
              </div>
              <div className="space-y-3 text-sm leading-7 text-base-content/70">
                <p>
                  <span className="text-base-content/45">Mode:</span> {user?.activeMode}
                </p>
                <p>
                  <span className="text-base-content/45">Wallet:</span>{" "}
                  {user?.wallet?.balance ?? 0}
                </p>
                <p>
                  <span className="text-base-content/45">Language:</span>{" "}
                  {user?.preferredLanguage}
                </p>
                <p>
                  <span className="text-base-content/45">Location:</span>{" "}
                  {user?.locationText || "Not set"}
                </p>
              </div>
            </div>
          </SectionPanel>
        </div>
      </form>
    </MotionPage>
  );
}
