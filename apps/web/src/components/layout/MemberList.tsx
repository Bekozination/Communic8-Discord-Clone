import { cn } from "../../lib/utils";
import { useServerStore } from "../../stores/server.store";
import { useUIStore } from "../../stores/ui.store";

export function MemberList() {
  const { members } = useServerStore();
  const { isMemberListOpen } = useUIStore();

  if (!isMemberListOpen) return null;

  const onlineMembers = members.filter((m) => m.user?.status === "online");
  const offlineMembers = members.filter((m) => m.user?.status !== "online");

  return (
    <div className="w-60 bg-surface-600 border-l border-surface-800/30 overflow-y-auto scrollbar-thin">
      <div className="py-4 px-3">
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1 mb-2">
              Çevrimiçi — {onlineMembers.length}
            </h3>
            {onlineMembers.map((member) => (
              <MemberItem key={member.id} member={member} />
            ))}
          </div>
        )}

        {offlineMembers.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1 mb-2">
              Çevrimdışı — {offlineMembers.length}
            </h3>
            {offlineMembers.map((member) => (
              <MemberItem key={member.id} member={member} isOffline />
            ))}
          </div>
        )}

        {members.length === 0 && (
          <div className="mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1 mb-2">
              Üyeler — {members.length}
            </h3>
            <p className="text-text-muted text-xs px-1">Henüz üye yok</p>
          </div>
        )}

        {/* If all members have no user status, show them all */}
        {members.length > 0 && onlineMembers.length === 0 && offlineMembers.length === 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-1 mb-2">
              Üyeler — {members.length}
            </h3>
            {members.map((member) => (
              <MemberItem key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberItem({
  member,
  isOffline = false,
}: {
  member: {
    id: string;
    user?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      status: string;
    };
    nickname: string | null;
  };
  isOffline?: boolean;
}) {
  const displayName = member.nickname || member.user?.displayName || "Unknown";

  return (
    <button
      className={cn(
        "flex items-center gap-3 px-2 py-1.5 w-full rounded-md transition-colors",
        "hover:bg-surface-500/50",
        isOffline && "opacity-40",
      )}
    >
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
            isOffline ? "bg-surface-400" : "bg-brand-primary",
          )}
        >
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2.5px] border-surface-600",
            member.user?.status === "online"
              ? "bg-brand-green"
              : member.user?.status === "idle"
                ? "bg-brand-yellow"
                : member.user?.status === "dnd"
                  ? "bg-brand-red"
                  : "bg-surface-200",
          )}
        />
      </div>
      <span className="text-sm text-text-secondary truncate">
        {displayName}
      </span>
    </button>
  );
}
