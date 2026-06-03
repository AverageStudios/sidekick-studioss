"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { useFormStatus } from "react-dom";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";

function ProfileSaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save profile"}
    </Button>
  );
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Image could not be loaded.")));
    image.src = src;
  });
}

async function createCroppedAvatarDataUrl(imageSrc: string, pixelCrop: Area) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const size = Math.max(256, Math.round(Math.max(pixelCrop.width, pixelCrop.height)));

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Profile picture editor could not access the canvas context.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function ProfilePictureField({
  currentAvatarUrl,
  initials,
  label,
}: {
  currentAvatarUrl?: string | null;
  initials: string;
  label: string;
}) {
  const inputId = useId();
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedDataUrl, setCroppedDataUrl] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applyingCrop, setApplyingCrop] = useState(false);
  const [cropError, setCropError] = useState("");

  useEffect(() => {
    if (!cropSourceUrl) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropError("");
      setApplyingCrop(false);
    }
  }, [cropSourceUrl]);

  const resolvedAvatarUrl = useMemo(() => {
    if (removeAvatar) return null;
    return previewUrl || currentAvatarUrl || null;
  }, [currentAvatarUrl, previewUrl, removeAvatar]);

  return (
    <>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-4">
        <input type="hidden" name="removeProfilePicture" value={removeAvatar ? "1" : "0"} />
        <input type="hidden" name="profilePictureCroppedDataUrl" value={removeAvatar ? "" : croppedDataUrl} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <InitialsAvatar initials={initials} label={label} src={resolvedAvatarUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--ink)]">Profile picture</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Upload a JPG, PNG, WEBP, or GIF up to 5 MB. Choose the exact crop before saving so it feels like a real avatar picker.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label
                htmlFor={inputId}
                className="inline-flex cursor-pointer items-center rounded-[12px] border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--soft-panel)]"
              >
                {currentAvatarUrl || previewUrl ? "Replace image" : "Upload image"}
              </label>
              {(currentAvatarUrl || previewUrl) && !removeAvatar ? (
                <button
                  type="button"
                  className="inline-flex items-center rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                  onClick={() => {
                    setPreviewUrl(null);
                    setCroppedDataUrl("");
                    setSelectedFileName("");
                    setCropSourceUrl(null);
                    setRemoveAvatar(true);
                    setCropError("");
                  }}
                >
                  Remove
                </button>
              ) : null}
            </div>
            {selectedFileName ? (
              <p className="mt-2 truncate text-xs text-[var(--muted)]">{selectedFileName}</p>
            ) : null}
            <input
              id={inputId}
              name="profilePicture"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }

                setRemoveAvatar(false);
                setSelectedFileName(file.name);
                setCropError("");
                const reader = new FileReader();
                reader.onload = () => {
                  const nextSource = typeof reader.result === "string" ? reader.result : null;
                  setCropSourceUrl(nextSource);
                };
                reader.readAsDataURL(file);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <ProfileSaveButton />
        </div>
      </div>

      {cropSourceUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.58)] px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-[42rem] rounded-[2rem] border border-[rgba(255,255,255,0.2)] bg-white p-5 shadow-[0_32px_90px_rgba(15,23,42,0.28)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Profile picture</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Crop your avatar</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Drag and zoom to choose exactly how your profile picture will look around the app.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                onClick={() => {
                  setCropSourceUrl(null);
                  setCropError("");
                }}
              >
                Cancel
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="rounded-[1.6rem] bg-[#0f172a] p-3">
                <div className="relative h-[22rem] overflow-hidden rounded-[1.35rem] bg-[radial-gradient(circle_at_top,_rgba(109,94,248,0.32),_transparent_55%),linear-gradient(180deg,#181f34_0%,#0b1120_100%)]">
                  <Cropper
                    image={cropSourceUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    objectFit="contain"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  />
                </div>
              </div>

              <div className="space-y-5 rounded-[1.6rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Live preview</p>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white px-3 py-3">
                    <InitialsAvatar initials={initials} label={label} src={previewUrl || cropSourceUrl} size="lg" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">{label}</p>
                      <p className="truncate text-xs text-[var(--muted)]">Circular avatar preview</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor={`${inputId}-zoom`} className="text-sm font-medium text-[var(--ink)]">
                      Zoom
                    </label>
                    <span className="text-xs text-[var(--muted)]">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    id={`${inputId}-zoom`}
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--soft-panel)] accent-[var(--brand)]"
                  />
                </div>

                {cropError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {cropError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCropSourceUrl(null);
                      setCropError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={!croppedAreaPixels || applyingCrop}
                    onClick={async () => {
                      if (!croppedAreaPixels) return;
                      setApplyingCrop(true);
                      setCropError("");
                      try {
                        const nextCroppedDataUrl = await createCroppedAvatarDataUrl(cropSourceUrl, croppedAreaPixels);
                        setPreviewUrl(nextCroppedDataUrl);
                        setCroppedDataUrl(nextCroppedDataUrl);
                        setCropSourceUrl(null);
                        setRemoveAvatar(false);
                      } catch (error) {
                        setCropError(error instanceof Error ? error.message : "Crop could not be applied.");
                      } finally {
                        setApplyingCrop(false);
                      }
                    }}
                  >
                    {applyingCrop ? "Applying..." : "Apply crop"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
