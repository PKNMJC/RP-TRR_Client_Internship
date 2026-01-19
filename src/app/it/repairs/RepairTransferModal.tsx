import React from "react";
import { X, Share2 } from "lucide-react";
import { RepairTicket, User } from "./types/repair.types";
import { Avatar } from "./ui/Avatar";

interface RepairTransferModalProps {
  repair: RepairTicket | null;
  onClose: () => void;
  onTransfer: (id: number, staffId: number) => void;
  itStaff: User[];
  submitting: boolean;
}

export const RepairTransferModal: React.FC<RepairTransferModalProps> = ({
  repair,
  onClose,
  onTransfer,
  itStaff,
  submitting,
}) => {
  if (!repair) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between p-8 border-b border-gray-50 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-black text-black dark:text-white">
              โอนงานซ่อม
            </h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
              Select new assignee
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 dark:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            {itStaff.map((staff) => (
              <button
                key={staff.id}
                onClick={() => onTransfer(repair.id, staff.id)}
                disabled={submitting || repair.assignee?.id === staff.id}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all group disabled:opacity-50 text-left"
              >
                <Avatar name={staff.name} size="md" />
                <div className="flex-1 text-left">
                  <p className="font-bold text-black dark:text-white text-sm group-hover:translate-x-1 transition-transform">
                    {staff.name}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    {staff.department || "IT Department"}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all">
                  <Share2 size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 bg-gray-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
