export const STORAGE_KEY = "rihlah-umrah-calculator-v1";

export const initialData = {
  company: "Travel Umroh",
  packageName: "Paket Umroh",
  departure: "",
  pax: 20,
  exchange: 4500,
  exchangeSource: "api",
  exchangeUpdatedAt: "",
  exchangeFetchedAt: "",
  markup: 10,
  nightsMakkah: 5,
  nightsMadinah: 5,
  duration: 12,
  direct: { visa: 0, flight: 0, zamzam: 0, porter: 0 },
  directCurrency: { visa: "IDR", flight: "SAR", zamzam: "SAR", porter: "SAR" },
  shared: { airport: 0, hotel: 0, guide: 0, other: 0 },
  sharedCurrency: { airport: "SAR", hotel: "SAR", guide: "SAR", other: "SAR" },
  hotels: [],
  apartments: [],
  transport: [],
  otherCosts: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const normalizeRows = (rows, prefix) =>
  Array.isArray(rows)
    ? rows
        .filter((row) => row && typeof row === "object")
        .map((row, index) => ({
          ...row,
          id: typeof row.id === "string" && row.id ? row.id : `${prefix}-${index}`,
        }))
    : [];
export const num = (value) =>
  Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const normalizedAmounts = (values, defaults) =>
  Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      num(values?.[key] ?? fallback),
    ]),
  );
const normalizedCurrencies = (values, defaults) =>
  Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      values?.[key] === "IDR" || (values?.[key] === undefined && fallback === "IDR")
        ? "IDR"
        : "SAR",
    ]),
  );
const normalizeLodgingRows = (rows, prefix) =>
  normalizeRows(rows, prefix).map((row) => ({
    ...row,
    checkIn: typeof row.checkIn === "string" ? row.checkIn : "",
    checkOut: typeof row.checkOut === "string" ? row.checkOut : "",
    nightsMode:
      row.nightsMode === "auto" || row.nightsMode === "manual"
        ? row.nightsMode
        : !row.checkIn && !row.checkOut
          ? "manual"
          : "auto",
  }));
const normalizeOtherCosts = (rows) =>
  normalizeRows(rows, "other-cost").map((row) => ({
    ...row,
    name: typeof row.name === "string" ? row.name : "",
    amount: num(row.amount),
    currency: row.currency === "IDR" ? "IDR" : "SAR",
    calculation: row.calculation === "pax" ? "pax" : "total",
  }));
const nightsBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  return Number.isFinite(start) && Number.isFinite(end) && end > start
    ? Math.round((end - start) / 86_400_000)
    : 0;
};

export function normalizeData(saved) {
  if (!isRecord(saved)) throw new Error("Data paket harus berupa objek JSON.");

  const shared = normalizedAmounts(saved.shared, initialData.shared);
  const otherCosts =
    saved.otherCosts === undefined && num(saved.shared?.other) > 0
      ? [
          {
            id: "legacy-other-cost",
            name: "Biaya lainnya",
            amount: num(saved.shared.other),
            currency: saved.sharedCurrency?.other === "IDR" ? "IDR" : "SAR",
            calculation: "total",
          },
        ]
      : normalizeOtherCosts(saved.otherCosts);
  shared.other = 0;

  return {
    ...clone(initialData),
    ...saved,
    company: typeof saved.company === "string" ? saved.company : initialData.company,
    packageName:
      typeof saved.packageName === "string" ? saved.packageName : initialData.packageName,
    departure: typeof saved.departure === "string" ? saved.departure : "",
    pax: num(saved.pax ?? initialData.pax),
    exchange: num(saved.exchange ?? initialData.exchange),
    exchangeSource: saved.exchangeSource === "manual" ? "manual" : "api",
    exchangeUpdatedAt:
      typeof saved.exchangeUpdatedAt === "string" ? saved.exchangeUpdatedAt : "",
    exchangeFetchedAt:
      typeof saved.exchangeFetchedAt === "string" ? saved.exchangeFetchedAt : "",
    markup: num(saved.markup ?? initialData.markup),
    nightsMakkah: num(saved.nightsMakkah ?? initialData.nightsMakkah),
    nightsMadinah: num(saved.nightsMadinah ?? initialData.nightsMadinah),
    duration: num(saved.duration ?? initialData.duration),
    direct: normalizedAmounts(saved.direct, initialData.direct),
    directCurrency: normalizedCurrencies(saved.directCurrency, initialData.directCurrency),
    shared,
    sharedCurrency: normalizedCurrencies(saved.sharedCurrency, initialData.sharedCurrency),
    hotels: normalizeLodgingRows(saved.hotels, "hotel"),
    apartments: normalizeLodgingRows(saved.apartments, "apartment"),
    transport: normalizeRows(saved.transport, "transport"),
    otherCosts,
  };
}

export const integer = (value) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value || 0);
export const fmt = (value, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
export const rowCurrency = (row) => (row.currency === "IDR" ? "IDR" : "SAR");
const toIdr = (value, currency, exchange) =>
  num(value) * (currency === "SAR" ? num(exchange) : 1);

export function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved ? normalizeData(saved) : clone(initialData);
  } catch (error) {
    console.error("Data tersimpan tidak dapat dibaca:", error);
    return clone(initialData);
  }
}

export function summarize(data) {
  const hotelRows = data.hotels.map((row) => {
    const nights = row.nightsMode === "auto"
      ? nightsBetween(row.checkIn, row.checkOut)
      : num(row.nights);
    const cost = toIdr(
      num(row.price) * nights * num(row.rooms),
      rowCurrency(row),
      data.exchange,
    );
    return {
      kind: "hotel",
      row,
      cost,
      nights,
      people: num(row.pax),
      cap: num(row.rooms) * num(row.capacity),
    };
  });
  const apartmentRows = data.apartments.map((row) => ({
    kind: "apartments",
    row,
    cost: toIdr(
      num(row.price) * num(row.units),
      rowCurrency(row),
      data.exchange,
    ),
    people: num(row.pax),
    cap: num(row.units) * num(row.capacity),
  }));
  const rows = [...hotelRows, ...apartmentRows];
  const transportTotal = data.transport.reduce(
    (sum, row) =>
      sum +
      toIdr(
        num(row.price) * num(row.units),
        rowCurrency(row),
        data.exchange,
      ),
    0,
  );
  const sharedTotal = Object.entries(data.shared).reduce(
    (sum, [key, value]) =>
      sum + toIdr(value, data.sharedCurrency[key], data.exchange),
    0,
  );
  const passengerCount = num(data.pax);
  const otherCostsTotal = data.otherCosts.reduce(
    (sum, row) =>
      sum +
      toIdr(
        num(row.amount) * (row.calculation === "pax" ? passengerCount : 1),
        rowCurrency(row),
        data.exchange,
      ),
    0,
  );
  const directPerPax = Object.entries(data.direct).reduce(
    (sum, [key, value]) =>
      sum + toIdr(value, data.directCurrency[key], data.exchange),
    0,
  );
  const commonPerPax = passengerCount
    ? (sharedTotal + transportTotal + otherCostsTotal) / passengerCount + directPerPax
    : 0;

  rows.forEach((item) => {
    item.mealPerPax = toIdr(
      num(item.row.meal) * num(item.row.mealDays),
      rowCurrency(item.row),
      data.exchange,
    );
    item.costTotal = item.people
      ? item.cost + item.people * (item.mealPerPax + commonPerPax)
      : 0;
    item.costPerPax = item.people ? item.costTotal / item.people : 0;
    item.sellPerPax = item.costPerPax * (1 + num(data.markup) / 100);
    item.sellTotal = item.sellPerPax * item.people;
  });

  const costTotal = rows.reduce((sum, item) => sum + item.costTotal, 0);
  const revenue = rows.reduce((sum, item) => sum + item.sellTotal, 0);
  const allocated = rows.reduce((sum, item) => sum + item.people, 0);
  const accommodationTotal = rows.reduce(
    (sum, item) => sum + (item.people ? item.cost : 0),
    0,
  );
  const mealTotal = rows.reduce(
    (sum, item) => sum + item.people * item.mealPerPax,
    0,
  );
  const costBreakdownPerPax = passengerCount
    ? {
        accommodation: accommodationTotal / passengerCount,
        meals: mealTotal / passengerCount,
        transport: (transportTotal * allocated) / passengerCount ** 2,
        shared: (sharedTotal * allocated) / passengerCount ** 2,
        direct: (directPerPax * allocated) / passengerCount,
        otherCosts: (otherCostsTotal * allocated) / passengerCount ** 2,
      }
    : { accommodation: 0, meals: 0, transport: 0, shared: 0, direct: 0, otherCosts: 0 };
  const hasLodging = rows.some((item) => item.cost > 0 || item.people > 0);
  const issues = rows.filter(
    (item) => item.people > item.cap || (item.cost > 0 && !item.people),
  ).length;

  return {
    rows,
    transportTotal,
    sharedTotal,
    otherCostsTotal,
    directPerPax,
    commonPerPax,
    costBreakdownPerPax,
    costTotal,
    revenue,
    profit: revenue - costTotal,
    allocated,
    hasLodging,
    issues,
    hppPerPax: passengerCount ? costTotal / passengerCount : 0,
    sellPerPax: passengerCount ? revenue / passengerCount : 0,
  };
}

export function validatePackage(data, totals) {
  const warnings = [];
  const add = (id, message, page) => warnings.push({ id, message, page });
  const text = (value) => (typeof value === "string" ? value.trim() : "");
  const pax = num(data.pax);
  const lodgingPage = "lodging";

  if (!text(data.company)) add("company", "Nama travel belum diisi.", "other-costs");
  if (!text(data.packageName)) add("package-name", "Nama paket belum diisi.", "other-costs");
  if (!data.departure) add("departure", "Tanggal keberangkatan belum ditentukan.", "other-costs");
  if (!pax) add("pax", "Jumlah jamaah harus lebih dari nol.", "other-costs");

  if (!data.hotels.length && !data.apartments.length) {
    add("lodging", "Tambahkan hotel atau apartemen untuk menghitung biaya akomodasi.", "lodging");
  }

  data.hotels.forEach((row, index) => {
    const label = text(row.name) || text(row.city) || `Hotel ${index + 1}`;
    const nights = row.nightsMode === "auto"
      ? nightsBetween(row.checkIn, row.checkOut)
      : num(row.nights);
    if (!num(row.price)) add(`hotel-price-${row.id}`, `Tarif ${label} belum diisi.`, "lodging");
    if (!nights) add(`hotel-nights-${row.id}`, `Jumlah malam ${label} belum diisi.`, "lodging");
    if (!num(row.rooms)) add(`hotel-rooms-${row.id}`, `Jumlah kamar ${label} belum diisi.`, "lodging");
    if (!num(row.pax)) add(`hotel-pax-${row.id}`, `Alokasi jamaah untuk ${label} belum diisi.`, "lodging");
  });

  data.apartments.forEach((row, index) => {
    const label = text(row.name) || text(row.city) || `Apartemen ${index + 1}`;
    if (!num(row.price)) add(`apartment-price-${row.id}`, `Tarif ${label} belum diisi.`, "lodging");
    if (!num(row.units)) add(`apartment-units-${row.id}`, `Jumlah unit ${label} belum diisi.`, "lodging");
    if (!num(row.pax)) add(`apartment-pax-${row.id}`, `Alokasi jamaah untuk ${label} belum diisi.`, "lodging");
  });

  data.transport.forEach((row, index) => {
    const label = text(row.route) || `Transportasi ${index + 1}`;
    if (!num(row.price)) add(`transport-price-${row.id}`, `Biaya ${label} belum diisi.`, "transport");
    if (!num(row.units)) add(`transport-units-${row.id}`, `Jumlah kendaraan ${label} belum diisi.`, "transport");
  });

  data.otherCosts.forEach((row, index) => {
    const label = text(row.name) || `Biaya lainnya ${index + 1}`;
    if (!num(row.amount)) add(`other-cost-amount-${row.id}`, `Nominal ${label} belum diisi.`, "custom-costs");
  });

  if (pax && totals.allocated < pax) {
    add(
      "allocation-short",
      `Alokasi baru ${integer(totals.allocated)} dari ${integer(pax)} jamaah.`,
      lodgingPage,
    );
  } else if (pax && totals.allocated > pax) {
    add(
      "allocation-over",
      `Alokasi ${integer(totals.allocated)} melebihi jumlah jamaah ${integer(pax)}.`,
      lodgingPage,
    );
  }

  if (totals.issues > 0) {
    add(
      "capacity",
      "Periksa kapasitas kamar dan alokasi jamaah.",
      lodgingPage,
    );
  }

  const hasSarCosts =
    Object.entries(data.direct).some(
      ([key, value]) => data.directCurrency[key] === "SAR" && num(value) > 0,
    ) ||
    Object.entries(data.shared).some(
      ([key, value]) => data.sharedCurrency[key] === "SAR" && num(value) > 0,
    ) ||
    [...data.hotels, ...data.apartments, ...data.transport].some(
      (row) => rowCurrency(row) === "SAR" && (num(row.price) > 0 || num(row.meal) > 0),
    ) ||
    data.otherCosts.some((row) => rowCurrency(row) === "SAR" && num(row.amount) > 0);
  if (hasSarCosts && !num(data.exchange)) {
    add("exchange", "Kurs SAR/IDR belum valid, sehingga biaya SAR tidak dapat dikonversi.", "other-costs");
  }

  if (data.exchangeSource === "api" && !data.exchangeFetchedAt) {
    add("exchange-date", "Waktu pembaruan kurs belum tercatat; periksa kurs sebelum menetapkan harga.", "other-costs");
  }

  return warnings;
}
