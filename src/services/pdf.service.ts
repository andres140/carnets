import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { CarnetDetail } from "@/types/carnet";
import type { SessionUser } from "@/types/usuario";
import { auditoriaService } from "./auditoria.service";
import { qrService } from "./qr.service";

export type CarnetPdfAction = "GENERAR_PDF" | "DESCARGAR_PDF" | "REIMPRIMIR_PDF";

export interface CarnetPdfData extends CarnetDetail {
  dependenciaNombre?: string | null;
}

type RawCarnetForPdf = Omit<
  CarnetPdfData,
  "fechaExpedicion" | "fechaVencimiento" | "createdAt" | "emitidoPorNombre"
> & {
  fechaExpedicion: Date | string;
  fechaVencimiento: Date | string;
  createdAt: Date | string;
  emitidoPor?: { nombreCompleto: string } | null;
  usuario?: { dependencia?: { nombre: string } | null } | null;
};

const SENA_GREEN = "#39A900";
const SENA_DARK = "#1f2937";
const SENA_GRAY = "#6b7280";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f8fafc",
    padding: 36,
    fontFamily: "Helvetica",
  },
  title: {
    color: SENA_DARK,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 18,
  },
  card: {
    width: 360,
    minHeight: 236,
    backgroundColor: "#ffffff",
    border: `2 solid ${SENA_GREEN}`,
    borderRadius: 8,
    overflow: "hidden",
  },
  topBar: {
    backgroundColor: SENA_GREEN,
    color: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoBlock: {
    width: 54,
    height: 32,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: SENA_GREEN,
    fontSize: 16,
    fontWeight: "bold",
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  institution: {
    fontSize: 8,
    fontWeight: "bold",
  },
  credential: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
  },
  body: {
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  photo: {
    width: 78,
    height: 96,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  mainInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: SENA_DARK,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  field: {
    width: "50%",
    paddingRight: 6,
    marginBottom: 5,
  },
  fieldFull: {
    width: "100%",
    marginBottom: 5,
  },
  label: {
    color: SENA_GRAY,
    fontSize: 6,
    textTransform: "uppercase",
  },
  value: {
    color: SENA_DARK,
    fontSize: 8,
    marginTop: 1,
  },
  code: {
    color: SENA_DARK,
    fontSize: 8,
    fontFamily: "Courier",
    marginTop: 1,
  },
  qrBox: {
    width: 68,
    alignItems: "center",
  },
  qr: {
    width: 62,
    height: 62,
  },
  qrCaption: {
    color: SENA_GRAY,
    fontSize: 5,
    textAlign: "center",
    marginTop: 4,
  },
  footer: {
    borderTop: "1 solid #e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    color: SENA_GRAY,
    fontSize: 7,
  },
});

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function readValue(value?: string | null) {
  return value?.trim() ? value : "No registrado";
}

function CarnetPdfDocument({
  carnet,
  qrDataUrl,
}: {
  carnet: CarnetPdfData;
  qrDataUrl: string;
}) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Vista imprimible del carne institucional"),
      React.createElement(
        View,
        { style: styles.card },
        React.createElement(
          View,
          { style: styles.topBar },
          React.createElement(
            View,
            { style: styles.logoBlock },
            React.createElement(Text, { style: styles.logoText }, "SENA")
          ),
          React.createElement(
            View,
            { style: styles.headerText },
            React.createElement(Text, { style: styles.institution }, "Servicio Nacional de Aprendizaje"),
            React.createElement(Text, { style: styles.credential }, "Carne institucional")
          )
        ),
        React.createElement(
          View,
          { style: styles.body },
          carnet.fotoUrl
            ? React.createElement(Image, { src: carnet.fotoUrl, style: styles.photo })
            : React.createElement(View, { style: styles.photo }),
          React.createElement(
            View,
            { style: styles.mainInfo },
            React.createElement(Text, { style: styles.name }, carnet.nombreCompleto),
            React.createElement(
              View,
              { style: styles.grid },
              React.createElement(Field, { label: "Documento", value: carnet.documento }),
              React.createElement(Field, { label: "Tipo usuario", value: carnet.tipoUsuario }),
              React.createElement(Field, { label: "Estado", value: carnet.estado }),
              React.createElement(Field, { label: "Regional", value: readValue(carnet.regionalNombre) }),
              React.createElement(Field, { label: "Centro de formacion", value: readValue(carnet.centroNombre), full: true }),
              React.createElement(Field, { label: "Dependencia", value: readValue(carnet.dependenciaNombre), full: true }),
              React.createElement(Field, { label: "Codigo unico", value: carnet.codigoUnico, code: true, full: true })
            )
          ),
          React.createElement(
            View,
            { style: styles.qrBox },
            React.createElement(Image, { src: qrDataUrl, style: styles.qr }),
            React.createElement(Text, { style: styles.qrCaption }, "Validacion publica")
          )
        ),
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(Text, { style: styles.footerText }, `Expedicion: ${formatDate(carnet.fechaExpedicion)}`),
          React.createElement(Text, { style: styles.footerText }, `Vencimiento: ${formatDate(carnet.fechaVencimiento)}`)
        )
      )
    )
  );
}

function Field({
  label,
  value,
  code,
  full,
}: {
  label: string;
  value: string;
  code?: boolean;
  full?: boolean;
}) {
  return React.createElement(
    View,
    { style: full ? styles.fieldFull : styles.field },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: code ? styles.code : styles.value }, value)
  );
}

export const pdfService = {
  buildCarnetPdfData(carnet: RawCarnetForPdf): CarnetPdfData {
    return {
      ...carnet,
      fechaExpedicion: new Date(carnet.fechaExpedicion).toISOString(),
      fechaVencimiento: new Date(carnet.fechaVencimiento).toISOString(),
      createdAt: new Date(carnet.createdAt).toISOString(),
      emitidoPorNombre: carnet.emitidoPor?.nombreCompleto ?? "No registrado",
      dependenciaNombre: carnet.usuario?.dependencia?.nombre ?? carnet.dependenciaNombre ?? null,
    };
  },

  async generateCarnetPdf(carnet: CarnetPdfData, qrDataUrl: string): Promise<Buffer> {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const doc = CarnetPdfDocument({ carnet, qrDataUrl });
    return renderToBuffer(doc);
  },

  async generateForCarnet(params: {
    carnet: RawCarnetForPdf;
    actor: SessionUser;
    action: CarnetPdfAction;
    ip?: string;
  }) {
    const carnetData = this.buildCarnetPdfData(params.carnet);
    const qrUrl = qrService.buildValidationUrl(carnetData.qrToken);
    const qrDataUrl = await qrService.generateQrDataUrl(qrUrl);
    const buffer = await this.generateCarnetPdf(carnetData, qrDataUrl);

    await auditoriaService.log({
      usuarioId: params.actor.id,
      accion: params.action,
      entidad: "Carnet",
      entidadId: carnetData.id,
      detalle: {
        codigoUnico: carnetData.codigoUnico,
        qrUrl,
        reimpresion: params.action === "REIMPRIMIR_PDF",
      },
      ip: params.ip,
    });

    return { buffer, carnet: carnetData };
  },
};
