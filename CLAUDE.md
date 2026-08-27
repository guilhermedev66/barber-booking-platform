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

## Status

Projeto em bootstrap inicial (scaffold backend + frontend em andamento).
