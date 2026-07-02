FROM rust:1.75-slim as builder

WORKDIR /usr/src/risk_scorer

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy main to cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY src ./src

# Build for release
RUN touch src/main.rs && \
    cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /usr/src/risk_scorer/target/release/risk_scorer /app/risk_scorer

# Expose port
EXPOSE 8001

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8001
ENV RUST_LOG=info

# Run the binary
CMD ["/app/risk_scorer"]
