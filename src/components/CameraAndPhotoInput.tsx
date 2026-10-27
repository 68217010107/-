import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, Trash2, X } from 'lucide-react';

interface CameraAndPhotoInputProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  aspectClass?: string;
  maxWidthPx?: number;
}

export async function compressImageFile(file: File, maxWidth = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ภาพได้'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('ไม่สามารถเปิดไฟล์ภาพได้'));
    reader.readAsDataURL(file);
  });
}

export const CameraAndPhotoInput: React.FC<CameraAndPhotoInputProps> = ({
  label,
  sublabel,
  value,
  onChange,
  aspectClass = 'aspect-[16/10]',
  maxWidthPx = 1080,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    setImgLoadFailed(false);
  }, [value]);

  useEffect(() => {
    if (!cameraOpen) {
      stopCamera();
      return;
    }

    let active = true;
    const startStream = async () => {
      setCameraError(null);
      stopCamera();
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('เบราว์เซอร์ไม่รองรับการเปิดกล้องโดยตรง กรุณาใช้ปุ่มเลือกรูปภาพแทน');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        setCameraError(
          err?.message || 'ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้องหรืออัปโหลดจากไฟล์ภาพ'
        );
      }
    };

    startStream();
    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraOpen, facingMode]);

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, maxWidthPx / video.videoWidth);
    const w = Math.round(video.videoWidth * scale);
    const h = Math.round(video.videoHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onChange(dataUrl);
    setCameraOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, maxWidthPx);
      onChange(compressed);
    } catch {
      // ignore invalid image
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบรูปภาพ
          </button>
        )}
      </div>

      <div
        className={`relative w-full ${aspectClass} rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center`}
      >
        {value && !imgLoadFailed ? (
          <img
            src={value}
            alt={label}
            referrerPolicy="no-referrer"
            onError={() => setImgLoadFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-medium">ยังไม่ได้แนบรูปภาพ</span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              กดถ่ายภาพจากกล้องหรือเลือกไฟล์ภาพจากเครื่อง
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          ถ่ายภาพด้วยกล้อง
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          อัปโหลดรูปภาพ
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">{label}</h4>
              <button
                type="button"
                onClick={() => setCameraOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="ปิดหน้าต่างกล้อง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCameraOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-3 py-1.5 rounded-md bg-amber-900 text-white font-medium"
                >
                  เลือกไฟล์รูปภาพจากเครื่องแทน
                </button>
              </div>
            ) : (
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                สลับกล้องหน้า/หลัง
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCameraOpen(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  ยกเลิก
                </button>
                {!cameraError && (
                  <button
                    type="button"
                    onClick={handleCaptureFrame}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
                  >
                    บันทึกภาพถ่ายนี้
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
