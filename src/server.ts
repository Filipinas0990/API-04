import fastify from 'fastify'
import crypto from 'node:crypto'

const server = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    }
})


const leads: { id: string; name: string }[] = [
    { id: '1', name: 'Filipe' },
    { id: '2', name: 'Gustavo' },
    { id: '3', name: 'Leoniria' }
]


server.get('/leads', (req, res) => {
    return res.send({ leads })
});

server.get('/leads/:id', (req, res) => {

    type Leads = {
        id: string
    };
    const Leads = req.params as Leads
    const LeadsId = Leads.id

    const lead = leads.find(lead => lead.id === Leads.id)

    if (lead) {
        return { lead }
    }

    return res.status(404)
});

server.post('/leads', (req, res) => {
    type Lead = {
        LeadsId: string;
        name: string;
        telefone: string;
        gestor_responsavel: string;
        temperatura: number;
        ineterrrese: string;
        observações: string;
    };

    const { LeadsId, name, telefone, gestor_responsavel, temperatura, ineterrrese, observações } = req.body as Lead;


    const lead = {
        id: crypto.randomUUID(),
        name,
        telefone,
        gestor_responsavel,
        temperatura,
        ineterrrese,
        observações
    }

    if (!lead.name) {
        return res.status(200).send({ error: 'Titulo obrigatório' })
    }

    if (!lead.observações) {
        return res.status(200).send({ error: 'Observações obrigatórias' })
    }




    // req.body; // Aqui você pode acessar os dados enviados no corpo da requisição, se necessário
    leads.push(lead);


    return res.status(201).send({ LeadsId: lead.id, name: lead.name, telefone: lead.telefone, gestor_responsavel: lead.gestor_responsavel, temperatura: lead.temperatura, ineterrrese: lead.ineterrrese, observações: lead.observações })



})

server.listen({ port: 3000 }).then(() => {
    console.log('Server is running on port 3000')
})