import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import multer from "multer";
import archiver from "archiver";
import pdfParse from "pdf-parse";
import PDFKit from "pdfkit";
import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts
} from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";
import mammoth from "mammoth";
import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { toolCatalog, categories } from "./toolCatalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 20
  }
});

app.use(cors());
app.use(express.json({ limit: "12mb" }));

const contentTypes = {
  pdf: "application/pdf",
  zip: "application/zip",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  jpg: "image/jpeg",
  txt: "text/plain; charset=utf-8"
};

const toolMap = new Map(toolCatalog.map((tool) => [tool.id, tool]));

app.get("/api/tools", (req, res) => {
  res.json({ categories, tools: toolCatalog });
});

app.post("/api/tools/:toolId", upload.array("files", 20), async (req, res) => {
  const tool = toolMap.get(req.params.toolId);
  if (!tool) {
    res.status(404).json({ error: "Tool not found" });
    return;
  }

  try {
    const options = parseOptions(req.body);
    const files = req.files ?? [];

    if (files.length < tool.minFiles) {
      throw userError(`${tool.title} needs at least ${tool.minFiles} file(s).`);
    }

    const output = await processTool(tool.id, files, options);
    res.setHeader("Content-Type", output.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeDownloadName(output.filename)}"`
    );
    res.send(output.buffer);
  } catch (error) {
    const status = error.statusCode ?? 500;
    res.status(status).json({
      error:
        status >= 500
          ? "Processing failed. Please try a smaller or simpler file."
          : error.message
    });
    if (status >= 500) {
      console.error(error);
    }
  }
});

const distDir = path.join(rootDir, "dist");
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(distDir, "index.html"), (error) => {
    if (error) {
      res.status(404).send("Run npm run build or use npm run dev.");
    }
  });
});

const port = Number(process.env.PORT ?? 5050);
app.listen(port, () => {
  console.log(`PDF Workbench API running on http://127.0.0.1:${port}`);
});

async function processTool(toolId, files, options) {
  switch (toolId) {
    case "merge-pdf":
      return mergePdf(files);
    case "split-pdf":
      return splitPdf(files[0], options);
    case "compress-pdf":
      return compressPdf(files);
    case "pdf-to-word":
      return pdfToWord(files[0]);
    case "pdf-to-powerpoint":
      return pdfToPowerPoint(files[0]);
    case "pdf-to-excel":
      return pdfToExcel(files[0]);
    case "word-to-pdf":
      return wordToPdf(files[0]);
    case "powerpoint-to-pdf":
      return powerPointToPdf(files[0]);
    case "excel-to-pdf":
      return excelToPdf(files[0]);
    case "edit-pdf":
      return addTextToPdf(files[0], options);
    case "pdf-to-jpg":
      return pdfToJpg(files[0], options);
    case "jpg-to-pdf":
    case "scan-to-pdf":
      return imagesToPdf(files, toolId);
    case "sign-pdf":
      return signPdf(files[0], options);
    case "watermark":
      return watermarkPdf(files[0], options);
    case "rotate-pdf":
      return rotatePdf(files[0], options);
    case "html-to-pdf":
      return htmlToPdf(files[0], options);
    case "unlock-pdf":
      return unlockPdf(files[0]);
    case "protect-pdf":
      return protectPdf(files[0], options);
    case "organize-pdf":
      return organizePdf(files[0], options);
    case "pdf-to-pdfa":
      return pdfToPdfA(files[0]);
    case "repair-pdf":
      return repairPdf(files[0]);
    case "page-numbers":
      return pageNumbers(files[0], options);
    case "ocr-pdf":
      return ocrPdf(files[0]);
    case "compare-pdf":
      return comparePdf(files.slice(0, 2));
    case "redact-pdf":
      return redactPdf(files[0], options);
    case "crop-pdf":
      return cropPdf(files[0], options);
    case "pdf-forms":
      return pdfForms(files[0], options);
    case "ai-summarizer":
      return aiSummarizer(files[0], options);
    case "translate-pdf":
      return translatePdf(files[0], options);
    case "create-workflow":
      return createWorkflow(files, options);
    default:
      throw userError("This tool is not available yet.");
  }
}

async function mergePdf(files) {
  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await loadPdf(file.buffer);
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }

  return pdfOutput(await output.save(), "merged.pdf");
}

async function splitPdf(file, options) {
  const source = await loadPdf(file.buffer);
  const pageCount = source.getPageCount();
  const selections = parseRangeGroups(options.ranges, pageCount);
  const entries = [];

  if (selections.length === 0) {
    for (let index = 0; index < pageCount; index += 1) {
      entries.push({
        name: `${baseName(file)}-page-${index + 1}.pdf`,
        data: await copySelectedPages(source, [index])
      });
    }
  } else {
    for (let index = 0; index < selections.length; index += 1) {
      entries.push({
        name: `${baseName(file)}-part-${index + 1}.pdf`,
        data: await copySelectedPages(source, selections[index])
      });
    }
  }

  return zipOutput(await zipEntries(entries), `${baseName(file)}-split.zip`);
}

async function compressPdf(files) {
  const entries = [];
  for (const file of files) {
    const pdfDoc = await loadPdf(file.buffer, { updateMetadata: false });
    pdfDoc.setProducer("PDF Workbench");
    pdfDoc.setCreator("PDF Workbench");
    const buffer = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 80
    });
    entries.push({
      name: `${baseName(file)}-compressed.pdf`,
      data: buffer
    });
  }

  if (entries.length === 1) {
    return pdfOutput(entries[0].data, entries[0].name);
  }

  return zipOutput(await zipEntries(entries), "compressed-pdfs.zip");
}

async function pdfToWord(file) {
  const text = await extractFileText(file);
  const paragraphs = textToParagraphs(text).map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line || " ", size: 22 })],
        spacing: { after: 140 }
      })
  );

  const doc = new Document({
    creator: "PDF Workbench",
    title: `${baseName(file)} converted`,
    sections: [
      {
        properties: {},
        children: paragraphs.length ? paragraphs : [new Paragraph("")]
      }
    ]
  });

  return {
    buffer: await Packer.toBuffer(doc),
    contentType: contentTypes.docx,
    filename: `${baseName(file)}.docx`
  };
}

async function pdfToPowerPoint(file) {
  const text = await extractFileText(file);
  const chunks = chunkText(text || "No selectable text was found.", 720);
  const pptx = new PptxGenJS();
  pptx.author = "PDF Workbench";
  pptx.subject = "Converted PDF text";
  pptx.title = `${baseName(file)} presentation`;
  pptx.company = "PDF Workbench";
  pptx.layout = "LAYOUT_WIDE";
  pptx.theme = {
    headFontFace: "Aptos Display",
    bodyFontFace: "Aptos",
    lang: "en-US"
  };

  chunks.forEach((chunk, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FAFAFC" };
    slide.addText(`Slide ${index + 1}`, {
      x: 0.6,
      y: 0.35,
      w: 12.1,
      h: 0.45,
      fontFace: "Aptos Display",
      bold: true,
      color: "2F3440",
      fontSize: 23
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 0.95,
      w: 12.1,
      h: 0,
      line: { color: "E2342F", width: 2 }
    });
    slide.addText(chunk, {
      x: 0.7,
      y: 1.25,
      w: 11.9,
      h: 5.7,
      fit: "shrink",
      breakLine: false,
      color: "444B59",
      fontSize: 18,
      valign: "top"
    });
  });

  return {
    buffer: await pptx.write({ outputType: "nodebuffer" }),
    contentType: contentTypes.pptx,
    filename: `${baseName(file)}.pptx`
  };
}

async function pdfToExcel(file) {
  const text = await extractFileText(file);
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => splitTableLine(line));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PDF Workbench";
  const sheet = workbook.addWorksheet("Extracted text");
  sheet.addRows(rows.length ? rows : [["No selectable text found"]]);
  for (let index = 1; index <= 8; index += 1) {
    sheet.getColumn(index).width = 24;
  }
  sheet.getRow(1).font = { bold: true };

  return {
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
    contentType: contentTypes.xlsx,
    filename: `${baseName(file)}.xlsx`
  };
}

async function wordToPdf(file) {
  const extension = ext(file);
  if (extension !== "docx") {
    throw userError("Please upload a DOCX file. Legacy DOC files need Word/LibreOffice conversion first.");
  }
  const result = await mammoth.extractRawText({ buffer: file.buffer });
  return textPdfOutput(
    `${baseName(file)} converted to PDF`,
    result.value || "No readable document text was found.",
    `${baseName(file)}.pdf`
  );
}

async function powerPointToPdf(file) {
  const zip = await JSZip.loadAsync(file.buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

  if (!slideFiles.length) {
    throw userError("No slides were found in this PPTX file.");
  }

  const slides = [];
  for (const slidePath of slideFiles) {
    const xml = await zip.file(slidePath).async("string");
    const pieces = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)].map((match) =>
      decodeXml(match[1])
    );
    slides.push(pieces.join("\n").replace(/\n{3,}/g, "\n\n"));
  }

  return textPdfOutput(
    `${baseName(file)} slides`,
    slides.map((slide, index) => `Slide ${index + 1}\n${slide}`).join("\n\n"),
    `${baseName(file)}.pdf`
  );
}

async function excelToPdf(file) {
  const workbook = new ExcelJS.Workbook();
  if (ext(file) === "csv") {
    const rows = parseCsv(file.buffer.toString("utf8"));
    const sheet = workbook.addWorksheet("CSV");
    sheet.addRows(rows);
  } else {
    await workbook.xlsx.load(file.buffer);
  }

  let text = "";
  workbook.worksheets.forEach((sheet) => {
    const rows = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      rows.push(row.values.slice(1));
    });
    text += `${sheet.name}\n`;
    text += rows
      .slice(0, 500)
      .map((row) => row.map((cell) => String(cell ?? "")).join("    "))
      .join("\n");
    text += "\n\n";
  });

  return textPdfOutput(
    `${baseName(file)} spreadsheet`,
    text || "No spreadsheet rows were found.",
    `${baseName(file)}.pdf`,
    { monospace: true }
  );
}

async function addTextToPdf(file, options) {
  const pdfDoc = await loadPdf(file.buffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const text = cleanInput(options.overlayText || "Edited with PDF Workbench");

  for (const page of pdfDoc.getPages()) {
    const { height } = page.getSize();
    page.drawText(text, {
      x: 42,
      y: height - 54,
      size: 13,
      font,
      color: rgb(0.9, 0.14, 0.12)
    });
  }

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-edited.pdf`);
}

async function pdfToJpg(file, options) {
  const maxPages = clampNumber(options.maxPages, 1, 40, 12);
  const entries = await renderPdfToJpgEntries(file.buffer, baseName(file), maxPages);

  if (entries.length === 1) {
    return {
      buffer: entries[0].data,
      contentType: contentTypes.jpg,
      filename: entries[0].name
    };
  }

  return zipOutput(await zipEntries(entries), `${baseName(file)}-jpg.zip`);
}

async function imagesToPdf(files, toolId) {
  const pdfDoc = await PDFDocument.create();
  for (const file of files) {
    const extension = ext(file);
    const image =
      extension === "png"
        ? await pdfDoc.embedPng(file.buffer)
        : await pdfDoc.embedJpg(file.buffer);
    const pageSize = fitImageToPage(image.width, image.height);
    const page = pdfDoc.addPage([pageSize.pageWidth, pageSize.pageHeight]);
    page.drawImage(image, {
      x: pageSize.x,
      y: pageSize.y,
      width: pageSize.width,
      height: pageSize.height
    });
  }

  return pdfOutput(
    await pdfDoc.save(),
    toolId === "scan-to-pdf" ? "scans.pdf" : "images.pdf"
  );
}

async function signPdf(file, options) {
  const pdfDoc = await loadPdf(file.buffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  const signature = cleanInput(options.signature || "Signed");

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize();
    page.drawText(signature, {
      x: Math.max(42, width - signature.length * 8 - 80),
      y: 44,
      size: 18,
      font,
      color: rgb(0.08, 0.28, 0.55)
    });
    page.drawLine({
      start: { x: Math.max(42, width - 240), y: 36 },
      end: { x: width - 42, y: 36 },
      thickness: 1.2,
      color: rgb(0.08, 0.28, 0.55)
    });
  }

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-signed.pdf`);
}

async function watermarkPdf(file, options) {
  const pdfDoc = await loadPdf(file.buffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const text = cleanInput(options.watermarkText || "PDF Workbench");

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width * 0.16,
      y: height * 0.45,
      size: clampNumber(options.watermarkSize, 28, 96, 54),
      font,
      rotate: degrees(-28),
      opacity: 0.16,
      color: rgb(0.87, 0.1, 0.08)
    });
  }

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-watermarked.pdf`);
}

async function rotatePdf(file, options) {
  const pdfDoc = await loadPdf(file.buffer);
  const angle = Number(options.degrees || 90);
  const normalized = [90, 180, 270].includes(angle) ? angle : 90;

  for (const page of pdfDoc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + normalized) % 360));
  }

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-rotated.pdf`);
}

async function htmlToPdf(file, options) {
  let html = options.html || "";
  if (options.url) {
    const response = await fetch(options.url);
    if (!response.ok) {
      throw userError("Could not fetch that URL.");
    }
    html = await response.text();
  } else if (file) {
    html = file.buffer.toString("utf8");
  }

  if (!html.trim()) {
    throw userError("Paste HTML, provide a URL, or upload an HTML file.");
  }

  const text = stripHtml(html);
  return textPdfOutput("HTML to PDF", text, "html-converted.pdf");
}

async function unlockPdf(file) {
  try {
    const pdfDoc = await loadPdf(file.buffer, { ignoreEncryption: true });
    return pdfOutput(await pdfDoc.save(), `${baseName(file)}-unlocked.pdf`);
  } catch {
    throw userError(
      "This PDF is encrypted with a password. Local unlock only works for readable PDFs without a required password."
    );
  }
}

async function protectPdf(file, options) {
  const pdfDoc = await loadPdf(file.buffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const label = cleanInput(options.protectLabel || "CONFIDENTIAL");

  pdfDoc.setTitle(`${baseName(file)} protected`);
  pdfDoc.setSubject("Visible protection notice added by PDF Workbench");

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(label, {
      x: width * 0.2,
      y: height * 0.5,
      size: 46,
      font,
      color: rgb(0.05, 0.18, 0.36),
      opacity: 0.13,
      rotate: degrees(-25)
    });
  }

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-protected.pdf`);
}

async function organizePdf(file, options) {
  const source = await loadPdf(file.buffer);
  const pageCount = source.getPageCount();
  const order = parsePageSelection(options.order, pageCount);
  const selected = order.length ? order : source.getPageIndices();

  return pdfOutput(
    await copySelectedPages(source, selected),
    `${baseName(file)}-organized.pdf`
  );
}

async function pdfToPdfA(file) {
  const pdfDoc = await loadPdf(file.buffer, { updateMetadata: false });
  pdfDoc.setTitle(`${baseName(file)} archival copy`);
  pdfDoc.setSubject("Archival copy generated locally by PDF Workbench");
  pdfDoc.setCreator("PDF Workbench");
  pdfDoc.setProducer("PDF Workbench");
  pdfDoc.setKeywords(["archive", "pdf-a", "local-copy"]);

  return pdfOutput(await pdfDoc.save({ useObjectStreams: true }), `${baseName(file)}-archive.pdf`);
}

async function repairPdf(file) {
  try {
    const pdfDoc = await loadPdf(file.buffer, { ignoreEncryption: true });
    return pdfOutput(await pdfDoc.save({ useObjectStreams: true }), `${baseName(file)}-repaired.pdf`);
  } catch {
    throw userError("The file structure is too damaged for the local repair engine to open.");
  }
}

async function pageNumbers(file, options) {
  const pdfDoc = await loadPdf(file.buffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const prefix = cleanInput(options.prefix || "Page");
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const { width } = page.getSize();
    const text = `${prefix} ${index + 1} / ${pages.length}`;
    page.drawText(text, {
      x: width / 2 - text.length * 3,
      y: 22,
      size: 10,
      font,
      color: rgb(0.2, 0.22, 0.27)
    });
  });

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-numbered.pdf`);
}

async function ocrPdf(file) {
  const text = await extractFileText(file);
  const message =
    text.trim() ||
    "No selectable text was found. Image OCR requires a Tesseract or cloud OCR engine.";

  return {
    buffer: Buffer.from(message, "utf8"),
    contentType: contentTypes.txt,
    filename: `${baseName(file)}-text.txt`
  };
}

async function comparePdf(files) {
  if (files.length < 2) {
    throw userError("Compare PDF needs two PDF files.");
  }

  const firstText = await extractFileText(files[0]);
  const secondText = await extractFileText(files[1]);
  const report = buildDiffReport(firstText, secondText, files[0], files[1]);
  return textPdfOutput("PDF Comparison Report", report, "pdf-comparison-report.pdf", {
    monospace: true
  });
}

async function redactPdf(file, options) {
  const term = cleanInput(options.redactTerm || "");
  if (!term) {
    throw userError("Enter the text you want to redact.");
  }

  const pdfDoc = await loadPdf(file.buffer);
  const matches = await findTextBoxes(file.buffer, term);
  if (!matches.length) {
    throw userError("No matching selectable text was found in this PDF.");
  }

  const pages = pdfDoc.getPages();
  for (const match of matches) {
    const page = pages[match.pageIndex];
    if (!page) continue;
    page.drawRectangle({
      x: match.x,
      y: match.y,
      width: Math.max(12, match.width),
      height: Math.max(10, match.height),
      color: rgb(0, 0, 0),
      opacity: 1
    });
  }

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-redacted.pdf`);
}

async function cropPdf(file, options) {
  const pdfDoc = await loadPdf(file.buffer);
  const margin = clampNumber(options.margin, 0, 144, 24);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    page.setCropBox(margin, margin, width - margin * 2, height - margin * 2);
  }

  return pdfOutput(await pdfDoc.save(), `${baseName(file)}-cropped.pdf`);
}

async function pdfForms(file, options) {
  const pdfDoc = file ? await loadPdf(file.buffer) : await PDFDocument.create();
  let page = pdfDoc.getPages()[0];
  if (!page) {
    page = pdfDoc.addPage([612, 792]);
  }

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  page.drawText(cleanInput(options.formTitle || "Fillable Request Form"), {
    x: 54,
    y: 724,
    size: 24,
    font,
    color: rgb(0.18, 0.2, 0.25)
  });

  const form = pdfDoc.getForm();
  const nameField = form.createTextField("full_name");
  nameField.setText("");
  nameField.addToPage(page, { x: 54, y: 650, width: 260, height: 32 });

  const emailField = form.createTextField("email");
  emailField.setText("");
  emailField.addToPage(page, { x: 54, y: 590, width: 260, height: 32 });

  const approval = form.createCheckBox("approved");
  approval.addToPage(page, { x: 54, y: 535, width: 18, height: 18 });

  const labelFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText("Full name", { x: 54, y: 686, size: 11, font: labelFont });
  page.drawText("Email", { x: 54, y: 626, size: 11, font: labelFont });
  page.drawText("Approved", { x: 82, y: 538, size: 11, font: labelFont });

  return pdfOutput(await pdfDoc.save(), `${file ? baseName(file) : "form"}-fillable.pdf`);
}

async function aiSummarizer(file, options) {
  const text = await extractFileText(file);
  const sentenceCount = clampNumber(options.sentences, 3, 12, 6);
  const summary = summarizeText(text, sentenceCount);

  return textPdfOutput(
    "Local Summary",
    summary || "No readable text was found to summarize.",
    `${baseName(file)}-summary.pdf`
  );
}

async function translatePdf(file, options) {
  const targetLanguage = cleanInput(options.targetLanguage || "Hindi");
  const text = await extractFileText(file);
  const packet = [
    `Translation packet`,
    `Target language: ${targetLanguage}`,
    "",
    "This local build extracts document text and prepares it for translation. Connect a translation provider in server/index.js for automatic translated output.",
    "",
    text || "No selectable text was found."
  ].join("\n");

  return textPdfOutput(
    `Translate to ${targetLanguage}`,
    packet,
    `${baseName(file)}-translation-packet.pdf`
  );
}

async function createWorkflow(files, options) {
  const pdfFiles = files.filter((file) => ext(file) === "pdf");
  if (!pdfFiles.length) {
    return imagesToPdf(files, "scan-to-pdf");
  }

  const merged = await mergePdf(pdfFiles);
  const workflowFile = {
    originalname: "workflow.pdf",
    buffer: merged.buffer
  };
  const numbered = await pageNumbers(workflowFile, {
    prefix: options.prefix || "Workflow"
  });
  return watermarkPdf(
    { originalname: "workflow-numbered.pdf", buffer: numbered.buffer },
    { watermarkText: options.watermarkText || "Reviewed" }
  );
}

async function copySelectedPages(source, selectedPageIndexes) {
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, selectedPageIndexes);
  pages.forEach((page) => output.addPage(page));
  return output.save();
}

async function renderPdfToJpgEntries(buffer, name, maxPages) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = await import("@napi-rs/canvas");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    const pageTotal = Math.min(pdf.numPages, maxPages);
    const entries = [];

    for (let pageNumber = 1; pageNumber <= pageTotal; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.65 });
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );
      const canvasContext = canvas.getContext("2d");
      await page.render({ canvasContext, viewport }).promise;
      entries.push({
        name: `${name}-page-${pageNumber}.jpg`,
        data: canvas.toBuffer("image/jpeg", 88)
      });
    }
    return entries;
  } catch (error) {
    const text = await extractPdfText(buffer).catch(() => "");
    return [
      {
        name: `${name}-preview.jpg`,
        data: await textToJpeg(
          "PDF preview",
          text || "This PDF could not be rendered as an image by the local renderer."
        )
      }
    ];
  }
}

async function findTextBoxes(buffer, term) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useSystemFonts: true
  });
  const pdf = await loadingTask.promise;
  const matches = [];
  const needle = term.toLowerCase();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      const value = String(item.str || "");
      if (!value.toLowerCase().includes(needle)) continue;
      const [, , , fontHeight, x, y] = item.transform;
      matches.push({
        pageIndex: pageNumber - 1,
        x,
        y: y - Math.abs(fontHeight) * 0.25,
        width: item.width || value.length * 6,
        height: Math.max(10, Math.abs(fontHeight) * 1.2)
      });
    }
  }

  return matches;
}

async function textToJpeg(title, text) {
  const { createCanvas } = await import("@napi-rs/canvas");
  const canvas = createCanvas(1200, 1500);
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#2f3440";
  context.font = "700 48px Arial";
  context.fillText(title, 72, 110);
  context.fillStyle = "#e2342f";
  context.fillRect(72, 140, 240, 8);
  context.fillStyle = "#4b515f";
  context.font = "26px Arial";
  drawCanvasText(context, text, 72, 210, 1056, 36, 30);
  return canvas.toBuffer("image/jpeg", 88);
}

function textPdfOutput(title, text, filename, options = {}) {
  return pdfKitBuffer((doc) => {
    doc.info.Title = title;
    doc.font(options.monospace ? "Courier" : "Helvetica-Bold");
    doc.fontSize(18).fillColor("#2f3440").text(title, {
      underline: false
    });
    doc.moveDown(0.45);
    doc
      .strokeColor("#e2342f")
      .lineWidth(2)
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(1);
    doc.font(options.monospace ? "Courier" : "Helvetica");
    doc.fontSize(options.monospace ? 8.5 : 11).fillColor("#363b47");
    doc.text(text || "No readable text was found.", {
      align: "left",
      lineGap: 3
    });
  }).then((buffer) => ({
    buffer,
    contentType: contentTypes.pdf,
    filename
  }));
}

function pdfKitBuffer(draw) {
  return new Promise((resolve, reject) => {
    const doc = new PDFKit({
      size: "A4",
      margin: 54,
      bufferPages: true,
      autoFirstPage: true
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    draw(doc);
    doc.end();
  });
}

async function zipEntries(entries) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks = [];
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    entries.forEach((entry) =>
      archive.append(Buffer.from(entry.data), { name: entry.name })
    );
    archive.finalize();
  });
}

async function extractFileText(file) {
  if (!file) return "";
  const extension = ext(file);
  if (extension === "pdf") {
    return extractPdfText(file.buffer);
  }
  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return normalizeText(result.value);
  }
  if (extension === "txt" || extension === "html" || extension === "htm") {
    return normalizeText(file.buffer.toString("utf8"));
  }
  return normalizeText(file.buffer.toString("utf8"));
}

async function extractPdfText(buffer) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str || "").join(" "));
    }
    return normalizeText(pages.join("\n\n"));
  } catch {
    const result = await pdfParse(buffer);
    return normalizeText(result.text);
  }
}

function buildDiffReport(firstText, secondText, firstFile, secondFile) {
  const firstLines = uniqueLines(firstText);
  const secondLines = uniqueLines(secondText);
  const firstSet = new Set(firstLines);
  const secondSet = new Set(secondLines);
  const removed = firstLines.filter((line) => !secondSet.has(line)).slice(0, 220);
  const added = secondLines.filter((line) => !firstSet.has(line)).slice(0, 220);

  return [
    `Compared: ${firstFile.originalname} -> ${secondFile.originalname}`,
    "",
    `Removed or changed lines (${removed.length})`,
    ...removed.map((line) => `- ${line}`),
    "",
    `Added or changed lines (${added.length})`,
    ...added.map((line) => `+ ${line}`)
  ].join("\n");
}

function summarizeText(text, sentenceCount) {
  const sentences = normalizeText(text)
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30) ?? [];

  if (!sentences.length) return "";

  const stopWords = new Set(
    "the a an and or of to for in on with as by this that these those is are was were be been from it its at into about".split(
      " "
    )
  );
  const words = normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
  const frequency = new Map();
  words.forEach((word) => frequency.set(word, (frequency.get(word) ?? 0) + 1));

  const ranked = sentences
    .map((sentence, index) => {
      const score = sentence
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .reduce((total, word) => total + (frequency.get(word) ?? 0), 0);
      return { sentence, index, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.index - b.index)
    .map((item, index) => `${index + 1}. ${item.sentence}`);

  return ranked.join("\n\n");
}

function parseRangeGroups(input, pageCount) {
  if (!input) return [];
  return String(input)
    .split(";")
    .map((group) => parsePageSelection(group, pageCount))
    .filter((group) => group.length);
}

function parsePageSelection(input, pageCount) {
  if (!input) return [];
  const pages = [];
  for (const part of String(input).split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = clampNumber(rangeMatch[1], 1, pageCount, 1);
      const end = clampNumber(rangeMatch[2], 1, pageCount, pageCount);
      const direction = start <= end ? 1 : -1;
      for (let page = start; direction > 0 ? page <= end : page >= end; page += direction) {
        pages.push(page - 1);
      }
      continue;
    }

    const page = Number(trimmed);
    if (Number.isInteger(page) && page >= 1 && page <= pageCount) {
      pages.push(page - 1);
    }
  }

  return pages;
}

function splitTableLine(line) {
  const cells = line
    .split(/\t| {2,}|,(?=\s*\S)/)
    .map((cell) => cell.trim())
    .filter(Boolean);
  return cells.length ? cells : [line];
}

function parseCsv(text) {
  return normalizeText(text)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const cells = [];
      let current = "";
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];
        if (char === "\"" && quoted && next === "\"") {
          current += "\"";
          index += 1;
        } else if (char === "\"") {
          quoted = !quoted;
        } else if (char === "," && !quoted) {
          cells.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(current);
      return cells;
    });
}

function textToParagraphs(text) {
  return normalizeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, index, lines) => line || (lines[index - 1] && lines[index + 1]));
}

function chunkText(text, maxLength) {
  const words = normalizeText(text).split(/\s+/);
  const chunks = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxLength) {
      chunks.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks.slice(0, 40) : [""];
}

function fitImageToPage(imageWidth, imageHeight) {
  const maxWidth = 612;
  const maxHeight = 792;
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    pageWidth: maxWidth,
    pageHeight: maxHeight,
    width,
    height,
    x: (maxWidth - width) / 2,
    y: (maxHeight - height) / 2
  };
}

function drawCanvasText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = normalizeText(text).split(/\s+/);
  let line = "";
  let lineNumber = 0;
  for (const word of words) {
    const testLine = `${line} ${word}`.trim();
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y + lineNumber * lineHeight);
      line = word;
      lineNumber += 1;
      if (lineNumber >= maxLines) {
        context.fillText("...", x, y + lineNumber * lineHeight);
        return;
      }
    } else {
      line = testLine;
    }
  }
  if (line && lineNumber < maxLines) {
    context.fillText(line, x, y + lineNumber * lineHeight);
  }
}

function stripHtml(html) {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
  );
}

function uniqueLines(text) {
  return normalizeText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2);
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function cleanInput(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]+/g, " ")
    .trim()
    .slice(0, 500);
}

function parseOptions(body) {
  if (!body) return {};
  if (body.options) {
    try {
      return JSON.parse(body.options);
    } catch {
      return {};
    }
  }
  return body;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

async function loadPdf(buffer, options = {}) {
  return PDFDocument.load(buffer, {
    ignoreEncryption: Boolean(options.ignoreEncryption),
    updateMetadata: options.updateMetadata !== false
  });
}

function ext(file) {
  return String(file?.originalname ?? "")
    .split(".")
    .pop()
    .toLowerCase();
}

function baseName(file) {
  return path
    .basename(file?.originalname ?? "document", path.extname(file?.originalname ?? ""))
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "document";
}

function pdfOutput(buffer, filename) {
  return {
    buffer: Buffer.from(buffer),
    contentType: contentTypes.pdf,
    filename
  };
}

function zipOutput(buffer, filename) {
  return {
    buffer,
    contentType: contentTypes.zip,
    filename
  };
}

function safeDownloadName(filename) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, "-");
}

function userError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
