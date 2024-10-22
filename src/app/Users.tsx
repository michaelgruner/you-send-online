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
import generateName from '@/entities/namer';

const styles = {
  solo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  users: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }
} as const;

export default function Users() {
  const [users, setUsers] = react.useState<User[]>([]);
  const [name, setName] = react.useState<string>('pending...');

  react.useEffect(() => {
    let discoverer: IDiscoverer = new Discoverer((users: User[]) => { console.log('Users joined: ', users); },
      (users: User[]) => { console.log('Users left: ', users); },
      (users: User[]) => { setUsers(users); });

    const newName = generateName();
    setName(newName);
    discoverer.join({ name: newName, online_since: new Date() });

    return () => { discoverer.leave(); };
  }, []);

  if (0 === users.length) {
    return (
      <>
        <p style={styles.solo}> Waiting for more users to connect... </p>
      </>
    );
  }

  return (
    <>
      <ul style={styles.users}>
        {
          users.map((user: User, index: number) => {
            if (user.name !== name) {
              return (<li key={index} >{`${user.name} (${user.online_since})`}</li>);
            } else {
              return null;
            }
          })
        }
      </ul>
    </>
  );
}
