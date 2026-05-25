import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  ChevronsDownUp,
  Combine,
  Crop,
  Download,
  FileArchive,
  FileCheck2,
  FileImage,
  FileInput,
  FileOutput,
  FilePenLine,
  FileSpreadsheet,
  FileText,
  FileType2,
  FileUp,
  Files,
  Fingerprint,
  Grid3X3,
  ImagePlus,
  Languages,
  Lock,
  Minimize2,
  PanelTop,
  PenLine,
  RefreshCw,
  RotateCw,
  Scissors,
  SearchCheck,
  ShieldCheck,
  Signature,
  Sparkles,
  Stamp,
  Table2,
  Unlock,
  Wrench,
  X
} from "lucide-react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5050/api";

const iconMap = {
  "merge-pdf": Combine,
  "split-pdf": Scissors,
  "compress-pdf": Minimize2,
  "pdf-to-word": FileText,
  "pdf-to-powerpoint": PanelTop,
  "pdf-to-excel": FileSpreadsheet,
  "word-to-pdf": FileInput,
  "powerpoint-to-pdf": FileOutput,
  "excel-to-pdf": Table2,
  "edit-pdf": FilePenLine,
  "pdf-to-jpg": FileImage,
  "jpg-to-pdf": ImagePlus,
  "sign-pdf": Signature,
  watermark: Stamp,
  "rotate-pdf": RotateCw,
  "html-to-pdf": FileType2,
  "unlock-pdf": Unlock,
  "protect-pdf": ShieldCheck,
  "organize-pdf": ChevronsDownUp,
  "pdf-to-pdfa": FileArchive,
  "repair-pdf": Wrench,
  "page-numbers": Grid3X3,
  "scan-to-pdf": FileCheck2,
  "ocr-pdf": SearchCheck,
  "compare-pdf": BookOpenCheck,
  "redact-pdf": Fingerprint,
  "crop-pdf": Crop,
  "pdf-forms": BadgeCheck,
  "ai-summarizer": BrainCircuit,
  "translate-pdf": Languages,
  "create-workflow": Sparkles
};

const settingSchema = {
  "split-pdf": [
    {
      name: "ranges",
      label: "Ranges",
      placeholder: "1-3; 4; 5-7",
      helper: "Use semicolon to create separate files."
    }
  ],
  "edit-pdf": [
    { name: "overlayText", label: "Text", placeholder: "Approved for review" }
  ],
  "sign-pdf": [
    { name: "signature", label: "Signature", placeholder: "Your name" }
  ],
  watermark: [
    { name: "watermarkText", label: "Watermark", placeholder: "Confidential" },
    { name: "watermarkSize", label: "Size", type: "number", placeholder: "54" }
  ],
  "rotate-pdf": [
    {
      name: "degrees",
      label: "Rotation",
      type: "select",
      options: [
        ["90", "90 degrees"],
        ["180", "180 degrees"],
        ["270", "270 degrees"]
      ]
    }
  ],
  "html-to-pdf": [
    { name: "url", label: "URL", placeholder: "https://example.com" },
    {
      name: "html",
      label: "HTML",
      type: "textarea",
      placeholder: "<h1>Invoice</h1><p>Paste HTML here</p>"
    }
  ],
  "protect-pdf": [
    { name: "protectLabel", label: "Seal", placeholder: "Confidential" }
  ],
  "organize-pdf": [
    {
      name: "order",
      label: "Page order",
      placeholder: "1,3,2,4-6",
      helper: "Leave empty to keep current order."
    }
  ],
  "page-numbers": [
    { name: "prefix", label: "Prefix", placeholder: "Page" }
  ],
  "redact-pdf": [
    { name: "redactTerm", label: "Text to redact", placeholder: "Account ID" }
  ],
  "crop-pdf": [
    { name: "margin", label: "Margin points", type: "number", placeholder: "24" }
  ],
  "pdf-forms": [
    { name: "formTitle", label: "Form title", placeholder: "Client intake form" }
  ],
  "ai-summarizer": [
    { name: "sentences", label: "Sentences", type: "number", placeholder: "6" }
  ],
  "translate-pdf": [
    { name: "targetLanguage", label: "Target", placeholder: "Hindi" }
  ],
  "create-workflow": [
    { name: "prefix", label: "Number prefix", placeholder: "Workflow" },
    { name: "watermarkText", label: "Watermark", placeholder: "Reviewed" }
  ],
  "pdf-to-jpg": [
    { name: "maxPages", label: "Max pages", type: "number", placeholder: "12" }
  ]
};

const defaultSettings = {
  degrees: "90",
  watermarkSize: "54",
  margin: "24",
  maxPages: "12",
  sentences: "6"
};

function App() {
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedTool, setSelectedTool] = useState(null);
  const [query, setQuery] = useState("");
  const runnerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/tools`)
      .then((response) => response.json())
      .then((payload) => {
        setTools(payload.tools);
        setCategories(payload.categories);
      })
      .catch(() => {
        setSelectedTool(null);
      });
  }, []);

  useEffect(() => {
    if (!selectedTool) return;
    window.setTimeout(() => {
      runnerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [selectedTool]);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const categoryMatch =
        activeCategory === "All" || tool.category === activeCategory;
      const queryMatch =
        !normalizedQuery ||
        `${tool.title} ${tool.description} ${tool.category}`
          .toLowerCase()
          .includes(normalizedQuery);
      return categoryMatch && queryMatch;
    });
  }, [tools, activeCategory, query]);

  return (
    <div className="app-shell">
      <Header />

      <main>
        <section className="hero-band">
          <div className="hero-content">
            <div className="hero-copy">
              <span className="eyebrow">Local PDF studio</span>
              <h1>Every PDF tool you need in one polished workspace</h1>
              <p>
                Merge, split, compress, convert, edit, protect, compare, and
                prepare documents with a fast local backend.
              </p>
            </div>
            <div className="hero-panel" aria-label="Processing status preview">
              <div className="mini-stack">
                <span />
                <span />
                <span />
              </div>
              <div>
                <strong>30 tools</strong>
                <small>Upload, process, download</small>
              </div>
            </div>
          </div>
        </section>

        <section className="workspace">
          <div className="toolbar-row">
            <div className="chip-row" role="tablist" aria-label="Tool categories">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`chip ${activeCategory === category ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="search-box">
              <SearchCheck size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools"
              />
            </label>
          </div>

          {selectedTool && (
            <div ref={runnerRef}>
              <ToolRunner
                key={selectedTool.id}
                tool={selectedTool}
                onClose={() => setSelectedTool(null)}
              />
            </div>
          )}

          <div className="tool-grid">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                active={selectedTool?.id === tool.id}
                onSelect={() => setSelectedTool(tool)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="PDF Workbench home">
        <span className="brand-mark">
          <FileText size={24} aria-hidden="true" />
        </span>
        <span>PDF Workbench</span>
      </a>

      <nav className="main-nav" aria-label="Primary">
        <a href="#merge">Merge PDF</a>
        <a href="#split">Split PDF</a>
        <a href="#compress">Compress PDF</a>
        <a href="#convert">Convert PDF</a>
        <a href="#tools">All PDF Tools</a>
      </nav>

      <div className="account-actions">
        <button className="ghost-button" type="button">
          Login
        </button>
        <button className="primary-button" type="button">
          Sign up
        </button>
        <button className="icon-button" type="button" aria-label="Open app menu">
          <Grid3X3 size={20} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function ToolCard({ tool, active, onSelect }) {
  const Icon = iconMap[tool.id] || FileText;
  return (
    <button
      className={`tool-card accent-${tool.accent} ${active ? "selected" : ""}`}
      type="button"
      onClick={onSelect}
      id={tool.id.replace("-pdf", "")}
    >
      <span className="tool-icon">
        <Icon size={30} strokeWidth={2.1} aria-hidden="true" />
      </span>
      {tool.badge && <span className="tool-badge">{tool.badge}</span>}
      <strong>{tool.title}</strong>
      <span>{tool.description}</span>
    </button>
  );
}

function ToolRunner({ tool, onClose }) {
  const fileInput = useRef(null);
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [download, setDownload] = useState(null);
  const Icon = iconMap[tool.id] || FileText;
  const schema = settingSchema[tool.id] || [];

  useEffect(() => {
    return () => {
      if (download?.url) URL.revokeObjectURL(download.url);
    };
  }, [download]);

  const onFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setFiles(nextFiles);
    setDownload(null);
    setMessage("");
  };

  const updateSetting = (name, value) => {
    setSettings((current) => ({ ...current, [name]: value }));
  };

  const runTool = async () => {
    setStatus("processing");
    setMessage("");
    setDownload(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("options", JSON.stringify(settings));

      const response = await fetch(`${API_BASE}/tools/${tool.id}`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        let errorMessage = "Processing failed.";
        try {
          const payload = await response.json();
          errorMessage = payload.error || errorMessage;
        } catch {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename =
        disposition.match(/filename="([^"]+)"/)?.[1] ||
        `${tool.id}-result`;
      const url = URL.createObjectURL(blob);
      setDownload({ url, filename });
      setStatus("done");
      setMessage("Ready to download.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message);
    }
  };

  const canRun = files.length >= tool.minFiles;
  const fileSummary =
    files.length === 0
      ? tool.minFiles === 0
        ? "File optional"
        : "No files selected"
      : files.map((file) => file.name).join(", ");

  return (
    <section className={`runner accent-${tool.accent}`} aria-live="polite">
      <div className="runner-main">
        <div className="runner-title">
          <span className="tool-icon">
            <Icon size={28} aria-hidden="true" />
          </span>
          <div>
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
          </div>
        </div>

        <button className="icon-button close-runner" type="button" onClick={onClose} aria-label="Close tool">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="runner-controls">
        <div
          className="drop-zone"
          role="button"
          tabIndex={0}
          onClick={() => fileInput.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              fileInput.current?.click();
            }
          }}
        >
          <input
            ref={fileInput}
            type="file"
            accept={tool.accept}
            multiple={tool.multiple}
            onChange={onFileChange}
          />
          <FileUp size={28} aria-hidden="true" />
          <strong>{tool.multiple ? "Choose files" : "Choose file"}</strong>
          <span>{fileSummary}</span>
        </div>

        <div className="settings-grid">
          {schema.map((field) => (
            <SettingField
              key={field.name}
              field={field}
              value={settings[field.name] || ""}
              onChange={(value) => updateSetting(field.name, value)}
            />
          ))}
        </div>

        <div className="run-actions">
          <button
            className="primary-button run-button"
            type="button"
            disabled={!canRun && tool.minFiles > 0 || status === "processing"}
            onClick={runTool}
          >
            {status === "processing" ? (
              <RefreshCw className="spin" size={18} aria-hidden="true" />
            ) : (
              <ArrowDownToLine size={18} aria-hidden="true" />
            )}
            {status === "processing" ? "Processing" : `Run ${tool.title}`}
          </button>

          {download && (
            <a className="download-button" href={download.url} download={download.filename}>
              <Download size={18} aria-hidden="true" />
              {download.filename}
            </a>
          )}

          {message && (
            <span className={`runner-message ${status}`}>{message}</span>
          )}
        </div>
      </div>
    </section>
  );
}

function SettingField({ field, value, onChange }) {
  if (field.type === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {field.options.map(([optionValue, label]) => (
            <option key={optionValue} value={optionValue}>
              {label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="field field-wide">
        <span>{field.label}</span>
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
        />
      </label>
    );
  }

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        type={field.type || "text"}
        value={value}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {field.helper && <small>{field.helper}</small>}
    </label>
  );
}

createRoot(document.getElementById("root")).render(<App />);
