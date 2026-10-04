import { describe, it, expect } from "vitest";
import { validateUploadedFile } from "../../supabase/functions/manage-assignment/validate-upload";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

// Minimal JPEG: SOI, SOF0, SOS, scan data, EOI
const jpeg = [0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 8, 0, 1, 0, 1, 1, 1, 0x11, 0, 0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0, 0x12, 0x34, 0xff, 0x00, 0xff, 0xd9];

describe("upload validation", () => {
  it("accepts a JPEG with trailing data after the image (motion photo)", () => {
    expect(validateUploadedFile(bytes(jpeg, "....ftypmp42 video bytes"))?.mime).toBe("image/jpeg");
  });
  it("rejects a file that only starts with the JPEG marker", () => {
    expect(validateUploadedFile(bytes([0xff, 0xd8], "MZ executable"))).toBeNull();
  });
  it("accepts a PDF whose page list is compressed (xref stream)", () => {
    const head = "%PDF-1.7\n1 0 obj<</Type/ObjStm/Filter/FlateDecode>>stream\nxx\nendstream endobj\n";
    const pdf = head + "2 0 obj<</Type/XRef/Size 3>>stream\nxx\nendstream endobj\nstartxref\n" + head.length + "\n%%EOF\n";
    expect(validateUploadedFile(bytes(pdf))?.mime).toBe("application/pdf");
  });
  it("rejects text labelled as a PDF", () => {
    expect(validateUploadedFile(bytes("just some plain text pretending"))).toBeNull();
  });
});
