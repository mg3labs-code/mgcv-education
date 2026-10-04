export type ValidatedFile = { mime: string; extension: string };

const ascii = (data: Uint8Array, start: number, end: number) =>
  new TextDecoder("latin1").decode(data.slice(start, end));

function isValidJpeg(data: Uint8Array): boolean {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return false;

  let offset = 2;
  let sawFrame = false;
  let sawScan = false;

  while (offset < data.length) {
    if (data[offset] !== 0xff) return false;
    while (offset < data.length && data[offset] === 0xff) offset += 1;
    if (offset >= data.length) return false;

    const marker = data[offset];
    offset += 1;

    if (marker === 0xd9) return sawFrame && sawScan;
    if (marker === 0xd8 || marker === 0x00) return false;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > data.length) return false;

    const segmentLength = (data[offset] << 8) | data[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > data.length) return false;

    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) sawFrame = true;

    offset += segmentLength;
    if (marker !== 0xda) continue;

    sawScan = true;
    while (offset < data.length) {
      if (data[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const markerStart = offset;
      while (offset < data.length && data[offset] === 0xff) offset += 1;
      if (offset >= data.length) return false;

      const scanMarker = data[offset];
      if (scanMarker === 0x00 || (scanMarker >= 0xd0 && scanMarker <= 0xd7)) {
        offset += 1;
        continue;
      }
      if (scanMarker === 0xd9) return sawFrame;

      offset = markerStart;
      break;
    }
  }

  return false;
}

function isValidPdf(data: Uint8Array): boolean {
  if (data.length < 20) return false;

  const header = ascii(data, 0, Math.min(data.length, 1024));
  if (!/%PDF-1\.[0-9]/.test(header)) return false;

  const tailStart = Math.max(0, data.length - 8192);
  const tail = ascii(data, tailStart, data.length).replace(/\0+$/g, "");
  const matches = [...tail.matchAll(/startxref\s+(\d+)\s+%%EOF(?=\s*$)/g)];
  const lastMatch = matches.at(-1);
  if (!lastMatch) return false;

  const xrefOffset = Number(lastMatch[1]);
  if (!Number.isSafeInteger(xrefOffset) || xrefOffset < 0 || xrefOffset >= data.length) return false;

  const xref = ascii(data, xrefOffset, Math.min(data.length, xrefOffset + 4096));
  return /^xref\b/.test(xref) || /^\d+\s+\d+\s+obj\b[\s\S]*?\/Type\s*\/XRef\b/.test(xref);
}

export function validateUploadedFile(data: Uint8Array): ValidatedFile | null {
  if (isValidJpeg(data)) return { mime: "image/jpeg", extension: "jpg" };

  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (data.length >= 24 && pngSignature.every((value, index) => data[index] === value)) {
    let offset = 8;
    let sawHeader = false;
    while (offset + 12 <= data.length) {
      const length = ((data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]) >>> 0;
      const type = ascii(data, offset + 4, offset + 8);
      if (offset + 12 + length > data.length) return null;
      if (!sawHeader && type !== "IHDR") return null;
      sawHeader = true;
      offset += 12 + length;
      if (type === "IEND") return length === 0 ? { mime: "image/png", extension: "png" } : null;
    }
    return null;
  }

  if (data.length >= 20 && ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 12) === "WEBP") {
    const declared = data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24);
    const chunk = ascii(data, 12, 16);
    if (["VP8 ", "VP8L", "VP8X"].includes(chunk) && declared + 8 <= data.length) {
      return { mime: "image/webp", extension: "webp" };
    }
    return null;
  }

  if (isValidPdf(data)) return { mime: "application/pdf", extension: "pdf" };
  return null;
}