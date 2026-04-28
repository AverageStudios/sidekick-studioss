import { NextResponse } from "next/server";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { storageBucketName, uploadAsset } from "@/services/storage";

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

function getMediaKind(file: File) {
  return file.type.startsWith("video/") ? "video" : "image";
}

export async function POST(request: Request) {
  const [user, role] = await Promise.all([getCurrentUser(), getCurrentRole()]);

  if (!user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  try {
    const folder = getMediaKind(file) === "video" ? "templates/videos" : "templates/images";
    const url = await uploadAsset(file, folder);

    if (!url) {
      return NextResponse.json(
        {
          error: `Media upload is not configured yet. Check Supabase storage bucket "${storageBucketName}".`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ url, kind: getMediaKind(file) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Media upload failed.",
      },
      { status: 500 },
    );
  }
}
