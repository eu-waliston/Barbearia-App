const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Database = require('./database');

let mainWindow;
let db;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: false,
    show: false // Não mostrar a janela até estar pronta
  });

  // Mostrar a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Conectar ao MongoDB
  try {
    db = new Database();
    const connected = await db.connect();

    if (connected) {
      console.log('Conectado ao MongoDB com sucesso!');
    } else {
      throw new Error('Falha ao conectar ao banco de dados');
    }
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);

    // Mostrar mensagem de erro mais amigável
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Erro de Conexão',
      message: 'Não foi possível conectar ao banco de dados',
      detail: `Verifique se o MongoDB está rodando na porta 27017.\n\nErro: ${error.message}`,
      buttons: ['Tentar Novamente', 'Sair'],
      defaultId: 0
    });

    if (result.response === 0) {
      // Tentar novamente
      setTimeout(() => {
        createWindow();
      }, 1000);
      return;
    } else {
      app.quit();
    }
  }

  await mainWindow.loadFile('index.html');

  // Descomente para desenvolvimento
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  // Fechar conexão com o banco de dados
  if (db) {
    await db.close();
  }
});

// IPC Handlers com tratamento de erros
ipcMain.handle('get-appointments', async (event, date) => {
  try {
    return await db.getAppointments(date);
  } catch (error) {
    console.error('Erro em get-appointments:', error);
    throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  }
});

ipcMain.handle('create-appointment', async (event, appointment) => {
  try {
    return await db.createAppointment(appointment);
  } catch (error) {
    console.error('Erro em create-appointment:', error);
    throw new Error(`Erro ao criar agendamento: ${error.message}`);
  }
});

ipcMain.handle('update-appointment', async (event, id, updates) => {
  try {
    return await db.updateAppointment(id, updates);
  } catch (error) {
    console.error('Erro em update-appointment:', error);
    throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
  }
});

ipcMain.handle('delete-appointment', async (event, id) => {
  try {
    return await db.deleteAppointment(id);
  } catch (error) {
    console.error('Erro em delete-appointment:', error);
    throw new Error(`Erro ao excluir agendamento: ${error.message}`);
  }
});

ipcMain.handle('get-barbers', async () => {
  try {
    return await db.getBarbers();
  } catch (error) {
    console.error('Erro em get-barbers:', error);
    throw new Error(`Erro ao buscar barbeiros: ${error.message}`);
  }
});

ipcMain.handle('get-services', async () => {
  try {
    return await db.getServices();
  } catch (error) {
    console.error('Erro em get-services:', error);
    throw new Error(`Erro ao buscar serviços: ${error.message}`);
  }
});

// Novos handlers com tratamento de erros
ipcMain.handle('get-appointment-stats', async (event, startDate, endDate) => {
  try {
    return await db.getAppointmentStats(startDate, endDate);
  } catch (error) {
    console.error('Erro em get-appointment-stats:', error);
    throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
  }
});

ipcMain.handle('get-upcoming-appointments', async (event, limit) => {
  try {
    return await db.getUpcomingAppointments(limit);
  } catch (error) {
    console.error('Erro em get-upcoming-appointments:', error);
    throw new Error(`Erro ao buscar próximos agendamentos: ${error.message}`);
  }
});

ipcMain.handle('cancel-appointment', async (event, id, reason) => {
  try {
    return await db.cancelAppointment(id, reason);
  } catch (error) {
    console.error('Erro em cancel-appointment:', error);
    throw new Error(`Erro ao cancelar agendamento: ${error.message}`);
  }
});

ipcMain.handle('complete-appointment', async (event, id, notes) => {
  try {
    return await db.completeAppointment(id, notes);
  } catch (error) {
    console.error('Erro em complete-appointment:', error);
    throw new Error(`Erro ao concluir agendamento: ${error.message}`);
  }
});

ipcMain.handle('check-availability', async (event, barberId, date, duration) => {
  try {
    return await db.checkAvailability(barberId, date, duration);
  } catch (error) {
    console.error('Erro em check-availability:', error);
    throw new Error(`Erro ao verificar disponibilidade: ${error.message}`);
  }
});

ipcMain.handle('get-available-slots', async (event, barberId, date, duration) => {
  try {
    return await db.getAvailableSlots(barberId, date, duration);
  } catch (error) {
    console.error('Erro em get-available-slots:', error);
    throw new Error(`Erro ao buscar horários disponíveis: ${error.message}`);
  }
});

ipcMain.handle('search-appointments', async (event, query) => {
  try {
    return await db.searchAppointments(query);
  } catch (error) {
    console.error('Erro em search-appointments:', error);
    throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  }
});

ipcMain.handle('get-appointment-by-id', async (event, id) => {
  try {
    return await db.getAppointmentById(id);
  } catch (error) {
    console.error('Erro em get-appointment-by-id:', error);
    throw new Error(`Erro ao buscar agendamento: ${error.message}`);
  }
});

ipcMain.handle('get-daily-schedule', async (event, date) => {
  try {
    return await db.getDailySchedule(date);
  } catch (error) {
    console.error('Erro em get-daily-schedule:', error);
    throw new Error(`Erro ao buscar agenda diária: ${error.message}`);
  }
});

ipcMain.handle('check-db-connection', async () => {
  try {
    return await db.checkConnection();
  } catch (error) {
    console.error('Erro em check-db-connection:', error);
    return { connected: false, message: error.message };
  }
});

// Controles de janela
ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});