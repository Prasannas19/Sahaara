import React, { useEffect, useState, useCallback } from 'react';
import { Copy, Check, Plus, Trash2, UserCheck, Users } from 'lucide-react';
import type { Circle, Member, Invite } from '../../types';
import { createInvite, listInvites, revokeInvite, buildInviteCode } from '../../services/inviteService';

export interface InviteManagerProps {
  circle: Circle;
  member: Member;
}

// Invite management for the circle's elder and caretakers: create
// single-use invite codes, copy them to share, and revoke unused ones.
export const InviteManager: React.FC<InviteManagerProps> = ({ circle, member }) => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setInvites(await listInvites(circle.circleId));
      setError(null);
    } catch {
      setError('Could not load invites right now.');
    } finally {
      setLoading(false);
    }
  }, [circle.circleId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (role: 'caretaker' | 'family') => {
    setBusy(true);
    try {
      await createInvite(circle.circleId, role, member.memberId);
      await refresh();
    } catch {
      setError('Could not create the invite. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setBusy(true);
    try {
      await revokeInvite(circle.circleId, inviteId);
      await refresh();
    } catch {
      setError('Could not revoke the invite. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = (invite: Invite) => {
    navigator.clipboard.writeText(
      `Sahaara invite for ${circle.elderName}'s care circle\nCircle ID: ${circle.circleId}\nInvite code: ${buildInviteCode(invite)}\nThis code works once, for a ${invite.role} account.`
    );
    setCopiedId(invite.inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3 border-t border-[#DCE9DF] pt-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#52605C] uppercase tracking-wider">Invite Codes</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleCreate('caretaker')}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-[6px] bg-[#173F35] text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#13352D] disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <UserCheck className="w-3 h-3" />
            Caretaker
          </button>
          <button
            type="button"
            onClick={() => handleCreate('family')}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-[6px] bg-[#173F35] text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#13352D] disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <Users className="w-3 h-3" />
            Family
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-[#8F2D2D]">{error}</p>}

      {loading ? (
        <p className="text-xs text-[#52605C]">Loading invites...</p>
      ) : invites.length === 0 ? (
        <p className="text-xs text-[#52605C] leading-relaxed">
          No invite codes yet. Create one for each person you want to add; each code works exactly once.
        </p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {invites.map((inv) => (
            <li
              key={inv.inviteId}
              className="p-2.5 rounded-[8px] bg-[#F8F7F1] border border-[#DCE9DF] flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    inv.used ? 'text-[#52605C]' : 'text-[#173F35]'
                  }`}
                >
                  {inv.role === 'caretaker' ? 'Caretaker' : 'Family'} {inv.used ? '(used)' : ''}
                </span>
                <p className="font-mono text-[11px] text-[#25312E] truncate select-all">
                  {buildInviteCode(inv)}
                </p>
              </div>
              {!inv.used && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(inv)}
                    className="p-1.5 rounded-[6px] text-[#173F35] hover:bg-[#EEF4EF] cursor-pointer"
                    aria-label="Copy invite"
                  >
                    {copiedId === inv.inviteId ? (
                      <Check className="w-4 h-4 text-green-700" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(inv.inviteId)}
                    disabled={busy}
                    className="p-1.5 rounded-[6px] text-[#8F2D2D] hover:bg-[#F2ECEC] disabled:opacity-50 cursor-pointer"
                    aria-label="Revoke invite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
