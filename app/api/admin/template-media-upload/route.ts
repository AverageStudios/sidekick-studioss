import { NextResponse } from "next/server";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { logRouteError } from "@/lib/api-security";
import { checkRateLimit, createRateLimitResponse, getIpFromRequest, logRateLimitHit } from "@/lib/rate-limit";
import { uploadAsset } from "@/services/storage";

const allowedMediaTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);
const maxMediaUploadBytes = 50 * 1024 * 1024;

function getMediaKind(file: File) {
  return file.type.startsWith("video/") ? "video" : "image";
}

export async function POST(request: Request) {
  const [user, role] = await Promise.all([getCurrentUser(), getCurrentRole()]);

  if (!user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(request);
  const rateLimit = checkRateLimit({
    key: "api:admin-template-media-upload",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    identifiers: { ip, userId: user.id },
  });
  if (!rateLimit.allowed) {
    logRateLimitHit({ key: "api:admin-template-media-upload", retryAfterSeconds: rateLimit.retryAfterSeconds, matchedOn: rateLimit.matchedOn, ip, userId: user.id });
    return createRateLimitResponse(undefined, rateLimit.retryAfterSeconds);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose an image or video to upload." },
      { status: 400 },
    );
  }

  if (!allowedMediaTypes.has(file.type)) {
    return NextResponse.json(
      {
        error:
          "Use a PNG, JPG, WEBP, GIF, MP4, WebM, MOV, or AVI file.",
      },
      { status: 400 },
    );
  }

  if (file.size > maxMediaUploadBytes) {
    return NextResponse.json(
      { error: "Media files must be 50 MB or smaller." },
      { status: 400 },
    );
  }

  try {
    const folder = getMediaKind(file) === "video" ? "templates/videos" : "templates/images";
    const url = await uploadAsset(file, folder);

    if (!url) {
      return NextResponse.json(
        { error: "Media upload is not available right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url, kind: getMediaKind(file) });
  } catch (error) {
    logRouteError("admin template media upload", error);
    return NextResponse.json(
      { error: "Media upload failed." },
      { status: 500 },
    );
  }
}
