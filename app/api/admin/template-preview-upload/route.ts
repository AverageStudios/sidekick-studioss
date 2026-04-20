import { NextResponse } from "next/server";
import { getCurrentRole, getCurrentUser } from "@/lib/auth";
import { storageBucketName, uploadAsset } from "@/services/storage";

const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export async function POST(request: Request) {
  const [user, role] = await Promise.all([getCurrentUser(), getCurrentRole()]);

  if (!user || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  try {
    const url = await uploadAsset(file, "templates/previews");

    if (!url) {
      return NextResponse.json(
        {
          error: `Preview image upload is not configured yet. Check Supabase storage bucket "${storageBucketName}".`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Preview image upload failed.",
      },
      { status: 500 },
    );
  }
}
