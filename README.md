# Nexus CRM Express Starter

Lightweight CRM-style Express application with:

- Transparent modern login screen
- Standard username/password login
- Placeholder button for Microsoft Entra ID authentication
- Dashboard placeholder for future metrics and charts
- Settings page
- Auto-collapsing vertical sidebar navigation
- SQLite for local development
- Azure SQL placeholder for production

## 1. Open in Visual Studio Code

Unzip the project, then open the folder in VS Code.

```bash
code nexus-crm-express
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment

Copy `.env.example` to `.env`.

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## 4. Initialize the local SQLite database

```bash
npm run db:init
```

This creates a local test user:

```text
Username: admin
Password: Password123!
```

## 5. Run the app locally

```bash
npm run dev
```

Then browse to:

```text
http://localhost:3000
```

## Production database direction: Azure SQL

For production, update `.env`:

```env
NODE_ENV=production
DB_PROVIDER=azuresql
AZURE_SQL_SERVER=your-sql-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USER=your-sql-username
AZURE_SQL_PASSWORD=your-sql-password
AZURE_SQL_ENCRYPT=true
```

The Azure SQL connection placeholder is in:

```text
src/db/azureSql.js
```

The database switch logic is in:

```text
src/db/index.js
```

## Entra ID placeholder

The Entra login button currently routes to a placeholder endpoint:

```text
/auth/entra
```

When ready, connect it to Microsoft Authentication Library or Passport strategy for Microsoft Entra ID. The placeholder route is in:

```text
src/routes/auth.js
```

## Suggested production architecture

```text
Azure Container Registry
        ↓
Azure Container Instance / Container Apps
        ↓
Express.js CRM App
        ↓
Azure SQL Database
        ↓
Key Vault for secrets
        ↓
Application Insights / Log Analytics
```
