# API Reference - Sistema de Prevendas

## Base URL

```
http://localhost:3001/api
```

## Authentication

Atualmente sem autenticação. Será implementado em versões futuras.

## Response Format

Todas as respostas seguem este formato:

```json
{
  "success": true,
  "data": {},
  "timestamp": "2025-11-26T10:00:00Z"
}
```

## Endpoints

### Health Check

#### GET /health

Verifica se o servidor está rodando.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

### Service Desk

#### POST /service-desk/calculate

Calcula dimensionamento de Service Desk usando Erlang C.

**Request:**
```json
{
  "agents": 10,
  "erlangC": 0.8,
  "serviceLevel": 80,
  "averageHandleTime": 300,
  "callsPerHour": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": 10,
    "erlangC": 0.75,
    "serviceLevel": 80,
    "averageHandleTime": 300,
    "callsPerHour": 100
  },
  "timestamp": "2025-11-26T10:00:00Z"
}
```

**Errors:**
- `400` - Invalid request data
- `500` - Server error

---

#### GET /service-desk/dimensions

Lista todos os dimensionamentos salvos.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "agents": 10,
      "erlangC": 0.75,
      "serviceLevel": 80,
      "averageHandleTime": 300,
      "callsPerHour": 100,
      "createdAt": "2025-11-26T10:00:00Z"
    }
  ],
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

### Proposals

#### POST /proposals

Cria uma nova proposta.

**Request:**
```json
{
  "title": "Proposta XYZ",
  "clientName": "Cliente ABC",
  "status": "draft"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prop123",
    "title": "Proposta XYZ",
    "clientName": "Cliente ABC",
    "status": "draft",
    "createdAt": "2025-11-26T10:00:00Z",
    "updatedAt": "2025-11-26T10:00:00Z"
  },
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

#### GET /proposals

Lista todas as propostas.

**Query Parameters:**
- `status` - Filtrar por status (draft, sent, accepted, rejected)
- `limit` - Número de resultados (padrão: 10)
- `offset` - Paginação (padrão: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prop123",
      "title": "Proposta XYZ",
      "clientName": "Cliente ABC",
      "status": "draft",
      "createdAt": "2025-11-26T10:00:00Z",
      "updatedAt": "2025-11-26T10:00:00Z"
    }
  ],
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

#### GET /proposals/:id

Obtém detalhes de uma proposta específica.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prop123",
    "title": "Proposta XYZ",
    "clientName": "Cliente ABC",
    "status": "draft",
    "content": "...",
    "createdAt": "2025-11-26T10:00:00Z",
    "updatedAt": "2025-11-26T10:00:00Z"
  },
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

### Edital Analysis

#### POST /edital-analysis/analyze

Analisa um edital usando IA.

**Request:**
```json
{
  "fileName": "edital.pdf",
  "content": "Conteúdo do edital..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "edital123",
    "fileName": "edital.pdf",
    "content": "Conteúdo do edital...",
    "analysis": "Análise gerada pela IA...",
    "createdAt": "2025-11-26T10:00:00Z",
    "updatedAt": "2025-11-26T10:00:00Z"
  },
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

#### GET /edital-analysis

Lista todas as análises de editais.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "edital123",
      "fileName": "edital.pdf",
      "analysis": "Análise...",
      "createdAt": "2025-11-26T10:00:00Z"
    }
  ],
  "timestamp": "2025-11-26T10:00:00Z"
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Descrição do erro",
  "timestamp": "2025-11-26T10:00:00Z"
}
```

### Common Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid request data | Dados de entrada inválidos |
| 404 | Not found | Recurso não encontrado |
| 500 | Internal Server Error | Erro no servidor |

---

## Rate Limiting

Não implementado atualmente. Será adicionado em versões futuras.

---

## Pagination

Endpoints que retornam listas suportam paginação:

```
GET /proposals?limit=10&offset=0
```

---

## Timestamps

Todos os timestamps estão em ISO 8601 format (UTC).

---

**Última atualização**: Novembro 2025
