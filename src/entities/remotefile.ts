/*
 * Copyright (c) 2024, Michael Gruner <me at mgruner.com>
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following
 * disclaimer in the documentation and/or other materials provided
 * with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 * contributors may be used to endorse or promote products derived
 * from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 */

type Metadata = {
  name: string,
  size: number,
};

class RemoteFile {
  fromFile(file: File) {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const metadata: Metadata = {
          name: file.name,
          size: file.size
        };

        const content = reader.result as ArrayBuffer;

        // Convert the metadata to a UTF-8 encoded ArrayBuffer
        const encoder = new TextEncoder();
        const metadataString = JSON.stringify(metadata);
        const metadataBuffer = encoder.encode(metadataString);

        // Calculate total length: name length + 8 bytes for size + content length
        const totalLength = Uint32Array.BYTES_PER_ELEMENT + metadataBuffer.byteLength + content.byteLength;

        // Create a new ArrayBuffer and a DataView to write into it
        const buffer = new ArrayBuffer(totalLength);
        const view = new DataView(buffer);

        // Write the metadata length
        let offset = 0;
        view.setUint32(offset, metadataBuffer.byteLength, true);

        // Write the actual name
        offset += Uint32Array.BYTES_PER_ELEMENT;
        new Uint8Array(buffer, offset, metadataBuffer.byteLength).set(metadataBuffer);

        // Write the content
        offset += metadataBuffer.byteLength;
        new Uint8Array(buffer, offset).set(new Uint8Array(content));

        resolve(buffer);
      };

      reader.onerror = () => reject(reader.error);

      reader.readAsArrayBuffer(file);
    });
  }

  toFile(buffer: ArrayBuffer) {
    const view = new DataView(buffer);

    let offset = 0;

    // Read the metadata length (first 4 bytes)
    const metadataLength = view.getUint32(offset, true); // `true` for little-endian
    offset += Uint32Array.BYTES_PER_ELEMENT;;

    // Extract and decode the metadata JSON
    const metadataBuffer = new Uint8Array(buffer, offset, metadataLength);
    const decoder = new TextDecoder();
    const metadataString = decoder.decode(metadataBuffer);
    const metadata = JSON.parse(metadataString);
    offset += metadataLength;

    // Extract the file content
    const contentBuffer = buffer.slice(offset);

    // Create a new File object from the content
    const file = new File([contentBuffer], metadata.name || "unknown", {
      type: metadata.type || "application/octet-stream",
    });

    return file;
  }
};

export default RemoteFile;
