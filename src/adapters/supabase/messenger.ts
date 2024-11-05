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

import IMessenger, { OnMessageCallback } from "@/entities/imessenger";
import User from "@/entities/user";
import client, { RealtimeChannel } from './client'

type Payload = {
  from: User;
  message: string;
};

class Messenger implements IMessenger {
  onMessage: OnMessageCallback | null;
  private user: User;
  private room?: RealtimeChannel;

  sendMessage(to: User, message: string): void {
    const otherRoom = client.channel(to.name);
    otherRoom.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        from: this.user,
        message: message
      }
    });
  }

  constructor(user: User, onMessage: OnMessageCallback | null) {
    this.onMessage = onMessage;
    this.user = user;
  }

  connect(): void {
    this.room = client.channel(this.user.name);
    this.room
      .on(
        'broadcast',
        { event: 'message' },
        (event) => this.onMessageInternal(event.payload)
      )
      .subscribe();
  }

  disconnect() {
    if (this.room) {
      client.removeChannel(this.room);
    }
  }

  private onMessageInternal(payload: Payload) {
    if (this.onMessage) {
      this.onMessage(payload.from, payload.message);
    }
  }

};

export default Messenger;
