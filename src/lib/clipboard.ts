export type ClipboardImage = {
  blob: Blob;
  mimeType: string;
};

function isImageType(type: string): boolean {
  return type.startsWith("image/");
}

export function clipboardEventHasImage(event: ClipboardEvent): boolean {
  const data = event.clipboardData;
  if (!data) return false;

  if (Array.from(data.files).some((file) => isImageType(file.type))) {
    return true;
  }

  return Array.from(data.items).some(
    (item) => item.kind === "file" && isImageType(item.type),
  );
}

export async function extractImageFromClipboardEvent(
  event: ClipboardEvent,
): Promise<ClipboardImage | null> {
  const data = event.clipboardData;
  if (!data) return null;

  for (const file of Array.from(data.files)) {
    if (isImageType(file.type)) {
      return { blob: file, mimeType: file.type || "image/png" };
    }
  }

  for (const item of Array.from(data.items)) {
    if (item.kind !== "file" || !isImageType(item.type)) continue;
    const file = item.getAsFile();
    if (file) {
      return { blob: file, mimeType: file.type || item.type || "image/png" };
    }
  }

  return null;
}

export async function extractImageFromClipboardItems(
  items: ClipboardItem[],
): Promise<ClipboardImage | null> {
  for (const item of items) {
    const type = item.types.find((candidate) => isImageType(candidate));
    if (!type) continue;
    const blob = await item.getType(type);
    return { blob, mimeType: type };
  }

  return null;
}
