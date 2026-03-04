#!/bin/bash
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get -y install --no-install-recommends build-essential pkg-config libssl-dev

curl -L --proto '=https' --tlsv1.2 -sSf \
  https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh \
  | bash
cargo binstall cargo-nextest --secure

# Match repo rust-toolchain.toml targets for cross-compilation workflows.
rustup target add x86_64-pc-windows-msvc
rustup target add x86_64-unknown-linux-gnu
rustup target add aarch64-apple-darwin
