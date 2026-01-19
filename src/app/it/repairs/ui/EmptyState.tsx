import React from "react";
import { Search } from "lucide-react";

export const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-gray-100">
      <Search className="text-gray-300" size={32} />
    </div>
    <h3 className="text-lg font-bold text-black mb-1">ไม่พบข้อมูล</h3>
    <p className="text-sm text-gray-500 text-center max-w-xs leading-relaxed">
      ไม่พบรายการแจ้งซ่อมตามเงื่อนไขที่คุณค้นหา
      กรุณาลองเปลี่ยนคำค้นหาหรือตัวกรอง
    </p>
  </div>
);
