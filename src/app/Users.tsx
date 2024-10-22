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

import react from 'react'

import User from "@/entities/user";
import IDiscoverer from "@/entities/idiscoverer";
import Discoverer from "@/adapters/supabase/discoverer";
import IMessenger from "@/entities/imessenger";
import Messenger from "@/adapters/supabase/messenger";
import generateName from '@/entities/namer';

const styles = {
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  name: {
    display: 'inline',
    marginBottom: '2em',
  },
  solo: {
    display: 'inline'
  },
  users: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    textAlign: 'center'
  }
} as const;

export default function Users() {
  const [users, setUsers] = react.useState<User[]>([]);
  const [user, setUser] = react.useState<User>({ name: 'pending...', online_since: new Date() });
  const [messenger, setMessenger] = react.useState<IMessenger | null>(null);

  react.useEffect(() => {
    const thisUser: User = {
      name: generateName(),
      online_since: new Date()
    };

    const discoverer: IDiscoverer = new Discoverer(
      (users: User[]) => { console.log('Users joined: ', users); },
      (users: User[]) => { console.log('Users left: ', users); },
      (users: User[]) => { setUsers(users); }
    );

    setUser(thisUser);
    discoverer.join(thisUser);

    setMessenger(new Messenger(thisUser, (from: User, message: string) => {
      console.log(`Received message from ${from.name}: ${message}`);
    }));

    return () => {
      discoverer.leave();
      messenger?.disconnect();
    };
  }, []);

  const sayHi = (to: User) => {
    messenger?.sendMessage(to, `Greetings from ${user.name}`);
  }

  return (
    <>
      <div style={styles.content}>
        <p style={styles.name}>Your user name is <strong>{user.name}</strong></p>
        {
          1 >= users.length ? (
            <p style={styles.solo}> Waiting for more users to connect... </p>
          ) : (
            <ul style={styles.users}>
              {
                users.map((otherUser: User, index: number) => {
                  if (otherUser.name !== user.name) {
                    return (<li key={index} onClick={() => { sayHi(otherUser); }}>{otherUser.name}</li>);
                  } else {
                    return null;
                  }
                })
              }
            </ul>
          )
        }

      </div>
    </>
  );
}
