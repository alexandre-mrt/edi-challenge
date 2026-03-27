"use client";

import { useState, useRef, useCallback } from "react";
import type { JSX } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "5MB";
const CROP_ASPECT = 1;
const OUTPUT_SIZE_PX = 256;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

type ImageMode = "url" | "upload";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
}

function createInitialCrop(
  imgWidth: number,
  imgHeight: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 80 },
      CROP_ASPECT,
      imgWidth,
      imgHeight
    ),
    imgWidth,
    imgHeight
  );
}

function cropImageToDataUrl(
  image: HTMLImageElement,
  crop: PixelCrop
): string {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE_PX;
  canvas.height = OUTPUT_SIZE_PX;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    OUTPUT_SIZE_PX,
    OUTPUT_SIZE_PX
  );

  return canvas.toDataURL("image/png");
}

export default function ImageUpload({ value, onChange }: ImageUploadProps): JSX.Element {
  const [mode, setMode] = useState<ImageMode>("url");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File exceeds ${MAX_FILE_SIZE_LABEL}. Please choose a smaller image.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageSrc(result);
        setCrop(undefined);
        onChange("");
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      imgRef.current = img;
      const initialCrop = createInitialCrop(img.width, img.height);
      setCrop(initialCrop);
    },
    []
  );

  const handleCropComplete = useCallback(
    (pixelCrop: PixelCrop) => {
      if (!imgRef.current || pixelCrop.width === 0 || pixelCrop.height === 0) {
        return;
      }
      const dataUrl = cropImageToDataUrl(imgRef.current, pixelCrop);
      onChange(dataUrl);
    },
    [onChange]
  );

  const switchMode = useCallback(
    (newMode: ImageMode) => {
      setMode(newMode);
      setError(null);
      setImageSrc(null);
      setCrop(undefined);
      onChange("");
    },
    [onChange]
  );

  return (
    <div>
      <label className="block text-[10px] font-semibold text-elca-orange tracking-[1px] uppercase mb-1.5">
        Profile Image
      </label>

      {/* Mode tabs */}
      <div className="flex mb-3 rounded-lg overflow-hidden border border-gray-200">
        <TabButton
          label="URL"
          active={mode === "url"}
          onClick={() => switchMode("url")}
        />
        <TabButton
          label="Upload"
          active={mode === "upload"}
          onClick={() => switchMode("upload")}
        />
      </div>

      {mode === "url" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-elca-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-elca-orange/30 focus:border-elca-orange transition-all"
        />
      )}

      {mode === "upload" && (
        <div className="space-y-3">
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="block w-full text-sm text-elca-gray file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-elca-orange/10 file:text-elca-orange hover:file:bg-elca-orange/20 file:cursor-pointer file:transition-colors"
          />

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          {imageSrc && (
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 p-2">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={handleCropComplete}
                aspect={CROP_ASPECT}
                circularCrop
                keepSelection
                minWidth={40}
                minHeight={40}
              >
                <img
                  src={imageSrc}
                  alt="Upload preview"
                  onLoad={handleImageLoad}
                  className="max-w-full max-h-[300px]"
                />
              </ReactCrop>
              <p className="text-[10px] text-elca-gray mt-1.5 text-center">
                Drag to reposition the crop area
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TabButtonProps {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
        active
          ? "bg-elca-orange text-white"
          : "bg-white text-elca-gray hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}
