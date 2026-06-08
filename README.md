# My Tight Five

A personal toolkit for stand-up comedians - write jokes, build sets, capture ideas, and practice your material.

---

## What it does

**My Tight Five** is a full-stack web app for managing stand-up comedy material:

- **Jokes** - write setups and punchlines, attach notes, record audio takes, tag by topic, track stage progression (draft → tested → polished), and link callbacks between jokes
- **Sets** - build ordered sets from your joke library via drag-and-drop, set a target duration, and track how close you are to time
- **Read-through** - step through a set card by card with spacebar to reveal punchlines, keeping your eyes off a script
- **Practice mode** - a full-screen overlay with a countdown timer showing your current joke and what's coming next
- **Ideas** - quick-capture a thought and promote it to a joke in one click
- **Dashboard** - see your polished joke count, total material duration, and recent work at a glance

---

## Tech stack

### Frontend (`app/`)

| Layer         | Technology                       |
|---------------|----------------------------------|
| Framework     | React 18 + Vite                  |
| Routing       | react-router-dom v6              |
| Styling       | styled-components v6             |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable|
| Notifications | react-toastify                   |
| Icons         | lucide-react                     |
| IDs           | ulid                             |

### Backend (AWS, managed by Terraform)

| Service                | Role                                                          |
|------------------------|---------------------------------------------------------------|
| **Cognito**            | User auth (sign up, sign in, JWT)                             |
| **API Gateway** (HTTP) | JWT-authorised REST API                                       |
| **Lambda** (Node.js)   | Single-function handler for all routes                        |
| **DynamoDB**           | Single-table store - jokes, sets, ideas per user              |
| **S3**                 | Audio recordings (pre-signed upload/download URLs)            |
| **CloudFront**         | SPA CDN + HTTPS for the frontend                              |
| **ACM**                | TLS certificates (CloudFront in us-east-1, API in eu-west-2) |
| **Route 53**           | DNS - `mytightfive.co.uk` + `api.mytightfive.co.uk`          |

---

## Repository layout

```
my-tight-five/
├── app/                    # React/Vite frontend
│   └── src/
│       ├── pages/          # Route-level components
│       ├── components/     # Shared UI (Button, Modal, Skeleton, …)
│       ├── hooks/          # useResource (data fetching)
│       ├── context/        # AuthContext, ThemeContext
│       └── utils/          # api, time, stages
├── infra/
│   ├── env/sandbox/        # Sandbox environment root (tfvars, providers, main)
│   ├── modules/            # Reusable Terraform modules
│   │   ├── acm/
│   │   ├── api_gateway/
│   │   ├── cloudfront/
│   │   ├── cognito/
│   │   ├── dynamodb/
│   │   ├── lambda/
│   │   │   └── src/        # Lambda handler (index.mjs)
│   │   ├── route53/
│   │   └── s3/
│   └── scripts/            # Local workflow scripts
└── .github/workflows/      # CI - validate + plan on PR, apply on dispatch
```

---

## Local development

### Prerequisites

- Node.js 22+
- A deployed backend (or run `bash infra/scripts/prereqs.sh` to check infra tooling)

### Frontend

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies nothing - it talks directly to the deployed API Gateway. Set the API URL in `app/src/utils/api.js` (or via an env var if you wire one up).

---

## Infrastructure

All infrastructure is managed with Terraform under `infra/`. Run everything in **Git Bash** from the repo root.

### First-time bootstrap (once per AWS account)

```bash
# Set your AWS profile for the target environment
export ENVIRONMENT="sandbox"
source infra/scripts/use-env.sh "$ENVIRONMENT"

# Confirm the account you're about to touch
bash infra/scripts/whoami.sh

# Create S3 state bucket, DynamoDB lock table, and GitHub OIDC role
bash infra/scripts/bootstrap-state.sh "$ENVIRONMENT" --region eu-west-2

# Initialise Terraform with the generated backend config
cd "infra/env/$ENVIRONMENT"
terraform init -backend-config=backend.hcl
```

### Day-to-day workflow

```bash
# From the repo root after sourcing use-env.sh:

# Format check + validate + tflint
bash infra/scripts/validate.sh "$ENVIRONMENT"

# Generate a saved plan
bash infra/scripts/plan.sh "$ENVIRONMENT"

# Apply the saved plan
bash infra/scripts/apply.sh "$ENVIRONMENT"
```

### CI/CD (GitHub Actions)

- **Pull requests** - runs `validate` + `plan`, posts the plan output as a comment
- **Manual dispatch** - runs `apply` against the selected environment, gated by a GitHub Environment approval

The workflow assumes an OIDC role `GitHubOIDCTerraformRole` was created by the bootstrap script. No long-lived AWS credentials are stored in GitHub - only `AWS_ROLE_ARN` in the GitHub Environment.

---

## Environments

| Environment | Domain | Region |
|---|---|---|
| sandbox | mytightfive.co.uk | eu-west-2 |

---

## Deploying the frontend

After `terraform apply`, the CloudFront distribution and S3 origin bucket are created. Build and upload the app:

```bash
cd app
npm run build
aws s3 sync dist/ s3://<frontend-bucket-name>/ --delete
aws cloudfront create-invalidation --distribution-id <cf-id> --paths "/*"
```

Bucket name and CloudFront distribution ID are available as Terraform outputs.
