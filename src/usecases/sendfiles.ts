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

import IProtocol, { IChannel } from "@/entities/iprotocol";
import RemoteFile from "@/entities/remotefile";
import User from "@/entities/user";

export function sendFiles(user: User, protocol: IProtocol | null, files: File[]) {
  protocol?.handshake(user)
    .then((channel: IChannel) => {
      files.forEach((file) => {
        const remoteFile = new RemoteFile();

        remoteFile.fromFile(file)
          .then((data: ArrayBuffer) => {
            channel.send(data);
          })
          .catch(() => {
            throw Error(`Unable to read ${file.name}`);
          });
      });
    })
    .catch((e) => {
      throw Error(`There was a problem opening the data channel: ${e}`);
    });
}

export function downloadFile(data: ArrayBuffer) {
  const remoteFile = new RemoteFile();
  const file = remoteFile.toFile(data);

  const url = URL.createObjectURL(file);
  const userConfirmed = window.confirm(`Do you want to download '${file.name}' (${file.size})?`);
  if (userConfirmed) {
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  URL.revokeObjectURL(url);
}
