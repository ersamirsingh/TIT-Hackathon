import {
  BriefcaseBusiness,
  FileSearch,
  Home,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wallet,
  Wrench,
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
];

export const workerNavItems = [
  {
    label: "Worker Feed",
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
];
