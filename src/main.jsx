import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  CheckVerified01 as BadgeCheck,
  Building02 as BedDouble,
  Building01 as Building2,
  Bus as BusFront,
  Calendar as CalendarDays,
  Coins01 as CircleDollarSign,
  Clock as Clock3,
  Download01 as ArrowDownToLine,
  File06 as FileText,
  LayoutAlt02 as LayoutDashboard,
  Moon01 as Moon,
  Plus,
  RefreshCw01 as RefreshCw,
  Settings01 as Settings2,
  Sun,
  Trash01 as Trash2,
  Upload01 as Upload,
  Users01 as Users,
} from "@untitledui/icons";
import { AppShell } from "@/components/ui/knowns/blocks/app-shell/app-shell";
import { DatePicker } from "@/components/ui/knowns/date-picker";
import {
  Badge,
} from "@/components/ui/knowns/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/knowns/card";
import { Field as KnownField, Input } from "@/components/ui/knowns/input";
import { Combobox } from "@/components/ui/knowns/combobox";
import { Progress } from "@/components/ui/knowns/progress";
import { Button } from "@/components/ui/button";
import {
  fmt,
  initialData,
  integer,
  loadData,
  num,
  normalizeData,
  rowCurrency,
  summarize,
  STORAGE_KEY,
  validatePackage,
} from "@/lib/calculator";
import "./input.css";

const currencyOptions = [
  { value: "SAR", label: "SAR", description: "Riyal Saudi" },
  { value: "IDR", label: "IDR", description: "Rupiah Indonesia" },
];
const accommodationOptions = [
  { value: "hotel", label: "Hotel" },
  { value: "apartments", label: "Apartemen" },
];
const roomTypeOptions = ["Quad", "Triple", "Double", "Single"].map((value) => ({
  value,
  label: value,
}));
const nightModeOptions = [
  { value: "auto", label: "Otomatis dari tanggal" },
  { value: "manual", label: "Isi manual" },
];
const otherCostModeOptions = [
  { value: "total", label: "Total paket" },
  { value: "pax", label: "Per jamaah" },
];
const THEME_STORAGE_KEY = "rihlah-theme";
const TEMPLATE_STORAGE_KEY = "rihlah-package-templates-v1";
const BACKUP_FORMAT = "rihlah-umrah-calculator-backup";

function createId(prefix) {
  return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random()}`;
}

function loadTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) throw new Error("Daftar template bukan array.");
    return saved.filter(
      (template) =>
        template &&
        typeof template.id === "string" &&
        typeof template.name === "string" &&
        template.data &&
        typeof template.data === "object" &&
        !Array.isArray(template.data),
    );
  } catch (error) {
    console.error("Template paket tersimpan tidak dapat dibaca:", error);
    return [];
  }
}

function formatDateTime(value) {
  if (!value) return "waktu tidak diketahui";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function loadTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch (error) {
    console.error("Preferensi tema tidak dapat dibaca:", error);
    return "light";
  }
}

const mainNav = [
  { id: "overview", label: "Ringkasan", icon: <LayoutDashboard /> },
];

const costNav = [
  { id: "lodging", label: "Hotel & Apartemen", icon: <BedDouble /> },
  { id: "transport", label: "Transportasi", icon: <BusFront /> },
  { id: "custom-costs", label: "Biaya lainnya", icon: <CircleDollarSign /> },
  { id: "other-costs", label: "Biaya & pengaturan", icon: <Settings2 /> },
];

const offerNav = [
  { id: "offer", label: "Penawaran paket", icon: <FileText /> },
];

const pageDetails = {
  overview: {
    label: "Ringkasan",
    title: "Ringkasan paket",
    description: "Pantau HPP, harga jual, dan alokasi biaya paket umroh.",
  },
  lodging: {
    label: "Hotel & Apartemen",
    title: "Hotel & Apartemen",
    description: "Atur akomodasi hotel dan apartemen dalam satu daftar.",
  },
  transport: {
    label: "Transportasi",
    title: "Transportasi",
    description: "Catat rute dan biaya transportasi rombongan.",
  },
  "custom-costs": {
    label: "Biaya lainnya",
    title: "Biaya lainnya",
    description: "Tambahkan biaya khusus dengan perhitungan total paket atau per jamaah.",
  },
  "other-costs": {
    label: "Biaya & pengaturan",
    title: "Biaya & pengaturan",
    description: "Kelola biaya langsung, biaya bersama, kurs, dan detail paket.",
  },
  offer: {
    label: "Penawaran paket",
    title: "Penawaran untuk jamaah",
    description: "Pratinjau harga paket yang siap dibagikan atau dicetak.",
  },
};

function PageHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {Icon && (
        <div className="hidden size-12 shrink-0 place-items-center rounded-2xl bg-primary/8 text-primary sm:grid">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

function formatGroupedNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number !== 0
    ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 8 }).format(number)
    : "";
}

function dateNightCount(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  return Number.isFinite(start) && Number.isFinite(end) && end > start
    ? Math.round((end - start) / 86_400_000)
    : 0;
}

function formatNumberDraft(value) {
  const parts = String(value).replace(/[^\d,]/g, "").split(",");
  const integer = (parts.shift() || "").replace(/^0+(?=\d)/, "");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.length ? `${grouped},${parts.join("")}` : grouped;
}

function parseGroupedNumber(value) {
  const number = Number(String(value).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function NumberInput({ value, onChange, onFocus, onBlur, ...props }) {
  const [draft, setDraft] = useState(() => formatGroupedNumber(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(formatGroupedNumber(value));
  }, [value]);

  const handleChange = (event) => {
    const raw = event.currentTarget.value;
    const caret = event.currentTarget.selectionStart ?? raw.length;
    const logicalCaret = raw.slice(0, caret).replace(/\./g, "").length;
    const formatted = formatNumberDraft(raw);
    setDraft(formatted);

    const input = event.currentTarget;
    requestAnimationFrame(() => {
      if (document.activeElement !== input) return;
      let position = 0;
      let logicalPosition = 0;
      while (position < formatted.length && logicalPosition < logicalCaret) {
        if (formatted[position] !== ".") logicalPosition += 1;
        position += 1;
      }
      input.setSelectionRange(position, position);
    });

    onChange?.({ target: { value: String(parseGroupedNumber(formatted)) } });
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={(event) => {
        focused.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focused.current = false;
        setDraft(formatGroupedNumber(value));
        onBlur?.(event);
      }}
      onChange={handleChange}
    />
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
  suffix,
  hint,
}) {
  const id = useId();
  return (
    <KnownField id={id} label={label} hint={hint} className="min-w-0">
      {type === "number" ? (
        <NumberInput
          id={id}
          size="lg"
          value={value}
          placeholder={placeholder ?? "0"}
          min={min}
          step={step}
          suffix={suffix}
          onChange={onChange}
        />
      ) : (
        <Input
          id={id}
          size="lg"
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          suffix={suffix}
          onChange={onChange}
        />
      )}
    </KnownField>
  );
}

function CurrencyAmount({ label, value, currency, onValueChange, onCurrencyChange }) {
  const id = useId();
  return (
    <KnownField id={id} label={label} className="min-w-0">
      <div className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
        <NumberInput
          id={id}
          size="lg"
          min="0"
          step="any"
          aria-label={label}
          value={value}
          placeholder="0"
          onChange={onValueChange}
        />
        <Combobox
          size="lg"
          aria-label={`Mata uang ${label}`}
          value={currency}
          options={currencyOptions}
          onValueChange={onCurrencyChange}
        />
      </div>
    </KnownField>
  );
}

function StatCard({ label, value, detail, icon: Icon, tone = "default" }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {value}
          </p>
          {detail && <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>}
        </div>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${
            tone === "green"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

function EditorTable({ rows, columns, onRemove, emptyLabel }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
            {columns.map((column) => (
              <th className="px-3 py-3 font-medium first:pl-4" key={column.key} scope="col">
                {column.label}
              </th>
            ))}
            <th className="w-12 px-3 py-3" aria-label="Aksi" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className="align-middle">
                {columns.map((column) => (
                  <td className="px-3 py-3 first:pl-4" key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
                <td className="px-3 py-3 text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    icon={<Trash2 />}
                    aria-label={`Hapus ${row.name || row.city || row.route || "biaya"}`}
                    onClick={() => onRemove(row.id)}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-4 py-10 text-center text-sm text-muted-foreground"
                colSpan={columns.length + 1}
              >
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableInput({ value, onChange, type = "text", min, step, placeholder, label }) {
  if (type === "number") {
    return (
      <NumberInput
        size="sm"
        min={min}
        step={step}
        placeholder={placeholder ?? "0"}
        aria-label={label || placeholder || "Nilai biaya"}
        value={value}
        onChange={onChange}
        className="min-w-24"
      />
    );
  }

  return (
    <Input
      size="sm"
      type={type}
      placeholder={placeholder}
      aria-label={label || placeholder || "Nilai biaya"}
      value={value ?? ""}
      onChange={onChange}
      className="min-w-24"
    />
  );
}

function TableCurrency({ value, onValueChange, label = "Mata uang biaya" }) {
  return (
    <Combobox
      size="sm"
      aria-label={label}
      value={value}
      options={currencyOptions}
      onValueChange={onValueChange}
      className="min-w-20"
    />
  );
}

function EmptyNotice({ children }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function Overview({ data, totals, warnings, setPage }) {
  const rows = totals.rows;
  const hasData = totals.hasLodging;
  const breakdown = [
    ["Akomodasi", totals.costBreakdownPerPax.accommodation],
    ["Konsumsi", totals.costBreakdownPerPax.meals],
    ["Transportasi", totals.costBreakdownPerPax.transport],
    ["Biaya bersama", totals.costBreakdownPerPax.shared],
    ["Biaya lainnya", totals.costBreakdownPerPax.otherCosts],
    ["Biaya langsung", totals.costBreakdownPerPax.direct],
  ];

  return (
    <>
      <PageHeading
        eyebrow={data.packageName || "Paket umroh"}
        title="Ringkasan paket"
        description="Pantau HPP, harga jual, dan kesiapan alokasi biaya dalam satu tampilan."
        icon={LayoutDashboard}
      />
      <div className="no-print mb-4 flex justify-end">
        <Button icon={<ArrowDownToLine />} onClick={() => window.print()}>
          Cetak ke PDF
        </Button>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="HPP per jamaah"
          value={fmt(totals.hppPerPax)}
          detail={`${integer(data.pax)} jamaah`}
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Harga jual per jamaah"
          value={fmt(totals.sellPerPax)}
          detail={`Margin ${num(data.markup)}%`}
          icon={BadgeCheck}
          tone="green"
        />
        <StatCard
          label="Total biaya paket"
          value={fmt(totals.costTotal)}
          detail="Termasuk biaya bersama"
          icon={ArrowDownToLine}
        />
        <StatCard
          label="Estimasi laba"
          value={fmt(totals.profit)}
          detail={`Total penjualan ${fmt(totals.revenue)}`}
          icon={CircleDollarSign}
        />
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Rincian HPP per jamaah</CardTitle>
          <CardDescription>
            Komponen dihitung dari biaya dan alokasi yang sudah dimasukkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {breakdown.map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-semibold">{fmt(value)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Total: {fmt(totals.hppPerPax)} per jamaah
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Rincian akomodasi</CardTitle>
              <CardDescription>HPP dan harga jual dihitung per alokasi jamaah.</CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconRight={<ArrowRight />}
              onClick={() => setPage("lodging")}
            >
              Kelola biaya
            </Button>
          </CardHeader>
          <CardContent>
            {rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 font-medium">Akomodasi</th>
                      <th className="py-3 font-medium">Alokasi</th>
                      <th className="py-3 font-medium">HPP / jamaah</th>
                      <th className="py-3 text-right font-medium">Harga jual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((item) => (
                      <tr key={item.row.id}>
                        <td className="py-3.5 pr-3">
                          <span className="block font-medium text-foreground">
                            {item.row.name || item.row.city || "Akomodasi"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.kind === "hotel" ? "Hotel" : "Apartemen"}
                          </span>
                        </td>
                        <td className="py-3.5">{integer(item.people)} pax</td>
                        <td className="py-3.5">{fmt(item.costPerPax)}</td>
                        <td className="py-3.5 text-right font-medium">
                          {fmt(item.sellPerPax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyNotice>
                Belum ada akomodasi. Tambahkan hotel atau apartemen untuk mulai menghitung HPP.
              </EmptyNotice>
            )}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Kesiapan alokasi</CardTitle>
              <CardDescription>
                {integer(totals.allocated)} dari {integer(data.pax)} jamaah telah dialokasikan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress
                label="Alokasi jamaah"
                value={totals.allocated}
                max={num(data.pax) || 1}
                valueLabel="none"
                size="md"
                tone="success"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Biaya akomodasi</span>
                <Badge>{hasData ? "Sudah diisi" : "Belum diisi"}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Informasi perjalanan</CardTitle>
              <CardDescription>Pengaturan utama paket saat ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={Users} label="Jumlah jamaah" value={`${integer(data.pax)} pax`} />
              <InfoRow
                icon={CalendarDays}
                label="Keberangkatan"
                value={data.departure || "Belum ditentukan"}
              />
              <InfoRow
                icon={Clock3}
                label="Durasi"
                value={`${integer(data.duration)} hari`}
              />
              <InfoRow
                icon={CircleDollarSign}
                label="Kurs SAR"
                value={`${fmt(num(data.exchange), "IDR")} / SAR`}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={<Settings2 />}
                className="w-full justify-start"
                onClick={() => setPage("other-costs")}
              >
                Buka pengaturan paket
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{warnings.length ? "Perlu ditinjau" : "Data utama lengkap"}</CardTitle>
              <CardDescription>
                {warnings.length
                  ? `${warnings.length} hal perlu dicek sebelum menetapkan harga.`
                  : "Tidak ada peringatan pada data paket."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {warnings.length ? (
                <ul className="space-y-1">
                  {warnings.slice(0, 6).map((warning) => (
                    <li key={warning.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                        onClick={() => setPage(warning.page)}
                      >
                        {warning.message}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <Badge tone="success">Siap ditinjau</Badge>
              )}
              {warnings.length > 6 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Dan {warnings.length - 6} hal lainnya.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function AuditPrintReport({ data, totals, warnings }) {
  const directLabels = {
    visa: "Visa",
    flight: "Tiket pesawat",
    zamzam: "Air zamzam",
    porter: "Porter",
  };
  const sharedLabels = {
    airport: "Handling bandara",
    hotel: "Biaya hotel bersama",
    guide: "Muthawif / guide",
  };
  const convertedAmount = (amount, currency) => {
    const raw = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(num(amount));
    return currency === "SAR"
      ? `${raw} (${fmt(num(amount) * num(data.exchange))})`
      : raw;
  };
  const departure = data.departure
    ? new Date(`${data.departure}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Belum ditentukan";

  return (
    <div id="print-area" className="audit-print-report">
      <header className="audit-report-header">
        <p>{data.company || "Travel Umroh"}</p>
        <h1>Lembar audit perhitungan HPP</h1>
        <p>{data.packageName || "Paket Umroh"}</p>
        <p className="audit-muted">
          Dicetak {new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </header>

      <section className="audit-section">
        <h2>Asumsi paket dan kurs</h2>
        <table>
          <tbody>
            <tr><th>Keberangkatan</th><td>{departure}</td><th>Jamaah</th><td>{integer(data.pax)} pax</td></tr>
            <tr><th>Durasi</th><td>{integer(data.duration)} hari</td><th>Markup</th><td>{num(data.markup)}%</td></tr>
            <tr>
              <th>Malam menginap</th>
              <td>Makkah {integer(data.nightsMakkah)} · Madinah {integer(data.nightsMadinah)}</td>
              <th>Total malam</th>
              <td>{integer(data.nightsMakkah + data.nightsMadinah)}</td>
            </tr>
            <tr>
              <th>Kurs</th>
              <td>1 SAR = {fmt(num(data.exchange))} IDR</td>
              <th>Sumber kurs</th>
              <td>
                {data.exchangeSource === "manual" ? "Manual" : "Otomatis"}
                {data.exchangeUpdatedAt ? ` · ${data.exchangeUpdatedAt}` : ""}
                {data.exchangeFetchedAt ? ` · ${formatDateTime(data.exchangeFetchedAt)}` : ""}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="audit-section">
        <h2>Ringkasan hasil</h2>
        <table>
          <tbody>
            <tr><th>Total HPP paket</th><td>{fmt(totals.costTotal)}</td><th>HPP per jamaah</th><td>{fmt(totals.hppPerPax)}</td></tr>
            <tr><th>Total penjualan</th><td>{fmt(totals.revenue)}</td><th>Harga jual per jamaah</th><td>{fmt(totals.sellPerPax)}</td></tr>
            <tr><th>Estimasi laba kotor</th><td>{fmt(totals.profit)}</td><th>Alokasi jamaah</th><td>{integer(totals.allocated)} / {integer(data.pax)}</td></tr>
          </tbody>
        </table>
        <table className="audit-breakdown">
          <thead>
            <tr><th>Rincian HPP per jamaah</th><th>Nilai (IDR)</th></tr>
          </thead>
          <tbody>
            {[
              ["Akomodasi", totals.costBreakdownPerPax.accommodation],
              ["Konsumsi", totals.costBreakdownPerPax.meals],
              ["Transportasi", totals.costBreakdownPerPax.transport],
              ["Biaya bersama", totals.costBreakdownPerPax.shared],
              ["Biaya lainnya", totals.costBreakdownPerPax.otherCosts],
              ["Biaya langsung", totals.costBreakdownPerPax.direct],
            ].map(([label, amount]) => (
              <tr key={label}><td>{label}</td><td>{fmt(amount)}</td></tr>
            ))}
            <tr><th>Total HPP per jamaah</th><th>{fmt(totals.hppPerPax)}</th></tr>
          </tbody>
        </table>
      </section>

      <section className="audit-section">
        <h2>Rincian akomodasi dan HPP</h2>
        {totals.rows.length ? (
          <table>
            <thead>
              <tr>
                <th>Akomodasi / tarif masukan</th>
                <th>Alokasi</th>
                <th>Biaya akomodasi</th>
                <th>Konsumsi / pax</th>
                <th>HPP / pax</th>
                <th>Harga jual / pax</th>
              </tr>
            </thead>
            <tbody>
              {totals.rows.map((item) => {
                const row = item.row;
                const quantity =
                  item.kind === "hotel"
                    ? `${integer(row.rooms)} kamar × ${integer(item.nights)} malam`
                    : `${integer(row.units)} unit`;
                return (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name || row.city || "Akomodasi"}</strong>
                      <br />
                      {item.kind === "hotel" ? "Hotel" : "Apartemen"}{row.city ? ` · ${row.city}` : ""}
                      <br />
                      Tarif: {convertedAmount(row.price, rowCurrency(row))} × {quantity}
                      <br />
                      Konsumsi: {convertedAmount(row.meal, rowCurrency(row))} × {integer(row.mealDays)} hari / pax
                    </td>
                    <td>{integer(item.people)} pax</td>
                    <td>{fmt(item.cost)}</td>
                    <td>{fmt(item.mealPerPax)}</td>
                    <td>{fmt(item.costPerPax)}</td>
                    <td>{fmt(item.sellPerPax)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>Belum ada data akomodasi.</p>
        )}
      </section>

      <section className="audit-section">
        <h2>Biaya transportasi, bersama, dan langsung</h2>
        <table>
          <thead>
            <tr><th>Komponen</th><th>Detail / nilai masukan</th><th>Nilai setelah konversi (IDR)</th></tr>
          </thead>
          <tbody>
            {data.transport.map((row) => {
              const currency = rowCurrency(row);
              const total = num(row.price) * num(row.units);
              return (
                <tr key={row.id}>
                  <td>
                    Transportasi: {row.route || row.description || "Tanpa nama"}
                    {row.description ? ` · ${row.description}` : ""}
                  </td>
                  <td>{convertedAmount(row.price, currency)} × {integer(row.units)} kendaraan</td>
                  <td>{fmt(total * (currency === "SAR" ? num(data.exchange) : 1))}</td>
                </tr>
              );
            })}
            {Object.entries(data.shared).filter(([, amount]) => num(amount) > 0).map(([key, amount]) => {
              const currency = data.sharedCurrency[key] === "IDR" ? "IDR" : "SAR";
              return (
                <tr key={`shared-${key}`}>
                  <td>Biaya bersama: {sharedLabels[key] || key}</td>
                  <td>{convertedAmount(amount, currency)} · total paket</td>
                  <td>{fmt(num(amount) * (currency === "SAR" ? num(data.exchange) : 1))}</td>
                </tr>
              );
            })}
            {data.otherCosts.map((row) => {
              const currency = rowCurrency(row);
              const quantity = row.calculation === "pax" ? num(data.pax) : 1;
              const amount = num(row.amount) * quantity;
              return (
                <tr key={`other-cost-${row.id}`}>
                  <td>Biaya lainnya: {row.name || "Tanpa nama"}</td>
                  <td>
                    {convertedAmount(row.amount, currency)}
                    {row.calculation === "pax" ? ` × ${integer(quantity)} jamaah` : " · total paket"}
                  </td>
                  <td>{fmt(amount * (currency === "SAR" ? num(data.exchange) : 1))}</td>
                </tr>
              );
            })}
            {Object.entries(data.direct).map(([key, amount]) => {
              const currency = data.directCurrency[key] === "IDR" ? "IDR" : "SAR";
              return (
                <tr key={`direct-${key}`}>
                  <td>Biaya langsung: {directLabels[key] || key}</td>
                  <td>{convertedAmount(amount, currency)} · per jamaah</td>
                  <td>{fmt(num(amount) * (currency === "SAR" ? num(data.exchange) : 1))}</td>
                </tr>
              );
            })}
            {!data.transport.length &&
              !Object.values(data.shared).some((amount) => num(amount)) &&
              !data.otherCosts.length &&
              !Object.values(data.direct).some((amount) => num(amount)) && (
                <tr><td colSpan="3">Belum ada biaya transportasi atau biaya tambahan.</td></tr>
              )}
          </tbody>
        </table>
        <p className="audit-note">
          Biaya dalam SAR dikonversi ke IDR menggunakan kurs yang tercantum di atas. Biaya langsung
          dihitung per jamaah; biaya bersama dan transportasi dialokasikan sesuai perhitungan HPP.
        </p>
      </section>

      <section className="audit-section">
        <h2>Peringatan validasi</h2>
        {warnings.length ? (
          <ul>{warnings.map((warning) => <li key={warning.id}>{warning.message}</li>)}</ul>
        ) : (
          <p>Tidak ada peringatan validasi.</p>
        )}
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function LegacyAccommodationPage({
  kind,
  rows,
  totals,
  updateRow,
  removeRow,
  addRow,
}) {
  const isHotel = kind === "hotel";
  const title = isHotel ? "Hotel" : "Apartemen";
  const rowTotal = totals.rows
    .filter((item) => item.kind === kind)
    .reduce((sum, item) => sum + item.cost, 0);

  const columns = isHotel
    ? [
        {
          key: "city",
          label: "Kota",
          render: (row) => (
            <TableInput
              label={`Kota ${title.toLowerCase()}`}
              value={row.city}
              placeholder="Makkah"
              onChange={(event) => updateRow(kind, row.id, "city", event.target.value)}
            />
          ),
        },
        {
          key: "name",
          label: "Nama hotel",
          render: (row) => (
            <TableInput
              label={`Nama ${title.toLowerCase()}`}
              value={row.name}
              placeholder="Nama hotel"
              onChange={(event) => updateRow(kind, row.id, "name", event.target.value)}
            />
          ),
        },
        {
          key: "price",
          label: "Tarif / kamar / malam",
          render: (row) => (
            <TableInput
              label={`Tarif ${title.toLowerCase()}`}
              type="number"
              min="0"
              step="any"
              value={row.price}
              onChange={(event) => updateRow(kind, row.id, "price", num(event.target.value))}
            />
          ),
        },
        {
          key: "currency",
          label: "Mata uang",
          render: (row) => (
            <TableCurrency
              label={`Mata uang ${title.toLowerCase()}`}
              value={rowCurrency(row)}
              onValueChange={(value) => updateRow(kind, row.id, "currency", value)}
            />
          ),
        },
        {
          key: "nights",
          label: "Malam",
          render: (row) => (
            <TableInput
              label="Jumlah malam hotel"
              type="number"
              min="0"
              value={row.nights}
              onChange={(event) => updateRow(kind, row.id, "nights", num(event.target.value))}
            />
          ),
        },
        {
          key: "rooms",
          label: "Kamar",
          render: (row) => (
            <TableInput
              label="Jumlah kamar hotel"
              type="number"
              min="0"
              value={row.rooms}
              onChange={(event) => updateRow(kind, row.id, "rooms", num(event.target.value))}
            />
          ),
        },
        {
          key: "pax",
          label: "Pax",
          render: (row) => (
            <TableInput
              label={`Jumlah jamaah ${title.toLowerCase()}`}
              type="number"
              min="0"
              value={row.pax}
              onChange={(event) => updateRow(kind, row.id, "pax", num(event.target.value))}
            />
          ),
        },
      ]
    : [
        {
          key: "city",
          label: "Kota",
          render: (row) => (
            <TableInput
              label={`Kota ${title.toLowerCase()}`}
              value={row.city}
              placeholder="Makkah"
              onChange={(event) => updateRow(kind, row.id, "city", event.target.value)}
            />
          ),
        },
        {
          key: "name",
          label: "Nama apartemen",
          render: (row) => (
            <TableInput
              label="Nama apartemen"
              value={row.name}
              placeholder="Nama apartemen"
              onChange={(event) => updateRow(kind, row.id, "name", event.target.value)}
            />
          ),
        },
        {
          key: "price",
          label: "Tarif / unit",
          render: (row) => (
            <TableInput
              label="Tarif apartemen per unit"
              type="number"
              min="0"
              step="any"
              value={row.price}
              onChange={(event) => updateRow(kind, row.id, "price", num(event.target.value))}
            />
          ),
        },
        {
          key: "currency",
          label: "Mata uang",
          render: (row) => (
            <TableCurrency
              label={`Mata uang ${title.toLowerCase()}`}
              value={rowCurrency(row)}
              onValueChange={(value) => updateRow(kind, row.id, "currency", value)}
            />
          ),
        },
        {
          key: "units",
          label: "Unit",
          render: (row) => (
            <TableInput
              label="Jumlah unit apartemen"
              type="number"
              min="0"
              value={row.units}
              onChange={(event) => updateRow(kind, row.id, "units", num(event.target.value))}
            />
          ),
        },
        {
          key: "capacity",
          label: "Kapasitas / unit",
          render: (row) => (
            <TableInput
              label="Kapasitas per unit apartemen"
              type="number"
              min="0"
              value={row.capacity}
              onChange={(event) =>
                updateRow(kind, row.id, "capacity", num(event.target.value))
              }
            />
          ),
        },
        {
          key: "pax",
          label: "Pax",
          render: (row) => (
            <TableInput
              label="Jumlah jamaah apartemen"
              type="number"
              min="0"
              value={row.pax}
              onChange={(event) => updateRow(kind, row.id, "pax", num(event.target.value))}
            />
          ),
        },
      ];

  columns.splice(
    isHotel ? 2 : 2,
    0,
    ...(isHotel
      ? [
          {
            key: "category",
            label: "Kategori",
            render: (row) => (
              <TableInput
                label="Kategori kamar hotel"
                value={row.category}
                placeholder="Quad / Triple"
                onChange={(event) =>
                  updateRow(kind, row.id, "category", event.target.value)
                }
              />
            ),
          },
        ]
      : [
          {
            key: "days",
            label: "Durasi sewa",
            render: (row) => (
              <TableInput
                label="Durasi sewa apartemen dalam hari"
                type="number"
                min="0"
                value={row.days}
                onChange={(event) =>
                  updateRow(kind, row.id, "days", num(event.target.value))
                }
              />
            ),
          },
        ]),
  );
  const paxColumn = columns.pop();
  if (isHotel) {
    columns.push({
      key: "capacity",
      label: "Kapasitas / kamar",
      render: (row) => (
        <TableInput
          label="Kapasitas per kamar hotel"
          type="number"
          min="0"
          value={row.capacity}
          onChange={(event) =>
            updateRow(kind, row.id, "capacity", num(event.target.value))
          }
        />
      ),
    });
  }
  columns.push(
    paxColumn,
    {
      key: "meal",
      label: "Konsumsi / pax / hari",
      render: (row) => (
        <TableInput
          label="Biaya konsumsi per jamaah per hari"
          type="number"
          min="0"
          step="any"
          value={row.meal}
          onChange={(event) => updateRow(kind, row.id, "meal", num(event.target.value))}
        />
      ),
    },
    {
      key: "mealDays",
      label: "Hari konsumsi",
      render: (row) => (
        <TableInput
          label="Jumlah hari konsumsi"
          type="number"
          min="0"
          value={row.mealDays}
          onChange={(event) =>
            updateRow(kind, row.id, "mealDays", num(event.target.value))
          }
        />
      ),
    },
    {
      key: "costPerPax",
      label: "HPP / pax",
      render: (row) => {
        const item = totals.rows.find((entry) => entry.kind === kind && entry.row.id === row.id);
        return (
          <span className="whitespace-nowrap text-xs font-medium">
            {fmt(item?.costPerPax || 0)}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const item = totals.rows.find((entry) => entry.kind === kind && entry.row.id === row.id);
        const status =
          item?.people > item?.cap
            ? ["warning", "Melebihi kapasitas"]
            : item?.cost > 0 && !item?.people
              ? ["warning", "Isi alokasi pax"]
              : item?.cost > 0 || item?.people > 0
                ? ["success", "Sesuai"]
                : ["neutral", "Belum diisi"];
        return <Badge tone={status[0]}>{status[1]}</Badge>;
      },
    },
  );

  return (
    <>
      <PageHeading
        eyebrow="Rincian biaya"
        title={`Biaya ${title.toLowerCase()}`}
        description={
          isHotel
            ? "Atur tarif kamar, jumlah malam, dan jumlah jamaah untuk setiap hotel."
            : "Atur tarif unit, kapasitas, dan jumlah jamaah untuk setiap apartemen."
        }
        icon={isHotel ? BedDouble : Building2}
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Daftar {title.toLowerCase()}</CardTitle>
            <CardDescription>
              Total biaya dasar {fmt(rowTotal)} · semua biaya dikonversi ke IDR untuk HPP.
            </CardDescription>
          </div>
          <Button icon={<Plus />} onClick={() => addRow(kind)}>
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <EditorTable
            rows={rows}
            columns={columns}
            onRemove={(id) => removeRow(kind, id)}
            emptyLabel={`Belum ada data ${title.toLowerCase()}. Pilih “Tambah” untuk memasukkan biaya.`}
          />
          <div className="border-t px-5 py-3 text-xs text-muted-foreground">
            Kurs saat ini: 1 SAR = {fmt(num(totals.exchange || 0))}. Biaya IDR tetap digunakan
            langsung tanpa konversi.
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function AccommodationPage({
  hotels,
  apartments,
  totals,
  updateRow,
  moveRow,
  removeRow,
  addRow,
}) {
  const rows = [
    ...hotels.map((row) => ({ row, kind: "hotel" })),
    ...apartments.map((row) => ({ row, kind: "apartments" })),
  ];
  const rowTotal = totals.rows.reduce((sum, item) => sum + item.cost, 0);

  return (
    <>
      <PageHeading
        eyebrow="Rincian biaya"
        title="Hotel & Apartemen"
        description="Hotel dihitung berdasarkan kamar × malam; apartemen berdasarkan tarif periode × unit."
        icon={BedDouble}
      />
      <Card className="min-w-0">
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <CardTitle>Daftar akomodasi</CardTitle>
            <CardDescription>
              Hotel: malam otomatis dari tanggal atau isi manual. Total akomodasi {fmt(rowTotal)}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Plus />} onClick={() => addRow("hotel")}>Tambah Hotel</Button>
            <Button variant="secondary" icon={<Plus />} onClick={() => addRow("apartments")}>
              Tambah Apartemen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          {rows.length ? rows.map(({ row, kind }) => {
            const isHotel = kind === "hotel";
            const update = (key, value) => updateRow(kind, row.id, key, value);
            const nights = row.nightsMode === "auto"
              ? dateNightCount(row.checkIn, row.checkOut)
              : num(row.nights);
            const item = totals.rows.find((entry) => entry.kind === kind && entry.row.id === row.id);
            const checkInId = `check-in-${row.id}`;
            const checkOutId = `check-out-${row.id}`;

            return (
              <div key={`${kind}-${row.id}`} className="min-w-0 space-y-4 rounded-xl border p-3 sm:p-4">
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <KnownField id={`kind-${row.id}`} label="Jenis" className="min-w-0">
                    <Combobox
                      id={`kind-${row.id}`}
                      size="sm"
                      value={kind}
                      options={accommodationOptions}
                      onValueChange={(value) => moveRow(kind, row.id, value)}
                    />
                  </KnownField>
                  <TextField
                    label="Kota"
                    value={row.city}
                    placeholder="Makkah"
                    onChange={(event) => update("city", event.target.value)}
                  />
                  <TextField
                    label={isHotel ? "Kota / Nama hotel" : "Kota / Nama apartemen"}
                    value={row.name}
                    placeholder={isHotel ? "Nama hotel" : "Nama apartemen"}
                    onChange={(event) => update("name", event.target.value)}
                  />
                  <KnownField id={checkInId} label="Check-in" className="min-w-0">
                    <DatePicker
                      id={checkInId}
                      variant="field"
                      size="sm"
                      value={row.checkIn || ""}
                      onValueChange={(value) => update("checkIn", value)}
                    />
                  </KnownField>
                  <KnownField id={checkOutId} label="Check-out" className="min-w-0">
                    <DatePicker
                      id={checkOutId}
                      variant="field"
                      size="sm"
                      value={row.checkOut || ""}
                      onValueChange={(value) => update("checkOut", value)}
                    />
                  </KnownField>
                </div>

                {isHotel ? (
                  <>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <KnownField id={`nights-mode-${row.id}`} label="Perhitungan malam" className="min-w-0">
                        <Combobox
                          id={`nights-mode-${row.id}`}
                          size="sm"
                          value={row.nightsMode || "auto"}
                          options={nightModeOptions}
                          onValueChange={(value) => update("nightsMode", value)}
                        />
                      </KnownField>
                      {row.nightsMode === "manual" ? (
                        <TextField
                          label="Jumlah malam hotel"
                          type="number"
                          min="0"
                          value={row.nights}
                          onChange={(event) => update("nights", num(event.target.value))}
                        />
                      ) : (
                        <div className="flex flex-col justify-center gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">Jumlah malam</span>
                          <p className="text-sm font-medium">{integer(nights)} malam</p>
                        </div>
                      )}
                      <TextField
                        label="Jamaah pengguna"
                        type="number"
                        min="0"
                        value={row.pax}
                        onChange={(event) => update("pax", num(event.target.value))}
                      />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Kombinasi tipe kamar</h3>
                      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <KnownField id={`room-type-${row.id}`} label="Tipe kamar" className="min-w-0">
                          <Combobox
                            id={`room-type-${row.id}`}
                            size="sm"
                            value={row.category || "Quad"}
                            options={roomTypeOptions}
                            onValueChange={(value) => update("category", value)}
                          />
                        </KnownField>
                        <TextField
                          label="Jumlah kamar"
                          type="number"
                          min="0"
                          value={row.rooms}
                          onChange={(event) => update("rooms", num(event.target.value))}
                        />
                        <TextField
                          label="Tarif / kamar / malam"
                          type="number"
                          min="0"
                          value={row.price}
                          onChange={(event) => update("price", num(event.target.value))}
                        />
                        <KnownField id={`currency-${row.id}`} label="Mata uang" className="min-w-0">
                          <Combobox
                            id={`currency-${row.id}`}
                            size="sm"
                            value={rowCurrency(row)}
                            options={currencyOptions}
                            onValueChange={(value) => update("currency", value)}
                          />
                        </KnownField>
                        <TextField
                          label="Kapasitas / kamar"
                          type="number"
                          min="0"
                          value={row.capacity}
                          onChange={(event) => update("capacity", num(event.target.value))}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <TextField
                      label="Tarif periode / unit"
                      type="number"
                      min="0"
                      value={row.price}
                      onChange={(event) => update("price", num(event.target.value))}
                    />
                    <KnownField id={`currency-${row.id}`} label="Mata uang" className="min-w-0">
                      <Combobox
                        id={`currency-${row.id}`}
                        size="sm"
                        value={rowCurrency(row)}
                        options={currencyOptions}
                        onValueChange={(value) => update("currency", value)}
                      />
                    </KnownField>
                    <TextField
                      label="Jumlah unit"
                      type="number"
                      min="0"
                      value={row.units}
                      onChange={(event) => update("units", num(event.target.value))}
                    />
                    <TextField
                      label="Kapasitas / unit"
                      type="number"
                      min="0"
                      value={row.capacity}
                      onChange={(event) => update("capacity", num(event.target.value))}
                    />
                    <TextField
                      label="Jamaah pengguna"
                      type="number"
                      min="0"
                      value={row.pax}
                      onChange={(event) => update("pax", num(event.target.value))}
                    />
                  </div>
                )}

                <details className="group rounded-lg border px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium">Konsumsi (opsional)</summary>
                  <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                    <TextField
                      label="Konsumsi / pax / hari"
                      type="number"
                      min="0"
                      value={row.meal}
                      onChange={(event) => update("meal", num(event.target.value))}
                    />
                    <TextField
                      label="Hari konsumsi"
                      type="number"
                      min="0"
                      value={row.mealDays}
                      onChange={(event) => update("mealDays", num(event.target.value))}
                    />
                  </div>
                </details>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <div className="text-xs">
                    <p className="font-medium">Total: {fmt(item?.cost || 0)}</p>
                    <p className="mt-1 text-muted-foreground">
                      Biaya per jamaah pengguna: {fmt(item?.costPerPax || 0)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    icon={<Trash2 />}
                    aria-label={`Hapus ${isHotel ? "hotel" : "apartemen"} ${row.name || row.city || ""}`}
                    onClick={() => removeRow(kind, row.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            );
          }) : (
            <EmptyNotice>Belum ada hotel atau apartemen. Pilih tombol Tambah untuk memasukkan akomodasi.</EmptyNotice>
          )}
          <p className="text-xs text-muted-foreground">
            Kurs saat ini: 1 SAR = {fmt(num(totals.exchange || 0))}. Biaya IDR digunakan langsung tanpa konversi.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function LegacyTransportPage({ rows, total, exchange, updateRow, removeRow, addRow }) {
  const columns = [
    {
      key: "route",
      label: "Rute",
      render: (row) => (
        <TableInput
          label="Rute transportasi"
          value={row.route}
          placeholder="Jeddah – Makkah"
          onChange={(event) => updateRow("transport", row.id, "route", event.target.value)}
        />
      ),
    },
    {
      key: "description",
      label: "Keterangan",
      render: (row) => (
        <TableInput
          label="Keterangan transportasi"
          value={row.description}
          placeholder="Bus rombongan"
          onChange={(event) =>
            updateRow("transport", row.id, "description", event.target.value)
          }
        />
      ),
    },
    {
      key: "price",
      label: "Biaya / kendaraan",
      render: (row) => (
        <TableInput
          label="Biaya per kendaraan"
          type="number"
          min="0"
          step="any"
          value={row.price}
          onChange={(event) =>
            updateRow("transport", row.id, "price", num(event.target.value))
          }
        />
      ),
    },
    {
      key: "currency",
      label: "Mata uang",
      render: (row) => (
        <TableCurrency
          label="Mata uang transportasi"
          value={rowCurrency(row)}
          onValueChange={(value) => updateRow("transport", row.id, "currency", value)}
        />
      ),
    },
    {
      key: "units",
      label: "Kendaraan",
      render: (row) => (
        <TableInput
          label="Jumlah kendaraan"
          type="number"
          min="0"
          value={row.units}
          onChange={(event) => updateRow("transport", row.id, "units", num(event.target.value))}
        />
      ),
    },
    {
      key: "pax",
      label: "Pax pengguna",
      render: (row) => (
        <TableInput
          label="Jumlah jamaah pengguna transportasi"
          type="number"
          min="0"
          value={row.pax}
          onChange={(event) => updateRow("transport", row.id, "pax", num(event.target.value))}
        />
      ),
    },
    {
      key: "cost",
      label: "Total biaya",
      render: (row) => {
        const cost =
          num(row.price) *
          num(row.units) *
          (rowCurrency(row) === "SAR" ? num(exchange) : 1);
        return <span className="whitespace-nowrap text-xs font-medium">{fmt(cost)}</span>;
      },
    },
    {
      key: "perPax",
      label: "HPP / pengguna",
      render: (row) => {
        const cost =
          num(row.price) *
          num(row.units) *
          (rowCurrency(row) === "SAR" ? num(exchange) : 1);
        return (
          <span className="whitespace-nowrap text-xs font-medium">
            {fmt(num(row.pax) ? cost / num(row.pax) : 0)}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Rincian biaya"
        title="Transportasi"
        description="Catat rute, jumlah kendaraan, dan mata uang biaya transportasi rombongan."
        icon={BusFront}
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Daftar transportasi</CardTitle>
            <CardDescription>Total biaya transportasi: {fmt(total)}. Biaya dimasukkan sebagai biaya bersama paket.</CardDescription>
          </div>
          <Button icon={<Plus />} onClick={() => addRow("transport")}>
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <EditorTable
            rows={rows}
            columns={columns}
            onRemove={(id) => removeRow("transport", id)}
            emptyLabel="Belum ada transportasi. Tambahkan rute untuk menghitung biaya bersama."
          />
          <p className="border-t px-5 py-3 text-xs text-muted-foreground">
            Total biaya transportasi dibagi rata ke jumlah jamaah pada pengaturan paket.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function TransportPage({ rows, total, exchange, updateRow, removeRow, addRow }) {
  return (
    <>
      <PageHeading
        eyebrow="Rincian biaya"
        title="Transportasi"
        description="Masukkan tarif per kendaraan, jumlah kendaraan, dan jamaah yang memakai setiap rute."
        icon={BusFront}
      />
      <Card className="min-w-0">
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <CardTitle>Daftar transportasi</CardTitle>
            <CardDescription>Total biaya transportasi: {fmt(total)}.</CardDescription>
          </div>
          <Button icon={<Plus />} onClick={() => addRow("transport")}>Tambah transportasi</Button>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          {rows.length ? rows.map((row) => {
            const update = (key, value) => updateRow("transport", row.id, key, value);
            const totalCost = num(row.price) * num(row.units) * (rowCurrency(row) === "SAR" ? num(exchange) : 1);
            return (
              <div key={row.id} className="min-w-0 space-y-4 rounded-xl border p-3 sm:p-4">
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <TextField
                    label="Rute perjalanan"
                    value={row.route}
                    placeholder="Jeddah – Makkah"
                    onChange={(event) => update("route", event.target.value)}
                  />
                  <TextField
                    label="Jenis / keterangan kendaraan"
                    value={row.description}
                    placeholder="Bus rombongan"
                    onChange={(event) => update("description", event.target.value)}
                  />
                  <TextField
                    label="Tarif per kendaraan"
                    type="number"
                    min="0"
                    value={row.price}
                    onChange={(event) => update("price", num(event.target.value))}
                  />
                  <KnownField id={`transport-currency-${row.id}`} label="Mata uang" className="min-w-0">
                    <Combobox
                      id={`transport-currency-${row.id}`}
                      value={rowCurrency(row)}
                      options={currencyOptions}
                      onValueChange={(value) => update("currency", value)}
                    />
                  </KnownField>
                  <TextField
                    label="Jumlah kendaraan"
                    type="number"
                    min="0"
                    value={row.units}
                    onChange={(event) => update("units", num(event.target.value))}
                  />
                  <TextField
                    label="Jamaah pengguna rute"
                    type="number"
                    min="0"
                    value={row.pax}
                    onChange={(event) => update("pax", num(event.target.value))}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <div className="text-xs">
                    <p className="font-medium">Total: {fmt(totalCost)}</p>
                    <p className="mt-1 text-muted-foreground">
                      Biaya per jamaah pengguna: {fmt(num(row.pax) ? totalCost / num(row.pax) : 0)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    icon={<Trash2 />}
                    aria-label={`Hapus rute ${row.route || row.description || ""}`}
                    onClick={() => removeRow("transport", row.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            );
          }) : (
            <EmptyNotice>Belum ada transportasi. Tambahkan rute untuk menghitung biaya kendaraan.</EmptyNotice>
          )}
          <p className="text-xs text-muted-foreground">
            Biaya transportasi menjadi biaya bersama paket dan dibagi ke jamaah yang dialokasikan.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function CustomCostsPage({ rows, total, exchange, pax, updateRow, removeRow, addRow }) {
  return (
    <>
      <PageHeading
        eyebrow="Rincian biaya"
        title="Biaya lainnya"
        description="Tambahkan biaya yang belum tercakup dan tentukan apakah nominal dihitung untuk total paket atau setiap jamaah."
        icon={CircleDollarSign}
      />
      <Card className="min-w-0">
        <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <CardTitle>Biaya tambahan</CardTitle>
            <CardDescription>Total biaya lainnya: {fmt(total)}.</CardDescription>
          </div>
          <Button icon={<Plus />} onClick={() => addRow("otherCosts")}>Tambah biaya</Button>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          {rows.length ? rows.map((row) => {
            const update = (key, value) => updateRow("otherCosts", row.id, key, value);
            const amount = num(row.amount) * (row.calculation === "pax" ? num(pax) : 1);
            const cost = amount * (rowCurrency(row) === "SAR" ? num(exchange) : 1);
            return (
              <div key={row.id} className="min-w-0 space-y-4 rounded-xl border p-3 sm:p-4">
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TextField
                    label="Nama biaya"
                    value={row.name}
                    placeholder="Contoh: perlengkapan"
                    onChange={(event) => update("name", event.target.value)}
                  />
                  <TextField
                    label={row.calculation === "pax" ? "Nominal / jamaah" : "Nominal"}
                    type="number"
                    min="0"
                    value={row.amount}
                    onChange={(event) => update("amount", num(event.target.value))}
                  />
                  <KnownField id={`other-cost-currency-${row.id}`} label="Mata uang" className="min-w-0">
                    <Combobox
                      id={`other-cost-currency-${row.id}`}
                      value={rowCurrency(row)}
                      options={currencyOptions}
                      onValueChange={(value) => update("currency", value)}
                    />
                  </KnownField>
                  <KnownField id={`other-cost-mode-${row.id}`} label="Perhitungan" className="min-w-0">
                    <Combobox
                      id={`other-cost-mode-${row.id}`}
                      value={row.calculation || "total"}
                      options={otherCostModeOptions}
                      onValueChange={(value) => update("calculation", value)}
                    />
                  </KnownField>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                  <p className="text-xs font-medium">
                    Total: {fmt(cost)}{row.calculation === "pax" ? ` · ${integer(pax)} jamaah` : " · satu kali per paket"}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    icon={<Trash2 />}
                    aria-label={`Hapus biaya ${row.name || "lainnya"}`}
                    onClick={() => removeRow("otherCosts", row.id)}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            );
          }) : (
            <EmptyNotice>Belum ada biaya lainnya. Pilih “Tambah biaya” untuk menambahkan komponen.</EmptyNotice>
          )}
          <p className="text-xs text-muted-foreground">
            Nilai dalam SAR dikonversi memakai kurs paket. Nilai IDR digunakan langsung.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function OtherCostsPage({
  data,
  totals,
  updateSetting,
  updateAmount,
  refreshRate,
  rateLoading,
  rateError,
  resetData,
  templates,
  onSaveTemplate,
  onApplyTemplate,
  onDeleteTemplate,
  onExportBackup,
  onImportBackup,
}) {
  const [templateName, setTemplateName] = useState("");
  const backupInputRef = useRef(null);
  const directLabels = {
    visa: "Visa",
    flight: "Tiket pesawat",
    zamzam: "Air zamzam",
    porter: "Porter",
  };
  const sharedLabels = {
    airport: "Handling bandara",
    hotel: "Biaya hotel bersama",
    guide: "Muthawif / guide",
  };

  return (
    <>
      <PageHeading
        eyebrow="Pengaturan paket"
        title="Biaya & pengaturan"
        description="Setiap biaya memiliki pilihan mata uang sendiri. Komponen IDR tidak dikonversi ulang."
        icon={Settings2}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi paket</CardTitle>
            <CardDescription>Detail dasar yang tampil pada ringkasan dan penawaran.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nama travel"
              value={data.company}
              placeholder="Nama travel"
              onChange={(event) => updateSetting("company", event.target.value)}
            />
            <TextField
              label="Nama paket"
              value={data.packageName}
              placeholder="Paket umroh"
              onChange={(event) => updateSetting("packageName", event.target.value)}
            />
            <KnownField id="departure-date" label="Tanggal keberangkatan" className="min-w-0">
              <DatePicker
                id="departure-date"
                variant="field"
                size="lg"
                value={data.departure}
                onValueChange={(value) => updateSetting("departure", value)}
              />
            </KnownField>
            <TextField
              label="Jumlah jamaah"
              type="number"
              min="1"
              value={data.pax}
              suffix="pax"
              onChange={(event) => updateSetting("pax", num(event.target.value))}
            />
            <TextField
              label="Malam di Makkah"
              type="number"
              min="0"
              value={data.nightsMakkah}
              suffix="malam"
              onChange={(event) => updateSetting("nightsMakkah", num(event.target.value))}
            />
            <TextField
              label="Malam di Madinah"
              type="number"
              min="0"
              value={data.nightsMadinah}
              suffix="malam"
              onChange={(event) => updateSetting("nightsMadinah", num(event.target.value))}
            />
            <TextField
              label="Durasi perjalanan"
              type="number"
              min="1"
              value={data.duration}
              suffix="hari"
              onChange={(event) => updateSetting("duration", num(event.target.value))}
            />
            <TextField
              label="Margin harga jual"
              type="number"
              min="0"
              step="any"
              value={data.markup}
              suffix="%"
              onChange={(event) => updateSetting("markup", num(event.target.value))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kurs SAR ke IDR</CardTitle>
            <CardDescription>
              Hanya biaya SAR yang dikonversi. Memperbarui kurs manual ke kurs otomatis memerlukan
              konfirmasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <TextField
                label="Nilai kurs"
                type="number"
                min="0"
                step="any"
                value={data.exchange}
                suffix="IDR / SAR"
                onChange={(event) => updateSetting("exchange", num(event.target.value))}
              />
              <Button
                variant="secondary"
                icon={<RefreshCw />}
                loading={rateLoading}
                onClick={() => refreshRate()}
              >
                Ambil kurs terbaru
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge>{data.exchangeSource === "manual" ? "Kurs manual" : "Kurs otomatis"}</Badge>
              {data.exchangeSource === "api" && data.exchangeUpdatedAt && (
                <span>Tanggal nilai kurs {data.exchangeUpdatedAt}</span>
              )}
              {data.exchangeFetchedAt && (
                <span>
                  {data.exchangeSource === "manual" ? "Diubah manual" : "Terakhir diperbarui"}{" "}
                  {formatDateTime(data.exchangeFetchedAt)}
                </span>
              )}
            </div>
            {rateError && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {rateError} Kurs tersimpan tetap digunakan.
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Perhitungan saat ini: biaya bersama {fmt(totals.sharedTotal)} dan biaya transportasi{" "}
              {fmt(totals.transportTotal)}.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cadangan data</CardTitle>
            <CardDescription>
              Unduh file JSON untuk menyimpan data paket dan template, atau pulihkan dari cadangan
              sebelumnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button icon={<ArrowDownToLine />} onClick={onExportBackup}>
              Unduh cadangan JSON
            </Button>
            <Button
              variant="secondary"
              icon={<Upload />}
              onClick={() => backupInputRef.current?.click()}
            >
              Pulihkan cadangan
            </Button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={onImportBackup}
            />
            <p className="basis-full text-xs leading-5 text-muted-foreground">
              Pemulihan akan mengganti data paket aktif dan daftar template setelah konfirmasi.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template paket</CardTitle>
            <CardDescription>
              Simpan konfigurasi untuk dipakai kembali. Template tidak mengubah paket aktif sampai
              Anda memilih Gunakan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <TextField
                label="Nama template"
                value={templateName}
                placeholder="Contoh: Umroh Ramadan"
                onChange={(event) => setTemplateName(event.target.value)}
              />
              <Button
                icon={<Plus />}
                disabled={!templateName.trim()}
                onClick={() => {
                  if (onSaveTemplate(templateName)) setTemplateName("");
                }}
              >
                Simpan template
              </Button>
            </div>
            {templates.length ? (
              <div className="divide-y rounded-xl border">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Disimpan {formatDateTime(template.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        iconRight={<ArrowRight />}
                        onClick={() => onApplyTemplate(template)}
                      >
                        Gunakan
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        icon={<Trash2 />}
                        aria-label={`Hapus template ${template.name}`}
                        onClick={() => onDeleteTemplate(template)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyNotice>Belum ada template paket.</EmptyNotice>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <AmountCard
          title="Biaya langsung per jamaah"
          description="Biaya ini ditambahkan satu kali pada HPP setiap jamaah."
          labels={directLabels}
          amounts={data.direct}
          currencies={data.directCurrency}
          onChange={(key, value, currency) => updateAmount("direct", key, value, currency)}
        />
        <AmountCard
          title="Biaya bersama"
          description={`Biaya ini dibagi ke ${integer(data.pax)} jamaah.`}
          labels={sharedLabels}
          amounts={data.shared}
          currencies={data.sharedCurrency}
          onChange={(key, value, currency) => updateAmount("shared", key, value, currency)}
        />
      </div>
      <Card className="mt-4 border-destructive/20">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Atur ulang kalkulator</CardTitle>
            <CardDescription>
              Hapus data paket yang tersimpan di perangkat ini dan mulai dari data awal.
            </CardDescription>
          </div>
          <Button variant="destructive" onClick={resetData}>
            Atur ulang data
          </Button>
        </CardHeader>
      </Card>
    </>
  );
}

function AmountCard({ title, description, labels, amounts, currencies, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {Object.entries(labels).map(([key, label]) => (
          <CurrencyAmount
            key={key}
            label={label}
            value={amounts[key]}
            currency={currencies[key]}
            onValueChange={(event) => onChange(key, num(event.target.value), currencies[key])}
            onCurrencyChange={(value) => onChange(key, amounts[key], value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function OfferPage({ data, totals }) {
  const grouped = totals.rows.filter((item) => item.people > 0);

  return (
    <>
      <PageHeading
        eyebrow="Untuk jamaah"
        title="Penawaran paket"
        description="Tinjau rincian harga sebelum mencetak atau menyimpan sebagai PDF."
        icon={FileText}
      />
      <div className="no-print mb-4 flex justify-end">
        <Button icon={<ArrowDownToLine />} onClick={() => window.print()}>
          Cetak / simpan PDF
        </Button>
      </div>
      <Card id="print-area" className="print-card mx-auto max-w-4xl">
        <CardContent className="px-6 py-7 sm:px-10 sm:py-10">
          <div className="flex flex-col justify-between gap-5 border-b pb-6 sm:flex-row sm:items-start">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-primary">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10">
                  <CircleDollarSign className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold tracking-tight">
                  {data.company || "Travel Umroh"}
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {data.packageName || "Penawaran Paket Umroh"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.departure
                  ? `Keberangkatan ${new Date(`${data.departure}T00:00:00`).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}`
                  : "Tanggal keberangkatan menyesuaikan"}
              </p>
            </div>
            <Badge>Penawaran resmi</Badge>
          </div>

          <div className="grid gap-3 py-6 sm:grid-cols-3">
            <OfferFact icon={Users} label="Kuota" value={`${integer(data.pax)} jamaah`} />
            <OfferFact icon={Clock3} label="Durasi" value={`${integer(data.duration)} hari`} />
            <OfferFact
              icon={CalendarDays}
              label="Akomodasi"
              value={`${integer(data.nightsMakkah + data.nightsMadinah)} malam`}
            />
          </div>

          <div className="rounded-2xl bg-primary/[0.045] p-5 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">Harga mulai dari</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              {fmt(totals.sellPerPax)}
              <span className="ml-2 text-base font-normal text-muted-foreground">/ jamaah</span>
            </p>
          </div>

          <div className="py-6">
            <h3 className="mb-3 text-base font-semibold">Rincian akomodasi</h3>
            {grouped.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[450px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-3 font-medium">Akomodasi</th>
                      <th className="py-3 font-medium">Kota</th>
                      <th className="py-3 text-right font-medium">Harga / jamaah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {grouped.map((item) => (
                      <tr key={item.row.id}>
                        <td className="py-3">
                          <span className="block font-medium">
                            {item.row.name || item.row.city || "Akomodasi"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.kind === "hotel" ? "Hotel" : "Apartemen"}
                          </span>
                        </td>
                        <td className="py-3">{item.row.city || "—"}</td>
                        <td className="py-3 text-right font-medium">
                          {fmt(item.sellPerPax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Rincian akomodasi akan diinformasikan kemudian.
              </p>
            )}
          </div>

          <div className="border-t pt-5">
            <h3 className="mb-2 text-sm font-semibold">Informasi paket</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Harga penawaran dihitung berdasarkan detail biaya paket saat ini. Konfirmasi kembali
              ketersediaan dan ketentuan perjalanan kepada {data.company || "pihak travel"}.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function OfferFact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState(loadData);
  const [templates, setTemplates] = useState(loadTemplates);
  const [theme, setTheme] = useState(loadTheme);
  const [page, setPage] = useState("overview");
  const [saveStatus, setSaveStatus] = useState("Tersimpan");
  const [toast, setToast] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState("");
  const rateRequestId = useRef(0);
  const toastTimer = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const totals = useMemo(() => summarize(data), [data]);
  const warnings = useMemo(() => validatePackage(data, totals), [data, totals]);
  const hasPricing = totals.hppPerPax > 0 || totals.sellPerPax > 0;
  const marginIsLoss = totals.hppPerPax > totals.sellPerPax;
  const grossMarginPercent = totals.revenue
    ? (totals.profit / totals.revenue) * 100
    : 0;
  const detail = pageDetails[page] || pageDetails.overview;

  const notify = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3000);
  };

  const persistTemplates = (next) => {
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(next));
      setTemplates(next);
      return true;
    } catch (error) {
      console.error("Template paket tidak dapat disimpan:", error);
      notify("Template tidak dapat disimpan di perangkat ini.");
      return false;
    }
  };

  const saveTemplate = (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    if (
      templates.some(
        (template) =>
          template.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
      )
    ) {
      notify("Nama template tersebut sudah digunakan.");
      return false;
    }
    const next = [
      ...templates,
      {
        id: createId("template"),
        name: trimmedName,
        createdAt: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(data)),
      },
    ];
    if (!persistTemplates(next)) return false;
    notify(`Template "${trimmedName}" berhasil disimpan.`);
    return true;
  };

  const applyTemplate = (template) => {
    let restored;
    try {
      restored = normalizeData(template.data);
    } catch (error) {
      console.error("Template paket tidak valid:", error);
      notify("Template tidak dapat digunakan karena datanya tidak valid.");
      return;
    }
    if (!window.confirm(`Gunakan template "${template.name}"? Data paket aktif akan diganti.`)) return;
    setData(restored);
    setPage("overview");
    notify(`Template "${template.name}" berhasil diterapkan.`);
  };

  const deleteTemplate = (template) => {
    if (!window.confirm(`Hapus template "${template.name}"?`)) return;
    persistTemplates(templates.filter((item) => item.id !== template.id));
  };

  const exportBackup = () => {
    try {
      const backup = {
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
        templates,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rihlah-cadangan-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Cadangan JSON berhasil diunduh.");
    } catch (error) {
      console.error("Cadangan JSON tidak dapat dibuat:", error);
      notify("Cadangan JSON tidak dapat dibuat.");
    }
  };

  const importBackup = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (
        !backup ||
        typeof backup !== "object" ||
        Array.isArray(backup) ||
        backup.format !== BACKUP_FORMAT ||
        backup.version !== 1 ||
        !Array.isArray(backup.templates)
      ) {
        throw new Error("Format atau versi file cadangan tidak didukung.");
      }
      const restoredData = normalizeData(backup.data);
      const restoredTemplates = backup.templates.map((template, index) => {
        if (
          !template ||
          typeof template.name !== "string" ||
          !template.name.trim()
        ) {
          throw new Error(`Nama template ke-${index + 1} tidak valid.`);
        }
        return {
          id: typeof template.id === "string" && template.id ? template.id : createId("template"),
          name: template.name.trim(),
          createdAt:
            typeof template.createdAt === "string"
              ? template.createdAt
              : new Date().toISOString(),
          data: normalizeData(template.data),
        };
      });
      if (
        !window.confirm(
          "Pulihkan cadangan? Data paket aktif dan daftar template saat ini akan diganti.",
        )
      ) {
        return;
      }
      if (!persistTemplates(restoredTemplates)) return;
      setData(restoredData);
      setPage("overview");
      notify("Cadangan berhasil dipulihkan.");
    } catch (error) {
      console.error("Cadangan tidak dapat dipulihkan:", error);
      notify(
        error instanceof Error
          ? `Cadangan gagal dipulihkan: ${error.message}`
          : "Cadangan gagal dipulihkan.",
      );
    } finally {
      input.value = "";
    }
  };

  const toggleTheme = (event) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (
      typeof document.startViewTransition !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(nextTheme);
      return;
    }

    const root = document.documentElement;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = bounds.left + bounds.width / 2;
    const y = bounds.top + bounds.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    root.style.setProperty("--theme-circle-x", `${x}px`);
    root.style.setProperty("--theme-circle-y", `${y}px`);
    root.style.setProperty("--theme-circle-radius", `${radius}px`);
    root.classList.add("theme-transition");

    try {
      const transition = document.startViewTransition(() => {
        flushSync(() => setTheme(nextTheme));
      });
      void transition.finished.then(
        () => root.classList.remove("theme-transition"),
        (error) => {
          root.classList.remove("theme-transition");
          console.error("Animasi perpindahan tema gagal:", error);
        },
      );
    } catch (error) {
      root.classList.remove("theme-transition");
      console.error("Transisi tema tidak dapat dimulai:", error);
      setTheme(nextTheme);
    }
  };

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error("Preferensi tema tidak dapat disimpan:", error);
      notify("Tema berubah, tetapi preferensinya tidak dapat disimpan.");
    }
  }, [theme]);

  useEffect(() => {
    const persistLatestData = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current));
      } catch (error) {
        console.error("Data kalkulator tidak dapat disimpan saat halaman ditutup:", error);
      }
    };
    const persistWhenHidden = () => {
      if (document.visibilityState === "hidden") persistLatestData();
    };
    window.addEventListener("pagehide", persistLatestData);
    document.addEventListener("visibilitychange", persistWhenHidden);
    return () => {
      window.removeEventListener("pagehide", persistLatestData);
      document.removeEventListener("visibilitychange", persistWhenHidden);
    };
  }, []);

  useEffect(() => {
    setSaveStatus("Menyimpan...");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSaveStatus("Tersimpan");
      } catch (error) {
        console.error("Data kalkulator tidak dapat disimpan:", error);
        setSaveStatus("Gagal menyimpan");
        notify("Data tidak dapat disimpan di perangkat ini.");
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error) => console.error("Service worker PWA gagal didaftarkan:", error));
  }, []);

  useEffect(() => {
    if (data.exchangeSource === "api") void refreshRate();
    return () => {
      rateRequestId.current += 1;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const refreshRate = async (force = false) => {
    if (
      !force &&
      data.exchangeSource === "manual" &&
      !window.confirm("Ganti kurs manual dengan kurs otomatis terbaru?")
    ) {
      return;
    }
    const requestId = ++rateRequestId.current;
    setRateLoading(true);
    setRateError("");
    const endpoints = [
      async (signal) => {
        const response = await fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/sar.json",
          { cache: "no-store", signal },
        );
        if (!response.ok) throw new Error(`API kurs merespons HTTP ${response.status}`);
        const body = await response.json();
        return { rate: body?.sar?.idr, date: body?.date };
      },
      async (signal) => {
        const response = await fetch(
          "https://latest.currency-api.pages.dev/v1/currencies/sar.json",
          { cache: "no-store", signal },
        );
        if (!response.ok) throw new Error(`API kurs merespons HTTP ${response.status}`);
        const body = await response.json();
        return { rate: body?.sar?.idr, date: body?.date };
      },
    ];
    const errors = [];
    try {
      for (const getRate of endpoints) {
        try {
          const result = await getRate(AbortSignal.timeout(10000));
          const rate = Number(result.rate);
          if (Number.isFinite(rate) && rate > 0) {
            if (requestId === rateRequestId.current) {
              setData((current) => ({
                ...current,
                exchange: rate,
                exchangeSource: "api",
                exchangeUpdatedAt: result.date || new Date().toLocaleDateString("id-ID"),
                exchangeFetchedAt: new Date().toISOString(),
              }));
              setRateError("");
            }
            return;
          }
          throw new Error("Respons layanan kurs tidak memuat nilai IDR yang valid");
        } catch (error) {
          errors.push(error);
        }
      }
      const error = errors.at(-1);
      throw new Error(
        `Kurs terbaru gagal diambil: ${error instanceof Error ? error.message : String(error)}`,
      );
    } catch (error) {
      if (requestId === rateRequestId.current) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(message, errors);
        setRateError(message);
      }
    } finally {
      if (requestId === rateRequestId.current) setRateLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    if (key === "exchange") {
      rateRequestId.current += 1;
      setRateLoading(false);
      setRateError("");
    }
    setData((current) => ({
      ...current,
      [key]: value,
      ...(key === "exchange"
        ? {
            exchangeSource: "manual",
            exchangeUpdatedAt: "",
            exchangeFetchedAt: new Date().toISOString(),
          }
        : {}),
    }));
  };

  const updateAmount = (group, key, value, currency) => {
    setData((current) => ({
      ...current,
      [group]: { ...current[group], [key]: value },
      [group === "direct" ? "directCurrency" : "sharedCurrency"]: {
        ...(group === "direct" ? current.directCurrency : current.sharedCurrency),
        [key]: currency,
      },
    }));
  };

  const updateRow = (group, id, key, value) => {
    const collection = group === "hotel" ? "hotels" : group;
    setData((current) => ({
      ...current,
      [collection]: current[collection].map((row) =>
        row.id === id ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const addRow = (group) => {
    const collection = group === "hotel" ? "hotels" : group;
    const id = globalThis.crypto?.randomUUID?.() || `row-${Date.now()}-${Math.random()}`;
    const row =
      group === "hotel"
        ? { id, city: "", category: "Quad", name: "", price: 0, currency: "SAR", checkIn: "", checkOut: "", nightsMode: "auto", nights: 0, rooms: 1, capacity: 4, pax: 0, meal: 0, mealDays: 0 }
        : group === "apartments"
          ? { id, city: "", name: "", price: 0, currency: "SAR", checkIn: "", checkOut: "", days: 0, units: 1, capacity: 4, pax: 0, meal: 0, mealDays: 0 }
          : group === "otherCosts"
            ? { id, name: "", amount: 0, currency: "SAR", calculation: "total" }
            : { id, route: "", description: "", price: 0, currency: "SAR", units: 1, pax: 0 };
    setData((current) => ({
      ...current,
      [collection]: [...current[collection], row],
    }));
  };

  const moveRow = (fromKind, id, toKind) => {
    const from = fromKind === "hotel" ? "hotels" : "apartments";
    const to = toKind === "hotel" ? "hotels" : "apartments";
    if (from === to) return;
    setData((current) => {
      const row = current[from].find((item) => item.id === id);
      if (!row) return current;
      const moved =
        toKind === "hotel"
          ? {
              ...row,
              category: row.category || "Quad",
              nightsMode: row.nightsMode || "auto",
              nights: num(row.nights),
              rooms: num(row.rooms) || 1,
              capacity: num(row.capacity) || 4,
            }
          : {
              ...row,
              units: num(row.units) || 1,
              capacity: num(row.capacity) || 4,
            };
      return {
        ...current,
        [from]: current[from].filter((item) => item.id !== id),
        [to]: [...current[to], moved],
      };
    });
  };

  const removeRow = (group, id) => {
    const collection = group === "hotel" ? "hotels" : group;
    setData((current) => ({
      ...current,
      [collection]: current[collection].filter((row) => row.id !== id),
    }));
  };

  const resetData = () => {
    if (!window.confirm("Hapus semua data paket dan mulai dari data awal?")) return;
    rateRequestId.current += 1;
    setRateLoading(false);
    setRateError("");
    setData(JSON.parse(JSON.stringify(initialData)));
    setPage("overview");
    notify("Data kalkulator telah diatur ulang.");
    void refreshRate(true);
  };

  const nav = (
    <div className={page === "overview" ? "audit-print-mode" : undefined}>
      <AppShell
      label="Rihlah"
      nav={mainNav}
      groups={[
        { id: "costs", label: "Biaya paket", items: costNav, collapsible: false },
        { id: "offers", label: "Penawaran", items: offerNav, collapsible: false },
      ]}
      active={page}
      onSelect={(node) => setPage(node.id)}
      storageKey="rihlah-knowns-shell"
      breadcrumb={[
        { label: "Rihlah" },
        { label: detail.label },
      ]}
      user={
        <Badge
          role="img"
          aria-label="Rihlah"
          className="grid size-8 place-items-center rounded-full p-1 text-[11px] font-semibold"
        >
          <img
            src={`${import.meta.env.BASE_URL}rihlah-icon.png`}
            alt=""
            className="size-full object-contain dark:invert"
          />
        </Badge>
      }
      actions={
        <>
          <Button
            variant="ghost"
            size="md"
            icon={theme === "dark" ? <Sun /> : <Moon />}
            aria-label={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
            aria-pressed={theme === "dark"}
            title={theme === "dark" ? "Tema terang" : "Tema gelap"}
            onClick={toggleTheme}
          />
          <Button
            size="sm"
            iconRight={<ArrowRight />}
            className="hidden sm:inline-flex"
            onClick={() => setPage("offer")}
          >
            Penawaran
          </Button>
        </>
      }
      sidebarFooter={
        <div className="space-y-3 rounded-xl border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">Status data</span>
            <Badge>{saveStatus}</Badge>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Perubahan tersimpan otomatis di perangkat ini.
          </p>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-32 pt-6 sm:px-7 sm:pb-28 sm:pt-8 lg:px-9">
        {page === "overview" && (
          <Overview data={data} totals={totals} warnings={warnings} setPage={setPage} />
        )}
        {page === "lodging" && (
          <AccommodationPage
            hotels={data.hotels}
            apartments={data.apartments}
            totals={{ ...totals, exchange: data.exchange }}
            updateRow={updateRow}
            moveRow={moveRow}
            removeRow={removeRow}
            addRow={addRow}
          />
        )}
        {page === "transport" && (
          <TransportPage
            rows={data.transport}
            total={totals.transportTotal}
            exchange={data.exchange}
            updateRow={updateRow}
            removeRow={removeRow}
            addRow={addRow}
          />
        )}
        {page === "custom-costs" && (
          <CustomCostsPage
            rows={data.otherCosts}
            total={totals.otherCostsTotal}
            exchange={data.exchange}
            pax={data.pax}
            updateRow={updateRow}
            removeRow={removeRow}
            addRow={addRow}
          />
        )}
        {page === "other-costs" && (
          <OtherCostsPage
            data={data}
            totals={totals}
            updateSetting={updateSetting}
            updateAmount={updateAmount}
            refreshRate={refreshRate}
            rateLoading={rateLoading}
            rateError={rateError}
            resetData={resetData}
            templates={templates}
            onSaveTemplate={saveTemplate}
            onApplyTemplate={applyTemplate}
            onDeleteTemplate={deleteTemplate}
            onExportBackup={exportBackup}
            onImportBackup={importBackup}
          />
        )}
        {page === "offer" && <OfferPage data={data} totals={totals} />}
        <footer className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          Rihlah · Kalkulator biaya perjalanan umroh
        </footer>
      </div>
      <div
        role="status"
        aria-live="polite"
        className={`no-print fixed right-0 bottom-0 left-[var(--kn-sidebar-inset-left,0px)] z-30 border-t shadow-lg backdrop-blur ${
          marginIsLoss
            ? "border-red-300 bg-red-50/95 dark:border-red-900 dark:bg-red-950/95"
            : hasPricing
              ? "border-emerald-300 bg-emerald-50/95 dark:border-emerald-900 dark:bg-emerald-950/95"
              : "border-border bg-background/95"
        }`}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-3 gap-2 px-4 py-3 sm:gap-6 sm:px-7 sm:py-4 lg:px-9">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">
              Total HPP / jamaah
            </p>
            <p className="mt-1 truncate text-xs font-semibold tabular-nums sm:text-base">
              {fmt(totals.hppPerPax)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">
              Harga jual paket
            </p>
            <p className="mt-1 truncate text-xs font-semibold tabular-nums sm:text-base">
              {fmt(totals.sellPerPax)}
            </p>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
              per jamaah · total {fmt(totals.revenue)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">
              Margin keuntungan
            </p>
            <p
              className={`mt-1 truncate text-xs font-bold tabular-nums sm:text-base ${
                marginIsLoss
                  ? "text-red-700 dark:text-red-300"
                  : hasPricing
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-foreground"
              }`}
            >
              {fmt(totals.profit)}
            </p>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
              {marginIsLoss
                ? "HPP melebihi harga jual"
                : hasPricing
                  ? `${grossMarginPercent.toLocaleString("id-ID", {
                      maximumFractionDigits: 1,
                    })}% dari penjualan`
                  : "Masukkan biaya untuk menghitung"}
            </p>
          </div>
        </div>
      </div>
      {toast && (
        <div
          className="fixed bottom-24 right-5 z-50 max-w-sm rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg sm:bottom-28"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
      </AppShell>
      {page === "overview" && (
        <AuditPrintReport data={data} totals={totals} warnings={warnings} />
      )}
    </div>
  );

  return nav;
}

createRoot(document.getElementById("root")).render(<App />);
