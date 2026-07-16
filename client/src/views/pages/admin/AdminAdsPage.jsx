import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createAdRequest, getAdsRequest, toggleAdRequest } from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import { InputField } from "../../components/FormField.jsx";
import { formatDate } from "../../../models/format.model.js";
import BrowserLocationField from "../../components/BrowserLocationField.jsx";

export default function AdminAdsPage() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState({
    title: "",
    businessName: "",
    category: "General",
    ctaText: "View Offer",
    ctaLink: "",
    imageUrl: "",
    coordinates: null,
  });

  const load = async () => {
    try {
      const response = await getAdsRequest();
      setAds(response.data.ads || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load ads");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createAd = async (event) => {
    event.preventDefault();
    try {
      await createAdRequest({
        title: form.title,
        businessName: form.businessName,
        category: form.category,
        ctaText: form.ctaText,
        ctaLink: form.ctaLink,
        imageUrl: form.imageUrl,
        coordinates: form.coordinates || undefined,
      });
      toast.success("Ad created");
      setForm({
        title: "",
        businessName: "",
        category: "General",
        ctaText: "View Offer",
        ctaLink: "",
        imageUrl: "",
        coordinates: null,
      });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create ad");
    }
  };

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Admin ads"
        title="Manage hyper-local banner inventory"
        description="Create and toggle sponsored units for tracking screens, with optional browser-captured targeting coordinates."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionPanel warm>
          <form className="space-y-4" onSubmit={createAd}>
            <InputField
              label="Title"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <InputField
              label="Business name"
              value={form.businessName}
              onChange={(event) =>
                setForm((current) => ({ ...current, businessName: event.target.value }))
              }
            />
            <InputField
              label="Category"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
            />
            <InputField
              label="CTA text"
              value={form.ctaText}
              onChange={(event) =>
                setForm((current) => ({ ...current, ctaText: event.target.value }))
              }
            />
            <InputField
              label="CTA link"
              value={form.ctaLink}
              onChange={(event) =>
                setForm((current) => ({ ...current, ctaLink: event.target.value }))
              }
            />
            <InputField
              label="Image URL"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
            />
            <BrowserLocationField
              label="Target location"
              description="Capture the current browser location if this ad should target one local area. Leave it empty to keep the ad broadly usable."
              value={form.coordinates}
              onChange={(coordinates) =>
                setForm((current) => ({ ...current, coordinates }))
              }
            />
            <button className="k-btn w-full" type="submit">
              Create ad
            </button>
          </form>
        </SectionPanel>

        <SectionPanel>
          <div className="grid gap-4">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="rounded-[1.6rem] border border-white/6 bg-white/3 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                      {ad.category}
                    </p>
                    <h3 className="mt-2 text-xl text-base-100">{ad.title}</h3>
                    <p className="mt-1 text-sm text-base-content/60">{ad.businessName}</p>
                    <p className="mt-2 text-xs text-base-content/45">
                      Created {formatDate(ad.createdAt)}
                    </p>
                  </div>
                  <button
                    className="k-btn-ghost"
                    onClick={async () => {
                      try {
                        await toggleAdRequest(ad._id);
                        toast.success("Ad status updated");
                        await load();
                      } catch (error) {
                        toast.error(error.response?.data?.message || "Toggle failed");
                      }
                    }}
                  >
                    {ad.isActive ? "Pause" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>
    </MotionPage>
  );
}
