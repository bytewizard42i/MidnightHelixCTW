SHELL := /usr/bin/env bash
.SHELLFLAGS := -euo pipefail -c

.PHONY: build-ApiFunction

build-ApiFunction:
	@staging_directory="$$(mktemp -d)"; \
	trap 'rm -rf -- "$$staging_directory"' EXIT; \
	mkdir -p \
	  "$$staging_directory/apps/api" \
	  "$$staging_directory/apps/web" \
	  "$$staging_directory/packages/mock-pillars" \
	  "$$staging_directory/packages/protocol-types"; \
	cp package.json package-lock.json "$$staging_directory/"; \
	cp apps/api/package.json "$$staging_directory/apps/api/"; \
	cp apps/web/package.json "$$staging_directory/apps/web/"; \
	cp packages/mock-pillars/package.json "$$staging_directory/packages/mock-pillars/"; \
	cp packages/protocol-types/package.json "$$staging_directory/packages/protocol-types/"; \
	( \
	  cd "$$staging_directory"; \
	  npm ci \
	    --omit=dev \
	    --ignore-scripts \
	    --workspace @mhelix/api \
	    --include-workspace-root=false \
	); \
	mkdir -p "$(ARTIFACTS_DIR)/src" "$(ARTIFACTS_DIR)/node_modules"; \
	cp apps/api/package.json apps/api/README.md package-lock.json "$(ARTIFACTS_DIR)/"; \
	cp -R apps/api/src/. "$(ARTIFACTS_DIR)/src/"; \
	find "$$staging_directory/node_modules" \
	  -mindepth 1 \
	  -maxdepth 1 \
	  ! -name '@mhelix' \
	  -exec cp -R -- '{}' "$(ARTIFACTS_DIR)/node_modules/" \;
