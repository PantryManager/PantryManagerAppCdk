# Pantry Manager CDK

AWS CDK infrastructure-as-code for the Pantry Manager application. This project provisions and manages all AWS resources required to deploy and run Pantry Manager, including AWS Amplify hosting and related infrastructure.

## Architecture

This CDK application deploys:
- **AWS Amplify** - Hosts the Next.js frontend application with continuous deployment from GitHub
- **Secrets Management** - AWS Secrets Manager integration for secure credential storage
- **Environment Configuration** - Automated environment variable injection for the application

## Prerequisites

Before deploying, ensure you have:

1. **Node.js** (v18 or later)
   ```bash
   node --version
   ```

2. **AWS CLI** configured with valid credentials
   ```bash
   aws configure
   ```

3. **Required AWS Permissions**:
   - `secretsmanager:*` - For secrets management
   - `amplify:*` - For Amplify app deployment
   - `iam:*` - For role creation
   - `cloudformation:*` - For stack deployment

4. **GitHub Repository** - Your Pantry Manager app repository URL and access token

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create required secrets in AWS Secrets Manager
npm run create-secrets

# 3. Update lib/constants.ts with the generated secret ARNs

# 4. Bootstrap CDK (first time only)
npm run cdk bootstrap

# 5. Build the TypeScript code
npm run build

# 6. Deploy the infrastructure
npm run cdk deploy
```

## Deployment Guide

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Required Secrets

This script must be run **BEFORE** deploying the CDK stack. It creates all the necessary secrets in AWS Secrets Manager that the application needs to run.

#### Usage

**Using npm script (recommended):**

```bash
npm run create-secrets
```

**Specify a different AWS region:**

```bash
npm run create-secrets -- --region us-west-2
```

#### What This Script Does

1. **Checks for existing secrets** - Won't overwrite secrets that already exist
2. **Prompts for each secret value** - Interactive input for all required secrets
3. **Creates secrets in AWS Secrets Manager** - Uses the AWS SDK to create secrets
4. **Generates ARNs** - Provides the ARNs you need to update in `lib/constants.ts`
5. **Validates completion** - Ensures all required secrets are created

#### Required Secrets

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

### Step 3: Update Constants

After running the create-secrets script, update `lib/constants.ts` with the generated secret ARNs from the script output.

### Step 4: Bootstrap CDK (First Time Only)

If this is your first time using CDK in your AWS account/region, you need to bootstrap:

```bash
npm run cdk bootstrap
```

This creates the necessary S3 bucket and other resources CDK needs for deployments.

### Step 5: Build the Project

Compile the TypeScript code:

```bash
npm run build
```

### Step 6: Deploy the Stack

Deploy the infrastructure to AWS:

```bash
npm run cdk deploy
```

You'll see a preview of the changes and be asked to confirm before deployment proceeds.

## Available CDK Commands

```bash
# Synthesize CloudFormation template
npm run cdk synth

# Show differences between local and deployed stack
npm run cdk diff

# Deploy the stack
npm run cdk deploy

# Destroy the stack (careful!)
npm run cdk destroy

# List all stacks
npm run cdk list
```

## Secrets Management Reference

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

### Verifying Secrets

Check that secrets were created successfully:

```bash
aws secretsmanager list-secrets --region us-east-2
```

## Troubleshooting

### CDK Bootstrap Required

If you see an error about missing CDK resources:
```bash
npm run cdk bootstrap
```

### Credentials Error

Make sure AWS credentials are configured:
```bash
aws configure
```

Or use environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### Access Denied

Ensure your AWS user/role has the required permissions for CloudFormation, Amplify, Secrets Manager, and IAM.

### Secret Already Exists

The create-secrets script will skip existing secrets. To update a secret value:
```bash
aws secretsmanager update-secret --secret-id secret-name --secret-string "new-value"
```

Then redeploy:
```bash
npm run cdk deploy
```

### Deployment Fails

Check CloudFormation stack events in the AWS Console for detailed error messages:
```bash
aws cloudformation describe-stack-events --stack-name PantryManagerAppCdkStack
```

## Security Best Practices

- **Never commit secrets to git** - The script prompts for values interactively
- **Use IAM roles when possible** - Avoid long-term access keys
- **Rotate secrets regularly** - Update in Secrets Manager, then redeploy with `npm run cdk deploy`
- **Restrict IAM permissions** - Follow principle of least privilege
- **Enable secret rotation** - Consider enabling AWS Secrets Manager rotation for database credentials
- **Review CloudFormation templates** - Use `npm run cdk synth` to inspect generated templates before deployment

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
