# Deployment Scripts

This directory contains utility scripts to help with deploying the Pantry Manager application.

## create-secrets.ts

A script to automate the creation of AWS Secrets Manager secrets required by the Pantry Manager application.

### Purpose

This script must be run **BEFORE** deploying the CDK stack with `cdk deploy`. It creates all the necessary secrets in AWS Secrets Manager that the application needs to run.

### Prerequisites

Before running this script, ensure you have:

1. **AWS CLI configured** with valid credentials
   ```bash
   aws configure
   ```

2. **Required AWS Permissions**:
   - `secretsmanager:CreateSecret`
   - `secretsmanager:DescribeSecret`
   - `secretsmanager:GetSecretValue`

3. **Dependencies installed**:
   ```bash
   npm install
   ```

### Usage

#### Option 1: Using npm script (recommended)

```bash
npm run create-secrets
```

#### Option 2: Using ts-node directly

```bash
npx ts-node scripts/create-secrets.ts
```

#### Option 3: Specify a different AWS region

```bash
npm run create-secrets -- --region us-west-2
```

or

```bash
npx ts-node scripts/create-secrets.ts --region eu-west-1
```

### What This Script Does

1. **Checks for existing secrets** - Won't overwrite secrets that already exist
2. **Prompts for each secret value** - Interactive input for all required secrets
3. **Creates secrets in AWS Secrets Manager** - Uses the AWS SDK to create secrets
4. **Generates ARNs** - Provides the ARNs you need to update in `lib/constants.ts`
5. **Validates completion** - Ensures all required secrets are created

### Required Secrets

The script will guide you through creating these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `github-token` | GitHub personal access token for Amplify | `ghp_xxxx...` |
| `pantry-github-id` | GitHub OAuth App Client ID | `Iv1.xxxx...` |
| `pantry-github-secret` | GitHub OAuth App Client Secret | `xxxx...` |
| `pantry-nextauth-secret` | NextAuth.js session encryption key | Run: `openssl rand -base64 32` |
| `pantry-db-url` | Database connection URL (Prisma format) | `postgresql://user:pass@host:5432/db` |
| `pantry-direct-db-url` | Direct database URL for migrations | `postgresql://user:pass@host:5432/db` |
| `pantry-fdc-api-key` | FoodData Central API key | Get from [FDC](https://fdc.nal.usda.gov/api-key-signup.html) |
| `pantry-gemini-api-key` | Google Gemini API key | Get from [AI Studio](https://aistudio.google.com/app/apikey) |

### How to Get Secret Values

#### GitHub Token
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token (starts with `ghp_`)

#### GitHub OAuth App
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App or use an existing one
3. Copy the Client ID and generate a Client Secret

#### NextAuth Secret
```bash
openssl rand -base64 32
```

#### Database URLs
- Get these from your database provider (e.g., Neon, Supabase, AWS RDS)
- Format: `postgresql://username:password@host:port/database?schema=public`

#### FDC API Key
- Sign up at https://fdc.nal.usda.gov/api-key-signup.html
- Free tier available

#### Gemini API Key
- Get from https://aistudio.google.com/app/apikey
- Free tier available

### After Running the Script

1. **Update `lib/constants.ts`**:
   - Copy the generated ARNs from the script output
   - Replace the `SECRET_ARNS` section in `lib/constants.ts`

2. **Verify secrets were created**:
   ```bash
   aws secretsmanager list-secrets --region us-east-2
   ```

3. **Deploy the CDK stack**:
   ```bash
   npm run cdk deploy
   ```

### Example Workflow

```bash
# Step 1: Install dependencies
npm install

# Step 2: Create secrets
npm run create-secrets

# Step 3: Update lib/constants.ts with the ARNs from script output

# Step 4: Build the CDK app
npm run build

# Step 5: Deploy the stack
npm run cdk deploy
```

### Troubleshooting

#### "Credentials Error"
Make sure AWS credentials are configured:
```bash
aws configure
# or
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

#### "Access Denied"
Ensure your AWS user/role has the required Secrets Manager permissions.

#### "Secret already exists"
The script will skip existing secrets. If you need to update a secret value, use the AWS Console or CLI:
```bash
aws secretsmanager update-secret --secret-id secret-name --secret-string "new-value"
```

#### Skipped Required Secrets
If you skip required secrets during the first run, simply run the script again to create them.

### Security Best Practices

- **Never commit secrets to git** - The script prompts for values interactively
- **Use IAM roles when possible** - Avoid long-term access keys
- **Rotate secrets regularly** - Update in Secrets Manager, then update CDK stack
- **Restrict IAM permissions** - Follow principle of least privilege
- **Enable secret rotation** - Consider enabling AWS Secrets Manager rotation for database credentials

### Help

```bash
npx ts-node scripts/create-secrets.ts --help
```
