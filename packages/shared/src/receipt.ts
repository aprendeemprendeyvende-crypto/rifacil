import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { v2 as cloudinary } from "cloudinary";

/**
 * Generación de recibos DEL LADO DEL SERVIDOR.
 *
 * Por qué existe: la v1 usaba html2canvas + canvas.toDataURL() en el navegador,
 * que se ROMPE en iOS Safari (límites de memoria de canvas). Ese es el bug de
 * "no genera recibos/números en iPhone". Aquí el recibo se dibuja en el servidor
 * (Satori -> SVG -> PNG con resvg) y se sube a Cloudinary FIRMADO. El iPhone solo
 * recibe una imagen ya hecha: imposible que falle por el navegador.
 *
 * Reemplaza el stub `generateReceipt` que `packages/api/src/routers/sale.ts` ya
 * importa de "@riffas/shared".
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// --- Fuente para Satori (se cachea entre invocaciones del worker) ---
let fontCache: ArrayBuffer | null = null;
async function getFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  // Inter 600 desde un CDN público; cámbialo por un archivo local si prefieres 0 red.
  const url =
    "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.otf";
  const res = await fetch(url);
  fontCache = await res.arrayBuffer();
  return fontCache;
}

// Helper para construir el árbol sin JSX (shared no tiene React/JSX configurado)
function el(type: string, style: Record<string, any>, children?: any): any {
  return { type, props: { style, children } };
}

const money = (v: unknown) =>
  `$${Number(v ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d?: Date | string | null) =>
  d
    ? new Date(d).toLocaleString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

export interface GenerateReceiptInput {
  sale: {
    receiptNumber: string;
    numbers: string[];
    totalNumbers: number;
    totalAmount?: unknown;
    finalAmount: unknown;
    paymentMethod?: string | null;
    paidAt?: Date | string | null;
    createdAt?: Date | string | null;
  };
  raffle: {
    title: string;
    lottery?: string | null;
    drawDate?: Date | string | null;
  };
  contact: { name: string; phone: string };
  brandName?: string | null;
  brandLogo?: string | null;
  brandColor?: string | null;
}

export async function generateReceipt(
  input: GenerateReceiptInput
): Promise<string> {
  const { sale, raffle, contact } = input;
  const brand = input.brandColor || "#7C3AED";
  const brandName = input.brandName || "Riffas";

  const row = (label: string, value: string, strong = false) =>
    el(
      "div",
      { display: "flex", justifyContent: "space-between", marginBottom: 6 },
      [
        el("span", { color: "#6B7280", fontSize: 22 }, label),
        el(
          "span",
          { color: strong ? brand : "#111827", fontSize: 22, fontWeight: 600 },
          value
        ),
      ]
    );

  const divider = el("div", {
    borderTop: "2px dashed #D1D5DB",
    margin: "14px 0",
    width: "100%",
  });

  const tree = el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      backgroundColor: "#FFFFFF",
      padding: 40,
      fontFamily: "Inter",
    },
    [
      // Encabezado de marca
      el(
        "div",
        { display: "flex", alignItems: "center", marginBottom: 8 },
        [
          el("div", {
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: brand,
            marginRight: 16,
          }),
          el(
            "div",
            { display: "flex", flexDirection: "column" },
            [
              el("span", { fontSize: 30, fontWeight: 600, color: "#111827" }, brandName),
              el("span", { fontSize: 20, color: "#6B7280" }, raffle.title),
            ]
          ),
        ]
      ),
      el(
        "span",
        { fontSize: 18, color: "#6B7280", marginBottom: 4 },
        `${fmtDate(raffle.drawDate)}${raffle.lottery ? ` · Lotería: ${raffle.lottery}` : ""}`
      ),
      divider,
      row("Recibo", sale.receiptNumber),
      row(
        sale.totalNumbers > 1 ? "Boletos" : "Boleto",
        sale.numbers.join(", ")
      ),
      row("Comprador", contact.name),
      row("Teléfono", contact.phone),
      divider,
      row("Valor total", money(sale.totalAmount ?? sale.finalAmount)),
      row("Pagado", money(sale.finalAmount), true),
      sale.paymentMethod ? row("Método", String(sale.paymentMethod)) : el("div", {}),
      row("Fecha", fmtDate(sale.paidAt || sale.createdAt)),
      divider,
      el(
        "span",
        { fontSize: 24, color: brand, fontWeight: 600, textAlign: "center", marginTop: 8 },
        "¡Gracias por su compra!"
      ),
    ]
  );

  const font = await getFont();
  const svg = await satori(tree, {
    width: 720,
    height: 760,
    fonts: [{ name: "Inter", data: font, weight: 600, style: "normal" }],
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 720 } })
    .render()
    .asPng();

  const dataUri = `data:image/png;base64,${png.toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: "riffas/receipts",
    public_id: sale.receiptNumber,
    overwrite: true,
    resource_type: "image",
  });

  return uploaded.secure_url;
}
