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
"use client"

import User from "@/entities/user";
import React from "react";

const styles = {
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  name: {
    marginBottom: '2em',
  },
  nameAccent: {
    fontWeight: 'bold',
  },
  solo: {
    display: 'inline'
  },
  users: {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    listStyleType: 'none',
    padding: '0',
    margin: '0',
    width: '50%',
    borderRadius: '10px',
  },
  user: {
    cursor: 'pointer',
    backgroundColor: 'var(--color-secondary)',
    padding: '0.5em',
    textAlign: 'center',
    border: '1px solid #ddd',
  }
} as const;

type Props = {
  users: User[],
  user: User,
  onUserClicked: (srcUser: User, clickedUser: User) => void
};

export default function Users({ users, user, onUserClicked }: Props) {

  return (
    <>
      <div style={styles.content}>
        <p style={styles.name}>Your user name is <span style={styles.nameAccent}>{user.name}</span></p>
        {
          1 >= users.length ? (
            <p style={styles.solo}> Waiting for more users to connect... </p>
          ) : (
            <ul style={styles.users}>
              {
                users.map((otherUser: User, index: number) => {
                  if (otherUser.name !== user.name) {
                    return (<li style={styles.user} key={index} onClick={() => { onUserClicked(user, otherUser); }} >{otherUser.name}</li>);
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
