// Success Solar ERP — shared frontend data models.
// These interfaces are the reference contract for the backend team.
// No backend calls are made from the frontend; all data is mock/local state.

export type Department =
  | 'CEO'
  | 'Marketing'
  | 'Site Visit'
  | 'Accounts'
  | 'Project'
  | 'Warehouse'
  | 'Transport'

export type Designation =
  | 'CEO'
  | 'Telecaller'
  | 'Direct Marketing Executive'
  | 'Site Visitor'
  | 'Accountant'
  | 'Project Head'
  | 'Field Technician'
  | 'Document Follow-up Executive'
  | 'Warehouse Maintenance'
  | 'Driver'
  | 'Partner / Payment Receiver'

export type EmploymentStatus = 'Active' | 'On Leave' | 'Suspended' | 'Relieved'

export interface Employee {
  id: string
  employeeCode: string
  name: string
  mobile: string
  email: string
  joiningDate: string
  department: Department
  designation: Designation
  username: string
  employmentStatus: EmploymentStatus
  avatarColor: string
  location?: string
}

export type LeadSource =
  | 'Previous Customer'
  | 'Referral'
  | 'Inquiry Call'
  | 'Walk-in'
  | 'Justdial'
  | 'IndiaMART'
  | 'Google Search'
  | 'BNI'
  | 'Direct Field Visit'
  | 'New Construction'
  | 'Commercial Building'
  | 'Other'

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up'
  | 'Site Visit Required'
  | 'Site Visit Scheduled'
  | 'Quotation Stage'
  | 'Lost'
  | 'Converted'

export type LostReason =
  | 'Price'
  | 'Product Unavailable'
  | 'Company Cannot Provide Requirement'
  | 'Customer Postponed'
  | 'Competitor'
  | 'Not Interested'
  | 'Technical Infeasibility'
  | 'Other'

export interface Lead {
  id: string
  customerName: string
  mobile: string
  alternateMobile?: string
  email?: string
  customerType: 'Residential' | 'Commercial' | 'Industrial'
  address: string
  area: string
  city: string
  leadSource: LeadSource
  sourceReference?: string
  productInterested: string
  requirementDescription: string
  approximateRequirement: string
  priority: 'Low' | 'Medium' | 'High'
  assignedEmployeeId: string
  firstContactDate: string
  status: LeadStatus
  lostReason?: LostReason
  lostReasonDetail?: string
  remarks?: string
  /** Employee id who created this client/lead record (marketing employee or CEO). */
  createdById?: string
  /** Whether this record originated from a brand-new lead or an already-completed customer returning for another project. */
  customerOrigin?: 'New Lead' | 'Existing Customer'
  /** If customerOrigin is 'Existing Customer', the id of the prior completed project this customer is linked to. */
  priorProjectId?: string
}

export type ProjectStage =
  | 'Site Visit'
  | 'Quotation'
  | 'Advance Payment'
  | 'Project Execution'
  | 'Installation'
  | 'Final Connection'
  | 'Completed'

export type ProjectStatus = 'On Track' | 'Delayed' | 'On Hold' | 'Completed' | 'Issue Raised'

export interface Project {
  id: string
  projectCode: string
  customerName: string
  customerMobile: string
  site: string
  area: string
  quotationId: string
  projectValue: number
  advanceReceived: number
  balanceAmount: number
  assignedTechnicianId?: string
  assignedDocEmployeeId?: string
  warehouseStatus: 'Not Requested' | 'Requested' | 'Reserved' | 'Issued'
  ebStatus: 'Not Started' | 'Application Submitted' | 'Meter Installed' | 'Connected'
  installationStatus: 'Not Started' | 'In Progress' | 'Completed'
  currentStage: ProjectStage
  status: ProjectStatus
  nextAction: string
  dueDate: string
  capacityKw: number
  priority: 'Low' | 'Medium' | 'High'
}

export type QuotationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Sent'
  | 'Customer Review'
  | 'Revision Required'
  | 'Customer Approved'
  | 'Customer Rejected'
  | 'Awaiting Advance'
  | 'Expired'

export interface QuotationLineItem {
  id: string
  product: string
  description?: string
  quantity: number
  unit: string
  unitPrice: number
  discount: number
  gstPercent: number
  labourCharge: number
}

export interface Quotation {
  id: string
  quotationNumber: string
  customerName: string
  site: string
  date: string
  validUntil: string
  preparedBy: string
  preparedById?: string
  projectType: string
  lineItems?: QuotationLineItem[]
  subtotal?: number
  discountTotal?: number
  taxTotal?: number
  labourTotal?: number
  otherCharges?: number
  grandTotal: number
  advancePercentage: number
  advanceAmount: number
  balanceAmount: number
  paymentTerms?: string
  installationTerms?: string
  warrantyTerms?: string
  notes?: string
  status: QuotationStatus
  revisionNumber: number
  revisionReason?: string
  /** Links to the previous version in the revision chain. The previous quotation is kept, never overwritten. */
  previousQuotationId?: string
  /** Id of the lead this quotation was generated for, if any. */
  leadId?: string
  /** True when created directly by the CEO (bypassing marketing origination). */
  createdByCeo?: boolean
}

export type PaymentType = 'Advance (50%)' | 'Balance Payment' | 'Partial Payment' | 'Full Payment'
export type PaymentState =
  | 'Pending'
  | 'Partial'
  | 'Proof Uploaded'
  | 'Under Verification'
  | 'Verified'
  | 'Rejected'

export interface Payment {
  id: string
  projectId: string
  customerName: string
  quotationId: string
  expectedAmount: number
  actualAmount: number
  paymentType: PaymentType
  paymentDate: string
  paymentMode: 'UPI' | 'Bank Transfer' | 'Cheque' | 'Cash' | 'Card'
  transactionReference: string
  state: PaymentState
  submittedBy: string
  verifiedBy?: string
  remarks?: string
}

export interface StockItem {
  id: string
  productName: string
  category: string
  brand: string
  model: string
  unit: string
  currentQuantity: number
  reservedQuantity: number
  availableQuantity: number
  minimumLevel: number
  costPerUnit: number
}

export interface FieldMovement {
  id: string
  employeeId: string
  employeeName: string
  role: string
  status: 'Checked In' | 'On Field' | 'Returning' | 'Checked Out'
  currentLocation: string
  destination?: string
  startTime: string
  lastUpdate: string
  routeHistory: { time: string; location: string }[]
  /** Mock captured site/visit photos (data URLs), used by field visit + marketing field visit flows. */
  photos?: string[]
  /** Free-text visit notes/log entries captured during the field visit. */
  visitNotes?: string[]
  /** Linked lead/customer this field visit relates to, if any. */
  leadId?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  department: Department
  timestamp: string
  read: boolean
  priority: 'Low' | 'Medium' | 'High'
  category: 'Approval' | 'Payment' | 'Stock' | 'Project' | 'Leave' | 'System'
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  leaveType: 'Casual' | 'Sick' | 'Emergency' | 'Unpaid'
  fromDate: string
  toDate: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  appliedOn: string
  ceoRemarks?: string
}

export interface PerformanceRecord {
  id: string
  employeeId: string
  employeeName: string
  department: Department
  role: string
  period: string
  score: number
  rank: number
  completedWork: number
  pendingWork: number
  efficiency: number
  remarks?: string
}

export interface ActivityLog {
  id: string
  timestamp: string
  actor: string
  department: Department
  action: string
  entity: string
  detail: string
}

export interface Approval {
  id: string
  type: 'Quotation Revision' | 'Stock Purchase Flag' | 'Leave Request' | 'Project Hold' | 'Discount Exception'
  requestedBy: string
  department: Department
  summary: string
  raisedOn: string
  status: 'Pending' | 'Approved' | 'Rejected'
  priority: 'Low' | 'Medium' | 'High'
}

export interface ExistingCustomer {
  customerId: string
  customerName: string
  mobile: string
  area: string
  site: string
  completedProjectId: string
  completedProjectCode: string
  completedOn: string
  totalValue: number
  capacityKw: number
}
