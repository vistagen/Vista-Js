#!/bin/bash
set -euxo pipefail

corepack enable pnpm
corepack prepare pnpm@8.15.0 --activate
