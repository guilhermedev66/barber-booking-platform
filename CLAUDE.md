# Barber Booking Platform

Plataforma de agendamento para barbearias. Cliente agenda horário com barbeiro
para um serviço; barbeiro/admin gerencia agenda, serviços e disponibilidade.

## Stack

- Backend: ASP.NET Core Web API, .NET 10, EF Core, PostgreSQL, Identity + JWT.
- Frontend: React + TypeScript + Vite, Tailwind CSS.
- Testes: xUnit (backend), Vitest + React Testing Library (frontend).

## Estrutura

```
backend/
  BarberBooking.Api/             # controllers, Program.cs, auth, DI
  BarberBooking.Domain/          # entidades, regras de negócio
  BarberBooking.Infrastructure/  # EF Core, DbContext, repositórios, migrations
  BarberBooking.Tests/           # testes unitários e de integração
frontend/
  src/                           # app React (Vite)
```

Sem camada "Application" separada por enquanto — regra de negócio fica em
Domain (services/value objects) chamada direto pelos controllers/handlers da
Api. Adicionar camada extra só se a complexidade real pedir.

## Domínio (MVP)

- **User** (Identity): roles Admin, Barber, Client.
- **Barbershop**: dados da barbearia (se multi-tenant; MVP pode assumir 1 unidade).
- **Barber**: perfil profissional, vinculado a um User.
- **Service**: nome, duração, preço.
- **Availability**: janelas de trabalho do barbeiro por dia da semana + exceções (folga).
- **Appointment**: cliente, barbeiro, serviço, data/hora início, status
  (Pending/Confirmed/Cancelled/Completed). Regra central: sem overlap de
  horário para o mesmo barbeiro.

## Regras de negócio críticas

- Não permitir dois agendamentos sobrepostos para o mesmo barbeiro.
- Agendamento só dentro da disponibilidade cadastrada do barbeiro.
- Cancelamento: cliente cancela até X horas antes (definir política depois).
- Cliente só enxerga/mexe nos próprios agendamentos; barbeiro/admin vê os da
  própria agenda; admin vê tudo.

## Convenções

- Sem overengineering: 3 camadas (Domain/Infrastructure/Api) até haver
  necessidade real de mais uma.
- Migrations do EF Core versionadas no repo.
- Autenticação: JWT via ASP.NET Identity, roles como claims.
- Commits: Conventional Commits (feat/fix/chore/refactor/test/docs).

## Comandos

```
# stack local completo (PostgreSQL + API)
docker compose up --build
# API: http://localhost:8080 | Swagger: http://localhost:8080/swagger
# para encerrar: docker compose down

# backend
cd backend
dotnet build
dotnet test
dotnet ef database update --project BarberBooking.Infrastructure --startup-project BarberBooking.Api

# frontend
cd frontend
npm install
npm run dev
npm test
```

O Compose aguarda o PostgreSQL ficar saudável, aplica as migrations e cria as
roles do Identity antes de disponibilizar a API. Em banco vazio, o ambiente de
desenvolvimento também cria três serviços, dois barbeiros demonstrativos e
disponibilidade recorrente de segunda a sexta, das 9h às 18h. Os dados ficam
persistidos no volume `barberbooking_postgres`. A chave JWT e a senha do banco
no Compose são exclusivamente locais e não devem ser reutilizadas em produção.

Em desenvolvimento, a API aceita CORS somente dos origins locais do Vite nas
portas `5173` (dev) e `4173` (preview), para `localhost` e `127.0.0.1`.

Os testes de integração do backend usam Testcontainers e exigem Docker ativo.

## API — Milestone 1

- `POST /api/auth/register` — cria usuário com role `Client`.
- `POST /api/auth/login` — retorna JWT bearer com claims de usuário e roles.
- `GET /api/services` — lista serviços ativos.
- `GET /api/barbers` — lista barbeiros ativos e os serviços atendidos.
- `GET /api/barbers/{id}/availability?date=YYYY-MM-DD&serviceId={guid}` —
  retorna slots UTC livres; `date` usa o fuso configurado em `Booking:TimeZoneId`.
- `POST /api/appointments` — cliente autenticado agenda com
  `{ barberId, serviceId, startUtc }`.
- `POST /api/appointments/{id}/cancel` — cancelamento protegido por role e ownership.
- `GET /api/appointments/mine` — agenda do cliente autenticado.
- `GET /api/appointments` — agenda do próprio barbeiro; admin recebe todas.

O intervalo padrão entre inícios de slots é configurado por
`Booking:SlotIntervalMinutes`. O banco impede sobreposição por barbeiro com
exclusion constraint GiST sobre `[StartUtc, EndUtc)`, ignorando cancelados.

## Status

Milestone 2 concluído: backend e frontend integrados contra a API real, stack
local reproduzível via Compose, seed demonstrativo para banco vazio, CORS local
restrito e CI com build/testes de integração em PostgreSQL real.
