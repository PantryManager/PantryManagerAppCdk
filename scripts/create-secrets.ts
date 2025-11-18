#!/usr/bin/env node
/**
 * Script to create AWS Secrets Manager secrets for Pantry Manager App
 *
 * ⚠️  IMPORTANT: Run this script BEFORE deploying the CDK stack!
 *
 * This script must be executed as a prerequisite step before running `cdk deploy`.
 * It creates all required secrets in AWS Secrets Manager that the CDK stack will reference.
 *
 * Prerequisites:
 *   - AWS CLI configured with appropriate credentials
 *   - Permissions to create secrets in AWS Secrets Manager
 *
 * Usage:
 *   npm run create-secrets
 *
 * Or directly with ts-node:
 *   npx ts-node scripts/create-secrets.ts
 *
 * After running this script:
 *   1. Update lib/constants.ts with the generated ARNs
 *   2. Run `cdk deploy` to deploy your stack
 */

import { SecretsManagerClient, CreateSecretCommand, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

interface SecretConfig {
    name: string;
    description: string;
    envVarName: string;
    required: boolean;
    example?: string;
}

const SECRETS: SecretConfig[] = [
    {
        name: 'github-token',
        description: 'GitHub personal access token for Amplify to access your repository',
        envVarName: 'GITHUB_TOKEN',
        required: true,
        example: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    {
        name: 'pantry-github-id',
        description: 'GitHub OAuth App Client ID for authentication',
        envVarName: 'GITHUB_ID',
        required: true,
        example: 'Iv1.xxxxxxxxxxxxxxxx',
    },
    {
        name: 'pantry-github-secret',
        description: 'GitHub OAuth App Client Secret for authentication',
        envVarName: 'GITHUB_SECRET',
        required: true,
        example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    {
        name: 'pantry-nextauth-secret',
        description: 'NextAuth.js secret for session encryption (generate with: openssl rand -base64 32)',
        envVarName: 'NEXTAUTH_SECRET',
        required: true,
        example: 'Run: openssl rand -base64 32',
    },
    {
        name: 'pantry-db-url',
        description: 'Database connection URL (Prisma format)',
        envVarName: 'DATABASE_URL',
        required: true,
        example: 'postgresql://user:password@host:5432/dbname?schema=public',
    },
    {
        name: 'pantry-direct-db-url',
        description: 'Direct database connection URL (for migrations)',
        envVarName: 'DIRECT_URL',
        required: true,
        example: 'postgresql://user:password@host:5432/dbname?schema=public',
    },
    {
        name: 'pantry-fdc-api-key',
        description: 'FoodData Central API key',
        envVarName: 'FDC_API_KEY',
        required: true,
        example: 'Get from: https://fdc.nal.usda.gov/api-key-signup.html',
    },
    {
        name: 'pantry-gemini-api-key',
        description: 'Google Gemini API key',
        envVarName: 'GEMINI_API_KEY',
        required: true,
        example: 'Get from: https://aistudio.google.com/app/apikey',
    },
];

// Default region - can be overridden with --region flag
const DEFAULT_REGION = 'us-east-1';

class SecretCreator {
    private client: SecretsManagerClient;
    private rl: readline.Interface;
    private region: string;

    constructor(region: string) {
        this.region = region;
        this.client = new SecretsManagerClient({ region });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }

    private async question(query: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(query, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    private async secretExists(secretName: string): Promise<boolean> {
        try {
            await this.client.send(new DescribeSecretCommand({ SecretId: secretName }));
            return true;
        } catch (error: any) {
            if (error.name === 'ResourceNotFoundException') {
                return false;
            }
            throw error;
        }
    }

    private async createSecret(secretName: string, secretValue: string, description: string): Promise<string> {
        const command = new CreateSecretCommand({
            Name: secretName,
            Description: description,
            SecretString: secretValue,
        });

        const response = await this.client.send(command);
        return response.ARN!;
    }

    private generateConstantsUpdate(createdSecrets: { name: string; arn: string; envVarName: string }[]): void {
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║   UPDATE lib/constants.ts                                    ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        console.log('Copy and paste the following into your lib/constants.ts file:\n');
        console.log('    SECRET_ARNS: {');

        // Create a map for easy lookup
        const arnMap = new Map(createdSecrets.map(s => [s.envVarName, s.arn]));

        // Print in the order of constants file
        const secretKeys = [
            'GITHUB_TOKEN',
            'GITHUB_ID',
            'GITHUB_SECRET',
            'NEXTAUTH_SECRET',
            'DATABASE_URL',
            'DIRECT_URL',
            'FDC_API_KEY',
            'GEMINI_API_KEY'
        ];

        secretKeys.forEach(key => {
            const arn = arnMap.get(key);
            if (arn) {
                console.log(`        ${key}: '${arn}',`);
            }
        });

        console.log('    },\n');
    }

    async run(): Promise<void> {
        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║   Pantry Manager - AWS Secrets Manager Setup                ║');
        console.log('║   PREREQUISITE: Run BEFORE `cdk deploy`                      ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        console.log(`AWS Region: ${this.region}\n`);
        console.log('This script will create all required secrets in AWS Secrets Manager.');
        console.log('These secrets must exist before deploying the CDK stack.\n');
        console.log('⚠️  Existing secrets will be skipped (not overwritten).\n');

        const proceed = await this.question('Do you want to proceed? (yes/no): ');
        if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
            console.log('\n❌ Aborted.');
            this.rl.close();
            return;
        }

        const createdSecrets: { name: string; arn: string; envVarName: string }[] = [];
        const skippedSecrets: string[] = [];
        const failedSecrets: string[] = [];

        for (const secret of SECRETS) {
            console.log('\n' + '─'.repeat(70));
            console.log(`\n📝 Secret: ${secret.name}`);
            console.log(`   Description: ${secret.description}`);
            if (secret.example) {
                console.log(`   Example/Help: ${secret.example}`);
            }

            // Check if secret already exists
            const exists = await this.secretExists(secret.name);
            if (exists) {
                console.log(`   ℹ️  Secret already exists. Skipping...`);
                skippedSecrets.push(secret.name);
                continue;
            }

            // Prompt for secret value
            const value = await this.question(`\n   Enter value for ${secret.name} (or press Enter to skip): `);

            if (!value) {
                if (secret.required) {
                    console.log('   ⚠️  This secret is required but was skipped.');
                    failedSecrets.push(secret.name);
                } else {
                    console.log('   ⏭️  Skipped.');
                }
                continue;
            }

            try {
                const arn = await this.createSecret(secret.name, value, secret.description);
                createdSecrets.push({ name: secret.name, arn, envVarName: secret.envVarName });
                console.log(`   ✅ Created successfully!`);
                console.log(`   ARN: ${arn}`);
            } catch (error: any) {
                console.error(`   ❌ Error creating secret: ${error.message}`);
                failedSecrets.push(secret.name);
            }
        }

        // Summary
        console.log('\n' + '═'.repeat(70));
        console.log('\n📊 SUMMARY:\n');
        console.log(`   ✅ Created: ${createdSecrets.length} secret(s)`);
        console.log(`   ⏭️  Skipped (already exist): ${skippedSecrets.length} secret(s)`);
        console.log(`   ❌ Failed/Missing: ${failedSecrets.length} secret(s)`);

        if (createdSecrets.length > 0) {
            this.generateConstantsUpdate(createdSecrets);
        }

        if (skippedSecrets.length > 0) {
            console.log('\n⏭️  Skipped Secrets (already exist):\n');
            skippedSecrets.forEach((name) => {
                console.log(`   - ${name}`);
            });
        }

        if (failedSecrets.length > 0) {
            console.log('\n❌ Failed/Missing Secrets:\n');
            failedSecrets.forEach((name) => {
                console.log(`   - ${name}`);
            });
            console.log('\n⚠️  WARNING: You must create these secrets before running `cdk deploy`!');
            console.log('   Run this script again to create the missing secrets.');
        }

        console.log('\n' + '═'.repeat(70));
        console.log('\n📋 NEXT STEPS:\n');

        if (createdSecrets.length > 0) {
            console.log('   1. ✏️  Update lib/constants.ts with the ARNs shown above');
        }

        if (failedSecrets.length === 0 && (createdSecrets.length > 0 || skippedSecrets.length === SECRETS.length)) {
            console.log('   2. ✅ All secrets are ready!');
            console.log('   3. 🚀 Run: npm run cdk deploy');
        } else {
            console.log('   2. ⚠️  Create missing secrets by running this script again');
            console.log('   3. 🚀 After all secrets exist, run: npm run cdk deploy');
        }

        console.log('\n✨ Done!\n');
        this.rl.close();
    }
}

async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const regionIndex = args.indexOf('--region');
    const region = regionIndex !== -1 && args[regionIndex + 1]
        ? args[regionIndex + 1]
        : DEFAULT_REGION;

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Pantry Manager - AWS Secrets Setup Script

Usage:
  npm run create-secrets [-- --region REGION]
  npx ts-node scripts/create-secrets.ts [--region REGION]

Options:
  --region REGION    AWS region to create secrets in (default: ${DEFAULT_REGION})
  --help, -h         Show this help message

Examples:
  npm run create-secrets
  npm run create-secrets -- --region us-west-2
  npx ts-node scripts/create-secrets.ts --region eu-west-1

Prerequisites:
  - AWS CLI configured with credentials
  - Permissions to create secrets in AWS Secrets Manager

This script MUST be run BEFORE deploying the CDK stack.
        `);
        process.exit(0);
    }

    console.log(`\n🔧 Using AWS Region: ${region}\n`);

    const creator = new SecretCreator(region);
    try {
        await creator.run();
    } catch (error: any) {
        console.error('\n❌ FATAL ERROR:', error.message);
        if (error.name === 'CredentialsError' || error.message.includes('credentials')) {
            console.error('\n🔐 AWS Credentials Issue:');
            console.error('   Make sure you have AWS credentials configured:\n');
            console.error('   Option 1: AWS CLI');
            console.error('     Run: aws configure\n');
            console.error('   Option 2: Environment Variables');
            console.error('     Set: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY\n');
            console.error('   Option 3: AWS Profile');
            console.error('     Set: AWS_PROFILE=your-profile-name\n');
        }
        process.exit(1);
    }
}

main();
