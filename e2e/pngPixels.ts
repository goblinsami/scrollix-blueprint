import { inflateSync } from 'node:zlib';

/** Decode screenshots to compare rendered pixels, not PNG compression metadata. */
export function decodePng(buffer: Buffer): { width: number; height: number; channels: number; pixels: Uint8Array } {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error('Expected PNG screenshot');
  let offset = 8, width = 0, height = 0, channels = 0;
  const chunks: Buffer[] = [];
  while (offset < buffer.length) {
    const size = buffer.readUInt32BE(offset), name = buffer.toString('ascii', offset + 4, offset + 8);
    const chunk = buffer.subarray(offset + 8, offset + 8 + size);
    if (name === 'IHDR') {
      width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4);
      if (chunk[8] !== 8 || chunk[12] !== 0) throw new Error('Only noninterlaced 8-bit PNG screenshots supported');
      channels = chunk[9] === 6 ? 4 : chunk[9] === 2 ? 3 : 0;
      if (!channels) throw new Error('Expected RGB/RGBA screenshot');
    }
    if (name === 'IDAT') chunks.push(chunk);
    offset += size + 12;
    if (name === 'IEND') break;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels, pixels = new Uint8Array(stride * height);
  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!;
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x, left = x >= channels ? pixels[index - channels]! : 0;
      const up = y > 0 ? pixels[index - stride]! : 0, upperLeft = y > 0 && x >= channels ? pixels[index - stride - channels]! : 0;
      const prediction = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : NaN;
      if (!Number.isFinite(prediction)) throw new Error('Invalid PNG filter');
      pixels[index] = (raw[y * (stride + 1) + x + 1]! + prediction) & 255;
    }
  }
  return { width, height, channels, pixels };
}
export function changedPixels(first: Buffer, second: Buffer, tolerance = 8): number {
  const a = decodePng(first), b = decodePng(second);
  if (a.width !== b.width || a.height !== b.height) throw new Error('Screenshot dimensions changed');
  let count = 0;
  for (let pixel = 0; pixel < a.width * a.height; pixel++) {
    const ai = pixel * a.channels, bi = pixel * b.channels;
    if ([0, 1, 2].some(channel => Math.abs(a.pixels[ai + channel]! - b.pixels[bi + channel]!) > tolerance)) count++;
  }
  return count;
}

/** Paper preset: dark architectural ink, excluding the HUD and pale technical grid. */
export function interiorInkPixels(buffer: Buffer): number {
  const image=decodePng(buffer);let ink=0;
  for(let y=40;y<image.height-40;y++)for(let x=10;x<image.width-10;x++){
    const at=(y*image.width+x)*image.channels;
    if(image.pixels[at]!<190&&image.pixels[at+1]!<190&&image.pixels[at+2]!<190)ink++;
  }
  return ink;
}