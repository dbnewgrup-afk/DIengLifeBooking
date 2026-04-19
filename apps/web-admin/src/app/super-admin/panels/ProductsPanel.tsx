"use client";
import { useEffect, useMemo, useState } from "react";
import { fmtDateTime, fmtIDR, fmtNum } from "../lib/utils";
import type { Product, ProductAvailability } from "../lib/types";
import { BaseTable, EmptyTableState, SectionTitle, TableFrame, Td, Th } from "../ui/Table";
import ActionButtons from "../ui/ActionButtons";
import DetailModal from "../ui/DetailModal";
import FilterToolbar from "../ui/FilterToolbar";

type ListingTypeValue = "VILLA" | "JEEP" | "TRANSPORT" | "PHOTOGRAPHER";
type ListingUnitTypeValue = "PER_NIGHT" | "PER_DAY" | "PER_TRIP" | "PER_SESSION";

type ProductUpdatePayload = {
  slug: string;
  name: string;
  price: number;
  active: boolean;
  type: ListingTypeValue;
  unitType: ListingUnitTypeValue;
  locationText: string;
  maxGuest: number;
};

type AvailabilitySavePayload = {
  items: Array<{ date: string; stock: number; isAvailable: boolean; priceOverride: number | null }>;
};

export default function ProductsPanel({
  products,
  onUpdate,
  onDelete,
  deletingId,
  onFetchAvailability,
  onSaveAvailability,
}: {
  products: Product[];
  onUpdate: (id: string, payload: ProductUpdatePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  deletingId?: string | null;
  onFetchAvailability: (id: string, month: string) => Promise<ProductAvailability[]>;
  onSaveAvailability: (id: string, payload: AvailabilitySavePayload) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sellerFilter, setSellerFilter] = useState("ALL");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availabilityMonth, setAvailabilityMonth] = useState(getMonthInputValue(new Date()));
  const [availabilityItems, setAvailabilityItems] = useState<ProductAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityForm, setAvailabilityForm] = useState({
    startDate: "",
    endDate: "",
    stock: 0,
    isAvailable: true,
    priceOverride: "",
  });
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId]
  );
  const [form, setForm] = useState<ProductUpdatePayload | null>(null);

  useEffect(() => {
    if (!selectedProduct) {
      setForm(null);
      setIsEditing(false);
      return;
    }
    setForm({
      slug: selectedProduct.slug,
      name: selectedProduct.name,
      price: selectedProduct.price,
      active: selectedProduct.status === "APPROVED",
      type: normalizeListingType(selectedProduct.category),
      unitType: selectedProduct.unitType,
      locationText: selectedProduct.locationText,
      maxGuest: selectedProduct.maxGuest,
    });
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) {
      setAvailabilityItems([]);
      setAvailabilityError(null);
      return;
    }

    let ignore = false;
    setAvailabilityLoading(true);
    setAvailabilityError(null);

    onFetchAvailability(selectedProduct.id, availabilityMonth)
      .then((items) => {
        if (!ignore) {
          setAvailabilityItems(items);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setAvailabilityError(error instanceof Error ? error.message : "Gagal memuat availability.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setAvailabilityLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [availabilityMonth, onFetchAvailability, selectedProduct]);

  const sellerOptions = useMemo(
    () =>
      Array.from(new Set(products.map((product) => product.sellerName))).sort((a, b) => a.localeCompare(b)),
    [products]
  );
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        !query ||
        [product.slug, product.name, product.sellerName].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || product.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || product.category === categoryFilter;
      const matchesSeller = sellerFilter === "ALL" || product.sellerName === sellerFilter;
      return matchesQuery && matchesStatus && matchesCategory && matchesSeller;
    });
  }, [products, query, statusFilter, categoryFilter, sellerFilter]);

  function openProductModal(id: string, mode: "view" | "edit" = "view") {
    setSelectedId(id);
    setIsEditing(mode === "edit");
  }

  function closeProductModal() {
    setSelectedId(null);
    setIsEditing(false);
  }

  async function handleSaveAvailability() {
    if (!selectedProduct) return;
    if (!availabilityForm.startDate || !availabilityForm.endDate) {
      setAvailabilityError("Tanggal mulai dan akhir wajib diisi.");
      return;
    }

    const dates = enumerateDateRange(availabilityForm.startDate, availabilityForm.endDate);
    if (dates.length === 0) {
      setAvailabilityError("Rentang tanggal tidak valid.");
      return;
    }

    setAvailabilitySaving(true);
    setAvailabilityError(null);
    try {
      await onSaveAvailability(selectedProduct.id, {
        items: dates.map((date) => ({
          date,
          stock: availabilityForm.stock,
          isAvailable: availabilityForm.isAvailable,
          priceOverride: normalizePriceOverride(availabilityForm.priceOverride),
        })),
      });
      const refreshed = await onFetchAvailability(selectedProduct.id, availabilityMonth);
      setAvailabilityItems(refreshed);
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : "Gagal menyimpan availability.");
    } finally {
      setAvailabilitySaving(false);
    }
  }

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Products"
        subtitle="Produk di sini langsung membaca listing marketplace yang tersimpan. Lebar kolom dibuat tetap supaya tabel tidak ikut melar sesuai isi data."
      />

      <FilterToolbar
        totalLabel={`${filteredProducts.length} dari ${products.length} produk`}
        onReset={() => {
          setQuery("");
          setStatusFilter("ALL");
          setCategoryFilter("ALL");
          setSellerFilter("ALL");
        }}
        fields={[
          {
            key: "query",
            label: "Cari produk",
            type: "search",
            value: query,
            placeholder: "Slug, nama, seller...",
            onChange: setQuery,
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Semua status", value: "ALL" },
              ...Array.from(new Set(products.map((product) => product.status))).map((status) => ({
                label: status,
                value: status,
              })),
            ],
          },
          {
            key: "category",
            label: "Kategori",
            type: "select",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: "Semua kategori", value: "ALL" },
              ...Array.from(new Set(products.map((product) => product.category))).map((category) => ({
                label: category,
                value: category,
              })),
            ],
          },
          {
            key: "seller",
            label: "Seller",
            type: "select",
            value: sellerFilter,
            onChange: setSellerFilter,
            options: [
              { label: "Semua seller", value: "ALL" },
              ...sellerOptions.map((seller) => ({ label: seller, value: seller })),
            ],
          },
        ]}
      />

      {filteredProducts.length === 0 ? (
        <EmptyTableState message="Belum ada produk yang tersimpan." />
      ) : (
        <TableFrame minWidth={1120}>
          <BaseTable>
            <colgroup>
              <col style={{ width: "13%" }} />
              <col style={{ width: "27%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Slug</Th>
                <Th>Nama</Th>
                <Th>Kategori</Th>
                <Th>Seller</Th>
                <Th style={{ textAlign: "right" }}>Harga</Th>
                <Th style={{ textAlign: "right" }}>Sold</Th>
                <Th>Status</Th>
                <Th style={{ textAlign: "right" }}>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <Td>
                    <div style={{ fontWeight: 800 }}>{product.slug}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                      {fmtDateTime(product.updatedAt)}
                    </div>
                  </Td>
                  <Td style={{ fontWeight: 800 }}>{product.name}</Td>
                  <Td>{product.category}</Td>
                  <Td>{product.sellerName}</Td>
                  <Td style={{ textAlign: "right", fontWeight: 800 }}>{fmtIDR(product.price)}</Td>
                  <Td style={{ textAlign: "right" }}>{fmtNum(product.soldCount)}</Td>
                  <Td>
                    <span
                      style={{
                        display: "inline-flex",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 800,
                        background: product.status === "APPROVED" ? "rgba(16,185,129,.16)" : "rgba(250,204,21,.16)",
                        color: product.status === "APPROVED" ? "#065f46" : "#854d0e",
                      }}
                    >
                      {product.status}
                    </span>
                  </Td>
                  <Td style={{ textAlign: "right" }}>
                    <ActionButtons
                      onView={() => openProductModal(product.id, "view")}
                      onEdit={() => openProductModal(product.id, "edit")}
                      onDelete={() => {
                        void onDelete(product.id).catch(() => undefined);
                      }}
                      disableDelete={deletingId === product.id}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </TableFrame>
      )}

      <DetailModal
        open={Boolean(selectedProduct)}
        onClose={closeProductModal}
        title={selectedProduct?.name || "Detail produk"}
        subtitle={
          selectedProduct
            ? isEditing
              ? `Edit produk • slug ${selectedProduct.slug}`
              : `Slug ${selectedProduct.slug}`
            : undefined
        }
        meta={
          selectedProduct
            ? [
                { label: "Kategori", value: selectedProduct.category },
                { label: "Seller", value: selectedProduct.sellerName },
                { label: "Harga", value: fmtIDR(selectedProduct.price) },
                { label: "Sold", value: fmtNum(selectedProduct.soldCount) },
                { label: "Status", value: selectedProduct.status },
                { label: "Updated", value: fmtDateTime(selectedProduct.updatedAt) },
              ]
            : []
        }
        data={selectedProduct ?? {}}
        content={
          selectedProduct && form ? (
            <div className="grid gap-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Detail produk</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <EditableField
                  label="Slug"
                  value={form.slug}
                  disabled={!isEditing}
                  onChange={(value) =>
                    setForm((current) =>
                      current ? { ...current, slug: value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") } : current
                    )
                  }
                />
                <EditableField
                  label="Nama produk"
                  value={form.name}
                  disabled={!isEditing}
                  onChange={(value) => setForm((current) => (current ? { ...current, name: value } : current))}
                />
                <EditableNumberField
                  label="Harga"
                  value={form.price}
                  disabled={!isEditing}
                  onChange={(value) => setForm((current) => (current ? { ...current, price: value } : current))}
                />
                <EditableNumberField
                  label="Max guest"
                  value={form.maxGuest}
                  disabled={!isEditing}
                  onChange={(value) => setForm((current) => (current ? { ...current, maxGuest: value } : current))}
                />
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  <span>Kategori listing</span>
                  <select
                    value={form.type}
                    disabled={!isEditing}
                    onChange={(event) =>
                      setForm((current) => (current ? { ...current, type: event.target.value as ListingTypeValue } : current))
                    }
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="VILLA">VILLA</option>
                    <option value="JEEP">JEEP</option>
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="PHOTOGRAPHER">PHOTOGRAPHER</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  <span>Unit type</span>
                  <select
                    value={form.unitType}
                    disabled={!isEditing}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, unitType: event.target.value as ListingUnitTypeValue } : current
                      )
                    }
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="PER_NIGHT">PER_NIGHT</option>
                    <option value="PER_DAY">PER_DAY</option>
                    <option value="PER_TRIP">PER_TRIP</option>
                    <option value="PER_SESSION">PER_SESSION</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                  <span>Lokasi</span>
                  <input
                    value={form.locationText}
                    disabled={!isEditing}
                    onChange={(event) =>
                      setForm((current) => (current ? { ...current, locationText: event.target.value } : current))
                    }
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    disabled={!isEditing}
                    onChange={(event) =>
                      setForm((current) => (current ? { ...current, active: event.target.checked } : current))
                    }
                  />
                  Produk aktif / approved
                </label>
              </div>

              <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                      Availability real dari admin
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Checkout sekarang hanya boleh memakai tanggal yang sudah diatur admin. Tidak ada bootstrap stock otomatis lagi.
                    </div>
                  </div>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    <span>Bulan</span>
                    <input
                      type="month"
                      value={availabilityMonth}
                      onChange={(event) => setAvailabilityMonth(event.target.value)}
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                </div>

                <div className="grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
                  <EditableField
                    label="Tanggal mulai"
                    value={availabilityForm.startDate}
                    disabled={availabilitySaving}
                    type="date"
                    onChange={(value) => setAvailabilityForm((current) => ({ ...current, startDate: value }))}
                  />
                  <EditableField
                    label="Tanggal akhir"
                    value={availabilityForm.endDate}
                    disabled={availabilitySaving}
                    type="date"
                    onChange={(value) => setAvailabilityForm((current) => ({ ...current, endDate: value }))}
                  />
                  <EditableNumberField
                    label="Stock"
                    value={availabilityForm.stock}
                    disabled={availabilitySaving}
                    onChange={(value) => setAvailabilityForm((current) => ({ ...current, stock: value }))}
                  />
                  <EditableField
                    label="Override harga"
                    value={availabilityForm.priceOverride}
                    disabled={availabilitySaving}
                    placeholder="Kosongkan jika ikut harga dasar"
                    onChange={(value) => setAvailabilityForm((current) => ({ ...current, priceOverride: value }))}
                  />
                  <label className="flex items-end gap-3 pb-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={availabilityForm.isAvailable}
                      disabled={availabilitySaving}
                      onChange={(event) =>
                        setAvailabilityForm((current) => ({ ...current, isAvailable: event.target.checked }))
                      }
                    />
                    Tanggal aktif
                  </label>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={availabilitySaving}
                    onClick={() => {
                      void handleSaveAvailability();
                    }}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    {availabilitySaving ? "Menyimpan availability..." : "Simpan availability"}
                  </button>
                </div>

                {availabilityError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {availabilityError}
                  </div>
                ) : null}

                {availabilityLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Memuat availability bulan ini...
                  </div>
                ) : availabilityItems.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Belum ada availability tersimpan untuk bulan {availabilityMonth}.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                          <th className="px-4 py-3 text-right font-semibold">Stock</th>
                          <th className="px-4 py-3 text-right font-semibold">Reserved</th>
                          <th className="px-4 py-3 text-right font-semibold">Sisa</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                          <th className="px-4 py-3 text-right font-semibold">Override</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availabilityItems.map((item) => {
                          const remaining = Math.max(0, item.stock - item.reservedCount);
                          return (
                            <tr key={item.id} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-semibold text-slate-900">{item.date}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{fmtNum(item.stock)}</td>
                              <td className="px-4 py-3 text-right text-slate-700">{fmtNum(item.reservedCount)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmtNum(remaining)}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                                    item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {item.isAvailable ? "AKTIF" : "NONAKTIF"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {item.priceOverride === null ? "-" : fmtIDR(item.priceOverride)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null
        }
        footer={
          selectedProduct && form ? (
            <div className="flex flex-wrap justify-end gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900"
                >
                  Enable edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProduct) return;
                      setForm({
                        slug: selectedProduct.slug,
                        name: selectedProduct.name,
                        price: selectedProduct.price,
                        active: selectedProduct.status === "APPROVED",
                        type: normalizeListingType(selectedProduct.category),
                        unitType: selectedProduct.unitType,
                        locationText: selectedProduct.locationText,
                        maxGuest: selectedProduct.maxGuest,
                      });
                      setIsEditing(false);
                    }}
                    className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Batal edit
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={async () => {
                      if (!selectedProduct || !form) return;
                      setIsSaving(true);
                      try {
                        await onUpdate(selectedProduct.id, form);
                        setIsEditing(false);
                      } catch {
                        // Error toast ditangani parent.
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan perubahan"}
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={deletingId === selectedProduct.id}
                onClick={async () => {
                  try {
                    await onDelete(selectedProduct.id);
                  } catch {
                    // Error toast ditangani parent.
                  }
                }}
                className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
              >
                {deletingId === selectedProduct.id ? "Menghapus..." : "Delete produk"}
              </button>
            </div>
          ) : null
        }
      />
    </section>
  );
}

function EditableField({
  label,
  value,
  disabled,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  type?: "text" | "date";
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function EditableNumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function normalizeListingType(category: string): ListingTypeValue {
  if (category === "JEEP") return "JEEP";
  if (category === "TRANSPORT") return "TRANSPORT";
  if (category === "PHOTOGRAPHER") return "PHOTOGRAPHER";
  return "VILLA";
}

function getMonthInputValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function enumerateDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const dates: string[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

function normalizePriceOverride(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
