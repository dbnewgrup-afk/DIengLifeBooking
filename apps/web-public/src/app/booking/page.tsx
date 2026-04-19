"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { DataState } from "@/components/ui";
import { getPublicApiErrorMessage, listProducts } from "@/data/api";
import { formatRupiah } from "@/lib/format";
import type { Product, ProductType } from "@/types";

const CATEGORY_ORDER: ProductType[] = ["villa", "jeep", "transport", "dokumentasi"];

function categoryLabel(type: ProductType) {
  switch (type) {
    case "villa":
      return "Villa";
    case "jeep":
      return "Jeep";
    case "transport":
      return "Rent";
    case "dokumentasi":
      return "Dokumentasi";
    default:
      return type;
  }
}

export default function BookingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ProductType>("villa");
  const [keyword, setKeyword] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestedCategory = useMemo(() => {
    const raw = searchParams.get("category");
    if (raw === "villa" || raw === "jeep" || raw === "transport" || raw === "dokumentasi") {
      return raw;
    }
    return null;
  }, [searchParams]);

  const requestedProductId = useMemo(() => searchParams.get("productId")?.trim() || "", [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const rows = await listProducts({ limit: 200 });
        if (!cancelled) {
          const published = rows.filter((product) => product.published);
          setProducts(published);
          const firstAvailable = published.find((product) => product.type === "villa") ?? published[0] ?? null;
          const nextCategory =
            requestedCategory && published.some((product) => product.type === requestedCategory)
              ? requestedCategory
              : firstAvailable?.type ?? "villa";
          const preferredProduct =
            published.find(
              (product) => product.id === requestedProductId && product.type === nextCategory
            ) ??
            published.find((product) => product.type === nextCategory) ??
            firstAvailable;

          setCategory(nextCategory);
          setSelectedProductId(preferredProduct?.id ?? "");
        }
      } catch (cause) {
        if (!cancelled) {
          setProducts([]);
          setSelectedProductId("");
          setLoadError(getPublicApiErrorMessage(cause, "Katalog booking gagal dimuat."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, requestedCategory, requestedProductId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.type !== category) return false;
      const haystack = `${product.name} ${product.location ?? ""} ${product.description ?? ""}`.toLowerCase();
      const matchesKeyword = keyword ? haystack.includes(keyword.toLowerCase()) : true;
      const matchesLocation = locationQuery
        ? (product.location ?? "").toLowerCase().includes(locationQuery.toLowerCase())
        : true;
      return matchesKeyword && matchesLocation;
    });
  }, [category, keyword, locationQuery, products]);

  useEffect(() => {
    if (!filteredProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(filteredProducts[0]?.id ?? "");
    }
  }, [filteredProducts, selectedProductId]);

  useEffect(() => {
    if (!pathname) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("category", category);

    if (selectedProductId) {
      nextParams.set("productId", selectedProductId);
    } else {
      nextParams.delete("productId");
    }

    const nextSearch = nextParams.toString();
    const currentSearch = searchParams.toString();

    if (nextSearch !== currentSearch) {
      router.replace(`${pathname}?${nextSearch}`, { scroll: false });
    }
  }, [category, pathname, router, searchParams, selectedProductId]);

  const selectedProduct =
    filteredProducts.find((product) => product.id === selectedProductId) ??
    products.find((product) => product.id === selectedProductId) ??
    null;
  const hasCategoryProducts = products.some((product) => product.type === category);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <BookingStepper current="select" className="mb-6" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-300">Step 1</p>
            <h1 className="mt-3 text-4xl font-black leading-tight">
              Pilih produk terbaik buat booking kamu
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Flow-nya sekarang dipisah. Jadi di step ini kamu fokus cari produk dulu per kategori,
              baru lanjut isi data booking dan pembayaran.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {CATEGORY_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCategory(type)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    category === type
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {categoryLabel(type)}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_140px]">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Cari produk</span>
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Nama produk, deskripsi, dll"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Lokasi</span>
                <input
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  placeholder="Contoh: Dieng"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400"
                />
              </label>
              <div className="flex flex-col gap-2 text-sm text-slate-300">
                <span>Hasil</span>
                <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-white/5 px-4 font-semibold text-white">
                  {filteredProducts.length} produk
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {loading ? (
                <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                  Lagi memuat katalog produk...
                </div>
              ) : loadError ? (
                <div className="col-span-full">
                  <DataState
                    tone="error"
                    className="border-white/10 bg-rose-500/10 text-white"
                    title="Katalog booking gagal dimuat"
                    description={loadError}
                  >
                    <button
                      type="button"
                      onClick={() => setReloadKey((value) => value + 1)}
                      className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
                    >
                      Coba lagi
                    </button>
                  </DataState>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full">
                  <DataState
                    tone="empty"
                    className="border-white/10 bg-white/5 text-white"
                    title={hasCategoryProducts ? "Tidak ada produk yang cocok" : "Belum ada produk aktif"}
                    description={
                      hasCategoryProducts
                        ? "Filter atau kata kunci yang aktif belum menemukan produk yang sesuai."
                        : `Belum ada produk aktif di kategori ${categoryLabel(category)}.`
                    }
                  />
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const selected = product.id === selectedProductId;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedProductId(product.id)}
                      className={`overflow-hidden rounded-[28px] border text-left transition ${
                        selected
                          ? "border-emerald-400 bg-emerald-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="relative h-48 w-full">
                        <Image
                          src={product.images?.[0] ?? "/images/products/villa-aster.jpg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-lg font-bold">{product.name}</h2>
                            <p className="mt-1 text-sm text-slate-300">{product.location ?? "Dieng"}</p>
                          </div>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                            {(product.rating ?? 4.8).toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-4 text-sm text-slate-300">
                          Mulai dari{" "}
                          <span className="font-semibold text-white">{formatRupiah(product.price)}</span> /{" "}
                          {product.unit ?? "malam"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-300">
              Produk dipilih
            </p>

            {selectedProduct ? (
              <>
                <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10">
                  <Image
                    src={selectedProduct.images?.[0] ?? "/images/products/villa-aster.jpg"}
                    alt={selectedProduct.name}
                    width={900}
                    height={640}
                    className="h-64 w-full object-cover"
                    priority
                  />
                </div>

                <div className="mt-5">
                  <h2 className="text-2xl font-black">{selectedProduct.name}</h2>
                  <p className="mt-2 text-sm text-slate-300">{selectedProduct.location ?? "Dieng"}</p>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {selectedProduct.description?.trim() ||
                      "Produk siap dipilih untuk lanjut ke form booking detail."}
                  </p>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Kategori</span>
                    <span className="font-semibold text-white">{categoryLabel(selectedProduct.type)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Unit</span>
                    <span className="font-semibold text-white">{selectedProduct.unit ?? "malam"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Harga</span>
                    <span className="font-semibold text-white">{formatRupiah(selectedProduct.price)}</span>
                  </div>
                </div>

                <Link
                  href={`/booking/details?category=${encodeURIComponent(selectedProduct.type)}&productId=${encodeURIComponent(selectedProduct.id)}`}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Lanjut isi data booking
                </Link>
              </>
            ) : (
              <div className="mt-6">
                <DataState
                  tone={loadError ? "error" : "empty"}
                  className="border-white/10 bg-white/5 text-white"
                  title={loadError ? "Produk belum tersedia" : "Pilih produk dulu"}
                  description={
                    loadError
                      ? loadError
                      : "Pilih salah satu produk dulu dari daftar kiri untuk lanjut ke detail booking."
                  }
                />
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
