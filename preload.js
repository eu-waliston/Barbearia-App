const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Agenda
  getAppointments: (date) => ipcRenderer.invoke('get-appointments', date),
  createAppointment: (appointment) => ipcRenderer.invoke('create-appointment', appointment),
  updateAppointment: (id, updates) => ipcRenderer.invoke('update-appointment', id, updates),
  deleteAppointment: (id) => ipcRenderer.invoke('delete-appointment', id),
  searchAppointments: (query) => ipcRenderer.invoke('search-appointments', query),
  getAppointmentById: (id) => ipcRenderer.invoke('get-appointment-by-id', id),

  // Dados
  getBarbers: () => ipcRenderer.invoke('get-barbers'),
  getServices: () => ipcRenderer.invoke('get-services'),

  // Funcionalidades avançadas
  getAppointmentStats: (startDate, endDate) => ipcRenderer.invoke('get-appointment-stats', startDate, endDate),
  getUpcomingAppointments: (limit) => ipcRenderer.invoke('get-upcoming-appointments', limit),
  cancelAppointment: (id, reason) => ipcRenderer.invoke('cancel-appointment', id, reason),
  completeAppointment: (id, notes) => ipcRenderer.invoke('complete-appointment', id, notes),
  checkAvailability: (barberId, date, duration) => ipcRenderer.invoke('check-availability', barberId, date, duration),
  getAvailableSlots: (barberId, date, duration) => ipcRenderer.invoke('get-available-slots', barberId, date, duration),
  getDailySchedule: (date) => ipcRenderer.invoke('get-daily-schedule', date),

  // Utilitários
  checkDbConnection: () => ipcRenderer.invoke('check-db-connection'),

  // Controle de janela
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Eventos
  onDatabaseError: (callback) => ipcRenderer.on('database-error', (event, message) => callback(message)),

  // Notificações
  showNotification: (title, message) => ipcRenderer.send('show-notification', title, message)
});