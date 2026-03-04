FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

ARG USERNAME=node

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
  && rm -rf /var/lib/apt/lists/*

USER ${USERNAME}

RUN curl -fsSL https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable

ENV PATH="/home/${USERNAME}/.cargo/bin:${PATH}"

RUN corepack enable \
  && corepack prepare pnpm@8.15.0 --activate
