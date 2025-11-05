/**
 * Configuration constants for Pantry Manager App deployment
 *
 * IMPORTANT: Update the SECRET_ARNS with actual ARNs from AWS Secrets Manager
 * after creating the secrets in the AWS Console or CLI.
 */

export const CONFIG = {
    // AWS Region for deployment
    REGION: 'us-east-2', // Ohio

    // GitHub Repository Configuration
    GITHUB: {
        REPOSITORY: 'https://github.com/PantryManager/PantryManagerApp',
        OWNER: 'PantryManager',
        REPO_NAME: 'PantryManagerApp',
        BRANCH: 'main',
    },

    // Next.js Build Configuration
    BUILD: {
        NODE_VERSION: '20', // Node.js version for build
        BUILD_COMMAND: 'npm run build',
        START_COMMAND: 'npm run start',
        INSTALL_COMMAND: 'npm ci',
    },

    /**
     * AWS Secrets Manager ARNs
     *
     * TODO: Replace these placeholder ARNs with actual ARNs after creating secrets
     *
     * Example ARN format:
     * arn:aws:secretsmanager:us-east-2:123456789012:secret:secret-name-AbCdEf
     *
     * To create secrets via AWS CLI:
     * aws secretsmanager create-secret --name github-token --secret-string "your-token" --region us-east-2
     * aws secretsmanager create-secret --name pantry-github-id --secret-string "your-id" --region us-east-2
     * aws secretsmanager create-secret --name pantry-github-secret --secret-string "your-secret" --region us-east-2
     * aws secretsmanager create-secret --name pantry-nextauth-secret --secret-string "your-secret" --region us-east-2
     * aws secretsmanager create-secret --name pantry-database-url --secret-string "your-url" --region us-east-2
     * aws secretsmanager create-secret --name pantry-direct-url --secret-string "your-url" --region us-east-2
     * aws secretsmanager create-secret --name pantry-fdc-api-key --secret-string "your-key" --region us-east-2
     * aws secretsmanager create-secret --name pantry-gemini-api-key --secret-string "your-key" --region us-east-2
     */
    SECRET_ARNS: {
        GITHUB_TOKEN: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:github-token-P9LWbO',
        GITHUB_ID: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:pantry-github-id-psMi5Z',
        GITHUB_SECRET: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:pantry-github-secret-joUIJt',
        NEXTAUTH_SECRET: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:pantry-nextauth-secret-o4NPjk',
        DATABASE_URL: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:pantry-db-url-lnetgw',
        DIRECT_URL: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:pantry-direct-db-url-xZovXX',
        FDC_API_KEY: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:pantry-fdc-api-key-BJXVLG',
        GEMINI_API_KEY: 'arn:aws:secretsmanager:us-east-2:788946907378:secret:pantry-gemini-api-key-FLKvFk',
    },
} as const;
