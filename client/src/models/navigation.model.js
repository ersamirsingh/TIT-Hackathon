import {
  BriefcaseBusiness,
  FileSearch,
  Home,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wallet,
  Wrench,
  HelpCircle,
} from "lucide-react";

export const customerNavItems = [
  {
    label: "Customer Desk",
    to: "/app/customer/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Post a Job",
    to: "/app/customer/new-job",
    icon: BriefcaseBusiness,
  },
  {
    label: "Profile",
    to: "/app/profile",
    icon: Settings,
  },
  {
    label: "Contact Support",
    to: "/app/contact",
    icon: HelpCircle,
  },
];

export const workerNavItems = [
  {
    label: "Explore Jobs",
    to: "/app/worker/feed",
    icon: Home,
  },
  {
    label: "Worker Profile",
    to: "/app/worker/profile",
    icon: Wrench,
  },
  {
    label: "Wallet",
    to: "/app/worker/wallet",
    icon: Wallet,
  },
  {
    label: "Profile",
    to: "/app/profile",
    icon: Settings,
  },
  {
    label: "Contact Support",
    to: "/app/contact",
    icon: HelpCircle,
  },
];

export const adminNavItems = [
  {
    label: "Overview",
    to: "/app/admin/overview",
    icon: ShieldCheck,
  },
  {
    label: "Users",
    to: "/app/admin/users",
    icon: Home,
  },
  {
    label: "Jobs",
    to: "/app/admin/jobs",
    icon: BriefcaseBusiness,
  },
  {
    label: "Disputes",
    to: "/app/admin/disputes",
    icon: FileSearch,
  },
  {
    label: "Ads",
    to: "/app/admin/ads",
    icon: LayoutDashboard,
  },
  {
    label: "Contact Support",
    to: "/app/contact",
    icon: HelpCircle,
  },
];
