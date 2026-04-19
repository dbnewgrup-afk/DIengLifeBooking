"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/schemas";
import { clearToken } from "@/lib/auth/session";
import type {
  CashierBookingRow,
  CashierOverviewResponse,
  CreateWalkInPayload,
  CreateWalkInResponse,
  ManualPaymentPayload,
  ManualPaymentResponse,
  Product,
  ProductsResponse,
  VerifyXenditResponse,
} from "./lib/types";
import { fmtDateTime, fmtIDR, calcNights, calcTotal } from "./lib/utils";
import { layout } from "./lib/styles";
import Tabs from "./ui/Tabs";
import Toast from "./ui/Toast";
import OverviewPanel from "./panels/OverviewPanel";
import WalkinPanel from "./panels/WalkinPanel";
import CashPanel from "./panels/CashPanel";
import VerifyPanel from "./panels/VerifyPanel";

type TabKey = "OVERVIEW" | "WALKIN" | "CASH" | "VERIFY";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "message" in error && typeof (error as ApiError).message === "string") {
    return (error as ApiError).message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function KasirPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("OVERVIEW");

  const [overview, setOverview] = useState<CashierOverviewResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [productId, setProductId] = useState("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [qtyRoom, setQtyRoom] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliate, setAffiliate] = useState("");
  const [notes, setNotes] = useState("");

  const [cashCode, setCashCode] = useState("");
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashMethod, setCashMethod] = useState<ManualPaymentPayload["method"]>("CASH");
  const [cashNote, setCashNote] = useState("");

  const [verifyCode, setVerifyCode] = useState("");

  const [walkinBusy, setWalkinBusy] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function loadOverview() {
    setOverviewLoading(true);
    setOverviewError(null);

    try {
      const response = await api.get<CashierOverviewResponse>("/cashier/overview");
      setOverview(response);
      return true;
    } catch (error) {
      setOverviewError(getErrorMessage(error, "Gagal memuat overview kasir."));
      return false;
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError(null);

    try {
      const response = await api.get<ProductsResponse>("/products", {
        query: { active: true, page: 1, pageSize: 100 },
      });
      setProducts(response.items);
      setProductId(current => current || response.items[0]?.id || "");
      return true;
    } catch (error) {
      setProductsError(getErrorMessage(error, "Gagal memuat listing aktif untuk kasir."));
      return false;
    } finally {
      setProductsLoading(false);
    }
  }

  async function refreshAllData() {
    setRefreshBusy(true);
    setErr(null);
    setOkMsg(null);

    try {
      const [overviewOk, productsOk] = await Promise.all([loadOverview(), loadProducts()]);
      if (overviewOk && productsOk) {
        setOkMsg("Data kasir berhasil disegarkan dari backend.");
      }
    } finally {
      setRefreshBusy(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadOverview(), loadProducts()]);
  }, []);

  const product = useMemo(() => products.find(item => item.id === productId), [productId, products]);
  const nights = useMemo(() => calcNights(start, end), [start, end]);
  const total = useMemo(() => calcTotal(product, qtyRoom, nights), [product, qtyRoom, nights]);

  function prefillManualPayment(booking: CashierBookingRow) {
    setCashCode(booking.code);
    setCashAmount(booking.totalAmount);
    setActiveTab("CASH");
  }

  function prefillXenditVerification(booking: CashierBookingRow) {
    setVerifyCode(booking.code);
    setActiveTab("VERIFY");
  }

  /* Handlers */
  async function submitWalkin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);

    if (!productId) return setErr("Produk wajib dipilih.");
    if (!custName.trim()) return setErr("Nama customer wajib diisi.");
    if (!custEmail.trim()) return setErr("Email customer wajib diisi.");
    if (!phone.trim()) return setErr("No. telepon customer wajib diisi.");
    if (!start) return setErr("Tanggal mulai wajib diisi.");
    if (product?.unit === "malam" && !end) return setErr("Tanggal selesai wajib diisi untuk produk per malam.");

    try {
      setWalkinBusy(true);
      const payload: CreateWalkInPayload = {
        listingId: productId,
        startDate: start,
        endDate: product?.unit === "malam" ? end : null,
        quantity: qtyRoom,
        guestCount,
        customer: {
          name: custName.trim(),
          email: custEmail.trim(),
          phone: phone.trim(),
        },
        affiliateReference: affiliate.trim() || null,
        note: notes.trim() || null,
      };
      const response = await api.post<CreateWalkInResponse>("/cashier/walkins", payload);
      setOkMsg(`Reservasi walk-in berhasil dibuat: ${response.booking.code}`);
      setCustName("");
      setCustEmail("");
      setPhone("");
      setNotes("");
      setAffiliate("");
      prefillManualPayment(response.booking);
      await loadOverview();
    } catch (error) {
      setErr(getErrorMessage(error, "Gagal membuat reservasi walk-in."));
    } finally {
      setWalkinBusy(false);
    }
  }

  async function submitCash(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);
    if (!cashCode.trim()) return setErr("Kode booking wajib diisi.");
    if (!cashAmount || cashAmount <= 0) return setErr("Nominal tidak valid.");

    try {
      setManualBusy(true);
      const payload: ManualPaymentPayload = {
        amount: cashAmount,
        method: cashMethod,
        note: cashNote.trim() || null,
      };
      const response = await api.post<ManualPaymentResponse>(
        `/cashier/orders/${encodeURIComponent(cashCode.trim())}/manual-payment`,
        payload
      );
      setOkMsg(
        `Pembayaran ${cashMethod === "CASH" ? "tunai" : "transfer"} berhasil ditandai untuk ${response.booking.code}.`
      );
      setCashNote("");
      await loadOverview();
    } catch (error) {
      setErr(getErrorMessage(error, "Gagal menandai pembayaran manual."));
    } finally {
      setManualBusy(false);
    }
  }

  async function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOkMsg(null);
    if (!verifyCode.trim()) return setErr("Kode booking wajib diisi.");

    try {
      setVerifyBusy(true);
      const response = await api.post<VerifyXenditResponse>(
        `/cashier/orders/${encodeURIComponent(verifyCode.trim())}/verify-xendit`,
        {}
      );
      setOkMsg(`Invoice Xendit ${response.invoice.status} untuk booking ${response.booking.code}.`);
      await loadOverview();
    } catch (error) {
      setErr(getErrorMessage(error, "Gagal verifikasi Xendit."));
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/clear-cookie", { method: "POST" });
    } finally {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.assign("/login/admin");
      }
    }
  }

  return (
    <div style={layout.page}>
      <div style={layout.container}>
        <header
          style={{
            position: "relative",
            isolation: "isolate",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 20,
            padding: 18,
            borderRadius: 22,
            background: "rgba(15,23,42,.28)",
            border: "1px solid rgba(255,255,255,.14)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ color: "#fff", fontSize: 32, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>Kasir</h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "rgba(226,232,240,.86)",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                Semua panel di halaman ini memakai data real backend aktif tanpa fallback dummy.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                zIndex: 3,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/kasir/reset-password"
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(15,23,42,.22)",
                  color: "#e2e8f0",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Reset password saya
              </Link>
              <button
                type="button"
                onClick={() => void refreshAllData()}
                disabled={refreshBusy}
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(15,23,42,.22)",
                  color: "#e2e8f0",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: refreshBusy ? "not-allowed" : "pointer",
                  opacity: refreshBusy ? 0.7 : 1,
                }}
              >
                {refreshBusy ? "Refresh..." : "Refresh Data"}
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                style={{
                  borderRadius: 999,
                  padding: "8px 12px",
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(15,23,42,.22)",
                  color: "#e2e8f0",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: loggingOut ? "not-allowed" : "pointer",
                  opacity: loggingOut ? 0.7 : 1,
                }}
              >
                {loggingOut ? "Logout..." : "Logout"}
              </button>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 999,
                  padding: "8px 12px",
                  background: "rgba(16,185,129,.14)",
                  color: "#d1fae5",
                  border: "1px solid rgba(110,231,183,.4)",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                }}
              >
                {activeTab} panel
              </div>
            </div>
          </div>

          <Tabs active={activeTab} onChange={setActiveTab} />
        </header>

        {/* Alerts */}
        {err ? <Toast ok={false}>{err}</Toast> : null}
        {okMsg ? <Toast ok>{okMsg}</Toast> : null}

        {/* Panels */}
        {activeTab === "OVERVIEW" ? (
          <OverviewPanel
            summary={overview?.summary ?? null}
            recentBookings={overview?.recentBookings ?? []}
            pendingPayments={overview?.pendingPayments ?? []}
            pendingXendit={overview?.pendingXendit ?? []}
            loading={overviewLoading}
            error={overviewError}
            refreshing={refreshBusy}
            onRefresh={() => void loadOverview()}
            onOpenCash={prefillManualPayment}
            onOpenVerify={prefillXenditVerification}
            fmtIDR={fmtIDR}
            fmtDateTime={fmtDateTime}
          />
        ) : null}

        {activeTab === "WALKIN" ? (
          <WalkinPanel
            products={products}
            productsLoading={productsLoading}
            productsError={productsError}
            value={{ productId, start, end, qtyRoom, guestCount, custName, custEmail, phone, affiliate, notes }}
            product={product}
            nights={nights}
            total={total}
            busy={walkinBusy}
            fmtIDR={fmtIDR}
            onChange={patch => {
              if (patch.productId !== undefined) setProductId(patch.productId);
              if (patch.start !== undefined) setStart(patch.start);
              if (patch.end !== undefined) setEnd(patch.end);
              if (patch.qtyRoom !== undefined) setQtyRoom(patch.qtyRoom);
              if (patch.guestCount !== undefined) setGuestCount(patch.guestCount);
              if (patch.custName !== undefined) setCustName(patch.custName);
              if (patch.custEmail !== undefined) setCustEmail(patch.custEmail);
              if (patch.phone !== undefined) setPhone(patch.phone);
              if (patch.affiliate !== undefined) setAffiliate(patch.affiliate);
              if (patch.notes !== undefined) setNotes(patch.notes);
            }}
            onSubmit={submitWalkin}
          />
        ) : null}

        {activeTab === "CASH" ? (
          <CashPanel
            queue={overview?.pendingPayments ?? []}
            queueLoading={overviewLoading}
            queueError={overviewError}
            value={{ code: cashCode, amount: cashAmount, method: cashMethod, note: cashNote }}
            onChange={p => {
              if (p.code !== undefined) setCashCode(p.code);
              if (p.amount !== undefined) setCashAmount(p.amount);
              if (p.method !== undefined) setCashMethod(p.method);
              if (p.note !== undefined) setCashNote(p.note);
            }}
            busy={manualBusy}
            fmtIDR={fmtIDR}
            onSubmit={submitCash}
          />
        ) : null}

        {activeTab === "VERIFY" ? (
          <VerifyPanel
            queue={overview?.pendingXendit ?? []}
            queueLoading={overviewLoading}
            queueError={overviewError}
            value={{ code: verifyCode }}
            onChange={patch => setVerifyCode(patch.code ?? verifyCode)}
            busy={verifyBusy}
            onSubmit={submitVerify}
          />
        ) : null}
      </div>
    </div>
  );
}
