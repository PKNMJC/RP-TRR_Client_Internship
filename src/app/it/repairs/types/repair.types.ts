export interface RepairAttachment {
  id: number;
  fileUrl: string;
  filename: string;
  mimeType: string;
}

export interface RepairLog {
  id: number;
  status: string;
  comment?: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
  };
}

export interface User {
  id: number;
  name: string;
  department?: string;
  email?: string;
  lineOALink?: {
    pictureUrl?: string;
  };
}

export type RepairStatus = "PENDING" | "IN_PROGRESS" | "WAITING_PARTS" | "COMPLETED" | "CANCELLED";
export type RepairUrgency = "NORMAL" | "URGENT" | "CRITICAL";

export interface RepairTicket {
  id: number;
  ticketCode: string;
  problemTitle: string;
  problemDescription?: string;
  problemCategory?: string;
  location?: string;
  status: RepairStatus;
  urgency: RepairUrgency;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  assignee?: { id: number; name: string; email?: string };
  // Reporter information
  reporterName?: string;
  reporterDepartment?: string;
  reporterPhone?: string;
  reporterLineId?: string;
  // User relation (owner of ticket)
  user?: User;
  notes?: string;
  logs?: RepairLog[];
  attachments?: RepairAttachment[];
}

export interface Stats {
  available: number;
  myTasks: number;
  completed: number;
  urgent: number;
}
