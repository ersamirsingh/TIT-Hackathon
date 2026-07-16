import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAdminUserDetailsRequest } from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import DetailGrid from "../../components/DetailGrid.jsx";

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getAdminUserDetailsRequest(userId);
        setUser(response.data.user);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load user");
      }
    };

    load();
  }, [userId]);

  if (!user) {
    return null;
  }

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="User detail"
        title={user.Name}
        description="Account identity, mode, wallet, and worker profile details."
      />
      <SectionPanel>
        <DetailGrid
          items={[
            { label: "Email", value: user.emailId },
            { label: "Contact", value: user.contact },
            { label: "Role", value: user.role },
            { label: "Active mode", value: user.activeMode },
            { label: "Verified", value: user.verified ? "Yes" : "No" },
            { label: "Wallet balance", value: user.wallet?.balance ?? 0 },
            { label: "Coins", value: user.coins ?? 0 },
            { label: "Location", value: user.locationText || "Not set" },
          ]}
        />
      </SectionPanel>
    </MotionPage>
  );
}
