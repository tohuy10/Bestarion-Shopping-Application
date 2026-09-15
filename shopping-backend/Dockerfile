# Stage 1: Build binary
FROM golang:alpine AS builder

ENV GOTOOLCHAIN=auto
WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api

# Stage 2: Minimal Runtime image
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS/SSL connections
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/api .
# Copy .env.example as default fallback if needed
COPY --from=builder /app/.env.example ./.env

EXPOSE 8080

CMD ["./api"]
