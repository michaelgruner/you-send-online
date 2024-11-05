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

'use client'

import React from 'react'

import User, { createDefault } from "@/entities/user";
import IDiscoverer from "@/entities/idiscoverer";
import Discoverer from "@/adapters/supabase/discoverer";
import IMessenger from "@/entities/imessenger";
import Messenger from "@/adapters/supabase/messenger";
import IProtocol, { IChannel } from '@/entities/iprotocol';
import Protocol from '@/adapters/webrtc/protocol';
import generateName from '@/entities/namer';
import { connect, disconnect } from '@/usecases/connect';

import Users from './Users';


export default function YouSendOnline() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [user, setUser] = React.useState<User>(createDefault());
  const [protocol, setProtocol] = React.useState<IProtocol | null>(null);

  React.useEffect(() => {
    const thisUser: User = {
      name: generateName(),
      online_since: new Date()
    };
    setUser(thisUser);

    const discoverer: IDiscoverer = new Discoverer(
      (users: User[]) => { console.log('Users joined: ', users); },
      (users: User[]) => { console.log('Users left: ', users); },
      (users: User[]) => { setUsers(users); }
    );

    const messenger: IMessenger = new Messenger(thisUser, null);
    const newProtocol: IProtocol = new Protocol(messenger, (data: ArrayBuffer) => {
      console.log("Data received: ", new TextDecoder().decode(data));
    });
    setProtocol(newProtocol);

    connect(thisUser, discoverer, newProtocol);

    return () => {
      disconnect(discoverer, newProtocol);
    };
  }, []);

  const onUserClicked = (srcUser: User, clickedUser: User) => {
    protocol?.handshake(clickedUser).then((channel: IChannel) => {
      channel.send(new TextEncoder().encode(`Hi! I'm ${srcUser.name}`).buffer);
    }).catch((e) => {
      console.error("Unable to open data channel", e);
    });
  };

  return (
    <>
      <Users users={users} user={user} onUserClicked={onUserClicked} />
    </>
  );
}
