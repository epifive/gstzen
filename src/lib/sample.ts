import { createDoc, defaultSettings } from "./defaults";
import { gstinCheckChar } from "./gst";
import { uid } from "./id";
import { addDaysISO, formatDocNumber, todayISO } from "./numbering";
import type { Doc, LineItem, Settings, StoreData } from "./types";

const gstin = (first14: string) => first14 + gstinCheckChar(first14);

const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="#4f46e5"/><path d="M24 30h48M24 48h48M24 66h48" stroke="#99f6e4" stroke-width="7" stroke-linecap="round"/><path d="M34 22v52M62 22v52" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/></svg>`,
  );

function item(description: string, hsn: string, qty: number, unit: string, rate: number, taxRate: number, discountPct = 0): LineItem {
  return { id: uid("li_"), description, hsn, qty, unit, rate, taxRate, discountPct };
}

export function sampleSettings(): Settings {
  const s = defaultSettings();
  s.business = {
    name: "Indigo Loom Studio (Sample)",
    address: "2nd Floor, 14 Lotus Arcade, FC Road\nShivajinagar, Pune 411005",
    stateCode: "27",
    country: "India",
    gstin: gstin("27ABCDE1234F1Z"),
    pan: "ABCDE1234F",
    taxId: "",
    phone: "+91 98765 43210",
    email: "hello@example.com",
    website: "www.example.com",
    logo: LOGO,
    signature: "",
    bank: {
      accountName: "Indigo Loom Studio",
      accountNumber: "50100123456789",
      ifsc: "HDFC0001234",
      bankName: "HDFC Bank",
      branch: "FC Road, Pune",
      swift: "",
    },
    upiId: "indigoloom@okhdfc",
    upiName: "Indigo Loom Studio",
  };
  s.defaults.terms = "Payment due within 15 days. Please quote the invoice number with your payment.";
  return s;
}

/** Sample data for the demo and the "Load sample data" button. Every record is flagged `sample`. */
export function sampleStore(now = new Date()): StoreData {
  const settings = sampleSettings();
  const today = todayISO(now);
  const mk = (type: Doc["type"], n: number, daysAgo: number, patch: Partial<Doc>): Doc => {
    const doc = createDoc(type, settings, now);
    const date = addDaysISO(today, -daysAgo);
    doc.date = date;
    doc.number = formatDocNumber(settings.numbering[type], n, date);
    if (type === "invoice") doc.dueDate = addDaysISO(date, 15);
    if (type === "quote") doc.dueDate = addDaysISO(date, 30);
    if (type === "receipt") doc.payment.date = date;
    Object.assign(doc, patch);
    doc.sample = true;
    return doc;
  };

  const docs: Doc[] = [
    mk("invoice", 1, 12, {
      client: {
        name: "Bluebay Retail LLP (Sample)",
        address: "88 Residency Road\nBengaluru 560025",
        stateCode: "29",
        country: "India",
        gstin: gstin("29AAFFB1234K1Z"),
        taxId: "",
        phone: "+91 90000 11111",
        email: "accounts@example.com",
        shipTo: "Bluebay Warehouse, Plot 7, KIADB Industrial Area\nHoskote 562114, Karnataka",
      },
      placeOfSupply: "29",
      poNumber: "PO-4471",
      items: [
        item("Handloom cotton bedsheet set (double)", "6302", 40, "Set", 1450, 5),
        item("Cushion covers, block print (pack of 5)", "6304", 60, "Pack", 899, 5, 5),
        item("Packaging and freight", "9965", 1, "Job", 2500, 18),
      ],
    }),
    mk("invoice", 2, 4, {
      client: {
        name: "Sahyadri Cafe (Sample)",
        address: "Shop 3, Linking Road, Bandra West\nMumbai 400050",
        stateCode: "27",
        country: "India",
        gstin: gstin("27AAKCS5678M1Z"),
        taxId: "",
        phone: "+91 91234 56789",
        email: "",
        shipTo: "",
      },
      placeOfSupply: "27",
      items: [
        item("Interior textile styling (design service)", "998391", 1, "Job", 35000, 18),
        item("Table runners, custom size", "6302", 24, "Pcs", 650, 5),
      ],
      discount: { type: "percent", value: 10 },
    }),
    mk("invoice", 3, 1, {
      title: "Export Invoice",
      client: {
        name: "Nordic Living AB (Sample)",
        address: "Sveavägen 12\n111 57 Stockholm, Sweden",
        stateCode: "",
        country: "Sweden",
        gstin: "",
        taxId: "SE556677889901",
        phone: "",
        email: "orders@example.com",
        shipTo: "",
      },
      placeOfSupply: "96",
      currency: "INR",
      items: [item("Hand-woven throws (zero-rated export under LUT)", "6301", 50, "Pcs", 2200, 0)],
      notes: "Supply meant for export under LUT without payment of IGST.",
      showUpiQr: false,
    }),
    mk("quote", 1, 2, {
      client: {
        name: "Green Leaf Hotels Pvt Ltd (Sample)",
        address: "Baner Road\nPune 411045",
        stateCode: "27",
        country: "India",
        gstin: gstin("27AABCG4321H1Z"),
        taxId: "",
        phone: "",
        email: "purchase@example.com",
        shipTo: "",
      },
      placeOfSupply: "27",
      items: [
        item("Room curtains, blackout lined", "6303", 120, "Pcs", 2350, 5),
        item("Installation and fitting", "995472", 1, "Job", 18000, 18),
      ],
      terms: "Prices valid for 30 days. 50% advance with order, balance on delivery.",
    }),
    mk("receipt", 1, 3, {
      client: {
        name: "Bluebay Retail LLP (Sample)",
        address: "88 Residency Road\nBengaluru 560025",
        stateCode: "29",
        country: "India",
        gstin: gstin("29AAFFB1234K1Z"),
        taxId: "",
        phone: "",
        email: "",
        shipTo: "",
      },
      placeOfSupply: "29",
      items: [item(`Payment against invoice ${formatDocNumber(settings.numbering.invoice, 1, today)}`, "", 1, "Nos", 50000, 0)],
      taxMode: "none",
      payment: { mode: "UPI", reference: "UPI Ref 431298765012", date: addDaysISO(today, -3), amountPaid: null },
      notes: "Received with thanks.",
    }),
  ];
  settings.numbering.invoice.next = 4;
  settings.numbering.quote.next = 2;
  settings.numbering.receipt.next = 2;
  return { version: 1, settings, docs };
}
