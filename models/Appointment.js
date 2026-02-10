const {
    ObjectId
} = require('mongodb');

class Appointment {
    constructor(db) {
        this.collection = db.collection('appointments');
    }


    validateAppointment(appointment) {
        const errors = [];

        console.log('=== VALIDAÇÃO APPOINTMENT ===');
        console.log('Dados recebidos:', appointment);
        console.log('BarberId:', appointment.barberId, 'Tipo:', typeof appointment.barberId);
        console.log('ServiceId:', appointment.serviceId, 'Tipo:', typeof appointment.serviceId);

        // Validações básicas apenas
        if (!appointment.clientName || appointment.clientName.trim() === '') {
            errors.push('Nome do cliente é obrigatório');
        }

        if (!appointment.clientPhone || appointment.clientPhone.trim() === '') {
            errors.push('Telefone do cliente é obrigatório');
        }

        if (!appointment.date || isNaN(new Date(appointment.date))) {
            errors.push('Data e hora do agendamento são inválidas');
        }

        // Validação SIMPLIFICADA - apenas verificar se existe
        if (!appointment.barberId) {
            errors.push('Barbeiro é obrigatório');
        } else if (appointment.barberId === 'undefined' || appointment.barberId === 'null') {
            errors.push('ID do barbeiro inválido');
        }

        if (!appointment.serviceId) {
            errors.push('Serviço é obrigatório');
        } else if (appointment.serviceId === 'undefined' || appointment.serviceId === 'null') {
            errors.push('ID do serviço inválido');
        }

        console.log('Erros encontrados:', errors);
        return errors;
    }

    // Versão SIMPLIFICADA do create
    async create(appointmentData) {
        console.log('=== CREATE APPOINTMENT ===');
        console.log('Dados recebidos para criação:', appointmentData);

        // Validação
        const errors = this.validateAppointment(appointmentData);
        if (errors.length > 0) {
            throw new Error(`Erro de validação: ${errors.join(', ')}`);
        }

        try {
            // Tentar criar ObjectIds
            let barberId, serviceId;

            console.log('Tentando criar ObjectId do barbeiro:', appointmentData.barberId);
            console.log('Tentando criar ObjectId do serviço:', appointmentData.serviceId);

            try {
                barberId = new ObjectId(appointmentData.barberId);
                console.log('ObjectId do barbeiro criado:', barberId);
            } catch (error) {
                console.error('Erro ao criar ObjectId do barbeiro:', error);
                // Se falhar, usar string mesmo
                barberId = appointmentData.barberId;
                console.log('Usando string como ID do barbeiro:', barberId);
            }

            try {
                serviceId = new ObjectId(appointmentData.serviceId);
                console.log('ObjectId do serviço criado:', serviceId);
            } catch (error) {
                console.error('Erro ao criar ObjectId do serviço:', error);
                // Se falhar, usar string mesmo
                serviceId = appointmentData.serviceId;
                console.log('Usando string como ID do serviço:', serviceId);
            }

            // Preparar dados do agendamento
            const appointment = {
                clientName: appointmentData.clientName.trim(),
                clientPhone: appointmentData.clientPhone.trim(),
                date: new Date(appointmentData.date),
                barberId: barberId,
                serviceId: serviceId,
                barberName: appointmentData.barberName || '',
                serviceName: appointmentData.serviceName || '',
                duration: appointmentData.duration || 30,
                price: appointmentData.price || 0,
                status: appointmentData.status || 'agendado',
                notes: appointmentData.notes || '',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            console.log('Appointment pronto para inserção:', appointment);

            // Inserir no banco de dados
            const result = await this.collection.insertOne(appointment);
            console.log('Resultado da inserção:', result);

            const createdAppointment = {
                ...appointment,
                _id: result.insertedId
            };
            console.log('Appointment criado:', createdAppointment);

            return createdAppointment;

        } catch (error) {
            console.error('Erro durante a criação do agendamento:', error);
            throw error;
        }
    }

    // Busca agendamento por ID
    async findById(id) {
        if (!ObjectId.isValid(id)) {
            throw new Error('ID inválido');
        }

        const appointment = await this.collection.findOne({
            _id: new ObjectId(id)
        });

        if (!appointment) {
            throw new Error('Agendamento não encontrado');
        }

        // Buscar dados relacionados (barbeiro e serviço)
        // Nota: Em um cenário real, você usaria lookups ou referências
        return appointment;
    }

    // Busca agendamentos por data
    async findByDate(date, barberId = null) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const query = {
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };

        // Filtrar por barbeiro se especificado
        if (barberId) {
            query.barberId = new ObjectId(barberId);
        }

        const appointments = await this.collection
            .find(query)
            .sort({
                date: 1
            })
            .toArray();

        return appointments;
    }

    // Busca agendamentos por barbeiro
    async findByBarber(barberId, startDate, endDate) {
        const query = {
            barberId: new ObjectId(barberId),
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        return await this.collection
            .find(query)
            .sort({
                date: 1
            })
            .toArray();
    }

    // Busca agendamentos por cliente
    async findByClient(phone, limit = 10) {
        return await this.collection
            .find({
                clientPhone: phone
            })
            .sort({
                date: -1
            })
            .limit(limit)
            .toArray();
    }

    // Atualiza um agendamento
    async update(id, updateData) {
        if (!ObjectId.isValid(id)) {
            throw new Error('ID inválido');
        }

        // Preparar dados para atualização
        const updates = {};

        if (updateData.clientName !== undefined) {
            updates.clientName = updateData.clientName.trim();
        }

        if (updateData.clientPhone !== undefined) {
            updates.clientPhone = updateData.clientPhone.trim();
        }

        if (updateData.date !== undefined) {
            updates.date = new Date(updateData.date);
        }

        if (updateData.barberId !== undefined) {
            updates.barberId = new ObjectId(updateData.barberId);
        }

        if (updateData.serviceId !== undefined) {
            updates.serviceId = new ObjectId(updateData.serviceId);
        }

        if (updateData.status !== undefined) {
            updates.status = updateData.status;
        }

        if (updateData.notes !== undefined) {
            updates.notes = updateData.notes;
        }

        updates.updatedAt = new Date();

        // Verificar se o agendamento existe
        const existingAppointment = await this.collection.findOne({
            _id: new ObjectId(id)
        });

        if (!existingAppointment) {
            throw new Error('Agendamento não encontrado');
        }

        // Se a data ou barbeiro foram alterados, verificar conflitos
        if (updateData.date || updateData.barberId) {
            const checkDate = updateData.date || existingAppointment.date;
            const checkBarberId = updateData.barberId || existingAppointment.barberId;
            const duration = 30; // Duração padrão, ajuste conforme necessário

            const isConflict = await this.checkTimeConflict(
                checkBarberId,
                checkDate,
                duration,
                id // Excluir o próprio agendamento da verificação
            );

            if (isConflict) {
                throw new Error('Conflito de horário: o barbeiro já possui um agendamento neste horário');
            }
        }

        // Atualizar no banco de dados
        const result = await this.collection.updateOne({
            _id: new ObjectId(id)
        }, {
            $set: updates
        });

        if (result.modifiedCount === 0) {
            throw new Error('Nenhuma alteração realizada');
        }

        return await this.findById(id);
    }

    // Remove um agendamento
    async delete(id) {
        if (!ObjectId.isValid(id)) {
            throw new Error('ID inválido');
        }

        const result = await this.collection.deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            throw new Error('Agendamento não encontrado');
        }

        return true;
    }

    // Verifica conflito de horário
    async checkTimeConflict(barberId, date, duration = 30, excludeAppointmentId = null) {
        const appointmentDate = new Date(date);
        const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60000);

        const query = {
            barberId: new ObjectId(barberId),
            status: {
                $ne: 'cancelado'
            }, // Ignorar agendamentos cancelados
            $or: [
                // Caso 1: Novo agendamento começa durante um agendamento existente
                {
                    date: {
                        $lte: appointmentDate
                    },
                    $expr: {
                        $gte: [{
                                $add: ["$date", {
                                    $multiply: ["$duration", 60000]
                                }]
                            },
                            appointmentDate
                        ]
                    }
                },
                // Caso 2: Novo agendamento termina durante um agendamento existente
                {
                    date: {
                        $gte: appointmentDate,
                        $lte: appointmentEnd
                    },
                    $expr: {
                        $lte: ["$date", appointmentEnd]
                    }
                },
                // Caso 3: Novo agendamento envolve completamente um agendamento existente
                {
                    date: {
                        $gte: appointmentDate
                    },
                    $expr: {
                        $lte: [{
                                $add: ["$date", {
                                    $multiply: ["$duration", 60000]
                                }]
                            },
                            appointmentEnd
                        ]
                    }
                }
            ]
        };

        // Excluir um agendamento específico (para updates)
        if (excludeAppointmentId) {
            query._id = {
                $ne: new ObjectId(excludeAppointmentId)
            };
        }

        const conflict = await this.collection.findOne(query);
        return conflict !== null;
    }

    // Obtém estatísticas
    async getStats(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const pipeline = [{
                $match: {
                    date: {
                        $gte: start,
                        $lte: end
                    },
                    status: {
                        $ne: 'cancelado'
                    }
                }
            },
            {
                $facet: {
                    // Contagem total de agendamentos
                    totalAppointments: [{
                        $count: "count"
                    }],
                    // Agendamentos por status
                    byStatus: [{
                        $group: {
                            _id: "$status",
                            count: {
                                $sum: 1
                            }
                        }
                    }],
                    // Agendamentos por barbeiro
                    byBarber: [{
                        $group: {
                            _id: "$barberId",
                            count: {
                                $sum: 1
                            }
                        }
                    }],
                    // Agendamentos por serviço
                    byService: [{
                        $group: {
                            _id: "$serviceId",
                            count: {
                                $sum: 1
                            }
                        }
                    }],
                    // Agendamentos por dia
                    byDay: [{
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$date"
                                    }
                                },
                                count: {
                                    $sum: 1
                                }
                            }
                        },
                        {
                            $sort: {
                                _id: 1
                            }
                        }
                    ],
                    // Receita total (se houver preços)
                    revenue: [{
                        $group: {
                            _id: null,
                            total: {
                                $sum: "$price"
                            }
                        }
                    }]
                }
            }
        ];

        const result = await this.collection.aggregate(pipeline).toArray();
        return result[0];
    }

    // Busca agendamentos futuros
    async findUpcoming(limit = 20) {
        const now = new Date();

        return await this.collection
            .find({
                date: {
                    $gte: now
                },
                status: 'agendado'
            })
            .sort({
                date: 1
            })
            .limit(limit)
            .toArray();
    }

    // Busca agendamentos passados
    async findPast(limit = 20) {
        const now = new Date();

        return await this.collection
            .find({
                date: {
                    $lt: now
                },
                status: {
                    $in: ['concluido', 'cancelado']
                }
            })
            .sort({
                date: -1
            })
            .limit(limit)
            .toArray();
    }

    // Cancela um agendamento
    async cancel(id, reason = '') {
        return await this.update(id, {
            status: 'cancelado',
            notes: reason ? `Cancelado: ${reason}` : 'Cancelado pelo cliente'
        });
    }

    // Conclui um agendamento
    async complete(id, notes = '') {
        return await this.update(id, {
            status: 'concluido',
            notes: notes ? `${notes} (Concluído)` : 'Serviço concluído'
        });
    }

    // Verifica disponibilidade
    async checkAvailability(barberId, date, duration = 30) {
        return !(await this.checkTimeConflict(barberId, date, duration));
    }

    // Obtém horários disponíveis para um barbeiro em uma data específica
    async getAvailableSlots(barberId, date, serviceDuration = 30) {
        const workHours = {
            start: 8, // 8:00
            end: 20 // 20:00
        };

        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(workHours.start, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(workHours.end, 0, 0, 0);

        // Buscar agendamentos do barbeiro no dia
        const appointments = await this.collection.find({
            barberId: new ObjectId(barberId),
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            status: {
                $ne: 'cancelado'
            }
        }).sort({
            date: 1
        }).toArray();

        // Gerar slots de horário
        const slots = [];
        let currentTime = new Date(startOfDay);

        while (currentTime < endOfDay) {
            const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);

            // Verificar se o slot está disponível
            const isAvailable = !appointments.some(appointment => {
                const appointmentStart = new Date(appointment.date);
                const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration || 30) * 60000);

                // Verificar sobreposição
                return (currentTime < appointmentEnd && slotEnd > appointmentStart);
            });

            if (isAvailable) {
                slots.push({
                    start: new Date(currentTime),
                    end: slotEnd,
                    available: true
                });
            }

            // Avançar 15 minutos para o próximo slot
            currentTime = new Date(currentTime.getTime() + 15 * 60000);
        }

        return slots;
    }
}

module.exports = Appointment;