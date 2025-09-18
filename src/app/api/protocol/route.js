import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  // читаем оригинальный PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // подключаем fontkit
  pdfDoc.registerFontkit(fontkit);

  // грузим Roboto
  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Roboto-Regular.ttf"
  );
  const fontBytes = fs.readFileSync(fontPath);
  const robotoFont = await pdfDoc.embedFont(fontBytes);

  // берём первую страницу
  const [firstPage] = pdfDoc.getPages();
  const { width, height } = firstPage.getSize();

  // встраиваем содержимое первой страницы
  const embeddedPage = await pdfDoc.embedPage(firstPage);

  // удаляем оригинальную первую страницу
  pdfDoc.removePage(0);

  // создаём новую страницу
  const newPage = pdfDoc.insertPage(0, [width, height]);

  // рисуем шапку
  newPage.drawText("ШАПКА ПРОТОКОЛА", {
    x: 200,
    y: height - 40,
    size: 12,
    font: robotoFont,
    color: rgb(0, 0, 0),
  });

  newPage.drawText("Протокол №1", {
    x: 50,
    y: height - 80,
    size: 14,
    font: robotoFont,
  });

  const today = new Date().toLocaleDateString("ru-RU");
  newPage.drawText(`Дата: ${today}`, {
    x: 50,
    y: height - 100,
    size: 12,
    font: robotoFont,
  });

  // смещаем старое содержимое вниз (например, на 120px)
  newPage.drawPage(embeddedPage, {
    x: 0,
    y: 0, // можно поменять на 50–100 для отступа
    width,
    height: height - 60, // сжимаем, чтобы влезло
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
