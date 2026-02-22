import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileUp } from "lucide-react";

export function UploadDropzone({
  accept = ".pdf",
  onFile,
}: {
  accept?: string;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);

  return (
    <Card
      className={`p-6 border-dashed ${drag ? "border-slate-900" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
          <FileUp size={18} />
        </div>
        <div className="font-semibold">Drag & drop your report</div>
        <div className="text-sm text-slate-600">Supported: {accept}</div>

        <input
          ref={ref}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />

        <Button variant="secondary" className="mt-3" onClick={() => ref.current?.click()}>
          Choose File
        </Button>
      </div>
    </Card>
  );
}
