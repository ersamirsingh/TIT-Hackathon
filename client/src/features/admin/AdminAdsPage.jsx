import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createAdRequest, getAdsRequest, toggleAdRequest } from "../../models/admin.model.js";
import MotionPage from "../../views/components/MotionPage.jsx";
import PageHeader from "../../views/components/PageHeader.jsx";
import SectionPanel from "../../views/components/SectionPanel.jsx";
import { InputField, SelectField } from "../../views/components/FormField.jsx";
import { formatDate } from "../../models/format.model.js";
import BrowserLocationField from "../../views/components/BrowserLocationField.jsx";

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

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionPanel warm>
          <form className="space-y-4" onSubmit={createAd}>
            <InputField
              label="Ad Title"
              placeholder="e.g. 20% Off Electrical Fixes"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
            <InputField
              label="Business Name"
              placeholder="e.g. QuickFix Services"
              value={form.businessName}
              onChange={(event) =>
                setForm((current) => ({ ...current, businessName: event.target.value }))
              }
              required
            />
            <SelectField
              label="Category"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
            >
              {["General", "Electrical", "Plumbing", "Appliance", "Cleaning", "Carpentry", "Painting", "Other"].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </SelectField>
            <InputField
              label="CTA Text"
              placeholder="e.g. View Offer"
              value={form.ctaText}
              onChange={(event) =>
                setForm((current) => ({ ...current, ctaText: event.target.value }))
              }
            />
            <InputField
              label="CTA Link"
              placeholder="e.g. https://example.com/promo"
              value={form.ctaLink}
              onChange={(event) =>
                setForm((current) => ({ ...current, ctaLink: event.target.value }))
              }
            />
            <InputField
              label="Banner Image URL"
              placeholder="e.g. https://example.com/banner.jpg"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
            />
            <BrowserLocationField
              label="Target Location (Optional)"
              description="Capture the current browser location if this ad should target one local area. Leave empty to target broadly."
              value={form.coordinates}
              onChange={(coordinates) =>
                setForm((current) => ({ ...current, coordinates }))
              }
            />
            <button className="k-btn w-full" type="submit">
              Create Ad Banner
            </button>
          </form>
        </SectionPanel>

        <SectionPanel>
          <h2 className="text-xl font-bold text-base-100 mb-6">Sponsored Inventory ({ads.length})</h2>
          
          <div className="space-y-5">
            {ads.map((ad) => (
              <div
                key={ad._id}
                className="rounded-[1.6rem] border border-white/6 bg-[#0c1017] p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
              >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  {ad.imageUrl && (
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title} 
                      className="w-16 h-16 object-cover rounded-xl border border-white/10 shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest text-warning font-semibold bg-warning/10 px-2 py-0.5 rounded-full">
                      {ad.category}
                    </span>
                    <h3 className="text-lg font-bold text-base-100 mt-1">{ad.title}</h3>
                    <p className="text-sm text-base-content/70">{ad.businessName}</p>
                    <p className="text-xs text-base-content/40">
                      Created {formatDate(ad.createdAt)}
                    </p>
                    {ad.ctaLink && (
                      <a 
                        href={ad.ctaLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-warning hover:underline inline-block pt-1"
                      >
                        {ad.ctaText || "View Offer"} &rarr;
                      </a>
                    )}
                  </div>
                </div>

                <button
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap ${
                    ad.isActive
                      ? "border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : "border-white/10 bg-white/3 text-base-content/65 hover:bg-white/5"
                  }`}
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
                  {ad.isActive ? "Pause Ad" : "Activate Ad"}
                </button>
              </div>
            ))}

            {ads.length === 0 && (
              <div className="py-12 text-center text-sm text-base-content/50 border border-white/5 rounded-2xl bg-white/2">
                No sponsored ads registered. Use the builder on the left to add one!
              </div>
            )}
          </div>
        </SectionPanel>
      </div>
    </MotionPage>
  );
}
