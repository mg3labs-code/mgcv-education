import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * Bundles a set of source files into a single .txt file and triggers a download.
 * Pass `files` as { path, content } pairs — get content via Vite's `?raw` imports
 * in the parent (so the source is inlined at build time, no fetch needed).
 */
interface FileEntry {
  path: string;
  content: string;
}

interface DownloadCodeButtonProps {
  files: FileEntry[];
  filename: string;
  label?: string;
  className?: string;
}

const DownloadCodeButton = ({ files, filename, label = "Download page code", className }: DownloadCodeButtonProps) => {
  const handleDownload = () => {
    const header = `# ${filename}\n# Bundled source for the current demo route.\n# Files included: ${files.length}\n# Generated: ${new Date().toISOString()}\n\n`;
    const body = files
      .map(
        (f) =>
          `\n${"=".repeat(80)}\n// FILE: ${f.path}\n${"=".repeat(80)}\n\n${f.content.trimEnd()}\n`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} className={`gap-1.5 ${className ?? ""}`}>
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
};

export default DownloadCodeButton;
