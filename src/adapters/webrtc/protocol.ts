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

import IProtocol, { IChannel, OnChannelMessageCallback } from "@/entities/iprotocol";
import IMessenger from "@/entities/imessenger";
import User from "@/entities/user";

type SignalMessage =
  | { type: "offer" | "answer"; sdp: string }
  | { type: "candidate"; candidate: string };

class WebRTCChannel implements IChannel {
  private dataChannel: RTCDataChannel;

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
  }

  send(data: ArrayBuffer): void {
    this.dataChannel.send(data);
  }
}

class Protocol implements IProtocol {
  readonly messenger: IMessenger;
  readonly onChannelMessageCallback: OnChannelMessageCallback;

  private peerConnection: RTCPeerConnection | null = null;
  private prematureIceCandidates: RTCIceCandidate[] = [];
  private peer: User | null = null;
  private localChannel: RTCDataChannel | null = null;
  private remoteChannel: RTCDataChannel | null = null;


  constructor(messenger: IMessenger, onChannelMessageCallback: OnChannelMessageCallback) {
    this.messenger = messenger;
    this.onChannelMessageCallback = onChannelMessageCallback;

    this.reset();
  }

  reset() {
    if (this.localChannel) {
      this.localChannel.close();
      this.localChannel = null;
    }

    if (this.remoteChannel) {
      this.remoteChannel.close();
      this.remoteChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.peerConnection = new RTCPeerConnection();
    this.prematureIceCandidates = [];
    this.peer = null;

    this.peerConnection.ondatachannel = event => {
      this.remoteChannel = event.channel;
      this.remoteChannel.onmessage = event => {
        this.onChannelMessageCallback(event.data as ArrayBuffer);
      };
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const message: SignalMessage = {
          type: "candidate",
          candidate: JSON.stringify(event.candidate),
        };
        this.messenger.sendMessage(this.peer!, JSON.stringify(message));
      }
    };

    this.messenger.onMessage = async (user: User, smessage: string) => {
      this.peer = user;

      const message: SignalMessage = JSON.parse(smessage);

      if (message.type === "offer") {
        const remoteDescription = new RTCSessionDescription({
          type: "offer",
          sdp: message.sdp,
        });
        await this.peerConnection!.setRemoteDescription(remoteDescription);

        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);

        const answerMessage: SignalMessage = {
          type: "answer",
          sdp: answer.sdp!,
        };
        this.messenger.sendMessage(this.peer, JSON.stringify(answerMessage));
        this.absorbPrematureIceCandidates();
      } else if (message.type === "answer") {
        const remoteDescription = new RTCSessionDescription({
          type: "answer",
          sdp: message.sdp,
        });
        await this.peerConnection!.setRemoteDescription(remoteDescription);

        this.absorbPrematureIceCandidates();
      } else if (message.type === "candidate") {
        const candidate = new RTCIceCandidate(JSON.parse(message.candidate));

        if (this.peerConnection!.remoteDescription) {
          this.peerConnection!.addIceCandidate(candidate);
        } else {
          this.prematureIceCandidates.push(candidate);
        }
      }
    };
  }

  private absorbPrematureIceCandidates() {
    this.prematureIceCandidates.forEach(candidate => this.peerConnection!.addIceCandidate(candidate));
    this.prematureIceCandidates = [];
  }

  async handshake(user: User): Promise<IChannel> {
    this.reset();

    this.peer = user;
    //this.peerConnection = new RTCPeerConnection();

    this.localChannel = this.peerConnection!.createDataChannel("data", { ordered: true });

    return new Promise<IChannel>((resolve, reject) => {
      this.localChannel!.onopen = () => resolve(new WebRTCChannel(this.localChannel!));
      this.localChannel!.onerror = reject;

      // Use a self-invoking async function to handle async/await outside the Promise executor
      (async () => {
        try {
          // Create and send offer
          const offer = await this.peerConnection!.createOffer();
          await this.peerConnection!.setLocalDescription(offer);
          const offerMessage: SignalMessage = {
            type: "offer",
            sdp: offer.sdp!,
          };
          this.messenger.sendMessage(this.peer!, JSON.stringify(offerMessage));
        } catch (error) {
          reject(error);
        }
      })();
    });
  }
}

export default Protocol;
