import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, ShieldCheck } from "lucide-react";
import {
  getWalletSummaryRequest,
  getWalletTransactionsRequest,
  rechargeWalletRequest,
} from "../../../models/wallet.model.js";
import { useAppController } from "../../../controllers/AppController.jsx";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import MetricCard from "../../components/MetricCard.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import { InputField } from "../../components/FormField.jsx";
import { formatCurrency, formatDateTime } from "../../../models/format.model.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function WalletPage() {
  const { refreshSession } = useAppController();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ amount: "", upiReference: "", upiApp: "PhonePe" });

  const load = async () => {
    try {
      const [summaryResponse, transactionsResponse] = await Promise.all([
        getWalletSummaryRequest(),
        getWalletTransactionsRequest(),
      ]);
      setSummary(summaryResponse.data);
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load wallet data");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rechargeWallet = async (event) => {
    event.preventDefault();
    try {
      await rechargeWalletRequest(form);
      await refreshSession({ silent: true });
      toast.success("Wallet recharged");
      setForm({ amount: "", upiReference: "", upiApp: "PhonePe" });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Recharge failed");
    }
  };

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Wallet"
        title="Keep your lead engine funded"
        description="Monitor the negative wallet balance, see debits and auto-refunds, and recharge through UPI before you hit the platform credit wall."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Balance"
          value={formatCurrency(summary?.wallet?.balance || 0)}
          hint="Current negative or positive wallet state"
          icon={CreditCard}
        />
        <MetricCard
          label="Credit limit"
          value={formatCurrency(summary?.wallet?.creditLimit || -200)}
          hint="At this point new jobs get blocked"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Coins"
          value={summary?.coins || 0}
          hint="Customer cashback that keeps future bookings in-app"
          icon={ArrowUpCircle}
        />
        <MetricCard
          label="Subscription"
          value={summary?.subscription?.status || "inactive"}
          hint="Verified Pro visibility window"
          icon={ArrowDownCircle}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <SectionPanel warm>
          <p className="section-label">UPI recharge</p>
          <h2 className="mt-2 text-2xl text-base-100">Top up your wallet</h2>
          <form className="mt-6 space-y-4" onSubmit={rechargeWallet}>
            <InputField
              label="Amount"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
            />
            <InputField
              label="UPI reference"
              value={form.upiReference}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  upiReference: event.target.value,
                }))
              }
            />
            <InputField
              label="UPI app"
              value={form.upiApp}
              onChange={(event) =>
                setForm((current) => ({ ...current, upiApp: event.target.value }))
              }
            />
            <button className="k-btn w-full" type="submit">
              Recharge now
            </button>
          </form>
        </SectionPanel>

        <SectionPanel>
          <div className="mb-5">
            <p className="section-label">Transactions</p>
            <h2 className="mt-2 text-2xl text-base-100">Wallet ledger</h2>
          </div>

          {transactions.length ? (
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td>{transaction.type}</td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>{transaction.description}</td>
                      <td>{formatDateTime(transaction.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No wallet activity yet"
              copy="Lead fees, refunds, boosts, subscriptions, and UPI top-ups will appear here."
            />
          )}
        </SectionPanel>
      </div>
    </MotionPage>
  );
}
