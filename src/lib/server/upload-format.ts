export const maxUploadBytes = 50 * 1024 * 1024;

export function matchesUpload(name: string, bytes: Buffer) {
  if (/\.png$/i.test(name))
    return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (/\.jpe?g$/i.test(name))
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!/\.stl$/i.test(name)) return false;
  return (
    (bytes.length >= 84 &&
      bytes.readUInt32LE(80) > 0 &&
      84 + 50 * bytes.readUInt32LE(80) === bytes.length) ||
    (/^\s*solid\b/i.test(bytes.subarray(0, 100).toString()) &&
      /\bendsolid\b/i.test(bytes.subarray(-256).toString()) &&
      bytes.includes(Buffer.from("endfacet")))
  );
}
