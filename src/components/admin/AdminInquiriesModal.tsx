import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { ContactInquiry } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Inbox, Mail, User } from 'lucide-react';

export interface AdminInquiriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminInquiriesModal: React.FC<AdminInquiriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, 'contactInquiries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as ContactInquiry);
        setInquiries(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching support inquiries:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const handleUpdateStatus = async (
    inquiryId: string,
    newStatus: 'new' | 'reviewed'
  ) => {
    setUpdatingId(inquiryId);
    try {
      const ref = doc(db, 'contactInquiries', inquiryId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAtServer: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (filter === 'all') return true;
    return inq.status === filter;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Support Inquiries Administration">
      <div className="space-y-4 text-left max-h-[75vh] flex flex-col">
        <p className="text-xs text-[#52605C] leading-relaxed">
          Review and coordinate submitted contact messages, feedback, and technical support requests. Protected by server security rules.
        </p>

        {/* Filter Tabs */}
        <div className="flex bg-[#EEF4EF] p-1 rounded-[10px] border border-[#DCE9DF] text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#173F35] shadow-xs'
                : 'text-[#52605C] hover:text-[#173F35]'
            }`}
          >
            All ({inquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('new')}
            className={`flex-1 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              filter === 'new'
                ? 'bg-white text-[#173F35] shadow-xs'
                : 'text-[#52605C] hover:text-[#173F35]'
            }`}
          >
            New ({inquiries.filter((i) => i.status === 'new').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('reviewed')}
            className={`flex-1 py-1.5 rounded-[6px] transition-colors cursor-pointer ${
              filter === 'reviewed'
                ? 'bg-white text-[#173F35] shadow-xs'
                : 'text-[#52605C] hover:text-[#173F35]'
            }`}
          >
            Resolved ({inquiries.filter((i) => i.status === 'reviewed').length})
          </button>
        </div>

        {/* Inquiry List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#52605C]">
              Connecting to secure inquiry records...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Inbox className="w-10 h-10 text-[#52605C]/40 mx-auto" />
              <p className="text-sm font-bold text-[#173F35]">No Inquiries in this view</p>
              <p className="text-xs text-[#52605C]">All user submissions have been reviewed.</p>
            </div>
          ) : (
            filteredInquiries.map((inq) => (
              <div
                key={inq.inquiryId}
                className="p-4 rounded-[14px] bg-[#F8F7F1] border border-[#DCE9DF] space-y-2.5 transition-all text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-[#173F35] block">{inq.subject}</span>
                    <div className="flex items-center gap-3 text-[11px] text-[#52605C]">
                      <span className="flex items-center gap-1 font-semibold text-[#173F35]">
                        <User className="w-3.5 h-3.5" />
                        {inq.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {inq.email}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      inq.status === 'new'
                        ? 'bg-[#FDF7EB] text-[#875C0B] border border-[#E8B968]'
                        : 'bg-[#DCE9DF] text-[#173F35]'
                    }`}
                  >
                    {inq.status === 'new' ? 'New Inquiry' : 'Resolved'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-[8px] border border-[#DCE9DF] text-xs text-[#25312E] leading-relaxed">
                  {inq.message}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#52605C] pt-1">
                  <span>Received: {new Date(inq.createdAt).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {inq.status === 'new' ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inq.inquiryId, 'reviewed')}
                        disabled={updatingId === inq.inquiryId}
                        className="px-2.5 py-1 rounded-[6px] bg-[#173F35] text-white font-bold hover:bg-[#1f5246] transition-colors cursor-pointer"
                      >
                        Mark as Resolved
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(inq.inquiryId, 'new')}
                        disabled={updatingId === inq.inquiryId}
                        className="px-2.5 py-1 rounded-[6px] bg-white border border-[#DCE9DF] text-[#52605C] hover:text-[#173F35] font-bold transition-colors cursor-pointer"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[#DCE9DF] flex justify-end">
          <Button variant="secondary" size="normal" onClick={onClose} className="text-xs font-bold">
            Close Console
          </Button>
        </div>
      </div>
    </Modal>
  );
};
