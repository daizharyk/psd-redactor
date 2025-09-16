import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  // читаем оригинальный PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // добавляем страницу в начало
  const page = pdfDoc.insertPage(0, [595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText("ШАПКА ПРОТОКОЛА", {
    x: 200,
    y: 800,
    size: 18,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText("Протокол №1", {
    x: 50,
    y: 750,
    size: 14,
    font,
  });

  const today = new Date().toLocaleDateString();
  page.drawText(`Дата: ${today}`, {
    x: 50,
    y: 730,
    size: 12,
    font,
  });

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=protocol.pdf",
    },
  });
}
