import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ZoomIn, ZoomOut, RotateCw, Maximize, Sun, Contrast, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { XrayImage } from "./types";
import { cn } from "@/lib/utils";

interface XrayPanelProps {
  toothNumber: number;
}

const DEMO_XRAYS: XrayImage[] = [
  {
    id: "demo-1",
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%231e293b' width='300' height='400'/%3E%3Cellipse cx='150' cy='200' rx='60' ry='120' fill='%23334155'/%3E%3Cellipse cx='150' cy='200' rx='40' ry='100' fill='%23475569'/%3E%3Cpath d='M130,120 L150,280 L170,120' stroke='%2394a3b8' stroke-width='2' fill='none'/%3E%3Ctext x='150' y='380' text-anchor='middle' fill='%2364748b' font-size='12'%3EPA X-Ray%3C/text%3E%3C/svg%3E",
    type: "xray",
    title: "PA Tooth",
    date: new Date().toISOString(),
    toothNumbers: [15],
    notes: "Periapical radiograph showing root morphology",
  },
];

export function XrayPanel({ toothNumber }: XrayPanelProps) {
  const [images, setImages] = useState<XrayImage[]>(DEMO_XRAYS);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<XrayImage | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const newImage: XrayImage = {
            id: `xray-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            url,
            type: file.type.includes("pdf") ? "cbct" : file.type.includes("image") ? "intraoral" : "xray",
            title: file.name.replace(/\.[^/.]+$/, ""),
            date: new Date().toISOString(),
            toothNumbers: [toothNumber],
          };
          setImages((prev) => [newImage, ...prev]);
        };
        reader.readAsDataURL(file);
      });
    },
    [toothNumber]
  );

  const openViewer = useCallback((img: XrayImage) => {
    setSelectedImage(img);
    setViewerOpen(true);
  }, []);

  const deleteImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          dragOver
            ? "border-blue-400 bg-blue-50/50"
            : "border-border bg-muted/50 hover:border-border-strong hover:bg-muted"
        )}
      >
        <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs font-medium text-foreground">Drop X-ray or click to upload</p>
        <p className="text-[10px] text-muted-foreground mt-1">Supports X-ray, CBCT, Intraoral photos</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.dcm,.pdf"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, idx) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative bg-muted rounded-xl overflow-hidden border border-border aspect-[3/4] cursor-pointer"
              onClick={() => openViewer(img)}
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-medium text-white truncate">{img.title}</p>
                <p className="text-[9px] text-white/70">
                  {new Date(img.date).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
                className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {viewerOpen && selectedImage && (
          <XrayViewer image={selectedImage} onClose={() => setViewerOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function XrayViewer({ image, onClose }: { image: XrayImage; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h4 className="text-xs font-medium text-white">{image.title}</h4>
          {image.toothNumbers && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
              Tooth {image.toothNumbers.join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} icon={<ZoomIn className="h-3.5 w-3.5" />} />
          <ToolbarButton onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} icon={<ZoomOut className="h-3.5 w-3.5" />} />
          <ToolbarButton onClick={() => setRotation((r) => r + 90)} icon={<RotateCw className="h-3.5 w-3.5" />} />
          <ToolbarButton onClick={resetView} icon={<Maximize className="h-3.5 w-3.5" />} />
          <div className="w-px h-5 bg-white/10 mx-1" />
          <ToolbarButton onClick={onClose} icon={<X className="h-3.5 w-3.5" />} />
        </div>
      </div>

      {/* Image Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={image.url}
            alt={image.title}
            className="max-w-full max-h-full object-contain transition-transform will-change-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-2 bg-black/50 border-t border-white/10 flex items-center gap-4 justify-center">
        <div className="flex items-center gap-2">
          <Sun className="h-3.5 w-3.5 text-white/60" />
          <input
            type="range"
            min="20"
            max="200"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-24 h-1 accent-blue-500"
          />
          <span className="text-[10px] text-white/60 w-8">{brightness}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Contrast className="h-3.5 w-3.5 text-white/60" />
          <input
            type="range"
            min="20"
            max="200"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="w-24 h-1 accent-blue-500"
          />
          <span className="text-[10px] text-white/60 w-8">{contrast}%</span>
        </div>
      </div>
    </motion.div>
  );
}

function ToolbarButton({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
    >
      {icon}
    </button>
  );
}
