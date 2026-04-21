// src/modules/leads/lead.repository.ts
// O Repository isola o acesso aos dados.
// Hoje usa um array em memória — quando conectar o Prisma,
// você só muda ESTE arquivo e o resto continua funcionando.

import crypto from 'node:crypto'
import type { Lead, CreateLeadDTO, UpdateLeadDTO } from './lead.shema.js'

// Simula o banco de dados enquanto o Prisma não está conectado
const leadsStore: Lead[] = [
    {
        id: '1',
        name: 'Filipe',
        telefone: '(62) 99999-0001',
        gestor_responsavel: 'Admin',
        temperatura: 3,
        interesse: 'Apartamento 3 quartos',
        observacoes: 'Lead quente, ligou 3x',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '2',
        name: 'Gustavo',
        telefone: '(62) 99999-0002',
        gestor_responsavel: 'Admin',
        temperatura: 2,
        interesse: 'Casa em condomínio',
        observacoes: 'Aguardando retorno',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
]

export const leadRepository = {
    findAll(): Lead[] {
        return leadsStore
    },

    findById(id: string): Lead | undefined {
        return leadsStore.find(lead => lead.id === id)
    },

    create(data: CreateLeadDTO): Lead {
        const newLead: Lead = {
            id: crypto.randomUUID(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        leadsStore.push(newLead)
        return newLead
    },

    update(id: string, data: UpdateLeadDTO): Lead | undefined {
        const index = leadsStore.findIndex(lead => lead.id === id)
        if (index === -1) return undefined

        leadsStore[index] = {
            ...leadsStore[index],
            ...data,
            updatedAt: new Date(),
        }
        return leadsStore[index]
    },

    delete(id: string): boolean {
        const index = leadsStore.findIndex(lead => lead.id === id)
        if (index === -1) return false

        leadsStore.splice(index, 1)
        return true
    },
}