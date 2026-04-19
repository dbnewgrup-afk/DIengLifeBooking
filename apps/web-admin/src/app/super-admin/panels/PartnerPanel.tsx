"use client";
import { useEffect, useMemo, useState } from "react";
import { fmtDateTime, fmtIDR, fmtNum } from "../lib/utils";
import type { PartnerRow } from "../lib/types";
import { BaseTable, EmptyTableState, SectionTitle, TableFrame, Td, Th } from "../ui/Table";
import ActionButtons from "../ui/ActionButtons";
import DetailModal from "../ui/DetailModal";
import FilterToolbar from "../ui/FilterToolbar";

type PartnerForm = {
  name: string;
  ownerName: string;
  email: string;
  status: PartnerRow["status"];
};

export default function PartnerPanel({
  partners,
  onUpdate,
  onDelete,
  busyId,
  busyAction,
}: {
  partners: PartnerRow[];
  onUpdate: (id: string, patch: PartnerForm) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busyId?: string | null;
  busyAction?: "update" | "delete" | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [isEditing, setIsEditing] = useState(false);
  const selectedPartner = useMemo(
    () => partners.find((partner) => partner.id === selectedId) ?? null,
    [partners, selectedId]
  );
  const [form, setForm] = useState<PartnerForm | null>(null);
  const isUpdating = (id: string) => busyId === id && busyAction === "update";
  const isDeleting = (id: string) => busyId === id && busyAction === "delete";

  useEffect(() => {
    if (!selectedPartner) {
      setForm(null);
      setIsEditing(false);
      return;
    }
    setForm({
      name: selectedPartner.name,
      ownerName: selectedPartner.ownerName,
      email: selectedPartner.email,
      status: selectedPartner.status,
    });
  }, [selectedPartner]);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesQuery =
        !query ||
        [partner.name, partner.ownerName, partner.email]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || partner.status === statusFilter;
      const matchesActivity =
        activityFilter === "ALL" ||
        (activityFilter === "WITH_PRODUCTS" ? partner.productCount > 0 : partner.productCount === 0);
      return matchesQuery && matchesStatus && matchesActivity;
    });
  }, [partners, query, statusFilter, activityFilter]);

  function openPartnerModal(id: string, mode: "view" | "edit" = "view") {
    setSelectedId(id);
    setIsEditing(mode === "edit");
  }

  function closePartnerModal() {
    setSelectedId(null);
    setIsEditing(false);
  }

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Seller"
        subtitle="Daftar seller ini langsung diambil dari profil seller backend, termasuk status verifikasi, jumlah listing, booking, dan saldo wallet."
      />

      <FilterToolbar
        totalLabel={`${filteredPartners.length} dari ${partners.length} seller`}
        onReset={() => {
          setQuery("");
          setStatusFilter("ALL");
          setActivityFilter("ALL");
        }}
        fields={[
          {
            key: "query",
            label: "Cari seller",
            type: "search",
            value: query,
            placeholder: "Nama seller, owner, email...",
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
              { label: "Active", value: "ACTIVE" },
              { label: "Pending review", value: "PENDING_REVIEW" },
              { label: "Suspended", value: "SUSPENDED" },
              { label: "Rejected", value: "REJECTED" },
            ],
          },
          {
            key: "activity",
            label: "Aktivitas listing",
            type: "select",
            value: activityFilter,
            onChange: setActivityFilter,
            options: [
              { label: "Semua seller", value: "ALL" },
              { label: "Punya produk", value: "WITH_PRODUCTS" },
              { label: "Belum punya produk", value: "WITHOUT_PRODUCTS" },
            ],
          },
        ]}
      />

      {filteredPartners.length === 0 ? (
        <EmptyTableState message="Belum ada seller yang cocok dengan filter saat ini." />
      ) : (
        <TableFrame minWidth={1120}>
          <BaseTable>
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Seller</Th>
                <Th>Kontak</Th>
                <Th>Status</Th>
                <Th style={{ textAlign: "right" }}>Produk</Th>
                <Th style={{ textAlign: "right" }}>Booking</Th>
                <Th style={{ textAlign: "right" }}>Saldo Ready</Th>
                <Th style={{ textAlign: "right" }}>Saldo Pending</Th>
                <Th style={{ textAlign: "right" }}>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr key={partner.id}>
                  <Td>
                    <div style={{ fontWeight: 800 }}>{partner.name}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                      Owner: {partner.ownerName}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                      Update {fmtDateTime(partner.updatedAt)}
                    </div>
                  </Td>
                  <Td>{partner.email}</Td>
                  <Td>
                    <SellerStatusPill status={partner.status} />
                  </Td>
                  <Td style={{ textAlign: "right" }}>{fmtNum(partner.productCount)}</Td>
                  <Td style={{ textAlign: "right" }}>{fmtNum(partner.bookingCount)}</Td>
                  <Td style={{ textAlign: "right", fontWeight: 800 }}>{fmtIDR(partner.balanceAvailable)}</Td>
                  <Td style={{ textAlign: "right" }}>{fmtIDR(partner.balancePending)}</Td>
                  <Td style={{ textAlign: "right" }}>
                    <ActionButtons
                      onView={() => openPartnerModal(partner.id, "view")}
                      onEdit={() => openPartnerModal(partner.id, "edit")}
                      onDelete={() => {
                        void onDelete(partner.id).catch(() => undefined);
                      }}
                      disableEdit={isUpdating(partner.id) || isDeleting(partner.id)}
                      disableDelete={isDeleting(partner.id)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </TableFrame>
      )}

      <DetailModal
        open={Boolean(selectedPartner)}
        onClose={closePartnerModal}
        title={selectedPartner?.name || "Detail seller"}
        subtitle={
          selectedPartner
            ? isEditing
              ? `Edit seller • owner ${selectedPartner.ownerName}`
              : `Owner ${selectedPartner.ownerName}`
            : undefined
        }
        meta={
          selectedPartner
            ? [
                { label: "Email", value: selectedPartner.email },
                { label: "Status", value: selectedPartner.status },
                { label: "Produk", value: fmtNum(selectedPartner.productCount) },
                { label: "Booking", value: fmtNum(selectedPartner.bookingCount) },
                { label: "Saldo ready", value: fmtIDR(selectedPartner.balanceAvailable) },
                { label: "Saldo pending", value: fmtIDR(selectedPartner.balancePending) },
              ]
            : []
        }
        data={selectedPartner ?? {}}
        content={
          selectedPartner && form ? (
            <div className="grid gap-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Detail seller</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <EditableField label="Nama seller" value={form.name} disabled={!isEditing} onChange={(value) => setForm((current) => current ? { ...current, name: value } : current)} />
                <EditableField label="Owner" value={form.ownerName} disabled={!isEditing} onChange={(value) => setForm((current) => current ? { ...current, ownerName: value } : current)} />
                <EditableField label="Email" value={form.email} disabled={!isEditing} onChange={(value) => setForm((current) => current ? { ...current, email: value } : current)} />
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  <span>Status</span>
                  <select
                    value={form.status}
                    disabled={!isEditing}
                    onChange={(event) => setForm((current) => current ? { ...current, status: event.target.value as PartnerRow["status"] } : current)}
                    className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null
        }
        footer={
          selectedPartner && form ? (
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
                    disabled={isUpdating(selectedPartner.id)}
                    onClick={() => {
                      setForm({
                        name: selectedPartner.name,
                        ownerName: selectedPartner.ownerName,
                        email: selectedPartner.email,
                        status: selectedPartner.status,
                      });
                      setIsEditing(false);
                    }}
                    className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                  >
                    Batal edit
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating(selectedPartner.id)}
                    onClick={async () => {
                      try {
                        await onUpdate(selectedPartner.id, form);
                        setIsEditing(false);
                      } catch {
                        // Error toast ditangani parent.
                      }
                    }}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    {isUpdating(selectedPartner.id) ? "Menyimpan..." : "Simpan perubahan"}
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={isDeleting(selectedPartner.id)}
                onClick={async () => {
                  try {
                    await onDelete(selectedPartner.id);
                  } catch {
                    // Error toast ditangani parent.
                  }
                }}
                className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
              >
                {isDeleting(selectedPartner.id) ? "Menghapus..." : "Delete seller"}
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
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function SellerStatusPill({ status }: { status: PartnerRow["status"] }) {
  const palette =
    status === "ACTIVE"
      ? { bg: "rgba(16,185,129,.16)", color: "#065f46" }
      : status === "PENDING_REVIEW"
        ? { bg: "rgba(250,204,21,.16)", color: "#854d0e" }
        : status === "SUSPENDED"
          ? { bg: "rgba(59,130,246,.16)", color: "#1d4ed8" }
          : { bg: "rgba(248,113,113,.16)", color: "#991b1b" };

  return (
    <span
      style={{
        display: "inline-flex",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
        background: palette.bg,
        color: palette.color,
      }}
    >
      {status}
    </span>
  );
}
