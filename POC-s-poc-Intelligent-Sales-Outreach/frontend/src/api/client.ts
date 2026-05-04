import axios from 'axios'

const API = axios.create({ baseURL: 'http://localhost:8000' })

// ── Tasks ──
export const tasksApi = {
  list: (params?: Record<string, string>) => API.get('/tasks', { params }),
  update: (id: string, data: any) => API.patch(`/tasks/${id}`, data),
  bulk: (data: any) => API.post('/tasks/bulk', data),
  summary: (repId?: string) => API.get('/tasks/summary', { params: repId ? { rep_id: repId } : {} }),
}

// ── Emails ──
export const emailsApi = {
  list: (params?: Record<string, string>) => API.get('/emails', { params }),
  draft: (data: any) => API.post('/emails/draft', data),
  send: (emailId: string) => API.post('/emails/send', { email_id: emailId }),
  schedule: (emailId: string, scheduledAt: string) => API.post('/emails/schedule', { email_id: emailId, scheduled_at: scheduledAt }),
  threads: (dealId: string) => API.get('/emails/threads', { params: { deal_id: dealId } }),
}

// ── AI ──
export const aiApi = {
  draftEmail: (data: any) => API.post('/ai/draft-email', data),
  translateEmail: (data: any) => API.post('/ai/translate-email', data),
  generateGuidelines: (data: any) => API.post('/ai/generate-guidelines', data),
  whatsappMessage: (data: any) => API.post('/ai/whatsapp-message', data),
  summarizeTranscript: (data: any) => API.post('/ai/summarize-transcript', data),
  executiveBriefing: (data: any) => API.post('/ai/executive-briefing', data),
  scoreEmail: (data: { subject: string; body: string }) => API.post('/ai/score-email', data),
  dealTemperature: (data: { deal_id: string }) => API.post('/ai/deal-temperature', data),
  optimizeEmail: (data: { subject: string; body: string; target_tone: string }) => API.post('/ai/optimize-email', data),
  analyzeRawThread: (data: { thread_text: string }) => API.post('/ai/analyze-raw-thread', data),
  assistantChat: (data: { message: string }) => API.post('/ai/chat', data),
  connectEmail: (data: { email: string; app_password: string }) => API.post('/ai/connect-email', data),
}

// ── Flows ──
export const flowsApi = {
  list: (params?: Record<string, string>) => API.get('/flows', { params }),
  get: (id: string) => API.get(`/flows/${id}`),
  enroll: (id: string, data: any) => API.post(`/flows/${id}/enroll`, data),
  enrollments: (id: string) => API.get(`/flows/${id}/enrollments`),
  dealEnrollments: (dealId: string) => API.get(`/flows/deal-enrollments/${dealId}`),
  advance: (enrollmentId: string) => API.patch(`/flows/enrollments/${enrollmentId}/advance`),
  executeStep: (enrollmentId: string) => API.post(`/flows/enrollments/${enrollmentId}/execute`),
  exit: (enrollmentId: string) => API.patch(`/flows/enrollments/${enrollmentId}/exit`),
}

// ── Deals ──
export const dealsApi = {
  list: (params?: Record<string, string>) => API.get('/deals', { params }),
  get: (id: string) => API.get(`/deals/${id}`),
  update: (id: string, data: any) => API.patch(`/deals/${id}`, data),
}

// ── Contacts ──
export const contactsApi = {
  list: (params?: Record<string, string>) => API.get('/contacts', { params }),
  get: (id: string) => API.get(`/contacts/${id}`),
}

// ── Plays ──
export const playsApi = {
  list: () => API.get('/plays'),
  get: (id: string) => API.get(`/plays/${id}`),
  guidelines: (id: string, stage?: string) => API.get(`/plays/${id}/guidelines`, { params: stage ? { stage } : {} }),
}

// ── Forecast ──
export const forecastApi = {
  get: (params?: Record<string, string>) => API.get('/forecast', { params }),
  updateCategory: (dealId: string, data: any) => API.patch(`/forecast/deals/${dealId}/category`, data),
  summary: (period?: string) => API.get('/forecast/summary', { params: period ? { period } : {} }),
}

// ── Calls ──
export const callsApi = {
  list: (params?: Record<string, string>) => API.get('/calls', { params }),
  get: (id: string) => API.get(`/calls/${id}`),
  create: (data: any) => API.post('/calls', data),
  summarize: (id: string) => API.patch(`/calls/${id}/summarize`),
}

// ── Reps ──
export const repsApi = {
  list: () => API.get('/contacts', { params: {} }), // Will use dedicated endpoint
}

export default API
