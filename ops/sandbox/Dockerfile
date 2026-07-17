FROM node:22.23.1-alpine3.24@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2

LABEL org.opencontainers.image.title="AI Delivery Workbench synthetic sandbox runtime" \
      org.opencontainers.image.description="Minimal Node runtime for the repository-owned toy validation slice" \
      org.opencontainers.image.licenses="MIT"

# The fixed toy-repository checks invoke node directly. Removing npm eliminates
# an unused package-manager dependency tree from the execution image.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
    && test ! -e /usr/local/bin/npm \
    && test ! -e /usr/local/bin/npx

USER 65532:65532
