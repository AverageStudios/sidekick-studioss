import { NextResponse } from "next/server";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { logRouteError } from "@/lib/api-security";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";
import { uploadAsset } from "@/services/storage";

const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const maxPreviewUploadBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const [user, role] = await Promise.all([getCurrentUser(), getCurrentRole()]);

  if (!user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = await checkRateLimit({
    key: "api:admin-template-preview-upload",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({ key: "api:admin-template-preview-upload", retryAfterSeconds: rateLimit.retryAfterSeconds, matchedOn: rateLimit.matchedOn, ip, userId: user.id });
    return createRateLimitResponse(undefined, rateLimit.retryAfterSeconds);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose an image to upload." },
      { status: 400 },
    );
  }

  if (!allowedImageTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Use a PNG, JPG, or WEBP image." },
      { status: 400 },
    );
  }

  if (file.size > maxPreviewUploadBytes) {
    return NextResponse.json(
      { error: "Preview images must be 10 MB or smaller." },
      { status: 400 },
    );
  }

  try {
    const url = await uploadAsset(file, "templates/previews");

    if (!url) {
      return NextResponse.json(
        { error: "Preview image upload is not available right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    logRouteError("admin template preview upload", error);
    return NextResponse.json(
      { error: "Preview image upload failed." },
      { status: 500 },
    );
  }
}
