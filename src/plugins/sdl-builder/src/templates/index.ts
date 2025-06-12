import { SDLTemplate } from "../types.js";

export const WEB_TEMPLATES = {
  basic: `---
version: "2.0"
services:
  web:
    image: nginx:latest
    expose:
      - port: 80
        as: 80
        to:
          - global: true
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 125000
deployment:
  web:
    dcloud:
      profile: web
      count: 1`,

  intermediate: `---
version: "2.0"
services:
  web:
    image: node:18-alpine
    env:
      - NODE_ENV=production
      - PORT=3000
    expose:
      - port: 3000
        as: 3000
        to:
          - global: true
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 2Gi
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 135000
        redis:
          denom: uakt
          amount: 125000
deployment:
  web:
    dcloud:
      profile: web
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1`,

  advanced: `---
version: "2.0"
services:
  web:
    image: nginx:alpine
    expose:
      - port: 80
        as: 80
        to:
          - global: true
  app:
    image: node:18-alpine
    env:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/app
    depends_on:
      - redis
      - postgres
    expose:
      - port: 3000
        as: 3000
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
  postgres:
    image: postgres:15-alpine
    env:
      - POSTGRES_DB=app
      - POSTGRES_PASSWORD=password
    expose:
      - port: 5432
        as: 5432
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 2Gi
    app:
      resources:
        cpu:
          units: 2
        memory:
          size: 2Gi
        storage:
          - size: 5Gi
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
    postgres:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 10Gi
  placement:
    dcloud:
      pricing:
        web:
          denom: uakt
          amount: 145000
        app:
          denom: uakt
          amount: 165000
        redis:
          denom: uakt
          amount: 120000
        postgres:
          denom: uakt
          amount: 130000
deployment:
  web:
    dcloud:
      profile: web
      count: 1
  app:
    dcloud:
      profile: app
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1
  postgres:
    dcloud:
      profile: postgres
      count: 1`
};

export const AI_TEMPLATES = {
  basic: `---
version: "2.0"
services:
  ai-model:
    image: pytorch/pytorch:latest
    expose:
      - port: 8000
        as: 8000
        to:
          - global: true
profiles:
  compute:
    ai-model:
      resources:
        cpu:
          units: 2
        memory:
          size: 4Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
        storage:
          - size: 20Gi
  placement:
    dcloud:
      pricing:
        ai-model:
          denom: uakt
          amount: 175000
deployment:
  ai-model:
    dcloud:
      profile: ai-model
      count: 1`,

  intermediate: `---
version: "2.0"
services:
  ai-model:
    image: pytorch/pytorch:latest
    env:
      - HUGGINGFACE_HUB_CACHE=/cache
      - TRANSFORMERS_CACHE=/cache
    expose:
      - port: 8000
        as: 8000
        to:
          - global: true
profiles:
  compute:
    ai-model:
      resources:
        cpu:
          units: 4
        memory:
          size: 8Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
                - model: a6000
                  ram: 48Gi
                  interface: pcie
        storage:
          - size: 50Gi
  placement:
    dcloud:
      pricing:
        ai-model:
          denom: uakt
          amount: 155000
deployment:
  ai-model:
    dcloud:
      profile: ai-model
      count: 1`,

  advanced: `---
version: "2.0"
services:
  ai-model:
    image: pytorch/pytorch:latest
    env:
      - HUGGINGFACE_HUB_CACHE=/cache
      - TRANSFORMERS_CACHE=/cache
      - CUDA_VISIBLE_DEVICES=0,1
    expose:
      - port: 8000
        as: 8000
        to:
          - global: true
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
profiles:
  compute:
    ai-model:
      resources:
        cpu:
          units: 8
        memory:
          size: 16Gi
        gpu:
          units: 2
          attributes:
            vendor:
              nvidia:
                - model: a100
                  ram: 80Gi
                  interface: pcie
                - model: h100
                  ram: 80Gi
                  interface: pcie
        storage:
          - size: 100Gi
    redis:
      resources:
        cpu:
          units: 1
        memory:
          size: 1Gi
        storage:
          - size: 2Gi
  placement:
    dcloud:
      pricing:
        ai-model:
          denom: uakt
          amount: 170000
        redis:
          denom: uakt
          amount: 115000
deployment:
  ai-model:
    dcloud:
      profile: ai-model
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1`
};

export const BLOCKCHAIN_TEMPLATES = {
  basic: `---
version: "2.0"
services:
  blockchain-node:
    image: ethereum/client-go:latest
    expose:
      - port: 8545
        as: 8545
        to:
          - global: true
      - port: 30303
        as: 30303
        to:
          - global: true
profiles:
  compute:
    blockchain-node:
      resources:
        cpu:
          units: 2
        memory:
          size: 8Gi
        storage:
          - size: 100Gi
  placement:
    dcloud:
      pricing:
        blockchain-node:
          denom: uakt
          amount: 150000
deployment:
  blockchain-node:
    dcloud:
      profile: blockchain-node
      count: 1`,

  intermediate: `---
version: "2.0"
services:
  eliza-agent:
    image: fenildocker/eliza-starter
    expose:
      - port: 30303
        as: 30303
        to:
          - global: true
      - port: 8545
        as: 8545
        to:
          - global: true
profiles:
  compute:
    eliza-agent:
      resources:
        cpu:
          units: 4
        memory:
          size: 16Gi
        storage:
          - size: 50Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
  placement:
    dcloud:
      pricing:
        eliza-agent:
          denom: uakt
          amount: 140000
deployment:
  eliza-agent:
    dcloud:
      profile: eliza-agent
      count: 1`,

  advanced: `---
version: "2.0"
services:
  eliza-agent:
    image: fenildocker/eliza-starter
    env:
      - NODE_ENV=production
      - DISCORD_TOKEN=your_discord_token
      - OPENAI_API_KEY=your_openai_key
    expose:
      - port: 30303
        as: 30303
        to:
          - global: true
      - port: 8545
        as: 8545
        to:
          - global: true
      - port: 3000
        as: 3000
        to:
          - global: true
  redis:
    image: redis:alpine
    expose:
      - port: 6379
        as: 6379
  postgres:
    image: postgres:15-alpine
    env:
      - POSTGRES_DB=eliza
      - POSTGRES_PASSWORD=password
    expose:
      - port: 5432
        as: 5432
profiles:
  compute:
    eliza-agent:
      resources:
        cpu:
          units: 4
        memory:
          size: 16Gi
        storage:
          - size: 100Gi
        gpu:
          units: 1
          attributes:
            vendor:
              nvidia:
                - model: rtx4090
                  ram: 24Gi
                  interface: pcie
    redis:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          - size: 1Gi
    postgres:
      resources:
        cpu:
          units: 1
        memory:
          size: 2Gi
        storage:
          - size: 20Gi
  placement:
    dcloud:
      pricing:
        eliza-agent:
          denom: uakt
          amount: 160000
        redis:
          denom: uakt
          amount: 110000
        postgres:
          denom: uakt
          amount: 125000
deployment:
  eliza-agent:
    dcloud:
      profile: eliza-agent
      count: 1
  redis:
    dcloud:
      profile: redis
      count: 1
  postgres:
    dcloud:
      profile: postgres
      count: 1`
};

export const getAllTemplates = () => ({
  web: WEB_TEMPLATES,
  ai: AI_TEMPLATES,
  blockchain: BLOCKCHAIN_TEMPLATES,
});
