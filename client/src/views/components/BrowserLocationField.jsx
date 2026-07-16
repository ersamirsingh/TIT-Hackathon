import { useState } from "react";
import { Crosshair, MapPin, Radar, RefreshCw } from "lucide-react";
import { getBrowserCoordinates } from "../../models/location.model.js";

const formatCoordinate = (value) =>
  Number.isFinite(Number(value)) ? Number(value).toFixed(5) : "Not captured";

export default function BrowserLocationField({
  label = "Live location",
  description = "Use your browser to capture your current coordinates automatically.",
  value,
  onChange,
}) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");

  const captureLocation = async () => {
    setCapturing(true);
    setError("");

    try {
      const coordinates = await getBrowserCoordinates();
      onChange?.(coordinates);
    } catch (captureError) {
      setError(captureError.message || "Could not fetch your current location.");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="rounded-[1.4rem] border border-white/6 bg-white/3 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-warning" />
            <p className="text-sm font-medium text-base-100">{label}</p>
          </div>
          <p className="text-sm leading-6 text-base-content/60">{description}</p>
        </div>
        <button
          className={value?.lat && value?.lng ? "k-btn-ghost" : "k-btn"}
          disabled={capturing}
          type="button"
          onClick={captureLocation}
        >
          {capturing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4" />
              {value?.lat && value?.lng ? "Refresh location" : "Use current location"}
            </>
          )}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/6 bg-black/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-base-content/40">Latitude</p>
          <p className="mt-2 text-sm text-base-100">{formatCoordinate(value?.lat)}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-base-content/40">Longitude</p>
          <p className="mt-2 text-sm text-base-100">{formatCoordinate(value?.lng)}</p>
        </div>
        <div className="rounded-2xl border border-white/6 bg-black/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-base-content/40">Accuracy</p>
          <p className="mt-2 text-sm text-base-100">
            {Number.isFinite(Number(value?.accuracy))
              ? `${Math.round(Number(value.accuracy))} m`
              : "Pending"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs leading-6 text-base-content/52">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        <p>
          We use browser GPS when available. If permission is denied, you can still continue with
          a location label and save coordinates later.
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </div>
  );
}
