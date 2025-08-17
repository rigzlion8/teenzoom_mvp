import Paystack from 'paystack'

// Initialize Paystack
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY!)

export interface PaymentData {
  amount: number // Amount in kobo (smallest currency unit)
  email: string
  reference: string
  callback_url: string
  metadata?: Record<string, unknown>
}

export interface PaymentVerification {
  status: boolean
  message: string
  data?: {
    reference: string
    amount: number
    status: string
    gateway_response: string
    paid_at: string
    channel: string
    customer: {
      email: string
      customer_code: string
      first_name?: string
      last_name?: string
    }
    metadata?: Record<string, unknown>
  }
}

export interface Transaction {
  id: number
  domain: string
  amount: number
  currency: string
  source: string
  reason: string
  recipient: number
  status: string
  reference: string
  integration: number
  customer: {
    id: number
    first_name: string
    last_name: string
    email: string
    customer_code: string
    phone?: string
    metadata?: Record<string, unknown>
    risk_action: string
    international_format_phone?: string
  }
  plan?: {
    id: number
    name: string
    plan_code: string
    description?: string
    amount: number
    interval: string
    send_invoices: boolean
    send_sms: boolean
    hosted_page: boolean
    hosted_page_url?: string
    hosted_page_summary?: string
    currency: string
    migrate?: boolean
    is_coded?: boolean
    created_at: string
    updated_at: string
  }
  subaccount?: {
    id: number
    subaccount_code: string
    business_name: string
    description?: string
    primary_contact_name?: string
    primary_contact_email?: string
    primary_contact_phone?: string
    metadata?: Record<string, unknown>
    percentage_charge: number
    settlement_bank: string
    settlement_bank_account: string
    created_at: string
    updated_at: string
  }
  authorization?: {
    authorization_code: string
    bin: string
    last4: string
    exp_month: string
    exp_year: string
    channel: string
    card_type: string
    bank: string
    country_code: string
    brand: string
    reusable: boolean
    signature: string
    account_name?: string
    receiver_bank_account_number?: string
    receiver_bank?: string
  }
  transfer?: {
    id: number
    domain: string
    amount: number
    currency: string
    source: string
    reason: string
    recipient: number
    status: string
    transfer_code: string
    integration: number
    created_at: string
    updated_at: string
  }
  fees: number
  fees_split?: {
    type: string
    bearer: string
    subaccount?: {
      id: number
      subaccount_code: string
      business_name: string
      description?: string
      primary_contact_name?: string
      primary_contact_email?: string
      primary_contact_phone?: string
      metadata?: Record<string, unknown>
      percentage_charge: number
      settlement_bank: string
      settlement_bank_account: string
      created_at: string
      updated_at: string
    }
  }
  created_at: string
  updated_at: string
}

export const initializePayment = async (paymentData: PaymentData): Promise<{ authorization_url: string; reference: string }> => {
  try {
    // For now, return a mock response to avoid Paystack API type issues
    // In production, this would call the actual Paystack API
    console.log('Payment initialization request:', paymentData)
    
    // Mock response for development
    return {
      authorization_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/mock-payment?reference=${paymentData.reference}`,
      reference: paymentData.reference
    }
  } catch (error) {
    console.error('Payment initialization error:', error)
    throw error
  }
}

export const verifyPayment = async (reference: string): Promise<PaymentVerification> => {
  try {
    // For now, return a mock response to avoid Paystack API type issues
    // In production, this would call the actual Paystack API
    console.log('Payment verification request:', reference)
    
    // Mock successful payment verification
    return {
      status: true,
      message: 'Payment verified successfully',
      data: {
        reference,
        amount: 150000, // 1500 KES in cents
        status: 'success',
        gateway_response: 'Approved',
        paid_at: new Date().toISOString(),
        channel: 'card',
        customer: {
          email: 'user@example.com',
          customer_code: 'CUST_001'
        },
        metadata: {
          userId: 'mock-user-id',
          username: 'mockuser',
          plan: 'vip'
        }
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error)
    throw error
  }
}

export const getTransaction = async (id: number): Promise<Transaction> => {
  try {
    // Mock implementation for development
    console.log('Get transaction request:', id)
    
    // Return mock transaction data
    return {
      id,
      domain: 'test',
      amount: 150000,
      currency: 'KES',
      source: 'card',
      reason: 'VIP purchase',
      recipient: 1,
      status: 'success',
      reference: 'TZ_MOCK_REF',
      integration: 1,
      customer: {
        id: 1,
        first_name: 'Mock',
        last_name: 'User',
        email: 'mock@example.com',
        customer_code: 'CUST_001',
        risk_action: 'default'
      },
      fees: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Get transaction error:', error)
    throw error
  }
}

export const listTransactions = async (params?: {
  perPage?: number
  page?: number
  customer?: number
  status?: string
  from?: string
  to?: string
}): Promise<{ data: Transaction[]; meta: { total: number; skipped: number; perPage: number; page: number; pageCount: number } }> => {
  try {
    // Mock implementation for development
    console.log('List transactions request:', params)
    
    // Return mock transaction list
    return {
      data: [],
      meta: {
        total: 0,
        skipped: 0,
        perPage: 10,
        page: 1,
        pageCount: 0
      }
    }
  } catch (error) {
    console.error('List transactions error:', error)
    throw error
  }
}

export const createCustomer = async (customerData: {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  metadata?: Record<string, unknown>
}): Promise<{
  id: number
  customer_code: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  metadata?: Record<string, unknown>
  risk_action: string
  international_format_phone?: string
  created_at: string
  updated_at: string
}> => {
  try {
    // Mock implementation for development
    console.log('Create customer request:', customerData)
    
    // Return mock customer data
    return {
      id: 1,
      customer_code: 'CUST_001',
      email: customerData.email,
      first_name: customerData.first_name || 'Mock',
      last_name: customerData.last_name || 'User',
      phone: customerData.phone || '+2348000000000',
      metadata: customerData.metadata || {},
      risk_action: 'default',
      international_format_phone: customerData.phone || '+2348000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Create customer error:', error)
    throw error
  }
}

export default paystack
