export function sampleGLB() {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteLength: 36, target: 34962 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
  });
  const header = Buffer.from(json.padEnd(Math.ceil(json.length / 4) * 4, " "));
  const data = Buffer.alloc(28 + header.length + 36);
  data.write("glTF");
  data.writeUInt32LE(2, 4);
  data.writeUInt32LE(data.length, 8);
  data.writeUInt32LE(header.length, 12);
  data.write("JSON", 16);
  header.copy(data, 20);
  data.writeUInt32LE(36, 20 + header.length);
  data.write("BIN\0", 24 + header.length);
  Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer).copy(
    data,
    28 + header.length,
  );
  return data;
}
