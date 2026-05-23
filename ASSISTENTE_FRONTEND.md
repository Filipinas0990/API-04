# Assistente IA "Filipe" — Guia de Implementação Frontend

## O que é

O Filipe é um número de WhatsApp dedicado que permite ao corretor cadastrar leads, vendas e imóveis enviando uma mensagem de texto, sem precisar abrir o sistema. O backend já identifica o corretor pelo número do celular dele.

---

## Página a criar

**Rota sugerida:** `/dashboard/configuracoes/assistente`  
**Menu:** Configurações → Assistente IA

---

## Seções da página

### 1. Status do assistente

Exibe se o corretor está configurado ou não para usar o Filipe.

**Chamada:**
```
GET /api/v1/auth/assistente/config
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "filipe_phone": "5511999999999",
  "meu_phone": "5511988887777",
  "configurado": true
}
```

**Lógica de exibição:**
- Se `configurado === true` → mostrar badge verde "✅ Assistente ativado"
- Se `configurado === false` → mostrar badge amarelo "⚠️ Configure seu número para ativar"

---

### 2. Número do Filipe (somente leitura)

Mostra o número do WhatsApp do assistente para o corretor salvar no celular.

**Campo:**
```
Número do assistente Filipe
[ +55 (11) 9 9999-9999 ]   [📋 Copiar]
```

- Valor vem de `filipe_phone` da resposta acima
- Se `filipe_phone === null` → mostrar "Em breve"
- Botão copiar copia o número sem formatação (só dígitos)

---

### 3. Meu número de WhatsApp

Campo para o corretor informar o número dele. Esse número é o que o sistema usa para identificar quem é o corretor quando ele manda mensagem pro Filipe.

**Campo:**
```
Meu número de WhatsApp
[ (11) 9 9999-9999 ]   [💾 Salvar]
```

**Chamada ao salvar:**
```
PUT /api/v1/auth/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "5511988887777"
}
```

**Regras:**
- Aceitar apenas números, parênteses, espaços e hífen na máscara
- Salvar sem formatação (só dígitos, com DDI 55): `5511988887777`
- Mostrar toast de sucesso "Número salvo com sucesso"
- Atualizar o status da seção 1 após salvar

---

### 4. Como usar (accordion/explicação)

Bloco informativo com exemplos do que o corretor pode dizer pro Filipe:

```
📱 Como usar o assistente

Salve o número do Filipe no seu celular e mande mensagem como se fosse
conversa normal. Exemplos:

➕ Cadastrar lead:
"Filipe, cadastra o João Silva, telefone 11 99999-8888, interessado em apartamento"

💰 Registrar venda:
"Filipe, registra uma venda de R$ 350.000 do imóvel Residencial Park"

🏠 Cadastrar imóvel:
"Filipe, cadastra um apartamento chamado Vista Livre em São Paulo por 280 mil"
```

---

## Fluxo completo de ativação

```
1. Corretor acessa Configurações > Assistente IA
2. Vê o número do Filipe → salva no celular
3. Informa o próprio número no campo "Meu número"
4. Clica Salvar
5. Status muda para ✅ Ativado
6. Corretor manda mensagem pro Filipe pelo WhatsApp normalmente
```

---

## Estados de erro para tratar

| Situação | Mensagem para o usuário |
|---|---|
| Número inválido (menos de 10 dígitos) | "Informe um número válido com DDD" |
| Erro ao salvar | "Não foi possível salvar. Tente novamente." |
| `filipe_phone` nulo | "O assistente ainda está sendo configurado. Em breve disponível." |

---

## Observações importantes

- O campo `phone` já existe no modelo de usuário — não precisa de migration
- O número deve ser salvo **com DDI 55** e **sem formatação**: `5511988887777`
- A página não precisa de nenhum endpoint novo além dos dois já documentados acima
- Após o corretor salvar o número, o assistente já funciona imediatamente — não precisa de aprovação ou ativação adicional
