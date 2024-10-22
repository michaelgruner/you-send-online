
import IDiscoverer, { OnJoinCallback, OnLeaveCallback, OnSyncCallback, CHANNEL } from "@/entities/idiscoverer";
import User from "@/entities/user";

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

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

    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.room = this.supabase.channel(CHANNEL);

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

  private supabase;
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
