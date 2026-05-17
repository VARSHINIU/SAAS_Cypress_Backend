# SAAS Cypress Backend Testing Framework

A backend test automation framework built with Cypress to validate database integrity and API behavior for a SaaS application.

---

## 🛠 Tech Stack

- **Cypress** — Test automation
- **PostgreSQL (pg)** — Database validation via custom tasks
- **Mochawesome** — HTML & JSON test reports
- **JavaScript**

---

## 📁 Project Structure

```
SAAS_Cypress_Backend/
├── cypress/
│   ├── e2e/            # Test spec files
│   ├── fixtures/       # Test data
│   ├── reports/mocha/  # Generated test reports
│   └── support/        # Custom commands & hooks
├── cypress.config.js   # Cypress configuration
└── package.json
```

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/VARSHINIU/SAAS_Cypress_Backend.git
cd SAAS_Cypress_Backend

# Install dependencies
npm install
```

Create a `.env` file in the root with your database credentials:

```env
USER=your_db_user
HOST=your_db_host
DB_NAME=your_database
DB_PASS=your_password
PORT=5432
```

---

## ▶️ Running Tests

```bash
# Interactive mode
npx cypress open

# Headless mode
npx cypress run
```

---

## 📊 Test Reports

Reports are auto-generated after each run inside `cypress/reports/mocha/` as both `.html` and `.json` files. Open the `.html` file in a browser to view results.

---

## ✨ Key Features

- Custom `READFROMDB` Cypress task to query PostgreSQL directly from tests
- Environment-variable-based DB configuration (no hardcoded credentials)
- Mochawesome reports for clear test result visibility

---

## 👩‍💻 Author

**Varshini U** — [GitHub](https://github.com/VARSHINIU)
