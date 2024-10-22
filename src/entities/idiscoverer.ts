import User from "@/entities/user";

type OnCallback = (users: User[]) => void;
export type OnJoinCallback = OnCallback;
export type OnLeaveCallback = OnCallback;
export type OnSyncCallback = OnCallback;
export const CHANNEL = "users";

interface IDiscoverer {
  onJoin: OnJoinCallback;
  onLeave: OnLeaveCallback;
  onSync: OnSyncCallback;
  join(user: User): void;
  leave(): void;
};

export default IDiscoverer;
