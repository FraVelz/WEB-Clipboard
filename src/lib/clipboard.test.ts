import { describe, expect, it } from "vitest";
import {
  clipboardEventHasImage,
  extractImageFromClipboardEvent,
  extractImageFromClipboardItems,
} from "./clipboard";

function imageFile(name = "shot.png"): File {
  return new File(["png-bytes"], name, { type: "image/png" });
}

function textFile(): File {
  return new File(["hello"], "note.txt", { type: "text/plain" });
}

function pasteEvent(
  files: File[],
  items: DataTransferItem[] = [],
): ClipboardEvent {
  return {
    clipboardData: {
      files,
      items,
    },
  } as unknown as ClipboardEvent;
}

describe("clipboard", () => {
  it("extracts the first image file from a paste event", async () => {
    const file = imageFile();
    const event = pasteEvent([textFile(), file]);

    expect(clipboardEventHasImage(event)).toBe(true);
    await expect(extractImageFromClipboardEvent(event)).resolves.toEqual({
      blob: file,
      mimeType: "image/png",
    });
  });

  it("extracts an image from clipboard items when files are empty", async () => {
    const file = imageFile();
    const event = pasteEvent(
      [],
      [
        {
          kind: "file",
          type: "image/png",
          getAsFile: () => file,
        } as DataTransferItem,
      ],
    );

    expect(clipboardEventHasImage(event)).toBe(true);
    await expect(extractImageFromClipboardEvent(event)).resolves.toEqual({
      blob: file,
      mimeType: "image/png",
    });
  });

  it("returns null for text-only paste events", async () => {
    const event = pasteEvent([textFile()]);

    expect(clipboardEventHasImage(event)).toBe(false);
    await expect(extractImageFromClipboardEvent(event)).resolves.toBeNull();
  });

  it("extracts an image from ClipboardItem list", async () => {
    const blob = new Blob(["png-bytes"], { type: "image/png" });
    const item = {
      types: ["text/plain", "image/png"],
      getType: async (type: string) => {
        if (type === "image/png") return blob;
        return new Blob(["nope"], { type });
      },
    } as unknown as ClipboardItem;

    await expect(extractImageFromClipboardItems([item])).resolves.toEqual({
      blob,
      mimeType: "image/png",
    });
  });

  it("returns null when ClipboardItems have no image", async () => {
    const item = {
      types: ["text/plain"],
      getType: async (type: string) => new Blob(["hi"], { type }),
    } as unknown as ClipboardItem;

    await expect(extractImageFromClipboardItems([item])).resolves.toBeNull();
  });
});
