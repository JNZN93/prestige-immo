export interface ContactInquiryInput {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string;
  message: string | null;
  handled: boolean;
  handledAt: string | null;
  handledBy: string | null;
  handledByName: string | null;
  createdAt: string;
}

interface ContactInquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string;
  message: string | null;
  handled: boolean;
  handled_at: string | null;
  handled_by: string | null;
  handler?: { full_name: string; email: string } | null;
  created_at: string;
}

export function mapRowToContactInquiry(row: ContactInquiryRow): ContactInquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    interest: row.interest,
    message: row.message,
    handled: row.handled,
    handledAt: row.handled_at,
    handledBy: row.handled_by,
    handledByName: row.handler?.full_name || row.handler?.email || null,
    createdAt: row.created_at,
  };
}
