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

import IDiscoverer, { OnJoinCallback, OnLeaveCallback, OnSyncCallback, CHANNEL } from "@/entities/idiscoverer";
import User from "@/entities/user";

import client from './client';

class Discoverer implements IDiscoverer {
  onJoin: OnJoinCallback;
  onLeave: OnLeaveCallback;
  onSync: OnSyncCallback;

  join(user: User) {
    this.room.subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') {
        return;
      }

      await this.room.track(user);
    });
  }

  leave() {
    const untrack = async () => {
      await this.room.untrack()
    }

    untrack();
    this.room.unsubscribe();
  }

  constructor(onJoin: OnJoinCallback, onLeave: OnLeaveCallback, onSync: OnSyncCallback) {
    this.onJoin = onJoin;
    this.onLeave = onLeave;
    this.onSync = onSync;

    this.room = client.channel(CHANNEL);

    this.room
      .on('presence', { event: 'sync' }, () => {
        const newState = this.room.presenceState<User>();
        const presences: User[] = Object.values(newState).flat();

        const users = this.onEvent(presences);
        this.onSync(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string, newPresences: User[] }) => {
        const users = this.onEvent(newPresences);
        this.onJoin(users);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string, leftPresences: User[] }) => {
        const users = this.onEvent(leftPresences);
        this.onJoin(users);
      });
  }

  private room;

  private onEvent(presences: User[]): User[] {
    const users: User[] = presences.map(user => ({
      name: user.name,
      online_since: new Date(user.online_since)
    }));

    return users;
  }
};

export default Discoverer;
