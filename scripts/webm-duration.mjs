/** MediaRecorder emits live WebM without duration. Add only an EBML Info Duration;
 * encoded video blocks are preserved byte-for-byte. Chrome streams have no indexes. */
function vint(buffer, offset, stripMarker) {
  const first=buffer[offset];if(first===undefined||first===0)throw new Error('Invalid EBML integer');
  let width=1, marker=0x80;while(!(first&marker)){width++;marker>>=1;if(width>8)throw new Error('Invalid EBML width');}
  let value=BigInt(stripMarker?first&(marker-1):first);
  for(let i=1;i<width;i++)value=(value<<8n)|BigInt(buffer[offset+i]);
  return {width,value,unknown:stripMarker&&value===(1n<<BigInt(width*7))-1n};
}
function sizeBytes(value, minWidth=1) {
  let width=minWidth;while(BigInt(value)>=(1n<<BigInt(width*7))-1n)width++;
  let bits=BigInt(value)|(1n<<BigInt(width*7));const bytes=Buffer.alloc(width);
  for(let i=width-1;i>=0;i--){bytes[i]=Number(bits&255n);bits>>=8n;}return bytes;
}
function element(buffer, offset){const id=vint(buffer,offset,false),size=vint(buffer,offset+id.width,true);const start=offset+id.width+size.width;return{id:Number(id.value),offset,idWidth:id.width,sizeWidth:size.width,start,end:size.unknown?buffer.length:start+Number(size.value),unknown:size.unknown};}
export function addWebmDuration(buffer, seconds) {
  if(!Number.isFinite(seconds)||seconds<=0)throw new Error('Duration must be finite and positive');
  const header=element(buffer,0),segment=element(buffer,header.end);
  if(segment.id!==0x18538067)throw new Error('Expected WebM Segment');
  let info;
  for(let offset=segment.start;offset<segment.end;){const child=element(buffer,offset);if(child.id===0x114d9b74)throw new Error('Indexed WebM not supported by metadata-only writer');if(child.id===0x1549a966)info=child;if(child.id===0x1f43b675)break;offset=child.end;}
  if(!info)throw new Error('WebM Info missing');
  let scale=1_000_000;const parts=[];
  for(let offset=info.start;offset<info.end;){const child=element(buffer,offset);if(child.id===0x2ad7b1){scale=0;for(const byte of buffer.subarray(child.start,child.end))scale=scale*256+byte;}if(child.id!==0x4489)parts.push(buffer.subarray(child.offset,child.end));offset=child.end;}
  const duration=Buffer.alloc(11);duration[0]=0x44;duration[1]=0x89;duration[2]=0x88;duration.writeDoubleBE(seconds*1e9/scale,3);parts.push(duration);
  const payload=Buffer.concat(parts),replacement=Buffer.concat([buffer.subarray(info.offset,info.offset+info.idWidth),sizeBytes(payload.length,info.sizeWidth),payload]);
  const delta=replacement.length-(info.end-info.offset);
  const segmentSize=segment.unknown?buffer.subarray(segment.offset+segment.idWidth,segment.start):sizeBytes(segment.end-segment.start+delta,segment.sizeWidth);
  return Buffer.concat([buffer.subarray(0,segment.offset+segment.idWidth),segmentSize,buffer.subarray(segment.start,info.offset),replacement,buffer.subarray(info.end)]);
}
