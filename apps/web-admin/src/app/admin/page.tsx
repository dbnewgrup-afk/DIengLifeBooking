"use client";

export const dynamic = "force-dynamic";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { StatTile } from "@/app/super-admin/ui/StatTile";
import { BaseTable, EmptyTableState, ErrorStateCard, LoadingStateCard, TableFrame, Td, Th } from "@/app/super-admin/ui/Table";
import type { ControlSnapshot, DashboardNotice } from "@/app/super-admin/lib/types";
import DashboardControlPanel from "@/components/dashboard-control/DashboardControlPanel";
import { api } from "@/lib/api/client";
import ReportsPanel from "./panels/ReportsPanel";
import { useAdminTabState } from "./lib/tab-state";

type SellerOption = { id: string; label: string; email: string };
type SellerStatusValue = "ACTIVE" | "PENDING_REVIEW" | "SUSPENDED" | "REJECTED";
type SellerSummary = {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  status: SellerStatusValue;
  productCount: number;
  bookingCount: number;
  balanceAvailable: number;
  balancePending: number;
  createdAt: string;
  updatedAt: string;
};
type AdminOverview = {
  grossReceipts: number;
  adminBalance: number;
  sellerLiability: number;
  totalProducts: number;
  totalPromos: number;
};
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  status: string;
  sellerId: string;
  sellerName: string;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
};
type ProductDetail = {
  id: string;
  sellerId: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  status: string;
  type: string;
  unitType: ProductForm["unitType"];
  locationText: string;
  maxGuest: number;
  trending: boolean;
  rating?: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
};
type PromoRow = {
  id: string;
  slug: string;
  title: string;
  code: string;
  description: string;
  discount: string;
  categoryKey: string;
  isActive: boolean;
  sortOrder: number;
  until: string;
  href: string;
  badge?: string;
  imageUrl?: string;
  terms?: string;
  updatedAt?: string;
};
type TransactionRow = {
  id: string;
  code: string;
  productName: string;
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  promoCode?: string | null;
  createdAt: string;
};
type TransactionDetail = {
  code: string;
  status: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  paymentStatus: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  qty: number;
  guestCount?: number;
  notes?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  customer?: {
    name?: string | null;
    identityNumber?: string | null;
  } | null;
  addons?: Array<{
    key: string;
    label: string;
    price: number;
    enabled: boolean;
  }>;
  promo?: { code: string; title: string } | null;
  items: Array<{
    productId: string;
    name: string;
    qty: number;
    unitPrice: number;
  }>;
  payments: Array<{
    provider: string;
    status: string;
    externalId?: string | null;
    invoiceUrl?: string | null;
    paidAt?: string | null;
  }>;
};

type ProductForm = {
  id?: string;
  sellerId: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  type: "VILLA" | "JEEP" | "TRANSPORT" | "PHOTOGRAPHER";
  unitType: "PER_NIGHT" | "PER_SESSION" | "PER_TRIP" | "PER_DAY";
  locationText: string;
  maxGuest: number;
  trending: boolean;
  rating: number;
  imageUrl: string;
};

type PromoForm = {
  id?: string;
  slug: string;
  title: string;
  code: string;
  description: string;
  discount: string;
  href: string;
  category: "SEMUA" | "VILLA" | "JEEP" | "RENT" | "DOKUMENTASI";
  expiresAt: string;
  sortOrder: number;
  isActive: boolean;
};
type SellerForm = {
  id?: string;
  displayName: string;
  ownerName: string;
  email: string;
  status: SellerStatusValue;
};

type DialogState =
  | { kind: "product"; title: string; item: ProductDetail }
  | { kind: "promo"; title: string; item: PromoRow }
  | { kind: "transaction"; title: string; item: TransactionDetail }
  | { kind: "seller"; title: string; item: SellerSummary }
  | { kind: "seller-edit"; title: string; item: SellerSummary };

const initialProductForm: ProductForm = {
  sellerId: "",
  slug: "",
  name: "",
  description: "",
  price: 0,
  active: true,
  type: "VILLA",
  unitType: "PER_NIGHT",
  locationText: "",
  maxGuest: 2,
  trending: true,
  rating: 4.8,
  imageUrl: "",
};

const initialPromoForm: PromoForm = {
  slug: "",
  title: "",
  code: "",
  description: "",
  discount: "10%",
  href: "/villa",
  category: "SEMUA",
  expiresAt: "2026-12-31T23:59:59.000Z",
  sortOrder: 0,
  isActive: true,
};
const initialSellerForm: SellerForm = {
  displayName: "",
  ownerName: "",
  email: "",
  status: "ACTIVE",
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});
const wideActionColumnStyle = {
  textAlign: "right" as const,
  width: 228,
  minWidth: 228,
  paddingRight: 18,
  whiteSpace: "nowrap" as const,
};
const narrowActionColumnStyle = {
  textAlign: "right" as const,
  width: 120,
  minWidth: 120,
  paddingRight: 18,
  whiteSpace: "nowrap" as const,
};
const actionCellStyle = {
  textAlign: "right" as const,
  overflow: "visible" as const,
  whiteSpace: "nowrap" as const,
  paddingRight: 18,
};

export default function AdminPage() {
  const { activeTab, setActiveTab } = useAdminTabState();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [sellerSummaries, setSellerSummaries] = useState<SellerSummary[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [controlNotices, setControlNotices] = useState<DashboardNotice[]>([]);
  const [controlSnapshot, setControlSnapshot] = useState<ControlSnapshot | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm);
  const [promoForm, setPromoForm] = useState<PromoForm>(initialPromoForm);
  const [sellerForm, setSellerForm] = useState<SellerForm>(initialSellerForm);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [controlSaving, setControlSaving] = useState(false);
  const [controlDeletingId, setControlDeletingId] = useState<string | null>(null);

  const sellerLabel = useMemo(
    () => sellers.find((seller) => seller.id === productForm.sellerId)?.label,
    [productForm.sellerId, sellers]
  );

  async function loadAll() {
    setLoadingData(true);
    setLoadError(null);
    try {
      const [overviewRes, sellersRes, sellerSummaryRes, productsRes, promosRes, transactionsRes, controlNoticeRes, controlSnapshotRes] =
        await Promise.all([
        api.get<{ ok: true; overview: AdminOverview }>("/admin-marketplace/overview"),
        api.get<{ ok: true; items: SellerOption[] }>("/admin-marketplace/sellers"),
        api.get<{ ok: true; items: SellerSummary[] }>("/admin-marketplace/sellers-summary"),
        api.get<{ ok: true; items: ProductRow[] }>("/admin-marketplace/products"),
        api.get<{ ok: true; items: PromoRow[] }>("/promos", {
          query: { includeInactive: true },
        }),
        api.get<{ ok: true; items: TransactionRow[] }>("/admin-marketplace/transactions"),
        api.get<{ ok: true; items: DashboardNotice[] }>("/dashboard-control/notices"),
        api.get<{ ok: true; snapshot: ControlSnapshot }>("/dashboard-control/monitoring"),
      ]);

      setOverview(overviewRes.overview);
      setSellers(sellersRes.items);
      setSellerSummaries(sellerSummaryRes.items);
      setProducts(productsRes.items);
      setPromos(promosRes.items);
      setTransactions(transactionsRes.items);
      setControlNotices(controlNoticeRes.items);
      setControlSnapshot(controlSnapshotRes.snapshot);
      setProductForm((current) => ({
        ...current,
        sellerId: sellersRes.items.some((seller) => seller.id === current.sellerId)
          ? current.sellerId
          : sellersRes.items[0]?.id || "",
      }));
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    void loadAll().catch((err) => {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat dashboard admin.");
    });
  }, []);

  async function loadProductDetail(id: string) {
    const response = await api.get<{ ok: true; item: ProductDetail }>(
      `/products/${encodeURIComponent(id)}`
    );
    return response.item;
  }

  async function loadTransactionDetail(code: string) {
    const response = await api.get<{ ok: true; order: TransactionDetail }>(
      `/orders/${encodeURIComponent(code)}`
    );
    return response.order;
  }

  async function submitProduct(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        sellerId: productForm.sellerId,
        slug: productForm.slug,
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        active: productForm.active,
        type: productForm.type,
        unitType: productForm.unitType,
        locationText: productForm.locationText,
        maxGuest: Number(productForm.maxGuest),
        imageUrl: productForm.imageUrl.trim() || undefined,
        metadata: {
          trending: productForm.trending,
          rating: Number(productForm.rating),
        },
      };

      if (productForm.id) {
        await api.patch(`/products/${encodeURIComponent(productForm.id)}`, payload);
        setMessage(
          "Produk berhasil diperbarui. Jika aktif dan ditandai tampil di homepage, produk akan ikut terbaca oleh frontend."
        );
      } else {
        await api.post("/products", payload);
        setMessage(
          "Produk berhasil ditambahkan. Jika aktif dan ditandai tampil di homepage, produk akan ikut tampil di frontend."
        );
      }

      setProductForm({ ...initialProductForm, sellerId: sellers[0]?.id || "" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPromo(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        slug: promoForm.slug,
        title: promoForm.title,
        code: promoForm.code.toUpperCase(),
        description: promoForm.description,
        discount: promoForm.discount,
        href: promoForm.href,
        category: promoForm.category,
        expiresAt: promoForm.expiresAt,
        sortOrder: Number(promoForm.sortOrder),
        isActive: promoForm.isActive,
      };

      if (promoForm.id) {
        await api.patch(`/promos/${encodeURIComponent(promoForm.id)}`, payload);
        setMessage("Promo berhasil diperbarui.");
      } else {
        await api.post("/promos", payload);
        setMessage("Promo berhasil ditambahkan.");
      }

      setPromoForm(initialPromoForm);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan promo.");
    } finally {
      setBusy(false);
    }
  }

  async function submitSeller(event: React.FormEvent) {
    event.preventDefault();
    if (!sellerForm.id) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await api.patch(`/admin-marketplace/sellers/${encodeURIComponent(sellerForm.id)}`, {
        displayName: sellerForm.displayName,
        ownerName: sellerForm.ownerName,
        email: sellerForm.email,
        status: sellerForm.status,
      });
      await loadAll();
      setDialog(null);
      setSellerForm(initialSellerForm);
      setMessage("Seller berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui seller.");
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(product: ProductRow) {
    if (!window.confirm(`Hapus produk "${product.name}" dari daftar admin?`)) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await api.del(`/products/${encodeURIComponent(product.id)}`);
      await loadAll();
      setMessage("Produk berhasil diarsipkan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk.");
    } finally {
      setBusy(false);
    }
  }

  async function removePromo(promo: PromoRow) {
    if (!window.confirm(`Hapus promo "${promo.title}" dari daftar admin?`)) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await api.del(`/promos/${encodeURIComponent(promo.id)}`);
      await loadAll();
      setMessage("Promo berhasil dihapus dari daftar aktif.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus promo.");
    } finally {
      setBusy(false);
    }
  }

  async function openProductViewer(product: ProductRow) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const item = await loadProductDetail(product.id);
      setDialog({
        kind: "product",
        title: `Detail produk: ${item.name}`,
        item,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail produk.");
    } finally {
      setBusy(false);
    }
  }

  async function openProductEditor(product: ProductRow) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const item = await loadProductDetail(product.id);
      setActiveTab("PRODUCTS");
      setProductForm({
        id: item.id,
        sellerId: item.sellerId,
        slug: item.slug,
        name: item.name,
        description: item.description || item.name,
        price: item.price,
        active: item.active,
        type: mapProductType(item.type),
        unitType: item.unitType,
        locationText: item.locationText || "",
        maxGuest: item.maxGuest || 1,
        trending: Boolean(item.trending),
        rating: typeof item.rating === "number" ? item.rating : 4.8,
        imageUrl: item.images[0] || initialProductForm.imageUrl,
      });
      setMessage("Detail produk berhasil dimuat ke form edit.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data edit produk.");
    } finally {
      setBusy(false);
    }
  }

  function openPromoViewer(promo: PromoRow) {
    setMessage(null);
    setError(null);
    setDialog({
      kind: "promo",
      title: `Detail promo: ${promo.title}`,
      item: promo,
    });
  }

  function openPromoEditor(promo: PromoRow) {
    setActiveTab("PROMOTIONS");
    setPromoForm({
      id: promo.id,
      slug: promo.slug,
      title: promo.title,
      code: promo.code,
      description: promo.description,
      discount: promo.discount,
      href: promo.href,
      category: promo.categoryKey as PromoForm["category"],
      expiresAt: promo.until,
      sortOrder: promo.sortOrder,
      isActive: promo.isActive,
    });
  }

  async function openTransactionViewer(transaction: TransactionRow) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const item = await loadTransactionDetail(transaction.code);
      setDialog({
        kind: "transaction",
        title: `Detail transaksi: ${transaction.code}`,
        item,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail transaksi.");
    } finally {
      setBusy(false);
    }
  }

  function openSellerViewer(seller: SellerSummary) {
    setMessage(null);
    setError(null);
    setDialog({
      kind: "seller",
      title: `Detail seller: ${seller.name}`,
      item: seller,
    });
  }

  function openSellerEditor(seller: SellerSummary) {
    setMessage(null);
    setError(null);
    setSellerForm({
      id: seller.id,
      displayName: seller.name,
      ownerName: seller.ownerName,
      email: seller.email,
      status: seller.status,
    });
    setDialog({
      kind: "seller-edit",
      title: `Edit seller: ${seller.name}`,
      item: seller,
    });
  }

  async function removeSeller(seller: SellerSummary) {
    if (!window.confirm(`Nonaktifkan seller "${seller.name}" dari daftar aktif?`)) {
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await api.del(`/admin-marketplace/sellers/${encodeURIComponent(seller.id)}`);
      await loadAll();
      if (dialog?.kind === "seller" || dialog?.kind === "seller-edit") {
        setDialog(null);
      }
      setMessage("Seller berhasil dinonaktifkan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menonaktifkan seller.");
    } finally {
      setBusy(false);
    }
  }

  async function saveControlNotice(
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
    setMessage(null);
    setError(null);
    try {
      if (id) {
        await api.patch(`/dashboard-control/notices/${encodeURIComponent(id)}`, payload);
        setMessage("Control notice berhasil diperbarui.");
      } else {
        await api.post("/dashboard-control/notices", payload);
        setMessage("Control notice berhasil dibuat.");
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan control notice.");
      throw err;
    } finally {
      setControlSaving(false);
    }
  }

  async function removeControlNotice(id: string) {
    if (!window.confirm("Hapus control notice ini dari dashboard?")) {
      return;
    }
    setControlDeletingId(id);
    setMessage(null);
    setError(null);
    try {
      await api.del(`/dashboard-control/notices/${encodeURIComponent(id)}`);
      setMessage("Control notice berhasil dihapus.");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus control notice.");
      throw err;
    } finally {
      setControlDeletingId(null);
    }
  }

  return (
    <>
      {message ? (
          <div className="mt-4">
            <Banner tone="success" text={message} />
          </div>
        ) : null}
      {error ? (
          <div className="mt-4">
            <Banner tone="error" text={error} />
          </div>
        ) : null}

      <div className="mt-6 space-y-6">
        {activeTab === "OVERVIEW" ? (
          <GlassSection
              eyebrow="Sellers"
              title="Snapshot admin marketplace"
              subtitle="Ringkasan cepat untuk memantau saldo admin, liabilitas seller, dan volume katalog dari satu panel overview."
              aside={<SectionStatus text={`${sellerSummaries.length} seller`} />}
            >
              {loadingData && !overview ? (
                <LoadingStateCard
                  title="Memuat overview admin..."
                  message="Ringkasan marketplace sedang diambil dari backend."
                />
              ) : loadError && !overview ? (
                <ErrorStateCard
                  title="Gagal memuat overview admin"
                  message={loadError}
                />
              ) : overview ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <StatTile title="Gross receipt" value={currency.format(overview.grossReceipts)} tone="teal" />
                  <StatTile title="Saldo admin" value={currency.format(overview.adminBalance)} tone="indigo" />
                  <StatTile title="Liabilitas seller" value={currency.format(overview.sellerLiability)} tone="amber" />
                  <StatTile title="Produk aktif" value={String(overview.totalProducts)} tone="teal" />
                  <StatTile title="Promo" value={String(overview.totalPromos)} tone="indigo" />
                </div>
              ) : (
                <EmptyTableState message="Belum ada ringkasan marketplace yang bisa ditampilkan." />
              )}

              <div className="mt-5 space-y-3">
                <InfoStrip>Seller dipilih saat admin membuat produk, jadi tab ini dipakai untuk cek mapping seller yang tersedia.</InfoStrip>
                <InfoStrip>Produk dan promo tetap dikelola dari tab masing-masing tanpa mengubah logic backend yang sudah ada.</InfoStrip>
              </div>
          </GlassSection>
        ) : null}

        {activeTab === "PRODUCTS" ? (
          <GlassSection
            eyebrow="Products"
            title={productForm.id ? "Edit produk" : "Tambah produk baru"}
            subtitle="Wrapper, spacing, field, dan action area dibuat satu bahasa visual dengan Super Admin. Isi form dan behaviour submit tetap sama."
            aside={<SectionStatus text={productForm.id ? "Mode edit" : "Mode create"} />}
          >
            <div className="surface-card">
              <form className="grid gap-4" onSubmit={submitProduct}>
                <FieldBlock label="Seller">
                  <select
                    value={productForm.sellerId}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        sellerId: event.target.value,
                      }))
                    }
                    className="field"
                  >
                    {sellers.length === 0 ? <option value="">Belum ada seller</option> : null}
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>
                        {seller.label}
                      </option>
                    ))}
                  </select>
                </FieldBlock>

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label="Nama produk">
                    <input
                      value={productForm.name}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nama produk"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Slug">
                    <input
                      value={productForm.slug}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
                        }))
                      }
                      placeholder="Slug"
                      className="field"
                    />
                  </FieldBlock>
                </div>

                <FieldBlock label="Deskripsi produk">
                  <textarea
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Deskripsi produk"
                    className="field min-h-[8rem]"
                  />
                </FieldBlock>

                <div className="grid gap-4 md:grid-cols-3">
                  <FieldBlock label="Harga">
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          price: Number(event.target.value),
                        }))
                      }
                      placeholder="Harga"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Tipe">
                    <select
                      value={productForm.type}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          type: event.target.value as ProductForm["type"],
                        }))
                      }
                      className="field"
                    >
                      <option value="VILLA">Villa</option>
                      <option value="JEEP">Jeep</option>
                      <option value="TRANSPORT">Transport</option>
                      <option value="PHOTOGRAPHER">Dokumentasi</option>
                    </select>
                  </FieldBlock>
                  <FieldBlock label="Unit">
                    <select
                      value={productForm.unitType}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          unitType: event.target.value as ProductForm["unitType"],
                        }))
                      }
                      className="field"
                    >
                      <option value="PER_NIGHT">Per malam</option>
                      <option value="PER_SESSION">Per sesi</option>
                      <option value="PER_TRIP">Per trip</option>
                      <option value="PER_DAY">Per hari</option>
                    </select>
                  </FieldBlock>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FieldBlock label="Lokasi">
                    <input
                      value={productForm.locationText}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          locationText: event.target.value,
                        }))
                      }
                      placeholder="Lokasi"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Max guest">
                    <input
                      type="number"
                      value={productForm.maxGuest}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          maxGuest: Number(event.target.value),
                        }))
                      }
                      placeholder="Max guest"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Rating">
                    <input
                      type="number"
                      step="0.1"
                      value={productForm.rating}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          rating: Number(event.target.value),
                        }))
                      }
                      placeholder="Rating"
                      className="field"
                    />
                  </FieldBlock>
                </div>

                <FieldBlock label="Image URL">
                  <input
                    value={productForm.imageUrl}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        imageUrl: event.target.value,
                      }))
                    }
                    placeholder="/images/products/villa-aster.jpg"
                    className="field"
                  />
                </FieldBlock>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={productForm.active}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          active: event.target.checked,
                        }))
                      }
                    />
                    <span>Produk aktif</span>
                  </label>

                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={productForm.trending}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          trending: event.target.checked,
                        }))
                      }
                    />
                    <span>Tampilkan di homepage</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button type="submit" disabled={busy} className="action-primary">
                    {productForm.id ? "Update produk" : "Tambah produk"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProductForm({
                        ...initialProductForm,
                        sellerId: sellers[0]?.id || "",
                      })
                    }
                    className="action-secondary"
                  >
                    Reset
                  </button>
                </div>

                <InfoStrip>
                  Seller terpilih: <strong>{sellerLabel || "-"}</strong>. Produk hanya bisa dibuat admin dan langsung di-mapping ke seller ini.
                </InfoStrip>
                <InfoStrip>
                  Agar produk masuk ke homepage frontend, centang `Produk aktif` dan `Tampilkan di homepage`.
                </InfoStrip>
              </form>
            </div>
          </GlassSection>
        ) : null}

        {activeTab === "CONTROL" ? (
          <div className="mt-6">
            <GlassSection
              eyebrow="Control"
              title="Control center seller-affiliate"
              subtitle="Admin bisa kirim notice ke seller, affiliate, atau semua user, lalu memantau aktivitas operasional seller-affiliate tanpa mengubah saldo dan komisi."
              aside={<SectionStatus text={`${controlNotices.length} notice`} />}
            >
              <DashboardControlPanel
                notices={controlNotices}
                snapshot={controlSnapshot}
                loading={loadingData}
                error={loadError}
                saving={controlSaving}
                deletingId={controlDeletingId}
                onSaveNotice={saveControlNotice}
                onDeleteNotice={removeControlNotice}
              />
            </GlassSection>
          </div>
        ) : null}

          {activeTab === "PROMOTIONS" ? (
            <GlassSection
            eyebrow="Promotions"
            title={promoForm.id ? "Edit promo" : "Tambah promo baru"}
            subtitle="Tampilan promo disamakan level visualnya dengan panel Super Admin, tanpa mengubah field, urutan form, atau aksi submit."
            aside={<SectionStatus text={promoForm.id ? "Mode edit" : "Mode create"} />}
          >
            <div className="surface-card">
              <form className="grid gap-4" onSubmit={submitPromo}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label="Judul promo">
                    <input
                      value={promoForm.title}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Judul promo"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Slug promo">
                    <input
                      value={promoForm.slug}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
                        }))
                      }
                      placeholder="Slug promo"
                      className="field"
                    />
                  </FieldBlock>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <FieldBlock label="Kode promo">
                    <input
                      value={promoForm.code}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          code: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Kode promo"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Diskon">
                    <input
                      value={promoForm.discount}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          discount: event.target.value,
                        }))
                      }
                      placeholder="10% / 50000"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Kategori">
                    <select
                      value={promoForm.category}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          category: event.target.value as PromoForm["category"],
                        }))
                      }
                      className="field"
                    >
                      <option value="SEMUA">Semua</option>
                      <option value="VILLA">Villa</option>
                      <option value="JEEP">Jeep</option>
                      <option value="RENT">Rent</option>
                      <option value="DOKUMENTASI">Dokumentasi</option>
                    </select>
                  </FieldBlock>
                </div>

                <FieldBlock label="Deskripsi promo">
                  <textarea
                    value={promoForm.description}
                    onChange={(event) =>
                      setPromoForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Deskripsi promo"
                    className="field min-h-[8rem]"
                  />
                </FieldBlock>

                <div className="grid gap-4 md:grid-cols-3">
                  <FieldBlock label="Href">
                    <input
                      value={promoForm.href}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          href: event.target.value,
                        }))
                      }
                      placeholder="/villa"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Sort order">
                    <input
                      type="number"
                      value={promoForm.sortOrder}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          sortOrder: Number(event.target.value),
                        }))
                      }
                      placeholder="Sort order"
                      className="field"
                    />
                  </FieldBlock>
                  <FieldBlock label="Expires at">
                    <input
                      value={promoForm.expiresAt}
                      onChange={(event) =>
                        setPromoForm((current) => ({
                          ...current,
                          expiresAt: event.target.value,
                        }))
                      }
                      placeholder="2026-12-31T23:59:59.000Z"
                      className="field"
                    />
                  </FieldBlock>
                </div>

                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={promoForm.isActive}
                    onChange={(event) =>
                      setPromoForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  <span>Promo aktif</span>
                </label>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button type="submit" disabled={busy} className="action-primary">
                    {promoForm.id ? "Update promo" : "Tambah promo"}
                  </button>
                  <button type="button" onClick={() => setPromoForm(initialPromoForm)} className="action-secondary">
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </GlassSection>
          ) : null}
        </div>

        {activeTab === "PRODUCTS" ? (
          <div className="mt-6">
            <GlassSection
          eyebrow="Products"
          title="Produk marketplace"
          subtitle="Table shell, action pill, badge, spacing, dan hierarchy visual dibuat mengikuti bahasa Super Admin."
        >
          <TableFrame minWidth={1080}>
            <BaseTable>
              <thead>
                <tr>
                  <Th>Produk</Th>
                  <Th>Seller</Th>
                  <Th>Kategori</Th>
                  <Th>Status</Th>
                  <Th style={{ textAlign: "right" }}>Harga</Th>
                  <Th style={{ textAlign: "right" }}>Terjual</Th>
                  <Th style={wideActionColumnStyle}>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <Td colSpan={7} style={{ padding: 18 }}>
                      <EmptyTableState
                        message={
                          loadingData
                            ? "Produk marketplace sedang dimuat dari backend."
                            : "Belum ada produk marketplace yang tampil di dashboard admin."
                        }
                      />
                    </Td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <Td>
                        <div className="font-semibold text-slate-900">{product.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{product.slug}</div>
                      </Td>
                      <Td>{product.sellerName}</Td>
                      <Td>
                        <InlineBadge tone="cyan" text={product.category} />
                      </Td>
                      <Td>
                        <InlineBadge tone={product.status === "APPROVED" ? "green" : "slate"} text={product.status} />
                      </Td>
                      <Td style={{ textAlign: "right", fontWeight: 700 }}>{currency.format(product.price)}</Td>
                      <Td style={{ textAlign: "right" }}>{product.soldCount}</Td>
                      <Td style={actionCellStyle}>
                        <div className="table-actions">
                          <button type="button" onClick={() => void openProductViewer(product)} disabled={busy} className="chip">
                            View
                          </button>
                          <button type="button" onClick={() => void openProductEditor(product)} disabled={busy} className="chip">
                            Edit
                          </button>
                          <button type="button" onClick={() => void removeProduct(product)} disabled={busy} className="chip chip-danger">
                            Hapus
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </BaseTable>
          </TableFrame>
        </GlassSection>
          </div>
        ) : null}

        {activeTab === "PROMOTIONS" ? (
          <div className="mt-6">
            <GlassSection
          eyebrow="Promotions"
          title="Promo marketplace"
          subtitle="Struktur data promo tetap sama, hanya dibungkus dengan frame tabel, badge status, dan action pill yang konsisten."
        >
          <TableFrame minWidth={980}>
            <BaseTable>
              <thead>
                <tr>
                  <Th>Promo</Th>
                  <Th>Kode</Th>
                  <Th>Kategori</Th>
                  <Th>Diskon</Th>
                  <Th>Status</Th>
                  <Th style={wideActionColumnStyle}>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {promos.length === 0 ? (
                  <tr>
                    <Td colSpan={6} style={{ padding: 18 }}>
                      <EmptyTableState
                        message={
                          loadingData
                            ? "Promo marketplace sedang dimuat dari backend."
                            : "Belum ada promo marketplace yang tampil di dashboard admin."
                        }
                      />
                    </Td>
                  </tr>
                ) : (
                  promos.map((promo) => (
                    <tr key={promo.id}>
                      <Td>
                        <div className="font-semibold text-slate-900">{promo.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{promo.slug}</div>
                      </Td>
                      <Td>{promo.code}</Td>
                      <Td>
                        <InlineBadge tone="cyan" text={promo.categoryKey} />
                      </Td>
                      <Td>{promo.discount}</Td>
                      <Td>
                        <InlineBadge tone={promo.isActive ? "green" : "slate"} text={promo.isActive ? "ACTIVE" : "INACTIVE"} />
                      </Td>
                      <Td style={actionCellStyle}>
                        <div className="table-actions">
                          <button type="button" onClick={() => openPromoViewer(promo)} disabled={busy} className="chip">
                            View
                          </button>
                          <button type="button" onClick={() => openPromoEditor(promo)} disabled={busy} className="chip">
                            Edit
                          </button>
                          <button type="button" onClick={() => void removePromo(promo)} disabled={busy} className="chip chip-danger">
                            Hapus
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </BaseTable>
          </TableFrame>
        </GlassSection>
          </div>
        ) : null}

        {activeTab === "TRANSACTIONS" ? (
          <div className="mt-6">
            <GlassSection
          eyebrow="Transactions"
          title="Transaksi global"
          subtitle="Panel transaksi dipertahankan utuh, hanya dinaikkan kualitas visual shell, table, dan status area-nya."
        >
          <TableFrame minWidth={1120}>
            <BaseTable>
              <thead>
                <tr>
                  <Th>Kode</Th>
                  <Th>Produk</Th>
                  <Th>Buyer</Th>
                  <Th>Seller</Th>
                  <Th>Status bayar</Th>
                  <Th>Promo</Th>
                  <Th style={{ textAlign: "right" }}>Total</Th>
                  <Th style={narrowActionColumnStyle}>Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <Td colSpan={8} style={{ padding: 18 }}>
                      {loadingData ? (
                        <LoadingStateCard
                          title="Memuat transaksi..."
                          message="Daftar transaksi global sedang diambil dari backend."
                        />
                      ) : loadError ? (
                        <ErrorStateCard
                          title="Gagal memuat transaksi"
                          message={loadError}
                        />
                      ) : (
                        <EmptyTableState message="Belum ada transaksi global yang tampil di dashboard admin." />
                      )}
                    </Td>
                  </tr>
                ) : (
                  transactions.map((row) => (
                    <tr key={row.id}>
                      <Td>{row.code}</Td>
                      <Td>{row.productName}</Td>
                      <Td>
                        <div className="font-semibold text-slate-900">{row.buyerName}</div>
                        <div className="mt-1 text-xs text-slate-500">{row.buyerEmail}</div>
                      </Td>
                      <Td>{row.sellerName}</Td>
                      <Td>
                        <InlineBadge
                          tone={row.paymentStatus === "PAID" ? "green" : row.paymentStatus === "PENDING" ? "amber" : "slate"}
                          text={row.paymentStatus}
                        />
                      </Td>
                      <Td>{row.promoCode || "-"}</Td>
                      <Td style={{ textAlign: "right", fontWeight: 700 }}>{currency.format(row.totalAmount)}</Td>
                      <Td style={actionCellStyle}>
                        <button type="button" onClick={() => void openTransactionViewer(row)} disabled={busy} className="chip">
                          View
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </BaseTable>
          </TableFrame>
        </GlassSection>
          </div>
        ) : null}

        {activeTab === "SELLERS" ? (
          <div className="mt-6">
            <GlassSection
            eyebrow="Sellers"
            title="Daftar semua seller"
            subtitle="Semua seller dari backend ditampilkan apa adanya, termasuk status ACTIVE, PENDING_REVIEW, SUSPENDED, dan REJECTED."
            aside={<SectionStatus text={`${sellerSummaries.length} seller`} />}
          >
            <TableFrame minWidth={1140}>
              <BaseTable>
                <thead>
                  <tr>
                    <Th>Seller</Th>
                    <Th>Owner</Th>
                    <Th>Email</Th>
                    <Th>Status</Th>
                    <Th style={{ textAlign: "right" }}>Produk</Th>
                    <Th style={{ textAlign: "right" }}>Booking</Th>
                    <Th style={wideActionColumnStyle}>Aksi</Th>
                  </tr>
                </thead>
                <tbody>
                  {sellerSummaries.length === 0 ? (
                    <tr>
                      <Td colSpan={7} style={{ padding: 18 }}>
                        <EmptyTableState
                          message={
                            loadingData
                              ? "Seller sedang dimuat dari backend."
                              : "Belum ada seller yang tampil di dashboard admin."
                          }
                        />
                      </Td>
                    </tr>
                  ) : (
                    sellerSummaries.map((seller) => (
                      <tr key={seller.id}>
                        <Td>
                          <div className="font-semibold text-slate-900">{seller.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{seller.id}</div>
                        </Td>
                        <Td>{seller.ownerName}</Td>
                        <Td>{seller.email}</Td>
                        <Td>
                          <InlineBadge
                            tone={seller.status === "ACTIVE" ? "green" : seller.status === "PENDING_REVIEW" ? "amber" : "slate"}
                            text={seller.status}
                          />
                        </Td>
                        <Td style={{ textAlign: "right" }}>{seller.productCount}</Td>
                        <Td style={{ textAlign: "right" }}>{seller.bookingCount}</Td>
                        <Td style={actionCellStyle}>
                          <div className="table-actions">
                            <button type="button" onClick={() => openSellerViewer(seller)} disabled={busy} className="chip">
                              View
                            </button>
                            <button type="button" onClick={() => openSellerEditor(seller)} disabled={busy} className="chip">
                              Edit
                            </button>
                            <button type="button" onClick={() => void removeSeller(seller)} disabled={busy} className="chip chip-danger">
                              Hapus
                            </button>
                          </div>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </BaseTable>
            </TableFrame>
          </GlassSection>
          </div>
        ) : null}

        {activeTab === "REPORTS" ? (
          <div className="mt-6">
            <ReportsPanel />
          </div>
        ) : null}

        {dialog ? (
          <ActionModal title={dialog.title} onClose={() => (!busy ? setDialog(null) : null)}>
            {dialog.kind === "product" ? (
              <DetailGrid>
                <DetailItem label="Nama" value={dialog.item.name} />
                <DetailItem label="Slug" value={dialog.item.slug} />
                <DetailItem
                  label="Seller"
                  value={sellers.find((seller) => seller.id === dialog.item.sellerId)?.label || dialog.item.sellerId}
                />
                <DetailItem label="Status" value={dialog.item.status} />
                <DetailItem label="Kategori" value={mapProductType(dialog.item.type)} />
                <DetailItem label="Harga" value={currency.format(dialog.item.price)} />
                <DetailItem label="Unit" value={dialog.item.unitType} />
                <DetailItem label="Lokasi" value={dialog.item.locationText} />
                <DetailItem label="Max guest" value={String(dialog.item.maxGuest)} />
                <DetailItem label="Trending" value={dialog.item.trending ? "Ya" : "Tidak"} />
                <DetailItem label="Rating" value={String(dialog.item.rating ?? "-")} />
                <DetailItem label="Image URL" value={dialog.item.images[0] || "-"} breakAll />
                <DetailItem label="Deskripsi" value={dialog.item.description || "-"} fullWidth />
                <DetailItem label="Dibuat" value={formatDateTime(dialog.item.createdAt)} />
                <DetailItem label="Diupdate" value={formatDateTime(dialog.item.updatedAt)} />
              </DetailGrid>
            ) : null}

            {dialog.kind === "promo" ? (
              <DetailGrid>
                <DetailItem label="Judul" value={dialog.item.title} />
                <DetailItem label="Slug" value={dialog.item.slug} />
                <DetailItem label="Kode" value={dialog.item.code} />
                <DetailItem label="Kategori" value={dialog.item.categoryKey} />
                <DetailItem label="Diskon" value={dialog.item.discount} />
                <DetailItem label="Status" value={dialog.item.isActive ? "ACTIVE" : "INACTIVE"} />
                <DetailItem label="Urutan" value={String(dialog.item.sortOrder)} />
                <DetailItem label="Link tujuan" value={dialog.item.href} breakAll />
                <DetailItem label="Image URL" value={dialog.item.imageUrl || "-"} breakAll />
                <DetailItem label="Badge" value={dialog.item.badge || "-"} />
                <DetailItem label="Berlaku sampai" value={formatDateTime(dialog.item.until)} />
                <DetailItem label="Deskripsi" value={dialog.item.description} fullWidth />
                <DetailItem label="Syarat & ketentuan" value={dialog.item.terms || "-"} fullWidth />
              </DetailGrid>
            ) : null}

            {dialog.kind === "transaction" ? (
              <div className="space-y-5">
                <DetailGrid>
                  <DetailItem label="Kode" value={dialog.item.code} />
                  <DetailItem label="Status booking" value={dialog.item.status} />
                  <DetailItem label="Status bayar" value={dialog.item.paymentStatus} />
                  <DetailItem label="Quantity" value={String(dialog.item.qty)} />
                  <DetailItem label="Subtotal" value={currency.format(dialog.item.subtotal)} />
                  <DetailItem label="Total" value={currency.format(dialog.item.total)} />
                  <DetailItem label="Diskon" value={currency.format(dialog.item.discountAmount)} />
                  <DetailItem
                    label="Promo"
                    value={dialog.item.promo ? `${dialog.item.promo.code} - ${dialog.item.promo.title}` : "-"}
                  />
                  <DetailItem
                    label="Jadwal"
                    value={formatDateRange(dialog.item.startDate, dialog.item.endDate)}
                  />
                  <DetailItem
                    label="Jumlah tamu"
                    value={dialog.item.guestCount !== undefined ? String(dialog.item.guestCount) : "-"}
                  />
                  <DetailItem
                    label="Nama buyer"
                    value={dialog.item.customer?.name || "-"}
                  />
                  <DetailItem label="Buyer email" value={dialog.item.buyerEmail || "-"} breakAll />
                  <DetailItem label="Buyer phone" value={dialog.item.buyerPhone || "-"} />
                  <DetailItem
                    label="Nomor identitas"
                    value={dialog.item.customer?.identityNumber || "-"}
                  />
                  <DetailItem label="Dibuat" value={formatDateTime(dialog.item.createdAt)} />
                  <DetailItem
                    label="Catatan buyer"
                    value={dialog.item.notes || "-"}
                    fullWidth
                  />
                </DetailGrid>

                <div className="grid gap-3">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Items</div>
                  {dialog.item.items.map((item) => (
                    <div key={`${dialog.item.code}-${item.productId}`} className="rounded-[16px] border border-slate-200 bg-slate-50/90 px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Qty {item.qty} • Harga satuan {currency.format(item.unitPrice)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Payments</div>
                  {dialog.item.payments.length === 0 ? (
                    <InfoStrip>Belum ada riwayat payment pada transaksi ini.</InfoStrip>
                  ) : (
                    dialog.item.payments.map((payment, index) => (
                      <div key={`${payment.provider}-${index}`} className="rounded-[16px] border border-slate-200 bg-slate-50/90 px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {payment.provider} • {payment.status}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {payment.externalId || "-"} {payment.paidAt ? `• ${formatDateTime(payment.paidAt)}` : ""}
                        </div>
                        <div className="mt-1 break-all text-xs text-slate-500">{payment.invoiceUrl || "-"}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {dialog.kind === "seller" ? (
              <DetailGrid>
                <DetailItem label="Nama seller" value={dialog.item.name} />
                <DetailItem label="Owner" value={dialog.item.ownerName} />
                <DetailItem label="Email" value={dialog.item.email} breakAll />
                <DetailItem label="Status" value={dialog.item.status} />
                <DetailItem label="Produk" value={String(dialog.item.productCount)} />
                <DetailItem label="Booking" value={String(dialog.item.bookingCount)} />
                <DetailItem label="Saldo available" value={currency.format(dialog.item.balanceAvailable)} />
                <DetailItem label="Saldo pending" value={currency.format(dialog.item.balancePending)} />
                <DetailItem label="Dibuat" value={formatDateTime(dialog.item.createdAt)} />
                <DetailItem label="Diupdate" value={formatDateTime(dialog.item.updatedAt)} />
              </DetailGrid>
            ) : null}

            {dialog.kind === "seller-edit" ? (
              <form className="grid gap-4" onSubmit={submitSeller}>
                <FieldBlock label="Display name">
                  <input
                    className="field"
                    value={sellerForm.displayName}
                    onChange={(event) =>
                      setSellerForm((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    required
                  />
                </FieldBlock>
                <FieldBlock label="Owner name">
                  <input
                    className="field"
                    value={sellerForm.ownerName}
                    onChange={(event) =>
                      setSellerForm((current) => ({
                        ...current,
                        ownerName: event.target.value,
                      }))
                    }
                    required
                  />
                </FieldBlock>
                <FieldBlock label="Email">
                  <input
                    className="field"
                    type="email"
                    value={sellerForm.email}
                    onChange={(event) =>
                      setSellerForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                  />
                </FieldBlock>
                <FieldBlock label="Status">
                  <select
                    className="field"
                    value={sellerForm.status}
                    onChange={(event) =>
                      setSellerForm((current) => ({
                        ...current,
                        status: event.target.value as SellerStatusValue,
                      }))
                    }
                  >
                    {["ACTIVE", "PENDING_REVIEW", "SUSPENDED", "REJECTED"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </FieldBlock>

                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" disabled={busy} onClick={() => setDialog(null)} className="action-secondary">
                    Batal
                  </button>
                  <button type="submit" disabled={busy} className="action-primary">
                    {busy ? "Menyimpan..." : "Simpan perubahan"}
                  </button>
                </div>
              </form>
            ) : null}
          </ActionModal>
        ) : null}

        <style jsx>{`
          .surface-card {
            border-radius: 22px;
            border: 1px solid rgba(255, 255, 255, 0.62);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(241, 245, 249, 0.96) 100%);
            padding: 1.15rem;
            box-shadow:
              0 16px 36px rgba(15, 23, 42, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.72);
          }

          .field {
            width: 100%;
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, 0.34);
            background: rgba(255, 255, 255, 0.94);
            color: #0f172a;
            padding: 0.88rem 0.95rem;
            font-size: 0.95rem;
            line-height: 1.45rem;
            outline: none;
            transition:
              border-color 0.18s ease,
              box-shadow 0.18s ease,
              background-color 0.18s ease,
              transform 0.18s ease;
          }

          .field::placeholder {
            color: #64748b;
          }

          .field:focus {
            border-color: rgba(37, 99, 235, 0.45);
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.16);
          }

          .action-primary,
          .action-secondary,
          .chip,
          .chip-danger {
            border: 0;
            border-radius: 999px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.88rem;
            font-weight: 800;
            letter-spacing: 0.01em;
            white-space: nowrap;
            flex-shrink: 0;
            transition:
              transform 0.18s ease,
              box-shadow 0.18s ease,
              opacity 0.18s ease,
              background-color 0.18s ease;
          }

          .action-primary,
          .action-secondary {
            padding: 0.82rem 1.16rem;
          }

          .chip,
          .chip-danger {
            padding: 0.62rem 0.95rem;
          }

          .action-primary {
            background: linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%);
            color: #ecfeff;
            box-shadow: 0 14px 28px rgba(14, 165, 233, 0.24);
          }

          .action-secondary {
            background: rgba(226, 232, 240, 0.7);
            color: #1e293b;
            box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.26);
          }

          .chip {
            background: rgba(219, 234, 254, 0.78);
            color: #1d4ed8;
            box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.28);
          }

          .chip-danger {
            background: rgba(254, 226, 226, 0.84);
            color: #b91c1c;
            box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.24);
          }

          .action-primary:hover,
          .action-secondary:hover,
          .chip:hover,
          .chip-danger:hover {
            transform: translateY(-1px);
          }

          .action-primary:disabled,
          .action-secondary:disabled,
          .chip:disabled,
          .chip-danger:disabled {
            cursor: not-allowed;
            opacity: 0.62;
            transform: none;
            box-shadow: none;
          }

          .table-actions {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: nowrap;
            width: max-content;
            margin-left: auto;
          }

          .toggle-row {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, 0.24);
            background: rgba(248, 250, 252, 0.9);
            padding: 0.92rem 1rem;
            color: #0f172a;
            font-size: 0.92rem;
            font-weight: 700;
          }

          .toggle-row input {
            height: 1.02rem;
            width: 1.02rem;
            accent-color: #2563eb;
          }
        `}</style>
    </>
  );
}

function mapProductType(type: string): ProductForm["type"] {
  if (type === "villa" || type === "VILLA") return "VILLA";
  if (type === "jeep" || type === "JEEP") return "JEEP";
  if (type === "transport" || type === "TRANSPORT") return "TRANSPORT";
  return "PHOTOGRAPHER";
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateTime.format(date);
}

function formatDateOnly(value?: string | null) {
  if (!value) return "-";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "-";
  return `${formatDateOnly(start)}${end ? ` - ${formatDateOnly(end)}` : ""}`;
}

function GlassSection({
  eyebrow,
  title,
  subtitle,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-white/14 bg-[rgba(15,23,42,0.28)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-200/70">{eyebrow}</div>
          <h2 className="mt-2 text-xl font-black text-white md:text-[24px]">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-200/85">{subtitle}</p>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ActionModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/60 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.28)] md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">View / Edit</div>
            <h3 className="mt-2 text-xl font-black text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-extrabold text-sky-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function DetailItem({
  label,
  value,
  breakAll,
  fullWidth,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-[18px] border border-slate-200 bg-slate-50/90 px-4 py-3 ${
        fullWidth ? "md:col-span-2" : ""
      }`}
    >
      <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={`mt-2 text-sm leading-6 text-slate-900 ${breakAll ? "break-all" : ""}`}>{value}</div>
    </div>
  );
}

function SectionStatus({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white/90">
      {text}
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function InfoStrip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-6 text-slate-600">
      {children}
    </div>
  );
}

function Banner({ tone, text }: { tone: "success" | "error"; text: string }) {
  const palette =
    tone === "success"
      ? {
          border: "border-emerald-200/70",
          background: "bg-emerald-50/92",
          text: "text-emerald-900",
        }
      : {
          border: "border-rose-200/70",
          background: "bg-rose-50/92",
          text: "text-rose-900",
        };

  return (
    <div className={`rounded-[22px] border px-4 py-3 text-sm font-semibold shadow-sm ${palette.border} ${palette.background} ${palette.text}`}>
      {text}
    </div>
  );
}

function InlineBadge({
  tone,
  text,
}: {
  tone: "green" | "amber" | "cyan" | "slate";
  text: string;
}) {
  const palette =
    tone === "green"
      ? {
          background: "rgba(220,252,231,0.92)",
          color: "#166534",
          border: "rgba(134,239,172,0.8)",
        }
      : tone === "amber"
        ? {
            background: "rgba(254,243,199,0.94)",
            color: "#92400e",
            border: "rgba(252,211,77,0.78)",
          }
        : tone === "cyan"
          ? {
              background: "rgba(224,242,254,0.94)",
              color: "#075985",
              border: "rgba(125,211,252,0.8)",
            }
          : {
              background: "rgba(226,232,240,0.92)",
              color: "#334155",
              border: "rgba(148,163,184,0.52)",
            };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        color: palette.color,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.12em",
        padding: "0.38rem 0.72rem",
        textTransform: "uppercase",
      }}
    >
      {text}
    </span>
  );
}
