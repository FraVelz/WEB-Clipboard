import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  addCapture,
  deleteCapture,
  listCaptures,
  reorderCaptures,
  updateCaptureTitle,
} from "./captures-db";

function pngBlob(label = "img"): Blob {
  return new Blob([label], { type: "image/png" });
}

async function resetDb(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("web-clipboard");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("deleteDatabase failed"));
    req.onblocked = () => resolve();
  });
}

afterEach(async () => {
  await resetDb();
});

describe("captures-db", () => {
  it("adds and lists captures newest first", async () => {
    const older = await addCapture({
      title: "old",
      blob: pngBlob("old"),
      mimeType: "image/png",
    });
    const newer = await addCapture({
      title: "new",
      blob: pngBlob("new"),
      mimeType: "image/png",
    });

    const listed = await listCaptures();
    expect(listed.map((item) => item.id)).toEqual([newer.id, older.id]);
    expect(listed[0]?.title).toBe("new");
    expect(listed[1]?.title).toBe("old");
    expect(listed[0]?.blob).toBeInstanceOf(Blob);
  });

  it("stores empty title when none is provided", async () => {
    const record = await addCapture({
      title: "",
      blob: pngBlob(),
      mimeType: "image/png",
    });

    const listed = await listCaptures();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe(record.id);
    expect(listed[0]?.title).toBe("");
    expect(listed[0]?.mimeType).toBe("image/png");
  });

  it("updates a capture title", async () => {
    const record = await addCapture({
      title: "",
      blob: pngBlob(),
      mimeType: "image/png",
    });

    await updateCaptureTitle(record.id, "renamed");
    const listed = await listCaptures();
    expect(listed[0]?.title).toBe("renamed");
  });

  it("rejects updating a missing capture", async () => {
    await expect(updateCaptureTitle("missing-id", "x")).rejects.toThrow(
      "Capture not found: missing-id",
    );
  });

  it("deletes a capture", async () => {
    const keep = await addCapture({
      title: "keep",
      blob: pngBlob("keep"),
      mimeType: "image/png",
    });
    const drop = await addCapture({
      title: "drop",
      blob: pngBlob("drop"),
      mimeType: "image/png",
    });

    await deleteCapture(drop.id);
    const listed = await listCaptures();
    expect(listed.map((item) => item.id)).toEqual([keep.id]);
  });

  it("reorders captures and persists the new order", async () => {
    const first = await addCapture({
      title: "first",
      blob: pngBlob("first"),
      mimeType: "image/png",
    });
    const second = await addCapture({
      title: "second",
      blob: pngBlob("second"),
      mimeType: "image/png",
    });
    const third = await addCapture({
      title: "third",
      blob: pngBlob("third"),
      mimeType: "image/png",
    });

    await reorderCaptures([first.id, third.id, second.id]);
    const listed = await listCaptures();
    expect(listed.map((item) => item.id)).toEqual([
      first.id,
      third.id,
      second.id,
    ]);
    expect(listed.map((item) => item.position)).toEqual([0, 1, 2]);
  });
});
