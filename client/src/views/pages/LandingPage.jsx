import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Mic,
  Radar,
  Shield,
  Wallet,
} from "lucide-react";
import MotionPage from "../components/MotionPage.jsx";
import SectionPanel from "../components/SectionPanel.jsx";

const features = [
  {
    icon: Mic,
    title: "Voice-first dispatch",
    copy:
      "Explain the problem in Hindi, Bhojpuri, or your local language. The app carries voice notes all the way into matching and quotes.",
  },
  {
    icon: Radar,
    title: "Blinkit-speed matching",
    copy:
      "Broadcast urgent repairs to verified nearby workers with GPS-aware matching and Rocket Mode priority dispatch.",
  },
  {
    icon: Wallet,
    title: "Negative wallet economy",
    copy:
      "Workers pay only when they are selected. Lead fees debit on selection, auto-refund on ghosting, and recharge is managed in-app.",
  },
  {
    icon: Shield,
    title: "Trust, timers, warranty",
    copy:
      "Trust fee, SOS coverage, 2-hour dispute lock, 7-day Karigar warranty, and coin rewards keep every booking inside the platform.",
  },
];

export default function LandingPage() {
  return (
    <MotionPage className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 md:px-8">
      <header className="flex items-center justify-between py-4">
        <div>
          <p className="section-label">Karigar</p>
          <h1 className="display-font text-2xl text-base-100">Premium local repair dispatch</h1>
        </div>
        <div className="flex gap-3">
          <Link className="k-btn-ghost" to="/login">
            Login
          </Link>
          <Link className="k-btn" to="/register">
            Create account
          </Link>
        </div>
      </header>

      <section className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hero-veil rounded-[2.5rem] p-8 md:p-12"
          >
            <p className="section-label">Trust-led service commerce</p>
            <div className="mt-6 max-w-4xl space-y-5">
              <h2 className="display-font text-5xl leading-[1.04] text-base-100 md:text-7xl">
                One dark-glass console for booking karigars and winning local jobs.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-base-content/68 md:text-lg">
                Customers switch into Find a Worker mode. Workers flip into Work as a Karigar.
                Voice notes, instant dispatch, negative wallets, Rocket Mode, verified pros,
                warranty timers, and wallet-led retention all live in one premium flow.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="k-btn" to="/register">
                Launch the workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="k-btn-ghost" to="/login">
                Explore live dashboards
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              "₹15 trust fee with SOS and verified ID tracking",
              "₹20 lead fee deducted only after worker selection",
              "7-day warranty activated after auto-close or customer confirmation",
            ].map((item) => (
              <div key={item} className="glass-panel rounded-[1.5rem] px-5 py-5 text-sm leading-7">
                {item}
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="panel-warm rounded-[2.5rem] p-6 md:p-8"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-label">Dispatch rhythm</p>
                <h3 className="mt-2 text-2xl text-base-100">Subtle dark, built for action</h3>
              </div>
              <BadgeCheck className="h-10 w-10 text-warning" />
            </div>

            <div className="space-y-4">
              {[
                "Nearby verified workers are pinged inside a GPS radius for emergency fixes.",
                "Profile boosts and Verified Pro subscriptions prioritize stronger workers.",
                "Tracking screens can carry hyper-local hardware store advertising.",
                "Cross-sell suggestions appear right after a repair closes.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4 text-sm leading-7"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
          >
            <SectionPanel className="h-full">
              <feature.icon className="h-7 w-7 text-warning" />
              <h3 className="mt-5 text-xl font-semibold text-base-100">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-base-content/65">{feature.copy}</p>
            </SectionPanel>
          </motion.div>
        ))}
      </section>
    </MotionPage>
  );
}
