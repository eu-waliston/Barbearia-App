const { MongoClient, ObjectId } = require('mongodb');
const Appointment = require('./models/Appointment');

class Database {
  constructor() {
    // Usar URI do MongoDB - ajuste conforme necessário
    this.uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    this.dbName = 'barbearia_app';
    this.client = null;
    this.db = null;
    this.Appointment = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('Conectando ao MongoDB...');

      this.client = new MongoClient(this.uri);

      await this.client.connect();
      console.log('Conexão estabelecida com sucesso!');

      this.db = this.client.db(this.dbName);
      this.isConnected = true;

      // Inicializar modelos
      this.Appointment = new Appointment(this.db);

      // Verificar conexão
      await this.db.command({ ping: 1 });
      console.log('Ping realizado com sucesso');

      // Inicializar dados de exemplo
      await this.initializeSampleData();

      return true;
    } catch (error) {
      console.error('Erro ao conectar ao MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async ensureConnection() {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
    return true;
  }

  async initializeSampleData() {
    try {
      await this.ensureConnection();

      const barbersCount = await this.db.collection('barbers').countDocuments();
      if (barbersCount === 0) {
        console.log('Inicializando dados de barbeiros...');
        await this.db.collection('barbers').insertMany([
          {
            _id: new ObjectId(),
            name: 'João Silva',
            specialty: 'Cortes Clássicos',
            available: true,
            email: 'joao@barbearia.com',
            phone: '(11) 99999-9999',
            rating: 4.8,
            services: ['Corte de Cabelo', 'Barba'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: new ObjectId(),
            name: 'Pedro Santos',
            specialty: 'Barba e Bigode',
            available: true,
            email: 'pedro@barbearia.com',
            phone: '(11) 98888-8888',
            rating: 4.9,
            services: ['Barba', 'Hidratação'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: new ObjectId(),
            name: 'Carlos Mendes',
            specialty: 'Cortes Modernos',
            available: true,
            email: 'carlos@barbearia.com',
            phone: '(11) 97777-7777',
            rating: 4.7,
            services: ['Corte de Cabelo', 'Corte + Barba', 'Pezinho'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: new ObjectId(),
            name: 'Marcos Oliveira',
            specialty: 'Todos os Serviços',
            available: true,
            email: 'marcos@barbearia.com',
            phone: '(11) 96666-6666',
            rating: 4.6,
            services: ['Corte de Cabelo', 'Barba', 'Corte + Barba', 'Hidratação', 'Pezinho'],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
        console.log('Dados de barbeiros inicializados com sucesso!');
      }

      const servicesCount = await this.db.collection('services').countDocuments();
      if (servicesCount === 0) {
        console.log('Inicializando dados de serviços...');
        await this.db.collection('services').insertMany([
          {
            _id: new ObjectId(),
            name: 'Corte de Cabelo',
            duration: 30,
            price: 35.00,
            category: 'Cabelo',
            description: 'Corte tradicional ou moderno',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: new ObjectId(),
            name: 'Barba',
            duration: 25,
            price: 25.00,
            category: 'Barba',
            description: 'Aparar e modelar barba e bigode',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: new ObjectId(),
            name: 'Corte + Barba',
            duration: 50,
            price: 55.00,
            category: 'Combo',
            description: 'Corte de cabelo completo + barba',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: new ObjectId(),
            name: 'Hidratação',
            duration: 20,
            price: 30.00,
            category: 'Tratamento',
            description: 'Hidratação profunda para cabelo e barba',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: new ObjectId(),
            name: 'Pezinho',
            duration: 15,
            price: 15.00,
            category: 'Manutenção',
            description: 'Ajuste nas laterais e nuca',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
        console.log('Dados de serviços inicializados com sucesso!');
      }

      // Criar índices para melhor performance
      await this.createIndexes();

    } catch (error) {
      console.error('Erro ao inicializar dados de exemplo:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Índices para a coleção de agendamentos
      await this.db.collection('appointments').createIndex({ date: 1 });
      await this.db.collection('appointments').createIndex({ barberId: 1 });
      await this.db.collection('appointments').createIndex({ clientPhone: 1 });
      await this.db.collection('appointments').createIndex({ status: 1 });
      await this.db.collection('appointments').createIndex({
        barberId: 1,
        date: 1,
        status: 1
      });

      // Índices para a coleção de barbeiros
      await this.db.collection('barbers').createIndex({ available: 1 });

      // Índices para a coleção de serviços
      await this.db.collection('services').createIndex({ active: 1 });

      console.log('Índices criados com sucesso!');
    } catch (error) {
      console.error('Erro ao criar índices:', error);
    }
  }

  // Métodos para agendamentos usando o modelo
  async getAppointments(date) {
    try {
      await this.ensureConnection();
      return await this.Appointment.findByDate(date);
    } catch (error) {
      console.error('Erro em getAppointments:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData) {
    try {
      await this.ensureConnection();
      return await this.Appointment.create(appointmentData);
    } catch (error) {
      console.error('Erro em createAppointment:', error);
      throw error;
    }
  }

  async updateAppointment(id, updates) {
    try {
      await this.ensureConnection();
      return await this.Appointment.update(id, updates);
    } catch (error) {
      console.error('Erro em updateAppointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id) {
    try {
      await this.ensureConnection();
      return await this.Appointment.delete(id);
    } catch (error) {
      console.error('Erro em deleteAppointment:', error);
      throw error;
    }
  }

  async getBarbers() {
    try {
      await this.ensureConnection();
      return await this.db.collection('barbers')
        .find({ available: true })
        .sort({ name: 1 })
        .toArray();
    } catch (error) {
      console.error('Erro em getBarbers:', error);
      throw error;
    }
  }

  async getServices() {
    try {
      await this.ensureConnection();
      return await this.db.collection('services')
        .find({ active: true })
        .sort({ name: 1 })
        .toArray();
    } catch (error) {
      console.error('Erro em getServices:', error);
      throw error;
    }
  }

  // Novos métodos usando o modelo
  async getAppointmentStats(startDate, endDate) {
    try {
      await this.ensureConnection();
      return await this.Appointment.getStats(startDate, endDate);
    } catch (error) {
      console.error('Erro em getAppointmentStats:', error);
      throw error;
    }
  }

  async getUpcomingAppointments(limit = 10) {
    try {
      await this.ensureConnection();
      return await this.Appointment.findUpcoming(limit);
    } catch (error) {
      console.error('Erro em getUpcomingAppointments:', error);
      throw error;
    }
  }

  async cancelAppointment(id, reason) {
    try {
      await this.ensureConnection();
      return await this.Appointment.cancel(id, reason);
    } catch (error) {
      console.error('Erro em cancelAppointment:', error);
      throw error;
    }
  }

  async completeAppointment(id, notes) {
    try {
      await this.ensureConnection();
      return await this.Appointment.complete(id, notes);
    } catch (error) {
      console.error('Erro em completeAppointment:', error);
      throw error;
    }
  }

  async checkAvailability(barberId, date, duration) {
    try {
      await this.ensureConnection();
      return await this.Appointment.checkAvailability(barberId, date, duration);
    } catch (error) {
      console.error('Erro em checkAvailability:', error);
      throw error;
    }
  }

  async getAvailableSlots(barberId, date, duration) {
    try {
      await this.ensureConnection();
      return await this.Appointment.getAvailableSlots(barberId, date, duration);
    } catch (error) {
      console.error('Erro em getAvailableSlots:', error);
      throw error;
    }
  }

  // Métodos adicionais úteis
  async searchAppointments(query) {
    try {
      await this.ensureConnection();
      const { clientName, clientPhone, startDate, endDate, status } = query;

      const searchQuery = {};

      if (clientName) {
        searchQuery.clientName = { $regex: clientName, $options: 'i' };
      }

      if (clientPhone) {
        searchQuery.clientPhone = { $regex: clientPhone, $options: 'i' };
      }

      if (startDate || endDate) {
        searchQuery.date = {};
        if (startDate) {
          searchQuery.date.$gte = new Date(startDate);
        }
        if (endDate) {
          searchQuery.date.$lte = new Date(endDate);
        }
      }

      if (status) {
        searchQuery.status = status;
      }

      return await this.db.collection('appointments')
        .find(searchQuery)
        .sort({ date: -1 })
        .limit(50)
        .toArray();
    } catch (error) {
      console.error('Erro em searchAppointments:', error);
      throw error;
    }
  }

  async getAppointmentById(id) {
    try {
      await this.ensureConnection();
      return await this.Appointment.findById(id);
    } catch (error) {
      console.error('Erro em getAppointmentById:', error);
      throw error;
    }
  }

  async getAppointmentsByClient(phone, limit = 20) {
    try {
      await this.ensureConnection();
      return await this.Appointment.findByClient(phone, limit);
    } catch (error) {
      console.error('Erro em getAppointmentsByClient:', error);
      throw error;
    }
  }

  async getDailySchedule(date) {
    try {
      await this.ensureConnection();
      const appointments = await this.getAppointments(date);

      // Organizar por barbeiro
      const barbers = await this.getBarbers();
      const schedule = {};

      for (const barber of barbers) {
        schedule[barber._id.toString()] = {
          barber,
          appointments: appointments.filter(a =>
            a.barberId.toString() === barber._id.toString()
          )
        };
      }

      return schedule;
    } catch (error) {
      console.error('Erro em getDailySchedule:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('Conexão com MongoDB fechada');
      }
    } catch (error) {
      console.error('Erro ao fechar conexão:', error);
    }
  }

  // Verificar se o MongoDB está rodando
  async checkConnection() {
    try {
      await this.ensureConnection();
      return { connected: true, message: 'Conectado ao MongoDB' };
    } catch (error) {
      return {
        connected: false,
        message: 'Erro de conexão: ' + error.message
      };
    }
  }
}

module.exports = Database;