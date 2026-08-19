# ===========================================================================
# SpecPulse dev targets.
#
# NOTE: preview/src/App.tsx is a GENERATED artifact (written by `make build` /
# the desktop console) and preview/dist, desktop/dist are build outputs — all
# gitignored. The electron binary under desktop/node_modules may need the
# datapulse-copy workaround on slow networks (see README "Desktop console").
# ===========================================================================

.PHONY: install init build agent ci preview dev desktop desktop-ui desktop-dev export adjust typecheck test clean help

install: ## Root deps only (fast)
	npm install

init: ## Fresh-clone bootstrap: install root + preview + desktop deps
	npm install
	npm --prefix preview install
	npm --prefix desktop install

build: ## Generate a UI from natural language (e.g. make build Q="login page with a 3D hero")
	npm run build -- "$(Q)"

agent: ## Interactive CLI loop — keeps regenerating against the same preview
	npm run agent

ci: ## Offline pipeline smoke test (no LLM): fixture spec -> preview/src/App.tsx
	npm run ci

export: ## Export a generated record to a production-ready single-file HTML + zip (make export ID="<record id>")
	npm run export -- "$(ID)"

adjust: ## Incrementally adjust an existing record (make adjust ID="<record id>" Q="<change request>")
	npm run adjust -- "$(ID)" "$(Q)"

preview: ## Browser preview dev server (:5173) for the generated UI
	npm run preview

dev: ## Build + launch the Electron 操作台 (detached; close the window to quit)
	@node scripts/kill-dev.mjs
	@npm --prefix desktop run typecheck
	@npm --prefix desktop run build
	@nohup ./desktop/node_modules/.bin/electron desktop >/tmp/specpulse-desktop.log 2>&1 &
	@sleep 1
	@echo "[dev] 操作台已启动 — logs: /tmp/specpulse-desktop.log"
	@echo "[dev] 关闭窗口即退出；再次启动前自动清理残留进程"

desktop: dev ## Alias of `make dev`
	@true

desktop-ui: ## Console vite dev server (:5277) — run before `make desktop-dev`
	npm --prefix desktop run dev

desktop-dev: ## Electron dev mode (HMR console): needs `make desktop-ui` running
	npm run desktop:dev

typecheck: ## TypeScript check (root + preview + desktop)
	npm run typecheck

test: ## Run the test suite (node:test + tsx, no network)
	npm run test

clean: ## Remove build outputs
	rm -rf dist preview/dist desktop/dist preview/src/App.tsx

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
