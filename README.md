# Workbench

A polished full-stack PDF toolbox inspired by modern PDF utility dashboards. It includes a React frontend and an Express backend with upload, process, and download flows for common PDF tasks.

## Features

- Merge, split, compress, rotate, crop, watermark, sign, and number PDFs
- Convert PDF text to DOCX, PPTX, XLSX, TXT, and JPG previews
- Convert DOCX, PPTX, XLSX/CSV, JPG/PNG, and HTML/text into PDFs
- Compare PDFs, create simple fillable forms, and generate local summaries
- Responsive tool grid with category filters and a reusable upload runner

## Setup

```bash
npm install
npm run build
npm start
```

Open `http://127.0.0.1:5050`.

For development:

```bash
npm run dev
```

## Notes

Some advanced tools use local best-effort processing. Password-protected PDFs, full OCR, and automatic translation need extra engines or API integrations.
