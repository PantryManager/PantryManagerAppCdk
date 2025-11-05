#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AmplifyStack } from '../lib/amplify-stack';
import { CONFIG } from '../lib/constants';

const app = new cdk.App();

// Deploy Amplify stack for Pantry Manager Next.js application
new AmplifyStack(app, 'PantryManagerAmplifyStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: CONFIG.REGION,
  },
  environmentName: 'prod',
  description: 'Amplify hosting stack for Pantry Manager Next.js application with CI/CD pipeline',
});
