FROM golang:1.24-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o agent-controller .

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
RUN addgroup -S controller && adduser -S controller -G controller -u 1000

COPY --from=builder /build/agent-controller /usr/local/bin/agent-controller

USER controller
ENTRYPOINT ["agent-controller"]
