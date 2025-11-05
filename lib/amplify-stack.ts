import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { CONFIG } from './constants';

export interface AmplifyStackProps extends cdk.StackProps {
    /**
     * Environment name (e.g., 'prod', 'staging', 'dev')
     * Defaults to 'prod'
     */
    environmentName?: string;
}

export class AmplifyStack extends cdk.Stack {
    public readonly amplifyApp: amplify.CfnApp;
    public readonly mainBranch: amplify.CfnBranch;

    constructor(scope: Construct, id: string, props?: AmplifyStackProps) {
        super(scope, id, props);

        const envName = props?.environmentName || 'prod';

        // Import existing secrets from Secrets Manager
        const githubToken = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'GitHubToken',
            CONFIG.SECRET_ARNS.GITHUB_TOKEN
        );

        const githubId = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'GitHubId',
            CONFIG.SECRET_ARNS.GITHUB_ID
        );

        const githubSecret = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'GitHubSecret',
            CONFIG.SECRET_ARNS.GITHUB_SECRET
        );

        const nextauthSecret = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'NextAuthSecret',
            CONFIG.SECRET_ARNS.NEXTAUTH_SECRET
        );

        const databaseUrl = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'DatabaseUrl',
            CONFIG.SECRET_ARNS.DATABASE_URL
        );

        const directUrl = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'DirectUrl',
            CONFIG.SECRET_ARNS.DIRECT_URL
        );

        const fdcApiKey = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'FdcApiKey',
            CONFIG.SECRET_ARNS.FDC_API_KEY
        );

        const geminiApiKey = secretsmanager.Secret.fromSecretCompleteArn(
            this,
            'GeminiApiKey',
            CONFIG.SECRET_ARNS.GEMINI_API_KEY
        );

        // Create Amplify App
        this.amplifyApp = new amplify.CfnApp(this, 'PantryManagerApp', {
            name: `pantry-manager-${envName}`,
            repository: CONFIG.GITHUB.REPOSITORY,
            accessToken: githubToken.secretValue.unsafeUnwrap(),

            // Platform settings
            platform: 'WEB_COMPUTE', // Required for Next.js SSR

            // Environment variables for the Next.js application
            environmentVariables: [
                {
                    name: 'GITHUB_ID',
                    value: githubId.secretValue.unsafeUnwrap(),
                },
                {
                    name: 'GITHUB_SECRET',
                    value: githubSecret.secretValue.unsafeUnwrap(),
                },
                {
                    name: 'NEXTAUTH_SECRET',
                    value: nextauthSecret.secretValue.unsafeUnwrap(),
                },
                {
                    name: 'NEXTAUTH_URL',
                    value: 'https://main.d27goldu7abdnf.amplifyapp.com',
                },
                {
                    name: 'DATABASE_URL',
                    value: databaseUrl.secretValue.unsafeUnwrap(),
                },
                {
                    name: 'DIRECT_URL',
                    value: directUrl.secretValue.unsafeUnwrap(),
                },
                {
                    name: 'FDC_API_KEY',
                    value: fdcApiKey.secretValue.unsafeUnwrap(),
                },
                {
                    name: 'GEMINI_API_KEY',
                    value: geminiApiKey.secretValue.unsafeUnwrap(),
                },
                // Next.js specific environment variables
                {
                    name: '_LIVE_UPDATES',
                    value: JSON.stringify([
                        {
                            pkg: 'next-version',
                            type: 'internal',
                            version: 'latest',
                        },
                    ]),
                },
            ],

            // Build settings - Amplify will use amplify.yml from the repository
            // buildSpec is omitted - Amplify will automatically use amplify.yml from the repo

            // Enable auto branch creation for feature branches (optional)
            enableBranchAutoDeletion: true,

            // IAM Service Role for Amplify
            iamServiceRole: this.createAmplifyServiceRole().roleArn,
        });

        // Create main branch deployment
        this.mainBranch = new amplify.CfnBranch(this, 'MainBranch', {
            appId: this.amplifyApp.attrAppId,
            branchName: CONFIG.GITHUB.BRANCH,
            enableAutoBuild: true,
            enablePullRequestPreview: false, // Set to true if you want PR previews
            framework: 'Next.js - SSR',
            stage: envName.toUpperCase() === 'PROD' ? 'PRODUCTION' : 'DEVELOPMENT',
            // Explicitly set build spec to use the root amplify.yml (not a monorepo)
            buildSpec: `version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - env
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - .next/cache/**/*
      - node_modules/**/*`,

        });

        // Outputs
        new cdk.CfnOutput(this, 'AmplifyAppId', {
            value: this.amplifyApp.attrAppId,
            description: 'Amplify App ID',
            exportName: `${envName}-amplify-app-id`,
        });

        new cdk.CfnOutput(this, 'AmplifyAppUrl', {
            value: `https://${CONFIG.GITHUB.BRANCH}.${this.amplifyApp.attrDefaultDomain}`,
            description: 'Amplify App URL',
            exportName: `${envName}-amplify-app-url`,
        });

        new cdk.CfnOutput(this, 'AmplifyConsoleUrl', {
            value: `https://console.aws.amazon.com/amplify/home?region=${this.region
                }#/${this.amplifyApp.attrAppId}`,
            description: 'Amplify Console URL',
        });
    }

    /**
     * Creates an IAM role for Amplify with necessary permissions
     */
    private createAmplifyServiceRole(): cdk.aws_iam.Role {
        const role = new cdk.aws_iam.Role(this, 'AmplifyServiceRole', {
            assumedBy: new cdk.aws_iam.ServicePrincipal('amplify.amazonaws.com'),
            description: 'Service role for Amplify to access AWS resources',
        });

        // Add permissions for Amplify to perform its operations
        role.addManagedPolicy(
            cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify')
        );

        return role;
    }
}
