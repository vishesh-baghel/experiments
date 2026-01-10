# Agent Repository Syncing Guide

This guide explains how to set up automatic syncing from a package in the experiments monorepo to a standalone GitHub repository. This is required for the Squad deployment platform to work, as Vercel Deploy Button needs a public standalone repo.

## Overview

```
experiments monorepo                    standalone repo
├── packages/
│   └── your-agent/      ──────────►   github.com/vishesh-baghel/your-agent
│       └── (all files)                └── (all files synced)
```

When you push changes to `packages/your-agent/` on the main branch of experiments, a GitHub Action automatically syncs those changes to the standalone repository.

## Prerequisites

- GitHub account with access to both repositories
- The standalone destination repository created (can be empty)
- SSH key pair for authentication

## Step-by-Step Setup

### 1. Create the Destination Repository

1. Go to https://github.com/new
2. Repository name: `your-agent-name` (e.g., `sensie`, `gary`)
3. Make it **Public** (required for Vercel Deploy Button)
4. **Do NOT** initialize with README, .gitignore, or license (the sync will push everything)
5. Click **"Create repository"**

### 2. Generate SSH Deploy Key Pair

Run this on your local machine:

```bash
# Replace 'your-agent' with actual agent name
ssh-keygen -t ed25519 -C "your-agent-template-sync" -f your_agent_deploy_key -N ""
```

This creates two files:
- `your_agent_deploy_key` - Private key (goes to experiments repo)
- `your_agent_deploy_key.pub` - Public key (goes to destination repo)

### 3. Add Public Key to Destination Repository

1. Go to `https://github.com/vishesh-baghel/your-agent/settings/keys`
2. Click **"Add deploy key"**
3. Fill in:
   - **Title**: `experiments-sync` (or any descriptive name)
   - **Key**: Paste the entire contents of `your_agent_deploy_key.pub`
4. **Check "Allow write access"** (required for pushing)
5. Click **"Add key"**

### 4. Add Private Key to Experiments Repository

1. Go to https://github.com/vishesh-baghel/experiments/settings/secrets/actions
2. Click **"New repository secret"**
3. Fill in:
   - **Name**: `YOUR_AGENT_TEMPLATE_DEPLOY_KEY` (e.g., `SENSIE_TEMPLATE_DEPLOY_KEY`, `GARY_TEMPLATE_DEPLOY_KEY`)
   - **Value**: Paste the entire contents of `your_agent_deploy_key` (the private key)
     - Include the `-----BEGIN OPENSSH PRIVATE KEY-----` header
     - Include the `-----END OPENSSH PRIVATE KEY-----` footer
4. Click **"Add secret"**

### 5. Clean Up Local Key Files

After adding both keys to GitHub, delete the local files:

```bash
rm your_agent_deploy_key your_agent_deploy_key.pub
```

### 6. Update the Sync Workflow

Edit `.github/workflows/sync-templates.yml` to add your agent:

#### Add to paths trigger:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'packages/jack-x-agent/**'
      - 'packages/sensie/**'
      - 'packages/your-agent/**'  # Add this line
```

#### Add a new sync job:

```yaml
  sync-your-agent:
    runs-on: ubuntu-latest
    if: contains(toJSON(github.event.commits.*.modified), 'packages/your-agent') || contains(toJSON(github.event.commits.*.added), 'packages/your-agent')

    steps:
      - name: Checkout monorepo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Sync to template repo
        uses: cpina/github-action-push-to-another-repository@main
        env:
          SSH_DEPLOY_KEY: ${{ secrets.YOUR_AGENT_TEMPLATE_DEPLOY_KEY }}
        with:
          source-directory: 'packages/your-agent'
          destination-github-username: 'vishesh-baghel'
          destination-repository-name: 'your-agent'
          target-branch: main
          commit-message: 'sync: update from experiments monorepo'
```

### 7. Test the Sync

1. Make a small change to your agent package
2. Commit and push to main branch
3. Go to Actions tab in experiments repo
4. Verify the sync job runs and succeeds
5. Check the destination repo for the synced files

## Existing Agents

| Agent | Package Path | Destination Repo | Deploy Key Secret |
|-------|--------------|------------------|-------------------|
| Jack | `packages/jack-x-agent` | `vishesh-baghel/jack` | `JACK_TEMPLATE_DEPLOY_KEY` |
| Sensie | `packages/sensie` | `vishesh-baghel/sensie` | `SENSIE_TEMPLATE_DEPLOY_KEY` |
| Gary | `packages/gary` | `vishesh-baghel/gary` | `GARY_TEMPLATE_DEPLOY_KEY` |

## Troubleshooting

### Sync job not running
- Verify the package path is in the `paths` trigger
- Check that you pushed to the `main` branch
- Verify the commit actually modified files in the package directory

### Permission denied errors
- Verify the deploy key has "Allow write access" enabled
- Check that the private key in experiments repo matches the public key in destination
- Ensure the secret name matches exactly what's in the workflow

### Destination repo not updating
- Check the Actions tab for error messages
- Verify the destination repository exists and is public
- Ensure the branch name matches (default: `main`)

### Key format errors
- Make sure you copied the entire private key including headers
- Check for extra whitespace or newlines
- Regenerate the key pair if issues persist

## Security Notes

- Deploy keys are repository-specific (more secure than personal access tokens)
- Each destination repo needs its own unique deploy key
- Private keys are stored as encrypted secrets in GitHub
- Only the sync workflow can access the deploy key secrets

## Adding to Squad

After setting up syncing, add the agent to Squad's configuration:

1. Edit `packages/squad/src/config/agents.ts`
2. Add a new `AgentConfig` object (see existing agents for template)
3. Set `sourceRepo` to `https://github.com/vishesh-baghel/your-agent`
4. Set `status` to `"coming-soon"` initially, then `"available"` when ready

## Quick Reference: Commands

```bash
# Generate deploy key for new agent (run locally)
ssh-keygen -t ed25519 -C "AGENT_NAME-template-sync" -f AGENT_NAME_deploy_key -N ""

# View public key (to add to destination repo)
cat AGENT_NAME_deploy_key.pub

# View private key (to add to experiments repo secrets)
cat AGENT_NAME_deploy_key

# Clean up after adding to GitHub
rm AGENT_NAME_deploy_key AGENT_NAME_deploy_key.pub
```

Replace `AGENT_NAME` with your actual agent name (e.g., `sensie`, `gary`).
