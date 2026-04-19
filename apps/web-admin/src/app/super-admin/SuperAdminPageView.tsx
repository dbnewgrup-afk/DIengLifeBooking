/* apps/web-admin/src/app/super-admin/SuperAdminPageView.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { fmtNum } from "./lib/utils";
import type {
  AffiliateRow,
  ApprovalItem,
  AuditItem,
  ControlSnapshot,
  DashboardNotice,
  Kpi,
  PartnerRow,
  PayoutSummary,
  Product,
  ProductAvailability,
  Reports,
} from "./lib/types";
import OverviewPanel from "./panels/OverviewPanel";
import AffiliatesPanel from "./panels/AffiliatesPanel";
import ApprovalsPanel from "./panels/ApprovalsPanel";
import AuditsPanel from "./panels/AuditsPanelReal";
import HomepageCmsPanel from "./panels/HomepageCmsPanelList";
import PartnerPanel from "./panels/PartnerPanel";
import PayoutsPanel from "./panels/PayoutsPanel";
import ProductsPanel from "./panels/ProductsPanel";
import ReportsPanel from "./panels/ReportsPanel";
import { API_BASE_URL } from "@/lib/constants";
import { clearToken, getToken } from "@/lib/auth/session";
import type { HomepageCmsSection, HomepageSectionKey } from "./lib/homepage-cms";
import { decodeAuthTokenPayload } from "@/lib/auth/token";
import DashboardControlPanel from "@/components/dashboard-control/DashboardControlPanel";

type TabKey =
  | "OVERVIEW"
  | "CONTROL"
  | "AFFILIATES"
  | "APPROVALS"
  | "AUDITS"
  | "CMS"
  | "PARTNER"
  | "PAYOUTS"
  | "PRODUCTS"
  | "REPORTS";

type AdminOverviewResponse = {
  kpis?: {
    revenue?: number;
    orders?: number;
    avgOrderValue?: number;
    paidRate?: number;
    checkinToday?: number;
    checkoutToday?: number;
    pendingPayments?: number;
  };
  byDay?: Array<{ label: string; orders: number; revenue: number }>;
  methodSplit?: Array<{ name: string; count: number }>;
  topProducts?: Array<{ id: string; name: string; orders: number; revenue: number }>;
};

type PayoutBatchListResponse = {
  items?: Array<{ id: string; status: string; totalAmount: number; createdAt: string }>;
};

type SectionKey =
  | "overview"
  | "control"
  | "products"
  | "partners"
  | "approvals"
  | "audits"
  | "affiliates"
  | "cms"
  | "payouts";

type SectionStatus = {
  kind: "loading" | "ready" | "error";
  message?: string;
};

const EMPTY_KPI: Kpi = {
  bookingToday: 0,
  checkinToday: 0,
  checkoutToday: 0,
  pendingPayments: 0,
  revenue: 0,
  avgOrderValue: 0,
  paidRate: 0,
};

const EMPTY_REPORTS: Reports = {
  occupancy: [],
  revenue: [],
  clicks: [],
  topProducts: [],
  methodSplit: [],
};

const EMPTY_PAYOUT: PayoutSummary = {
  totalBatches: 0,
  draftCount: 0,
  approvedCount: 0,
  completedCount: 0,
  totalAmount: 0,
  lastBatchAt: null,
};

const INITIAL_SECTION_STATUS: Record<SectionKey, SectionStatus> = {
  overview: { kind: "loading" },
  control: { kind: "loading" },
  products: { kind: "loading" },
  partners: { kind: "loading" },
  approvals: { kind: "loading" },
  audits: { kind: "loading" },
  affiliates: { kind: "loading" },
  cms: { kind: "loading" },
  payouts: { kind: "loading" },
};

export default function SuperAdminPageView() {
  const [active, setActive] = useState<TabKey>("OVERVIEW");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [kpi, setKpi] = useState<Kpi>(EMPTY_KPI);
  const [reports, setReports] = useState<Reports>(EMPTY_REPORTS);
  const [controlNotices, setControlNotices] = useState<DashboardNotice[]>([]);
  const [controlSnapshot, setControlSnapshot] = useState<ControlSnapshot | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [payout, setPayout] = useState<PayoutSummary>(EMPTY_PAYOUT);
  const [products, setProducts] = useState<Product[]>([]);
  const [cmsSections, setCmsSections] = useState<HomepageCmsSection[]>([]);
  const [activeCmsKey, setActiveCmsKey] = useState<HomepageSectionKey | null>(null);
  const [activeCmsFocusId, setActiveCmsFocusId] = useState<string | null>(null);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsPublishing, setCmsPublishing] = useState(false);
  const [controlSaving, setControlSaving] = useState(false);
  const [controlDeletingId, setControlDeletingId] = useState<string | null>(null);
  const [sectionStatus, setSectionStatus] = useState<Record<SectionKey, SectionStatus>>(INITIAL_SECTION_STATUS);
  const [approvalBusy, setApprovalBusy] = useState<{ id: string; action: "approve" | "reject" | "complete" } | null>(null);
  const [auditBusy, setAuditBusy] = useState<{ id: string; action: "review" | "delete" } | null>(null);
  const [partnerBusy, setPartnerBusy] = useState<{ id: string; action: "update" | "delete" } | null>(null);
  const [productDeletingId, setProductDeletingId] = useState<string | null>(null);

  const activeCmsSection = useMemo(
    () => cmsSections.find((item) => item.key === activeCmsKey) ?? null,
    [cmsSections, activeCmsKey]
  );
  const overviewPanelLoading =
    sectionStatus.overview.kind === "loading" ||
    sectionStatus.products.kind === "loading" ||
    sectionStatus.partners.kind === "loading" ||
    sectionStatus.approvals.kind === "loading" ||
    sectionStatus.affiliates.kind === "loading" ||
    sectionStatus.cms.kind === "loading";
  const overviewPanelError =
    [sectionStatus.overview, sectionStatus.products, sectionStatus.partners, sectionStatus.approvals, sectionStatus.affiliates, sectionStatus.cms]
      .find((item) => item.kind === "error")?.message ?? null;

  function updateSectionStatus(key: SectionKey, next: SectionStatus) {
    setSectionStatus((current) => ({ ...current, [key]: next }));
  }

  async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getToken();
    const headers = new Headers(init?.headers ?? {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
      ...init,
      headers,
    });

    const json = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error("__AUTH_401__");
    }
    if (!response.ok) {
      throw new Error((json as any)?.message || (json as any)?.error || `Gagal memuat ${path}`);
    }

    return json as T;
  }

  function applyOverviewPayload(payload: AdminOverviewResponse) {
    setKpi({
      bookingToday: payload.kpis?.orders ?? 0,
      checkinToday: payload.kpis?.checkinToday ?? 0,
      checkoutToday: payload.kpis?.checkoutToday ?? 0,
      pendingPayments: payload.kpis?.pendingPayments ?? 0,
      revenue: payload.kpis?.revenue ?? 0,
      avgOrderValue: payload.kpis?.avgOrderValue ?? 0,
      paidRate: payload.kpis?.paidRate ?? 0,
    });
    setReports({
      occupancy: (payload.byDay ?? []).map((item) => ({ label: item.label.slice(5), value: item.orders })),
      revenue: (payload.byDay ?? []).map((item) => ({ label: item.label.slice(5), value: item.revenue })),
      clicks: (payload.byDay ?? []).map((item) => ({
        label: item.label.slice(5),
        value: item.orders ? Math.round(item.revenue / item.orders) : 0,
      })),
      topProducts: payload.topProducts ?? [],
      methodSplit: payload.methodSplit ?? [],
    });
  }

  function applyPayoutPayload(payload: PayoutBatchListResponse) {
    const batches = payload.items ?? [];
    setPayout({
      totalBatches: batches.length,
      draftCount: batches.filter((item) => item.status === "DRAFT").length,
      approvedCount: batches.filter((item) => item.status === "APPROVED" || item.status === "PROCESSING").length,
      completedCount: batches.filter((item) => item.status === "COMPLETED").length,
      totalAmount: batches.reduce((sum, item) => sum + item.totalAmount, 0),
      lastBatchAt: batches[0]?.createdAt ?? null,
    });
  }

  async function refetchOverview() {
    updateSectionStatus("overview", { kind: "loading" });
    try {
      const payload = await requestJson<AdminOverviewResponse>("/reports/admin/overview");
      applyOverviewPayload(payload);
      updateSectionStatus("overview", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("overview", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat overview."),
      });
      throw error;
    }
  }

  async function refetchControl() {
    updateSectionStatus("control", { kind: "loading" });
    try {
      const [noticePayload, snapshotPayload] = await Promise.all([
        requestJson<{ items?: DashboardNotice[] }>("/dashboard-control/notices"),
        requestJson<{ snapshot: ControlSnapshot }>("/dashboard-control/monitoring"),
      ]);
      setControlNotices(noticePayload.items ?? []);
      setControlSnapshot(snapshotPayload.snapshot ?? null);
      updateSectionStatus("control", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("control", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat control center."),
      });
      throw error;
    }
  }

  async function refetchProducts() {
    updateSectionStatus("products", { kind: "loading" });
    try {
      const payload = await requestJson<{ items?: Product[] }>("/admin-marketplace/products");
      setProducts(payload.items ?? []);
      updateSectionStatus("products", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("products", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat products."),
      });
      throw error;
    }
  }

  async function refetchPartners() {
    updateSectionStatus("partners", { kind: "loading" });
    try {
      const payload = await requestJson<{ items?: PartnerRow[] }>("/admin-marketplace/sellers-summary");
      setPartners(payload.items ?? []);
      updateSectionStatus("partners", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("partners", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat seller."),
      });
      throw error;
    }
  }

  async function refetchApprovals() {
    updateSectionStatus("approvals", { kind: "loading" });
    try {
      const payload = await requestJson<{ items?: ApprovalItem[] }>("/approvals");
      setApprovals(payload.items ?? []);
      updateSectionStatus("approvals", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("approvals", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat approvals."),
      });
      throw error;
    }
  }

  async function refetchAudits() {
    updateSectionStatus("audits", { kind: "loading" });
    try {
      const payload = await requestJson<{ items?: AuditItem[] }>("/audits?page=1&pageSize=20");
      setAudits(payload.items ?? []);
      updateSectionStatus("audits", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("audits", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat audit trail."),
      });
      throw error;
    }
  }

  async function refetchAffiliates() {
    updateSectionStatus("affiliates", { kind: "loading" });
    try {
      const payload = await requestJson<{ items?: AffiliateRow[] }>("/affiliates/admin-summary");
      setAffiliates(payload.items ?? []);
      updateSectionStatus("affiliates", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("affiliates", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat affiliate."),
      });
      throw error;
    }
  }

  async function refetchPayouts() {
    updateSectionStatus("payouts", { kind: "loading" });
    try {
      const payload = await requestJson<PayoutBatchListResponse>("/payouts/batches?page=1&pageSize=20");
      applyPayoutPayload(payload);
      updateSectionStatus("payouts", { kind: "ready" });
    } catch (error: unknown) {
      updateSectionStatus("payouts", {
        kind: "error",
        message: getRequestErrorMessage(error, "Gagal memuat payouts."),
      });
      throw error;
    }
  }

  useEffect(() => {
    let ignore = false;
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    const payload = decodeAuthTokenPayload(token);
    const tokenExpiry = typeof payload?.exp === "number" ? payload.exp * 1000 : null;
    if (tokenExpiry && tokenExpiry <= Date.now()) {
      setErr("Sesi login sudah habis. Klik logout lalu login ulang.");
      setLoading(false);
      return;
    }

    const headers: HeadersInit = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    async function fetchJson<T>(path: string): Promise<T> {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        cache: "no-store",
        headers,
      });

      const json = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error("__AUTH_401__");
      }
      if (!response.ok) {
        throw new Error((json as any)?.message || (json as any)?.error || `Gagal memuat ${path}`);
      }
      return json as T;
    }

    async function load() {
      setLoading(true);
      setErr(null);
      setSectionStatus(INITIAL_SECTION_STATUS);

      const authResult = await Promise.allSettled([fetchJson<{ ok?: boolean; user?: { role?: string } }>("/auth/me")]);
      if (ignore) return;

      if (authResult[0].status === "rejected") {
        const reason = authResult[0].reason;
        if (reason instanceof Error && reason.message === "__AUTH_401__") {
          setErr("Sesi login tidak valid. Klik logout lalu login ulang.");
          setLoading(false);
          return;
        }

        setErr("Sesi login tidak valid. Silakan masuk ulang.");
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        fetchJson<AdminOverviewResponse>("/reports/admin/overview"),
        fetchJson<{ items?: DashboardNotice[] }>("/dashboard-control/notices"),
        fetchJson<{ snapshot: ControlSnapshot }>("/dashboard-control/monitoring"),
        fetchJson<{ items?: Product[] }>("/admin-marketplace/products"),
        fetchJson<{ items?: PartnerRow[] }>("/admin-marketplace/sellers-summary"),
        fetchJson<{ items?: ApprovalItem[] }>("/approvals"),
        fetchJson<{ items?: AuditItem[] }>("/audits?page=1&pageSize=20"),
        fetchJson<{ items?: AffiliateRow[] }>("/affiliates/admin-summary"),
        fetchJson<{ items?: HomepageCmsSection[] }>("/cms/homepage"),
        fetchJson<{ items?: Array<{ id: string; status: string; totalAmount: number; createdAt: string }> }>("/payouts/batches?page=1&pageSize=20"),
      ]);

      if (ignore) return;

      const [overviewResult, controlNoticesResult, controlSnapshotResult, productsResult, sellersResult, approvalsResult, auditsResult, affiliatesResult, cmsResult, payoutsResult] =
        results;

      const failures = results.filter((item) => item.status === "rejected");

      if (overviewResult.status === "fulfilled") {
        applyOverviewPayload(overviewResult.value);
        updateSectionStatus("overview", { kind: "ready" });
      } else {
        setKpi(EMPTY_KPI);
        setReports(EMPTY_REPORTS);
        updateSectionStatus("overview", {
          kind: "error",
          message: getRequestErrorMessage(overviewResult.reason, "Gagal memuat overview."),
        });
      }

      if (controlNoticesResult.status === "fulfilled" && controlSnapshotResult.status === "fulfilled") {
        setControlNotices(controlNoticesResult.value.items ?? []);
        setControlSnapshot(controlSnapshotResult.value.snapshot ?? null);
        updateSectionStatus("control", { kind: "ready" });
      } else {
        setControlNotices([]);
        setControlSnapshot(null);
        updateSectionStatus("control", {
          kind: "error",
          message: getRequestErrorMessage(
            controlNoticesResult.status === "rejected"
              ? controlNoticesResult.reason
              : controlSnapshotResult.status === "rejected"
                ? controlSnapshotResult.reason
                : null,
            "Gagal memuat control center."
          ),
        });
      }

      setProducts(productsResult.status === "fulfilled" ? productsResult.value.items ?? [] : []);
      updateSectionStatus(
        "products",
        productsResult.status === "fulfilled"
          ? { kind: "ready" }
          : { kind: "error", message: getRequestErrorMessage(productsResult.reason, "Gagal memuat products.") }
      );
      setPartners(sellersResult.status === "fulfilled" ? sellersResult.value.items ?? [] : []);
      updateSectionStatus(
        "partners",
        sellersResult.status === "fulfilled"
          ? { kind: "ready" }
          : { kind: "error", message: getRequestErrorMessage(sellersResult.reason, "Gagal memuat seller.") }
      );
      setApprovals(approvalsResult.status === "fulfilled" ? approvalsResult.value.items ?? [] : []);
      updateSectionStatus(
        "approvals",
        approvalsResult.status === "fulfilled"
          ? { kind: "ready" }
          : { kind: "error", message: getRequestErrorMessage(approvalsResult.reason, "Gagal memuat approvals.") }
      );
      setAudits(auditsResult.status === "fulfilled" ? auditsResult.value.items ?? [] : []);
      updateSectionStatus(
        "audits",
        auditsResult.status === "fulfilled"
          ? { kind: "ready" }
          : { kind: "error", message: getRequestErrorMessage(auditsResult.reason, "Gagal memuat audit trail.") }
      );
      setAffiliates(affiliatesResult.status === "fulfilled" ? affiliatesResult.value.items ?? [] : []);
      updateSectionStatus(
        "affiliates",
        affiliatesResult.status === "fulfilled"
          ? { kind: "ready" }
          : { kind: "error", message: getRequestErrorMessage(affiliatesResult.reason, "Gagal memuat affiliate.") }
      );

      if (cmsResult.status === "fulfilled") {
        const sections = cmsResult.value.items ?? [];
        setCmsSections(sections);
        setActiveCmsKey((current) => current ?? sections[0]?.key ?? null);
        updateSectionStatus("cms", { kind: "ready" });
      } else {
        setCmsSections([]);
        updateSectionStatus("cms", {
          kind: "error",
          message: getRequestErrorMessage(cmsResult.reason, "Gagal memuat CMS homepage."),
        });
      }

      if (payoutsResult.status === "fulfilled") {
        applyPayoutPayload(payoutsResult.value);
        updateSectionStatus("payouts", { kind: "ready" });
      } else {
        setPayout(EMPTY_PAYOUT);
        updateSectionStatus("payouts", {
          kind: "error",
          message: getRequestErrorMessage(payoutsResult.reason, "Gagal memuat payouts."),
        });
      }

      if (failures.length > 0) {
        const unauthorized = failures.some(
          (item) => item.reason instanceof Error && item.reason.message === "__AUTH_401__"
        );
        if (unauthorized) {
          setErr("Sebagian endpoint menolak token login. Klik logout lalu login ulang.");
          setLoading(false);
          return;
        }

        console.warn("Sebagian request super admin gagal dimuat.", failures);
      }

      setLoading(false);
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleApprovalAction(approval: ApprovalItem, action: "approve" | "reject" | "complete") {
    setApprovalBusy({ id: approval.id, action });
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/approvals/${approval.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({
          type: approval.type,
        }),
      });

      if (approval.type === "SELLER") {
        await Promise.all([refetchPartners(), refetchApprovals(), refetchOverview()]);
      } else if (approval.type === "LISTING") {
        await Promise.all([refetchProducts(), refetchApprovals(), refetchOverview()]);
      } else if (approval.type === "PAYOUT") {
        await Promise.all([refetchPayouts(), refetchApprovals(), refetchPartners(), refetchOverview()]);
      } else if (approval.type === "AFFILIATE_WITHDRAW") {
        await Promise.all([refetchApprovals(), refetchAffiliates(), refetchControl()]);
      } else if (approval.type === "REVIEW") {
        await Promise.all([refetchApprovals(), refetchOverview()]);
      }

      setOkMsg(
        action === "approve"
          ? `Approval ${approval.code} berhasil diproses ke backend.`
          : action === "complete"
            ? `Payout ${approval.code} berhasil ditandai paid di backend.`
            : `Approval ${approval.code} berhasil direject ke backend.`
      );
    } catch (error: unknown) {
      const message = getRequestErrorMessage(
        error,
        action === "approve"
          ? "Gagal approve approval."
          : action === "complete"
            ? "Gagal menandai payout sebagai paid."
            : "Gagal reject approval."
      );
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setApprovalBusy(null);
    }
  }

  async function handleSaveControlNotice(
    id: string | null,
    payload: {
      title: string;
      body: string;
      audience: "SELLER" | "AFFILIATE" | "ALL_USERS";
      ctaLabel?: string | null;
      ctaHref?: string | null;
      isActive: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      sortOrder: number;
    }
  ) {
    setControlSaving(true);
    setErr(null);
    try {
      await requestJson(id ? `/dashboard-control/notices/${id}` : "/dashboard-control/notices", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      await refetchControl();
      setOkMsg(id ? "Control notice berhasil diperbarui." : "Control notice berhasil dibuat.");
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal menyimpan control notice.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setControlSaving(false);
    }
  }

  async function handleDeleteControlNotice(id: string) {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("Hapus control notice ini dari dashboard?");
    if (!confirmed) return;

    setControlDeletingId(id);
    setErr(null);
    try {
      await requestJson(`/dashboard-control/notices/${id}`, { method: "DELETE" });
      await refetchControl();
      setOkMsg("Control notice berhasil dihapus.");
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal menghapus control notice.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setControlDeletingId(null);
    }
  }

  async function handleAuditReview(id: string) {
    setAuditBusy({ id, action: "review" });
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/audits/${id}/review`, { method: "POST" });
      await refetchAudits();
      setOkMsg("Audit berhasil direview dan jejak review sudah tersimpan di backend.");
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal review audit.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setAuditBusy(null);
    }
  }

  async function handleAuditDelete(id: string) {
    const confirmed =
      typeof window === "undefined" ? true : window.confirm("Hapus log audit ini dari backend?");
    if (!confirmed) return;

    setAuditBusy({ id, action: "delete" });
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/audits/${id}`, { method: "DELETE" });
      await refetchAudits();
      setOkMsg("Log audit berhasil dihapus dari backend dan tabel sudah diperbarui.");
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal menghapus audit.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setAuditBusy(null);
    }
  }

  async function handlePartnerUpdate(
    partnerId: string,
    patch: { name: string; ownerName: string; email: string; status: PartnerRow["status"] }
  ) {
    setPartnerBusy({ id: partnerId, action: "update" });
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/admin-marketplace/sellers/${partnerId}`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: patch.name,
          ownerName: patch.ownerName,
          email: patch.email,
          status: patch.status,
        }),
      });
      await Promise.all([refetchPartners(), refetchApprovals(), refetchOverview()]);
      setOkMsg(`Seller ${patch.name} berhasil diperbarui dan sinkron dengan backend.`);
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal update seller.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setPartnerBusy(null);
    }
  }

  async function handlePartnerDelete(id: string) {
    const confirmed =
      typeof window === "undefined" ? true : window.confirm("Hapus seller ini dari backend?");
    if (!confirmed) return;

    setPartnerBusy({ id, action: "delete" });
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/admin-marketplace/sellers/${id}`, { method: "DELETE" });
      await Promise.all([refetchPartners(), refetchApprovals(), refetchOverview()]);
      setOkMsg("Seller berhasil dihapus dari backend dan dashboard sudah disinkronkan ulang.");
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal menghapus seller.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setPartnerBusy(null);
    }
  }

  async function handleProductUpdate(
    productId: string,
    payload: {
      slug: string;
      name: string;
      price: number;
      active: boolean;
      type: "VILLA" | "JEEP" | "TRANSPORT" | "PHOTOGRAPHER";
      unitType: "PER_NIGHT" | "PER_DAY" | "PER_TRIP" | "PER_SESSION";
      locationText: string;
      maxGuest: number;
    }
  ) {
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await Promise.all([refetchProducts(), refetchApprovals(), refetchOverview()]);
      setOkMsg(`Produk ${payload.name} berhasil diperbarui dan disinkronkan dari backend.`);
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal update produk.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }

  async function handleProductAvailabilityFetch(productId: string, month: string) {
    const payload = await requestJson<{ items?: ProductAvailability[] }>(
      `/products/${productId}/availability?month=${encodeURIComponent(month)}`
    );
    return payload.items ?? [];
  }

  async function handleProductAvailabilitySave(
    productId: string,
    payload: {
      items: Array<{
        date: string;
        stock: number;
        isAvailable: boolean;
        priceOverride: number | null;
      }>;
    }
  ) {
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/products/${productId}/availability`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await Promise.all([refetchProducts(), refetchOverview()]);
      setOkMsg(`Availability produk berhasil diperbarui untuk ${payload.items.length} tanggal.`);
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal menyimpan availability produk.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    }
  }

  async function handleProductDelete(id: string) {
    const confirmed =
      typeof window === "undefined" ? true : window.confirm("Arsipkan produk ini di backend?");
    if (!confirmed) return;

    setProductDeletingId(id);
    setErr(null);
    try {
      await requestJson<{ ok: boolean }>(`/products/${id}`, { method: "DELETE" });
      await Promise.all([refetchProducts(), refetchApprovals(), refetchOverview()]);
      setOkMsg("Produk berhasil diarsipkan di backend dan daftar produk sudah diperbarui.");
    } catch (error: unknown) {
      const message = getRequestErrorMessage(error, "Gagal menghapus produk.");
      setErr(message);
      throw error instanceof Error ? error : new Error(message);
    } finally {
      setProductDeletingId(null);
    }
  }

  const tabs: Array<{ k: TabKey; t: string; count?: number }> = [
    { k: "OVERVIEW", t: "Overview" },
    { k: "CONTROL", t: "Control", count: controlNotices.length },
    { k: "AFFILIATES", t: "Affiliates", count: affiliates.length },
    { k: "APPROVALS", t: "Approvals", count: approvals.length },
    { k: "AUDITS", t: "Audits", count: audits.length },
    { k: "CMS", t: "CMS", count: cmsSections.length },
    { k: "PARTNER", t: "Seller", count: partners.length },
    { k: "PAYOUTS", t: "Payouts", count: payout.totalBatches },
    { k: "PRODUCTS", t: "Products", count: products.length },
    { k: "REPORTS", t: "Reports" },
  ];

  return (
    <div
      style={{
        minHeight: "100svh",
        background:
          "radial-gradient(60% 50% at 15% -10%, rgba(56,174,204,.16), transparent 60%), radial-gradient(55% 40% at 90% -10%, rgba(30,64,175,.20), transparent 60%), linear-gradient(180deg, #102a43 0%, #1e3a8a 58%, #312e81 100%)",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 18px 40px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 14,
            padding: 18,
            borderRadius: 22,
            background: "rgba(15,23,42,.28)",
            border: "1px solid rgba(255,255,255,.14)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div>
            <h1 style={{ color: "#fff", fontSize: 32, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>Super Admin</h1>
            <p style={{ margin: "8px 0 0", color: "rgba(226,232,240,.86)", fontSize: 14, lineHeight: 1.7 }}>
              Panel kontrol menyeluruh untuk operasional, CMS homepage, seller, payout, audit, dan laporan performa.
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/super-admin/accounts"
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
              Kelola akun
            </Link>
            <Link
              href="/super-admin/reset-password"
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
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await fetch("/api/auth/clear-cookie", { method: "POST" });
                } finally {
                  clearToken();
                  if (typeof window !== "undefined") {
                    window.location.assign("/login/admin");
                  }
                }
              }}
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
              {loading ? "Loading dashboard..." : "Super Admin Mode"}
            </div>
          </div>
        </header>

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            padding: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,.18)",
            border: "1px solid rgba(255,255,255,.22)",
            backdropFilter: "blur(14px)",
          }}
        >
          {tabs.map((tab) => {
            const activeTab = active === tab.k;
            return (
              <button
                key={tab.k}
                type="button"
                onClick={() => setActive(tab.k)}
                style={{
                  borderRadius: 999,
                  padding: "10px 14px",
                  border: "1px solid rgba(255,255,255,.32)",
                  background: activeTab ? "rgba(255,255,255,.94)" : "transparent",
                  color: activeTab ? "#0f172a" : "#eff6ff",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{tab.t}</span>
                {typeof tab.count === "number" ? (
                  <span
                    style={{
                      borderRadius: 999,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 900,
                      background: activeTab ? "rgba(15,23,42,.08)" : "rgba(255,255,255,.14)",
                    }}
                  >
                    {fmtNum(tab.count)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {err ? <div style={toast(false)}>{err}</div> : null}
        {okMsg ? <div style={toast(true)}>{okMsg}</div> : null}

        {active === "OVERVIEW" && (
          <OverviewPanel
            kpi={kpi}
            reports={reports}
            products={products}
            sellers={partners}
            approvals={approvals}
            affiliates={affiliates}
            cmsSections={cmsSections}
            onOpenCmsDetail={(key, entryId) => {
              setActive("CMS");
              setActiveCmsKey(key);
              setActiveCmsFocusId(entryId ?? null);
            }}
            onNavigateModule={(target) => setActive(target)}
            loading={overviewPanelLoading}
            error={overviewPanelError}
          />
        )}
        {active === "CONTROL" && (
          <DashboardControlPanel
            notices={controlNotices}
            snapshot={controlSnapshot}
            loading={sectionStatus.control.kind === "loading"}
            error={sectionStatus.control.kind === "error" ? sectionStatus.control.message ?? "Gagal memuat control center." : null}
            saving={controlSaving}
            deletingId={controlDeletingId}
            onSaveNotice={handleSaveControlNotice}
            onDeleteNotice={handleDeleteControlNotice}
          />
        )}
          {active === "AFFILIATES" && (
            <AffiliatesPanel
              rows={affiliates}
              loading={sectionStatus.affiliates.kind === "loading"}
              error={sectionStatus.affiliates.kind === "error" ? sectionStatus.affiliates.message ?? "Gagal memuat affiliate." : null}
            />
        )}
        {active === "APPROVALS" && (
          <ApprovalsPanel
            approvals={approvals}
            onApprove={(approval) => handleApprovalAction(approval, "approve")}
            onReject={(approval) => handleApprovalAction(approval, "reject")}
            onComplete={(approval) => handleApprovalAction(approval, "complete")}
            busyId={approvalBusy?.id ?? null}
            busyAction={approvalBusy?.action ?? null}
            loading={sectionStatus.approvals.kind === "loading"}
            error={sectionStatus.approvals.kind === "error" ? sectionStatus.approvals.message ?? "Gagal memuat approvals." : null}
          />
        )}
        {active === "AUDITS" && (
          <AuditsPanel
            rows={audits}
            onReview={handleAuditReview}
            onDelete={handleAuditDelete}
            busyId={auditBusy?.id ?? null}
            busyAction={auditBusy?.action ?? null}
            loading={sectionStatus.audits.kind === "loading"}
            error={sectionStatus.audits.kind === "error" ? sectionStatus.audits.message ?? "Gagal memuat audit trail." : null}
          />
        )}
        {active === "CMS" && (
          <HomepageCmsPanel
            sections={cmsSections}
            activeKey={activeCmsKey}
            draft={activeCmsSection}
            saving={cmsSaving}
            publishing={cmsPublishing}
            focusEntryId={activeCmsFocusId}
            onSelect={(key) => {
              setActiveCmsKey(key);
              setActiveCmsFocusId(null);
            }}
            onDraftChange={(nextDraft) => {
              if (!activeCmsKey) return;
              setCmsSections((current) =>
                current.map((item) =>
                  item.key === activeCmsKey ? { ...item, draftContent: nextDraft } : item
                )
              );
            }}
            onVisibilityChange={(nextVisible) => {
              if (!activeCmsKey) return;
              setCmsSections((current) =>
                current.map((item) =>
                  item.key === activeCmsKey ? { ...item, isVisible: nextVisible } : item
                )
              );
            }}
            onSaveDraft={async () => {
              if (!activeCmsSection) return;
              setCmsSaving(true);
              setErr(null);
              try {
                const token = getToken();
                const res = await fetch(`${API_BASE_URL}/cms/homepage/${activeCmsSection.key}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({
                    draftContent: activeCmsSection.draftContent,
                    isVisible: activeCmsSection.isVisible,
                  }),
                });

                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(json?.message || json?.error || "Gagal menyimpan draft CMS.");
                }

                if ((json as any)?.item) {
                  setCmsSections((current) =>
                    current.map((item) => (item.key === (json as any).item.key ? (json as any).item : item))
                  );
                }
                setOkMsg(`Draft ${activeCmsSection.label} berhasil disimpan.`);
              } catch (error: unknown) {
                setErr(getErrorMessage(error, "Gagal menyimpan draft CMS."));
              } finally {
                setCmsSaving(false);
              }
            }}
            onPublish={async () => {
              if (!activeCmsSection) return;
              setCmsPublishing(true);
              setErr(null);
              try {
                const token = getToken();
                const res = await fetch(`${API_BASE_URL}/cms/homepage/${activeCmsSection.key}/publish`, {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(json?.message || json?.error || "Gagal publish CMS.");
                }

                if ((json as any)?.item) {
                  setCmsSections((current) =>
                    current.map((item) => (item.key === (json as any).item.key ? (json as any).item : item))
                  );
                }
                setOkMsg(`Section ${activeCmsSection.label} berhasil dipublish.`);
              } catch (error: unknown) {
                setErr(getErrorMessage(error, "Gagal publish CMS."));
              } finally {
                setCmsPublishing(false);
              }
            }}
            onDeleteEntry={async (entry, nextDraft) => {
              if (!activeCmsSection) return;
              setCmsSaving(true);
              setErr(null);
              try {
                const token = getToken();
                const res = await fetch(`${API_BASE_URL}/cms/homepage/${activeCmsSection.key}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({
                    draftContent: nextDraft,
                    isVisible: activeCmsSection.isVisible,
                  }),
                });

                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(json?.message || json?.error || "Gagal menghapus item CMS.");
                }

                if ((json as any)?.item) {
                  setCmsSections((current) =>
                    current.map((item) => (item.key === (json as any).item.key ? (json as any).item : item))
                  );
                }
                setOkMsg(`Konten "${entry.title}" berhasil dihapus dari draft ${activeCmsSection.label}.`);
              } catch (error: unknown) {
                setErr(getErrorMessage(error, "Gagal menghapus item CMS."));
              } finally {
                setCmsSaving(false);
              }
            }}
          />
        )}
        {active === "PARTNER" && (
          <PartnerPanel
            partners={partners}
            onUpdate={handlePartnerUpdate}
            onDelete={handlePartnerDelete}
            busyId={partnerBusy?.id ?? null}
            busyAction={partnerBusy?.action ?? null}
          />
        )}
        {active === "PAYOUTS" && (
          <PayoutsPanel
            payout={payout}
            loading={sectionStatus.payouts.kind === "loading"}
            error={sectionStatus.payouts.kind === "error" ? sectionStatus.payouts.message ?? "Gagal memuat payouts." : null}
          />
        )}
        {active === "PRODUCTS" && (
          <ProductsPanel
            products={products}
            onUpdate={handleProductUpdate}
            onDelete={handleProductDelete}
            deletingId={productDeletingId}
            onFetchAvailability={handleProductAvailabilityFetch}
            onSaveAvailability={handleProductAvailabilitySave}
          />
        )}
        {active === "REPORTS" && (
          <ReportsPanel
            reports={reports}
            loading={sectionStatus.overview.kind === "loading"}
            error={sectionStatus.overview.kind === "error" ? sectionStatus.overview.message ?? "Gagal memuat reports." : null}
          />
        )}
      </div>
    </div>
  );
}

function toast(ok: boolean): CSSProperties {
  return {
    marginTop: 14,
    borderRadius: 16,
    padding: "12px 14px",
    border: ok ? "1px solid rgba(16,185,129,.45)" : "1px solid rgba(244,63,94,.36)",
    color: ok ? "#d1fae5" : "#fee2e2",
    background: ok ? "rgba(16,185,129,.12)" : "rgba(244,63,94,.14)",
    backdropFilter: "blur(8px)",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === "__AUTH_401__") {
    return "Sesi login tidak valid. Klik logout lalu login ulang.";
  }
  return getErrorMessage(error, fallback);
}
