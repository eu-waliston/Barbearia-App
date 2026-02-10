// Lógica principal da interface do usuário
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização
    initApp();

    // Navegação entre views
    setupNavigation();

    // Configuração dos controles de janela
    setupWindowControls();

    // Atualizar data e hora
    updateDateTime();
    setInterval(updateDateTime, 60000); // Atualizar a cada minuto

    // Carregar dados iniciais
    loadInitialData();
});

async function initApp() {
    // Configurar data atual no seletor
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('selected-date').value = today;
    document.getElementById('appointment-date').value = today;

    // Carregar barbeiros e serviços
    await loadBarbers();
    await loadServices();

    // Carregar agenda do dia atual
    await loadAppointments(today);

    // Gerar slots de horário
    generateTimeSlots();
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Remover classe active de todos os itens
            navItems.forEach(nav => nav.classList.remove('active'));

            // Adicionar classe active ao item clicado
            item.classList.add('active');

            // Mostrar view correspondente
            const viewId = item.getAttribute('data-view') + '-view';
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === viewId) {
                    view.classList.add('active');
                }
            });
        });
    });

    // Botão para voltar ao dashboard do formulário
    document.getElementById('cancel-form').addEventListener('click', () => {
        document.querySelector('.nav-item[data-view="dashboard"]').click();
        resetForm();
    });
}

function setupWindowControls() {
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });

    document.getElementById('maximize-btn').addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });

    document.getElementById('close-btn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
}

function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const formattedDate = now.toLocaleDateString('pt-BR', options);
    document.getElementById('current-date-time').textContent = formattedDate;
}

async function loadBarbers() {
    try {
        const barbers = await window.electronAPI.getBarbers();
        const barberSelect = document.getElementById('barber');
        const barbersContainer = document.getElementById('barbers-container');

        // Limpar selects (mantendo primeira opção)
        while (barberSelect.options.length > 1) {
            barberSelect.remove(1);
        }

        // Preencher select - garantir que value seja string
        barbers.forEach(barber => {
            // Converter ObjectId para string de forma segura
            let barberId;
            if (barber._id) {
                if (typeof barber._id === 'object' && barber._id.toString) {
                    barberId = barber._id.toString(); // ObjectId para string
                } else {
                    barberId = String(barber._id); // Qualquer outro tipo para string
                }
            } else {
                console.error('Barbeiro sem ID:', barber);
                return; // Pular barbeiro sem ID
            }

            const option = document.createElement('option');
            option.value = barberId; // String
            option.textContent = `${barber.name} - ${barber.specialty}`;
            option.setAttribute('data-id', barberId);

            barberSelect.appendChild(option);
        });

        // Criar cards de barbeiros (se existir container)
        if (barbersContainer) {
            barbersContainer.innerHTML = '';
            barbers.forEach(barber => {
                const card = document.createElement('div');
                card.className = 'barber-card';
                card.innerHTML = `
                    <div class="barber-avatar">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <h3 class="barber-name">${barber.name}</h3>
                    <p class="barber-specialty">${barber.specialty}</p>
                    <span class="barber-status status-available">Disponível</span>
                `;
                barbersContainer.appendChild(card);
            });
        }

    } catch (error) {
        console.error('Erro ao carregar barbeiros:', error);
        showNotification('Erro ao carregar barbeiros', 'error');
    }
}

async function loadServices() {
    try {
        const services = await window.electronAPI.getServices();
        const serviceSelect = document.getElementById('service');
        const servicesTable = document.getElementById('services-table');

        // Limpar selects (mantendo primeira opção)
        while (serviceSelect.options.length > 1) {
            serviceSelect.remove(1);
        }

        // Preencher select - garantir que value seja string
        services.forEach(service => {
            // Converter ObjectId para string de forma segura
            let serviceId;
            if (service._id) {
                if (typeof service._id === 'object' && service._id.toString) {
                    serviceId = service._id.toString(); // ObjectId para string
                } else {
                    serviceId = String(service._id); // Qualquer outro tipo para string
                }
            } else {
                console.error('Serviço sem ID:', service);
                return; // Pular serviço sem ID
            }

            const option = document.createElement('option');
            option.value = serviceId; // String
            option.textContent = `${service.name} - R$ ${service.price.toFixed(2)} (${service.duration}min)`;
            option.setAttribute('data-id', serviceId);
            option.setAttribute('data-duration', service.duration);
            option.setAttribute('data-price', service.price);

            serviceSelect.appendChild(option);
        });

        // Preencher tabela (se existir)
        if (servicesTable) {
            servicesTable.innerHTML = '';
            services.forEach(service => {
                // Converter ObjectId para string
                let serviceId;
                if (service._id && typeof service._id === 'object' && service._id.toString) {
                    serviceId = service._id.toString();
                } else {
                    serviceId = String(service._id || '');
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${service.name}</td>
                    <td>${service.duration} min</td>
                    <td>R$ ${service.price.toFixed(2)}</td>
                    <td>
                        <div class="table-actions">
                            <button class="table-btn edit" data-id="${serviceId}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="table-btn delete" data-id="${serviceId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                servicesTable.appendChild(row);
            });
        }

    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        showNotification('Erro ao carregar serviços', 'error');
    }
}

async function loadAppointments(date) {
    try {
        const appointments = await window.electronAPI.getAppointments(date);
        const container = document.querySelector('.appointments-container');

        // Limpar container
        container.innerHTML = '';

        // Renderizar cada agendamento
        appointments.forEach(appointment => {
            const appointmentElement = createAppointmentElement(appointment);
            container.appendChild(appointmentElement);
        });

        // Atualizar contagem no dashboard
        updateDashboardStats(appointments);
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        showNotification('Erro ao carregar agendamentos', 'error');
    }
}

function createAppointmentElement(appointment) {
    const element = document.createElement('div');
    element.className = `appointment-card ${appointment.status}`;

    // Calcular posição baseada na hora
    const appointmentDate = new Date(appointment.date);
    const hour = appointmentDate.getHours();
    const minutes = appointmentDate.getMinutes();
    const topPosition = (hour - 8) * 60 + minutes; // A partir das 8h

    element.style.top = `${topPosition}px`;
    element.style.height = `${appointment.duration || 30}px`;

    // Formatar hora
    const timeString = appointmentDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    element.innerHTML = `
        <div class="appointment-time">${timeString}</div>
        <div class="appointment-client">${appointment.clientName}</div>
        <div class="appointment-service">${appointment.serviceName}</div>
        <div class="appointment-barber">
            <i class="fas fa-user-tie"></i>
            ${appointment.barberName}
        </div>
    `;

    // Adicionar evento de clique para abrir detalhes
    element.addEventListener('click', () => {
        showAppointmentDetails(appointment);
    });

    return element;
}

function generateTimeSlots() {
    const timeSlotsContainer = document.querySelector('.time-slots');
    timeSlotsContainer.innerHTML = '';

    // Gerar horários das 8h às 20h
    for (let hour = 8; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';

            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            timeSlot.textContent = timeString;

            timeSlotsContainer.appendChild(timeSlot);
        }
    }
}

function resetForm() {
    document.getElementById('appointment-form').reset();
    document.getElementById('appointment-date').value = new Date().toISOString().split('T')[0];
}

function showAppointmentDetails(appointment) {
    const modal = document.getElementById('appointment-modal');
    const detailsContainer = document.getElementById('appointment-details');

    // Formatar data e hora
    const appointmentDate = new Date(appointment.date);
    const dateString = appointmentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeString = appointmentDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Criar conteúdo dos detalhes
    detailsContainer.innerHTML = `
        <div class="detail-group">
            <h4>Cliente</h4>
            <p>${appointment.clientName}</p>
            <p>${appointment.clientPhone}</p>
        </div>

        <div class="detail-group">
            <h4>Data e Hora</h4>
            <p>${dateString}</p>
            <p>${timeString}</p>
        </div>

        <div class="detail-group">
            <h4>Serviço</h4>
            <p>${appointment.serviceName}</p>
        </div>

        <div class="detail-group">
            <h4>Barbeiro</h4>
            <p>${appointment.barberName}</p>
        </div>

        <div class="detail-group">
            <h4>Status</h4>
            <p class="status-badge ${appointment.status}">${getStatusText(appointment.status)}</p>
        </div>

        ${appointment.notes ? `
            <div class="detail-group">
                <h4>Observações</h4>
                <p>${appointment.notes}</p>
            </div>
        ` : ''}
    `;

    // Configurar botões de ação
    document.getElementById('cancel-appointment').onclick = () => {
        updateAppointmentStatus(appointment._id, 'cancelado');
        modal.classList.remove('active');
    };

    document.getElementById('complete-appointment').onclick = () => {
        updateAppointmentStatus(appointment._id, 'concluido');
        modal.classList.remove('active');
    };

    // Mostrar modal
    modal.classList.add('active');

    // Fechar modal ao clicar no X
    document.querySelector('.modal-close').onclick = () => {
        modal.classList.remove('active');
    };

    // Fechar modal ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    };
}

async function updateAppointmentStatus(id, status) {
    try {
        await window.electronAPI.updateAppointment(id, {
            status
        });

        // Recarregar agenda
        const selectedDate = document.getElementById('selected-date').value;
        await loadAppointments(selectedDate);

        showNotification(`Agendamento ${getStatusText(status)} com sucesso!`, 'success');
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        showNotification('Erro ao atualizar agendamento', 'error');
    }
}

function getStatusText(status) {
    const statusMap = {
        'agendado': 'Agendado',
        'concluido': 'Concluído',
        'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
}

function updateDashboardStats(appointments) {
    // Contar agendamentos
    const appointmentsCount = appointments.length;
    document.getElementById('appointments-count').textContent = appointmentsCount;

    // Calcular faturamento (exemplo simplificado)
    const revenue = appointments.reduce((total, appointment) => {
        return total + (appointment.price || 0);
    }, 0);
    document.getElementById('revenue-amount').textContent = `R$ ${revenue.toFixed(2)}`;

    // Contar clientes únicos
    const uniqueClients = new Set(appointments.map(a => a.clientPhone)).size;
    document.getElementById('clients-count').textContent = uniqueClients;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');

    // Configurar cor baseada no tipo
    if (type === 'error') {
        notification.style.backgroundColor = 'var(--danger-color)';
        notification.querySelector('i').className = 'fas fa-exclamation-circle';
    } else if (type === 'warning') {
        notification.style.backgroundColor = 'var(--warning-color)';
        notification.querySelector('i').className = 'fas fa-exclamation-triangle';
    } else {
        notification.style.backgroundColor = 'var(--secondary-color)';
        notification.querySelector('i').className = 'fas fa-check-circle';
    }

    // Mostrar notificação
    messageElement.textContent = message;
    notification.classList.add('active');

    // Ocultar após 3 segundos
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// Controles da agenda
document.getElementById('selected-date').addEventListener('change', async (e) => {
    await loadAppointments(e.target.value);
});

document.getElementById('prev-day').addEventListener('click', () => {
    const dateInput = document.getElementById('selected-date');
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() - 1);
    dateInput.value = currentDate.toISOString().split('T')[0];
    loadAppointments(dateInput.value);
});

document.getElementById('next-day').addEventListener('click', () => {
    const dateInput = document.getElementById('selected-date');
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + 1);
    dateInput.value = currentDate.toISOString().split('T')[0];
    loadAppointments(dateInput.value);
});

document.getElementById('today-btn').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('selected-date').value = today;
    loadAppointments(today);
});
// Adicionar evento para quando o serviço é selecionado
document.getElementById('service').addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.value) {
        const duration = selectedOption.getAttribute('data-duration');
        const price = selectedOption.getAttribute('data-price');
        console.log('Serviço selecionado - Duração:', duration, 'Preço:', price);
    }
});

// Configuração do formulário de agendamento - VERSÃO FINAL CORRIGIDA
document.getElementById('appointment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obter valores do formulário
    const clientName = document.getElementById('client-name').value;
    const clientPhone = document.getElementById('client-phone').value;
    const appointmentDate = document.getElementById('appointment-date').value;
    const appointmentTime = document.getElementById('appointment-time').value;
    const barberSelect = document.getElementById('barber');
    const serviceSelect = document.getElementById('service');
    const notes = document.getElementById('notes').value;

    // Validar selects
    if (barberSelect.value === '' || serviceSelect.value === '') {
        showNotification('Por favor, selecione um barbeiro e um serviço', 'error');
        return;
    }

    // Obter IDs como STRINGS
    const barberId = barberSelect.value;
    const serviceId = serviceSelect.value;

    // DEBUG: Verificar os IDs
    console.log('IDs dos selects:', {
        barberId,
        serviceId,
        barberIdType: typeof barberId,
        serviceIdType: typeof serviceId
    });

    // Obter o texto das opções selecionadas
    const barberText = barberSelect.options[barberSelect.selectedIndex].text;
    const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;

    // Extrair nomes
    const barberName = barberText.split(' - ')[0];
    const serviceName = serviceText.split(' - ')[0];

    // Combinar data e hora
    const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);

    // Obter duração e preço dos atributos data-*
    let duration = 30;
    let price = 0;

    try {
        const durationAttr = serviceSelect.options[serviceSelect.selectedIndex].getAttribute('data-duration');
        const priceAttr = serviceSelect.options[serviceSelect.selectedIndex].getAttribute('data-price');

        if (durationAttr) duration = parseInt(durationAttr);
        if (priceAttr) price = parseFloat(priceAttr);
    } catch (error) {
        console.warn('Não foi possível obter atributos do serviço:', error);
    }

    // Criar objeto de agendamento com IDs como STRINGS
    const appointment = {
        clientName,
        clientPhone,
        date: dateTime,
        barberId: barberId, // Já é string
        barberName,
        serviceId: serviceId, // Já é string
        serviceName,
        duration,
        price,
        notes,
        status: 'agendado'
    };

    console.log('Enviando appointment:', appointment);

    try {
        // Enviar para o banco de dados
        const result = await window.electronAPI.createAppointment(appointment);

        // Mostrar notificação de sucesso
        showNotification('Agendamento criado com sucesso!', 'success');

        // Recarregar agenda
        const selectedDate = document.getElementById('selected-date').value;
        await loadAppointments(selectedDate);

        // Resetar formulário
        resetForm();

        // Voltar para o dashboard
        document.querySelector('.nav-item[data-view="dashboard"]').click();

    } catch (error) {
        console.error('Erro ao criar agendamento:', error);
        showNotification(`Erro ao criar agendamento: ${error.message}`, 'error');
    }
});

// DEBUG: Adicione esta função para verificar os dados
async function checkFormData() {
    console.log('=== CHECK FORM DATA ===');

    const barberSelect = document.getElementById('barber');
    const serviceSelect = document.getElementById('service');

    console.log('Barber select options:', barberSelect.options.length);
    console.log('Service select options:', serviceSelect.options.length);

    // Verificar cada opção
    for (let i = 0; i < barberSelect.options.length; i++) {
        const option = barberSelect.options[i];
        console.log(`Barber option ${i}: value="${option.value}", text="${option.text}"`);
    }

    for (let i = 0; i < serviceSelect.options.length; i++) {
        const option = serviceSelect.options[i];
        console.log(`Service option ${i}: value="${option.value}", text="${option.text}"`);
    }

    // Verificar os dados no banco
    try {
        const barbers = await window.electronAPI.getBarbers();
        console.log('Barbeiros da API:', barbers);

        const services = await window.electronAPI.getServices();
        console.log('Serviços da API:', services);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
}
// Inicialização dos dados
async function loadInitialData() {
    await loadBarbers();
    await loadServices();
    await loadAppointments(new Date().toISOString().split('T')[0]);
}
// Função utilitária para converter IDs
function convertToObjectIdString(id) {
    if (!id) return '';

    // Se já for string, retornar
    if (typeof id === 'string') {
        // Verificar se é "[object Object]"
        if (id === '[object Object]') {
            console.error('ID inválido encontrado: [object Object]');
            return '';
        }
        return id;
    }

    // Se for objeto com método toString()
    if (typeof id === 'object' && id.toString) {
        const str = id.toString();
        if (str === '[object Object]') {
            console.error('Objeto não-ObjectId convertido para string:', id);
            return '';
        }
        return str;
    }

    // Qualquer outro tipo
    return String(id);
}

// Função utilitária para converter IDs
function convertToObjectIdString(id) {
    if (!id) return '';

    // Se já for string, retornar
    if (typeof id === 'string') {
        // Verificar se é "[object Object]"
        if (id === '[object Object]') {
            console.error('ID inválido encontrado: [object Object]');
            return '';
        }
        return id;
    }

    // Se for objeto com método toString()
    if (typeof id === 'object' && id.toString) {
        const str = id.toString();
        if (str === '[object Object]') {
            console.error('Objeto não-ObjectId convertido para string:', id);
            return '';
        }
        return str;
    }

    // Qualquer outro tipo
    return String(id);
}
// Chamar após carregar a página
setTimeout(checkFormData, 2000);