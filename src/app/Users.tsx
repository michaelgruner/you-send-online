'use client'

import react from 'react'

import User from "@/entities/user";
import IDiscoverer from "@/entities/idiscoverer";
import Discoverer from "@/adapters/supabase/discoverer";

const styles = {
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

  react.useEffect(() => {
    let discoverer: IDiscoverer = new Discoverer((users: User[]) => { console.log('Users joined: ', users); },
      (users: User[]) => { console.log('Users left: ', users); },
      (users: User[]) => { setUsers(users); });

    discoverer.join({ name: "Michael", online_since: new Date() });

    return () => { discoverer.leave(); };
  }, []);

  return (
    <>
      <ul style={styles.users}>
        {
          users.map((user: User, index: number) => {
            return (<li key={index} >{`${user.name} (${user.online_since})`}</li>);
          })
        }
      </ul>
    </>
  );
}
