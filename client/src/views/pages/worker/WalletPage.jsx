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
import { InputField, SelectField } from "../../components/FormField.jsx";
import { formatCurrency, formatDateTime } from "../../../models/format.model.js";
import EmptyState from "../../components/EmptyState.jsx";

export default function WalletPage() {
  const { refreshSession } = useAppController();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ amount: "", upiReference: "", upiApp: "PhonePe", paymentMethod: "default" });
  const [checkoutModal, setCheckoutModal] = useState(null); // null, 'stripe', 'razorpay'
  const [processingPayment, setProcessingPayment] = useState(false);
  const [stripeCard, setStripeCard] = useState({ number: "4242 4242 4242 4242", expiry: "12/28", cvc: "123" });
  const [razorpayMethod, setRazorpayMethod] = useState("card");

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
    if (event) event.preventDefault();
    
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (form.paymentMethod === "stripe" && !checkoutModal) {
      setCheckoutModal("stripe");
      return;
    }

    if (form.paymentMethod === "razorpay" && !checkoutModal) {
      setCheckoutModal("razorpay");
      return;
    }

    setProcessingPayment(true);
    try {
      if (form.paymentMethod === "default") {
        await rechargeWalletRequest({
          amount: form.amount,
          upiReference: form.upiReference,
          upiApp: form.upiApp,
          paymentMethod: "default",
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await rechargeWalletRequest({
          amount: form.amount,
          paymentMethod: form.paymentMethod,
        });
      }
      await refreshSession({ silent: true });
      toast.success("Wallet recharged successfully");
      setForm({ amount: "", upiReference: "", upiApp: "PhonePe", paymentMethod: "default" });
      setCheckoutModal(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Recharge failed");
    } finally {
      setProcessingPayment(false);
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
          <p className="section-label">Wallet recharge</p>
          <h2 className="mt-2 text-2xl text-base-100">Top up your wallet</h2>
          <form className="mt-6 space-y-4" onSubmit={rechargeWallet}>
            <InputField
              label="Amount"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({ ...current, amount: event.target.value }))
              }
              required
            />
            <SelectField
              label="Payment gateway / method"
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((current) => ({ ...current, paymentMethod: event.target.value }))
              }
            >
              <option value="default">Default (UPI reference)</option>
              <option value="stripe">Stripe (Simulated card)</option>
              <option value="razorpay">Razorpay (Simulated interface)</option>
            </SelectField>

            {form.paymentMethod === "default" && (
              <>
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
              </>
            )}

            <button className="k-btn w-full font-semibold" type="submit" disabled={processingPayment}>
              {processingPayment ? "Connecting..." : form.paymentMethod === "default" ? "Recharge now" : `Pay with ${form.paymentMethod === "stripe" ? "Stripe" : "Razorpay"}`}
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

      {/* Stripe Simulated Checkout Modal */}
      {checkoutModal === "stripe" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0e121d] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-warning">stripe</span>
                <span className="text-xs uppercase tracking-widest text-base-content/40 bg-white/5 px-2 py-0.5 rounded">Simulated</span>
              </div>
              <button 
                className="text-base-content/50 hover:text-base-content text-xl"
                onClick={() => setCheckoutModal(null)}
                disabled={processingPayment}
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-base-100">Card Payment Details</h3>
              <p className="text-sm text-base-content/60">Amount to charge: <span className="text-warning font-semibold">{formatCurrency(form.amount)}</span></p>
              
              <div className="space-y-3 text-left">
                <InputField
                  label="Card Number"
                  value={stripeCard.number}
                  onChange={(e) => setStripeCard(prev => ({ ...prev, number: e.target.value }))}
                  disabled={processingPayment}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Expires"
                    value={stripeCard.expiry}
                    onChange={(e) => setStripeCard(prev => ({ ...prev, expiry: e.target.value }))}
                    disabled={processingPayment}
                  />
                  <InputField
                    label="CVC"
                    value={stripeCard.cvc}
                    onChange={(e) => setStripeCard(prev => ({ ...prev, cvc: e.target.value }))}
                    disabled={processingPayment}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="button" 
                className="k-btn-ghost w-1/2" 
                onClick={() => setCheckoutModal(null)}
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="k-btn w-1/2 font-semibold" 
                onClick={() => rechargeWallet(null)}
                disabled={processingPayment}
              >
                {processingPayment ? "Processing Card..." : `Pay ₹${form.amount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Simulated Checkout Modal */}
      {checkoutModal === "razorpay" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-[1.5rem] bg-[#0c1929] text-white overflow-hidden shadow-2xl border border-white/5">
            {/* Razorpay Header */}
            <div className="bg-[#192b45] p-5 flex items-center justify-between border-b border-white/5">
              <div>
                <p className="text-xs uppercase tracking-widest text-warning/80 font-semibold">Karigar Dispatch</p>
                <p className="text-lg font-bold text-white">Top Up Wallet</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/50">Amount</p>
                <p className="text-base font-bold text-warning">₹{form.amount}</p>
              </div>
            </div>

            {/* Methods body */}
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white/70">SELECT PAYMENT METHOD</p>
                <div className="grid grid-cols-3 gap-2">
                  {["card", "upi", "netbanking"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRazorpayMethod(m)}
                      className={`py-3 px-1 rounded-xl text-xs font-semibold uppercase tracking-wider border transition ${
                        razorpayMethod === m 
                          ? "border-warning bg-warning/10 text-warning" 
                          : "border-white/5 bg-white/3 text-white/60 hover:bg-white/5"
                      }`}
                      disabled={processingPayment}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/3 rounded-2xl p-4 border border-white/5 text-sm leading-6 text-white/60">
                {razorpayMethod === "card" && <p>💳 Pay using secure credit/debit card. Mocked visa/mastercard enabled.</p>}
                {razorpayMethod === "upi" && <p>📱 GooglePay, PhonePe, Paytm, or any UPI ID. Instant verification.</p>}
                {razorpayMethod === "netbanking" && <p>🏦 Netbanking with SBI, HDFC, ICICI, Axis, or Kotak.</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="k-btn-ghost w-1/3"
                  onClick={() => setCheckoutModal(null)}
                  disabled={processingPayment}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="k-btn w-2/3 font-semibold text-black"
                  onClick={() => rechargeWallet(null)}
                  disabled={processingPayment}
                >
                  {processingPayment ? "Securing payment..." : `Pay ₹${form.amount}`}
                </button>
              </div>
            </div>

            {/* Razorpay Footer */}
            <div className="bg-[#112033] py-3 px-5 text-center text-[10px] text-white/40 border-t border-white/5">
              ⚡ Secured by <span className="font-bold text-white/60">Razorpay</span> (Simulated)
            </div>
          </div>
        </div>
      )}
    </MotionPage>
  );
}
