export const toolCatalog = [
  {
    id: "merge-pdf",
    title: "Merge PDF",
    category: "Organize PDF",
    accent: "coral",
    accept: ".pdf",
    multiple: true,
    minFiles: 2,
    description: "Combine PDFs in the order you upload them."
  },
  {
    id: "split-pdf",
    title: "Split PDF",
    category: "Organize PDF",
    accent: "coral",
    accept: ".pdf",
    minFiles: 1,
    description: "Export each page or selected ranges as independent PDF files."
  },
  {
    id: "compress-pdf",
    title: "Compress PDF",
    category: "Optimize PDF",
    accent: "green",
    accept: ".pdf",
    minFiles: 1,
    description: "Rewrite PDFs with object streams and metadata cleanup."
  },
  {
    id: "pdf-to-word",
    title: "PDF to Word",
    category: "Convert PDF",
    accent: "blue",
    accept: ".pdf",
    minFiles: 1,
    description: "Extract selectable PDF text into an editable DOCX document."
  },
  {
    id: "pdf-to-powerpoint",
    title: "PDF to PowerPoint",
    category: "Convert PDF",
    accent: "orange",
    accept: ".pdf",
    minFiles: 1,
    description: "Turn extracted PDF content into PPTX slides."
  },
  {
    id: "pdf-to-excel",
    title: "PDF to Excel",
    category: "Convert PDF",
    accent: "green",
    accept: ".pdf",
    minFiles: 1,
    description: "Extract table-like PDF text into workbook rows."
  },
  {
    id: "word-to-pdf",
    title: "Word to PDF",
    category: "Convert PDF",
    accent: "blue",
    accept: ".doc,.docx",
    minFiles: 1,
    description: "Convert DOCX text into a clean PDF."
  },
  {
    id: "powerpoint-to-pdf",
    title: "PowerPoint to PDF",
    category: "Convert PDF",
    accent: "orange",
    accept: ".pptx",
    minFiles: 1,
    description: "Extract PPTX slide text and render a readable PDF."
  },
  {
    id: "excel-to-pdf",
    title: "Excel to PDF",
    category: "Convert PDF",
    accent: "green",
    accept: ".xlsx,.csv",
    minFiles: 1,
    description: "Render spreadsheet rows into a paginated PDF."
  },
  {
    id: "edit-pdf",
    title: "Edit PDF",
    category: "Edit PDF",
    accent: "purple",
    accept: ".pdf",
    minFiles: 1,
    description: "Add custom text to every page."
  },
  {
    id: "pdf-to-jpg",
    title: "PDF to JPG",
    category: "Convert PDF",
    accent: "yellow",
    accept: ".pdf",
    minFiles: 1,
    description: "Render PDF pages into JPG images."
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    category: "Convert PDF",
    accent: "yellow",
    accept: ".jpg,.jpeg,.png",
    multiple: true,
    minFiles: 1,
    description: "Turn images into a single PDF."
  },
  {
    id: "sign-pdf",
    title: "Sign PDF",
    category: "Edit PDF",
    accent: "blue",
    accept: ".pdf",
    minFiles: 1,
    description: "Place a signature label on each PDF page."
  },
  {
    id: "watermark",
    title: "Watermark",
    category: "Edit PDF",
    accent: "purple",
    accept: ".pdf",
    minFiles: 1,
    description: "Stamp transparent text over your PDF."
  },
  {
    id: "rotate-pdf",
    title: "Rotate PDF",
    category: "Organize PDF",
    accent: "purple",
    accept: ".pdf",
    minFiles: 1,
    description: "Rotate every page by 90, 180, or 270 degrees."
  },
  {
    id: "html-to-pdf",
    title: "HTML to PDF",
    category: "Convert PDF",
    accent: "yellow",
    accept: ".html,.htm,.txt",
    minFiles: 0,
    description: "Convert an HTML file, URL, or pasted HTML into a PDF."
  },
  {
    id: "unlock-pdf",
    title: "Unlock PDF",
    category: "PDF Security",
    accent: "blue",
    accept: ".pdf",
    minFiles: 1,
    description: "Resave readable PDFs to remove editable restrictions."
  },
  {
    id: "protect-pdf",
    title: "Protect PDF",
    category: "PDF Security",
    accent: "blue",
    accept: ".pdf",
    minFiles: 1,
    description: "Add a visible confidential seal and permission notice."
  },
  {
    id: "organize-pdf",
    title: "Organize PDF",
    category: "Organize PDF",
    accent: "coral",
    accept: ".pdf",
    minFiles: 1,
    description: "Reorder pages using a custom page sequence."
  },
  {
    id: "pdf-to-pdfa",
    title: "PDF to PDF/A",
    category: "Optimize PDF",
    accent: "blue",
    accept: ".pdf",
    minFiles: 1,
    description: "Create an archival copy with metadata and embedded XMP."
  },
  {
    id: "repair-pdf",
    title: "Repair PDF",
    category: "Optimize PDF",
    accent: "green",
    accept: ".pdf",
    minFiles: 1,
    description: "Reload and rewrite damaged PDFs when the structure is readable."
  },
  {
    id: "page-numbers",
    title: "Page Numbers",
    category: "Edit PDF",
    accent: "purple",
    accept: ".pdf",
    minFiles: 1,
    description: "Add page numbers with custom prefix text."
  },
  {
    id: "scan-to-pdf",
    title: "Scan to PDF",
    category: "Convert PDF",
    accent: "orange",
    accept: ".jpg,.jpeg,.png",
    multiple: true,
    minFiles: 1,
    description: "Combine scan images into a tidy PDF."
  },
  {
    id: "ocr-pdf",
    title: "OCR PDF",
    category: "PDF Intelligence",
    accent: "green",
    accept: ".pdf",
    minFiles: 1,
    description: "Extract selectable text already present in PDFs."
  },
  {
    id: "compare-pdf",
    title: "Compare PDF",
    category: "PDF Intelligence",
    accent: "blue",
    accept: ".pdf",
    multiple: true,
    minFiles: 2,
    description: "Create a readable text-difference report."
  },
  {
    id: "redact-pdf",
    title: "Redact PDF",
    category: "Edit PDF",
    accent: "blue",
    accept: ".pdf",
    minFiles: 1,
    description: "Cover matching text snippets with black redaction boxes."
  },
  {
    id: "crop-pdf",
    title: "Crop PDF",
    category: "Edit PDF",
    accent: "purple",
    accept: ".pdf",
    minFiles: 1,
    description: "Apply uniform page crop margins."
  },
  {
    id: "pdf-forms",
    title: "PDF Forms",
    category: "Edit PDF",
    accent: "purple",
    accept: ".pdf",
    minFiles: 0,
    badge: "New",
    description: "Generate a simple fillable form or add fields to a page."
  },
  {
    id: "ai-summarizer",
    title: "AI Summarizer",
    category: "PDF Intelligence",
    accent: "violet",
    accept: ".pdf,.txt",
    minFiles: 1,
    badge: "New",
    description: "Create a quick local extractive summary from document text."
  },
  {
    id: "translate-pdf",
    title: "Translate PDF",
    category: "PDF Intelligence",
    accent: "violet",
    accept: ".pdf,.txt",
    minFiles: 1,
    badge: "New",
    description: "Prepare a translation-ready text packet from PDF content."
  },
  {
    id: "create-workflow",
    title: "Create Workflow",
    category: "Workflows",
    accent: "coral",
    accept: ".pdf,.jpg,.jpeg,.png,.docx,.xlsx",
    multiple: true,
    minFiles: 1,
    special: true,
    description: "Run a practical workflow: compress, number, and watermark PDFs."
  }
];

export const categories = [
  "All",
  "Workflows",
  "Organize PDF",
  "Optimize PDF",
  "Convert PDF",
  "Edit PDF",
  "PDF Security",
  "PDF Intelligence"
];
