import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import {
  blockUserRequest,
  getAdminUsersRequest,
  unblockUserRequest,
  unverifyUserRequest,
  verifyUserRequest,
} from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  const load = async () => {
    try {
      const response = await getAdminUsersRequest();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load users");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const mutate = async (action, successMessage) => {
    try {
      await action();
      toast.success(successMessage);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Admin users"
        title="Moderate accounts and trust status"
        description="Review verification, blocking state, roles, wallet condition, and move into deeper detail pages when needed."
      />

      <SectionPanel>
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mode</th>
                <th>Verified</th>
                <th>Wallet</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry._id}>
                  <td>
                    <Link className="link-accent" to={`/app/admin/users/${entry._id}`}>
                      {entry.Name}
                    </Link>
                  </td>
                  <td>{entry.activeMode}</td>
                  <td>{entry.verified ? "Yes" : "No"}</td>
                  <td>{entry.wallet?.balance ?? 0}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          mutate(
                            () =>
                              entry.verified
                                ? unverifyUserRequest(entry._id)
                                : verifyUserRequest(entry._id),
                            entry.verified ? "User unverified" : "User verified",
                          )
                        }
                      >
                        {entry.verified ? "Unverify" : "Verify"}
                      </button>
                      <button
                        className="btn btn-xs"
                        onClick={() =>
                          mutate(
                            () =>
                              entry.isBlocked
                                ? unblockUserRequest(entry._id)
                                : blockUserRequest(entry._id),
                            entry.isBlocked ? "User unblocked" : "User blocked",
                          )
                        }
                      >
                        {entry.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </MotionPage>
  );
}
