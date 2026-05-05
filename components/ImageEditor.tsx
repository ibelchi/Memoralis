'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageEditorProps {
  file: File;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export default function ImageEditor({ file, onConfirm, onCancel }: ImageEditorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [crop, setCrop] = useState<Rect | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null); // 'move' or handle name
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<Point>({ x: 0, y: 0 });
  const startCrop = useRef<Rect | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImage(img);
      setCrop({
        x: img.width * 0.1,
        y: img.height * 0.1,
        width: img.width * 0.8,
        height: img.height * 0.8,
      });
    };
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getRotatedSize = (width: number, height: number, rot: number) => {
    return rot % 180 === 90 ? { w: height, h: width } : { w: width, h: height };
  };

  const draw = useCallback(() => {
    if (!image || !canvasRef.current || !crop) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w: imgW, h: imgH } = getRotatedSize(image.width, image.height, rotation);
    
    // Fit canvas to container while maintaining aspect ratio
    const scale = Math.min(
      (containerSize.width - 40) / imgW,
      (containerSize.height - 120) / imgH,
      1
    );

    canvas.width = imgW * scale;
    canvas.height = imgH * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply rotation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw original image (unrotated coordinates)
    ctx.drawImage(
      image,
      -image.width * scale / 2,
      -image.height * scale / 2,
      image.width * scale,
      image.height * scale
    );
    ctx.restore();

    // Draw overlay (dimmed)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    const scaleCrop = (r: Rect) => ({
      x: r.x * scale,
      y: r.y * scale,
      w: r.width * scale,
      h: r.height * scale,
    });

    // We need to calculate the crop position relative to the ROTATED image
    // For simplicity, let's keep the crop state relative to the rotated view
    const sCrop = scaleCrop(crop);

    // Path for the hole
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(sCrop.x, sCrop.y, sCrop.w, sCrop.h);
    ctx.fill('evenodd');

    // Draw crop border
    ctx.strokeStyle = '#D4752A';
    ctx.lineWidth = 2;
    ctx.strokeRect(sCrop.x, sCrop.y, sCrop.w, sCrop.h);

    // Draw handles
    ctx.fillStyle = '#white';
    const handleSize = 10;
    const handles = [
      { x: sCrop.x, y: sCrop.y, name: 'tl' },
      { x: sCrop.x + sCrop.w, y: sCrop.y, name: 'tr' },
      { x: sCrop.x, y: sCrop.y + sCrop.h, name: 'bl' },
      { x: sCrop.x + sCrop.w, y: sCrop.y + sCrop.h, name: 'br' },
      { x: sCrop.x + sCrop.w / 2, y: sCrop.y, name: 't' },
      { x: sCrop.x + sCrop.w / 2, y: sCrop.y + sCrop.h, name: 'b' },
      { x: sCrop.x, y: sCrop.y + sCrop.h / 2, name: 'l' },
      { x: sCrop.x + sCrop.w, y: sCrop.y + sCrop.h / 2, name: 'r' },
    ];

    ctx.fillStyle = '#D4752A';
    handles.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Show dimensions
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'black';
    const dimText = `${Math.round(crop.width)} x ${Math.round(crop.height)} px`;
    ctx.fillText(dimText, sCrop.x + 5, sCrop.y - 10);

  }, [image, rotation, crop, containerSize]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleRotate = (dir: number) => {
    const nextRot = (rotation + dir + 360) % 360;
    
    // When rotating, we should adjust the crop to stay within bounds and maintain visual consistency
    // For simplicity, let's reset or recalculate crop
    if (image) {
      const { w: oldW, h: oldH } = getRotatedSize(image.width, image.height, rotation);
      const { w: newW, h: newH } = getRotatedSize(image.width, image.height, nextRot);
      
      // Basic reset of crop to fit center
      setCrop({
        x: newW * 0.1,
        y: newH * 0.1,
        width: newW * 0.8,
        height: newH * 0.8,
      });
    }
    
    setRotation(nextRot);
  };

  const getClientPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const startDragging = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !crop || !image) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = getClientPos(e);
    const x = pos.x - rect.left;
    const y = pos.y - rect.top;

    const { w: imgW, h: imgH } = getRotatedSize(image.width, image.height, rotation);
    const scale = canvasRef.current.width / imgW;

    const sCrop = {
      x: crop.x * scale,
      y: crop.y * scale,
      w: crop.width * scale,
      h: crop.height * scale,
    };

    // Check handles
    const handleThreshold = 20;
    const handles = [
      { x: sCrop.x, y: sCrop.y, name: 'tl' },
      { x: sCrop.x + sCrop.w, y: sCrop.y, name: 'tr' },
      { x: sCrop.x, y: sCrop.y + sCrop.h, name: 'bl' },
      { x: sCrop.x + sCrop.w, y: sCrop.y + sCrop.h, name: 'br' },
      { x: sCrop.x + sCrop.w / 2, y: sCrop.y, name: 't' },
      { x: sCrop.x + sCrop.w / 2, y: sCrop.y + sCrop.h, name: 'b' },
      { x: sCrop.x, y: sCrop.y + sCrop.h / 2, name: 'l' },
      { x: sCrop.x + sCrop.w, y: sCrop.y + sCrop.h / 2, name: 'r' },
    ];

    for (const h of handles) {
      const dist = Math.sqrt((h.x - x)**2 + (h.y - y)**2);
      if (dist < handleThreshold) {
        setIsDragging(h.name);
        startPos.current = pos;
        startCrop.current = { ...crop };
        return;
      }
    }

    // Check inside
    if (x >= sCrop.x && x <= sCrop.x + sCrop.w && y >= sCrop.y && y <= sCrop.y + sCrop.h) {
      setIsDragging('move');
      startPos.current = pos;
      startCrop.current = { ...crop };
    }
  };

  const doDragging = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !startCrop.current || !canvasRef.current || !image) return;
    
    const pos = getClientPos(e);
    const { w: imgW, h: imgH } = getRotatedSize(image.width, image.height, rotation);
    const scale = canvasRef.current.width / imgW;

    const dx = (pos.x - startPos.current.x) / scale;
    const dy = (pos.y - startPos.current.y) / scale;

    const newCrop = { ...startCrop.current };

    if (isDragging === 'move') {
      newCrop.x = Math.max(0, Math.min(imgW - newCrop.width, newCrop.x + dx));
      newCrop.y = Math.max(0, Math.min(imgH - newCrop.height, newCrop.y + dy));
    } else {
      if (isDragging.includes('l')) {
        const delta = Math.min(dx, newCrop.width - 20);
        newCrop.x = Math.max(0, newCrop.x + delta);
        newCrop.width -= delta;
      }
      if (isDragging.includes('r')) {
        newCrop.width = Math.max(20, Math.min(imgW - newCrop.x, newCrop.width + dx));
      }
      if (isDragging.includes('t')) {
        const delta = Math.min(dy, newCrop.height - 20);
        newCrop.y = Math.max(0, newCrop.y + delta);
        newCrop.height -= delta;
      }
      if (isDragging.includes('b')) {
        newCrop.height = Math.max(20, Math.min(imgH - newCrop.y, newCrop.height + dy));
      }
    }

    setCrop(newCrop);
  };

  const stopDragging = () => {
    setIsDragging(null);
  };

  const handleApply = async () => {
    if (!image || !crop) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = crop.width;
    exportCanvas.height = crop.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Apply rotation and crop
    ctx.save();
    ctx.translate(-crop.x, -crop.y);
    
    // We need to rotate around the center of the original image
    const { w: imgW, h: imgH } = getRotatedSize(image.width, image.height, rotation);
    ctx.translate(imgW / 2, imgH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    exportCanvas.toBlob((blob) => {
      if (blob) {
        const processedFile = new File([blob], file.name, { type: 'image/jpeg' });
        onConfirm(processedFile);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300 touch-none">
      <div 
        ref={containerRef}
        className="relative flex-1 w-full flex items-center justify-center p-4 overflow-hidden"
        onMouseMove={isDragging ? (e) => doDragging(e) : undefined}
        onMouseUp={stopDragging}
        onTouchMove={isDragging ? (e) => doDragging(e) : undefined}
        onTouchEnd={stopDragging}
      >
        <canvas
          ref={canvasRef}
          className="shadow-2xl cursor-crosshair touch-none"
          onMouseDown={startDragging}
          onTouchStart={startDragging}
        />
      </div>

      <div className="w-full bg-stone-900/80 backdrop-blur-md p-6 flex flex-col gap-6 items-center border-t border-stone-800">
        <div className="flex gap-4">
          <button
            onClick={() => handleRotate(-90)}
            className="flex items-center justify-center w-12 h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-full transition-colors border border-stone-700"
            title="Girar 90° esquerra"
          >
            ↺
          </button>
          <button
            onClick={() => handleRotate(90)}
            className="flex items-center justify-center w-12 h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-full transition-colors border border-stone-700"
            title="Girar 90° dreta"
          >
            ↻
          </button>
        </div>

        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-2xl font-medium transition-colors"
          >
            Cancel·lar
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 px-6 bg-[#D4752A] hover:bg-orange-700 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98]"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
