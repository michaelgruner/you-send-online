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


  constructor(messenger: IMessenger) {
    this.messenger = messenger;

  }

  async handshake(user: User, onChannelMessageCallback: OnChannelMessageCallback | null): Promise<IChannel> {
    const peerConnection = new RTCPeerConnection();
    let remoteIceCandidates: RTCIceCandidate[] = [];

    const localChannel = peerConnection.createDataChannel("data", { ordered: true });

    // Called if the peer opened a data channel of its own
    peerConnection.ondatachannel = event => {
      const remoteChannel = event.channel;
      remoteChannel.onmessage = event => {
        if (onChannelMessageCallback) {
          onChannelMessageCallback(event.data as ArrayBuffer);
        }
      };
    };

    // Called when a new local ICE candidate is generated
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New local candidate!", event.candidate);
        const message: SignalMessage = {
          type: "candidate",
          candidate: JSON.stringify(event.candidate),
        };
        this.messenger.sendMessage(user, JSON.stringify(message));
      }
    };

    this.messenger.onMessage = async (_: User, smessage: string) => {
      console.log("Remote message received: ", smessage);
      const message: SignalMessage = JSON.parse(smessage);

      if (message.type === "offer") {
        const remoteDescription = new RTCSessionDescription({
          type: "offer",
          sdp: message.sdp,
        });
        await peerConnection.setRemoteDescription(remoteDescription);
        console.log("New remote description!", remoteDescription);

        // Create an answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send the answer back to the initiator
        const answerMessage: SignalMessage = {
          type: "answer",
          sdp: answer.sdp!,
        };
        this.messenger.sendMessage(user, JSON.stringify(answerMessage));
        remoteIceCandidates.forEach(candidate => peerConnection.addIceCandidate(candidate));
        remoteIceCandidates = [];
      } else if (message.type === "answer") {
        const remoteDescription = new RTCSessionDescription({
          type: "answer",
          sdp: message.sdp,
        });
        await peerConnection.setRemoteDescription(remoteDescription);
        console.log("New remote description!", remoteDescription);


      } else if (message.type === "candidate") {
        const candidate = new RTCIceCandidate(JSON.parse(message.candidate));
        if (peerConnection.remoteDescription) {
          peerConnection.addIceCandidate(candidate);
          console.log("New remote candidate!", candidate);
        } else {
          remoteIceCandidates.push(candidate);
        }
      }
    };

    return new Promise<IChannel>(async (resolve, reject) => {
      // Resolve the promise when the local channel opens
      localChannel.onopen = () => resolve(new WebRTCChannel(localChannel));
      localChannel.onerror = reject;

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      const offerMessage: SignalMessage = {
        type: "offer",
        sdp: offer.sdp!,
      };
      this.messenger.sendMessage(user, JSON.stringify(offerMessage));
      console.log("New local description!", offer);
    });
  }
}

export default Protocol;
