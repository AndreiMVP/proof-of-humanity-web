function concatenateBuffers(...buffers) {
  const totalByteLength = buffers.reduce((sum, bf) => sum + bf.byteLength, 0);
  const temporary = new Uint8Array(totalByteLength);

  let offset = 0;
  buffers.forEach((bf) => {
    temporary.set(new Uint8Array(bf), offset);
    offset += bf.byteLength;
  });

  return temporary.buffer;
}

export default function exifRemoved(buffer) {
  const dv = new DataView(buffer);
  const pieces = [];
  let i = 0;

  const formatTag = dv.getUint16(0);

  let recess = 0;
  let offset = 2;
  if (formatTag === 0xffd8) {
    let app1 = dv.getUint16(offset);
    offset += 2;
    while (offset < dv.byteLength) {
      if (app1 === 0xffda) break;
      if (app1 === 0xffe1) {
        pieces[i++] = { recess, offset: offset - 2 };
        recess = offset + dv.getUint16(offset);
      }
      offset += dv.getUint16(offset);
      app1 = dv.getUint16(offset);
      offset += 2;
    }

    return concatenateBuffers(
      ...pieces.reduce(
        (acc, v) => [...acc, buffer.slice(v.recess, v.offset)],
        []
      ),
      buffer.slice(recess)
    );

    // window.open(
    //   URL.createObjectURL(
    //     new Blob(
    //       [
    //         concatenateBuffers(
    //           ...pieces.reduce(
    //             (acc, v) => [...acc, buffer.slice(v.recess, v.offset)],
    //             []
    //           ),
    //           buffer.slice(recess)
    //         ),
    //       ],
    //       { type: "image/jpeg" }
    //     )
    //   ),
    //   "_blank",
    //   "toolbar=yes, scrollbars=yes, resizable=yes, top=500, left=500, width=400, height=400"
    // );
  }

  return buffer;
}
