/** Terminal interface for browser-based text game. */

export interface Choice {
  label: string;
  value: string;
  subtitle?: string;
  disabled?: boolean;
  group?: string;
  active?: boolean;
  badge?: string;
  badgeClass?: string;
  btnClass?: string;
  labelClass?: string;
}

export interface Span {
  text: string;
  css?: string;
}

export type ChoiceLayout = "list" | "grid" | "row";

export interface Terminal {
  print(text: string, cssClass?: string): void;
  printLine(spans: Span[]): void;
  printHTML(html: string): void;
  clear(): void;
  promptText(prompt: string): Promise<string>;
  promptChoice(prompt: string, choices: Choice[], layout?: ChoiceLayout, contentHTML?: string): Promise<string>;
  promptContinue(seconds?: number): Promise<void>;
  promptConfirm(message: string, confirmLabel?: string, cancelLabel?: string): Promise<boolean>;
}

export function createDomTerminal(root: HTMLElement): Terminal {
  const output = document.createElement("div");
  output.className = "terminal-output";
  output.setAttribute("data-testid", "terminal-output");
  root.appendChild(output);

  function scrollToBottom(): void {
    output.scrollTop = output.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  }

  const terminal: Terminal = {
    print(text: string, cssClass?: string): void {
      const line = document.createElement("div");
      if (cssClass) line.className = cssClass;
      line.textContent = text;
      output.appendChild(line);
      scrollToBottom();
    },

    printLine(spans: Span[]): void {
      const line = document.createElement("div");
      for (const span of spans) {
        const el = document.createElement("span");
        if (span.css) el.className = span.css;
        el.textContent = span.text;
        line.appendChild(el);
      }
      output.appendChild(line);
      scrollToBottom();
    },

    printHTML(html: string): void {
      const div = document.createElement("div");
      div.innerHTML = html; // nosemgrep: javascript.browser.security.insecure-document-method.insecure-document-method
      output.appendChild(div);
      scrollToBottom();
    },

    clear(): void {
      output.innerHTML = "";
    },

    promptText(prompt: string): Promise<string> {
      return new Promise((resolve) => {
        const wrapper = document.createElement("div");
        wrapper.className = "terminal-input-line";
        wrapper.setAttribute("data-testid", "text-prompt");

        const label = document.createElement("span");
        label.className = "terminal-prompt";
        label.textContent = prompt;
        wrapper.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.className = "terminal-input";
        input.setAttribute("data-testid", "text-input");
        wrapper.appendChild(input);

        const submitBtn = document.createElement("div");
        submitBtn.className = "btn";
        submitBtn.setAttribute("data-testid", "text-submit");
        submitBtn.textContent = "Enter";
        wrapper.appendChild(submitBtn);

        output.appendChild(wrapper);
        input.focus();

        const refocus = (e: KeyboardEvent) => {
          if (document.activeElement !== input && e.key.length === 1) {
            input.focus();
          }
        };
        document.addEventListener("keydown", refocus);

        function submit(): void {
          document.removeEventListener("keydown", refocus);
          const value = input.value;
          wrapper.remove();
          terminal.print(`${prompt}${value}`);
          resolve(value);
        }

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        });

        submitBtn.addEventListener("click", submit);

        scrollToBottom();
      });
    },

    promptChoice(prompt: string, choices: Choice[], layout: ChoiceLayout = "list", contentHTML?: string): Promise<string> {
      return new Promise((resolve) => {
        if (prompt) terminal.print(prompt);

        let selectedIndex = 0;
        // Skip disabled items for initial selection
        while (selectedIndex < choices.length && choices[selectedIndex].disabled) {
          selectedIndex++;
        }
        if (selectedIndex >= choices.length) selectedIndex = 0;

        if (layout === "grid") {
          // ── Grid layout: 2-column card grid, with optional tab bar ──
          const hasTabs = choices.some((c) => c.group === "tab");
          const wrapper = document.createElement("div");
          wrapper.setAttribute("data-testid", "choice-prompt");

          let tabBar: HTMLDivElement | null = null;
          if (hasTabs) {
            tabBar = document.createElement("div");
            tabBar.className = "tab-bar";
            wrapper.appendChild(tabBar);
          }

          if (contentHTML) {
            const content = document.createElement("div");
            content.innerHTML = contentHTML; // nosemgrep: javascript.browser.security.insecure-document-method.insecure-document-method
            wrapper.appendChild(content);
          }

          const grid = document.createElement("div");
          grid.className = "card-grid";
          wrapper.appendChild(grid);

          const cards: HTMLDivElement[] = [];
          for (let i = 0; i < choices.length; i++) {
            const isTab = choices[i].group === "tab";

            if (isTab) {
              const tab = document.createElement("div");
              const isBack = choices[i].value === "back";
              const isFilter = choices[i].value === "toggle-filter";
              let tabClass = "tab";
              if (choices[i].active) tabClass += " tab-active";
              if (isBack) tabClass += " tab-back";
              if (isFilter) tabClass += " tab-filter";
              tab.className = tabClass;
              tab.setAttribute("data-testid", `choice-${choices[i].value}`);
              tab.textContent = choices[i].label;

              tab.addEventListener("click", () => {
                selectedIndex = i;
                updateSelection();
                confirm();
              });

              tabBar!.appendChild(tab);
              cards.push(tab);
            } else {
              const card = document.createElement("div");
              const isBack = choices[i].value === "back" || choices[i].value === "quit";
              const isHeader = choices[i].group === "header";
              let cardClass = isHeader ? "card card-header" : "card";
              if (choices[i].disabled && !isHeader) cardClass += " disabled";
              if (isBack) cardClass += " card-back";
              card.className = cardClass;
              card.setAttribute("data-testid", `choice-${choices[i].value}`);

              const title = document.createElement("div");
              title.className = choices[i].labelClass ? `card-title ${choices[i].labelClass}` : "card-title";
              title.textContent = choices[i].label;
              card.appendChild(title);

              if (choices[i].subtitle) {
                const sub = document.createElement("div");
                sub.className = "card-subtitle";
                sub.textContent = choices[i].subtitle!;
                card.appendChild(sub);
              }

              if (choices[i].badge) {
                const badgeEl = document.createElement("div");
                badgeEl.className = `card-badge ${choices[i].badgeClass || ""}`;
                badgeEl.textContent = choices[i].badge!;
                card.appendChild(badgeEl);
                card.style.position = "relative";
              }

              if (!choices[i].disabled) {
                card.addEventListener("click", () => {
                  selectedIndex = i;
                  updateSelection();
                  confirm();
                });
              }

              grid.appendChild(card);
              cards.push(card);
            }
          }

          // Hide grid if it has no content children
          if (grid.children.length === 0) grid.style.display = "none";

          output.appendChild(wrapper);

          function updateSelection(): void {
            for (let i = 0; i < cards.length; i++) {
              if (choices[i].disabled) continue;
              cards[i].classList.toggle("selected", i === selectedIndex);
            }
          }

          function confirm(): void {
            document.removeEventListener("keydown", onKey);
            resolve(choices[selectedIndex].value);
            scrollToBottom();
          }

          function onKey(e: KeyboardEvent): void {
            const cols = 2;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              let next = selectedIndex;
              const step = e.key === "ArrowDown" ? cols : 1;
              for (let tries = 0; tries < choices.length; tries++) {
                next = (next + step) % choices.length;
                if (!choices[next].disabled) { selectedIndex = next; break; }
              }
              updateSelection();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              let next = selectedIndex;
              const step = e.key === "ArrowUp" ? cols : 1;
              for (let tries = 0; tries < choices.length; tries++) {
                next = (next - step + choices.length) % choices.length;
                if (!choices[next].disabled) { selectedIndex = next; break; }
              }
              updateSelection();
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (!choices[selectedIndex].disabled) confirm();
            } else if (e.key === "Escape") {
              const backIdx = choices.findIndex((c) => c.value === "back");
              if (backIdx !== -1) { selectedIndex = backIdx; confirm(); }
            } else if (e.key >= "1" && e.key <= "9") {
              const num = parseInt(e.key, 10) - 1;
              if (num < choices.length && !choices[num].disabled) {
                selectedIndex = num;
                updateSelection();
                confirm();
              }
            }
          }

          requestAnimationFrame(() => {
            updateSelection();
            document.addEventListener("keydown", onKey);
          });

          wrapper.scrollIntoView({ block: "start", behavior: "instant" });

        } else if (layout === "row") {
          // ── Row layout: horizontal buttons ──
          const row = document.createElement("div");
          row.className = "button-row";
          row.setAttribute("data-testid", "choice-prompt");

          const btns: HTMLDivElement[] = [];
          for (let i = 0; i < choices.length; i++) {
            const btn = document.createElement("div");
            const isBack = choices[i].value === "back";
            const isFirst = i === 0;
            let cls = "btn";
            if (choices[i].btnClass !== undefined) cls += choices[i].btnClass ? ` ${choices[i].btnClass}` : "";
            else if (isBack) cls += " btn-secondary";
            else if (isFirst) cls += " btn-primary";
            btn.className = cls;
            btn.setAttribute("data-testid", `choice-${choices[i].value}`);
            btn.textContent = choices[i].label;

            btn.addEventListener("click", () => {
              selectedIndex = i;
              confirm();
            });

            row.appendChild(btn);
            btns.push(btn);
          }

          output.appendChild(row);

          function updateSelection(): void {
            for (let i = 0; i < btns.length; i++) {
              btns[i].classList.toggle("selected", i === selectedIndex);
            }
          }

          function confirm(): void {
            document.removeEventListener("keydown", onKey);
            resolve(choices[selectedIndex].value);
            scrollToBottom();
          }

          function onKey(e: KeyboardEvent): void {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
              e.preventDefault();
              selectedIndex = (selectedIndex + 1) % choices.length;
              updateSelection();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
              e.preventDefault();
              selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
              updateSelection();
            } else if (e.key === "Enter") {
              e.preventDefault();
              confirm();
            } else if (e.key === "Escape") {
              const backIdx = choices.findIndex((c) => c.value === "back");
              if (backIdx !== -1) { selectedIndex = backIdx; confirm(); }
            } else if (e.key >= "1" && e.key <= "9") {
              const num = parseInt(e.key, 10) - 1;
              if (num < choices.length) {
                selectedIndex = num;
                confirm();
              }
            }
          }

          requestAnimationFrame(() => {
            updateSelection();
            document.addEventListener("keydown", onKey);
          });

          scrollToBottom();

        } else {
          // ── List layout: vertical inline (current behavior) ──
          const list = document.createElement("div");
          list.className = "terminal-choice-list";
          list.setAttribute("data-testid", "choice-prompt");

          const items: HTMLDivElement[] = [];
          for (let i = 0; i < choices.length; i++) {
            const item = document.createElement("div");
            const isBack = choices[i].value === "back";
            item.className = isBack ? "terminal-choice-item terminal-choice-back" : "terminal-choice-item";
            item.setAttribute("data-testid", `choice-${choices[i].value}`);
            item.textContent = choices[i].label;

            item.addEventListener("click", () => {
              selectedIndex = i;
              updateSelection();
              confirm();
            });

            list.appendChild(item);
            items.push(item);
          }

          output.appendChild(list);

          function updateSelection(): void {
            for (let i = 0; i < items.length; i++) {
              items[i].classList.toggle("selected", i === selectedIndex);
              const choice = choices[i];
              if (i === selectedIndex) {
                items[i].textContent = `> ${choice.label}`;
              } else {
                items[i].textContent = `  ${choice.label}`;
              }
            }
            items[selectedIndex]?.scrollIntoView({ block: "nearest" });
          }

          function confirm(): void {
            document.removeEventListener("keydown", onKey);
            for (const item of items) {
              item.style.cursor = "default";
              item.replaceWith(item.cloneNode(true));
            }
            resolve(choices[selectedIndex].value);
            scrollToBottom();
          }

          function onKey(e: KeyboardEvent): void {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              selectedIndex = (selectedIndex + 1) % choices.length;
              updateSelection();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
              updateSelection();
            } else if (e.key === "Enter") {
              e.preventDefault();
              confirm();
            } else if (e.key === "Escape") {
              const backIdx = choices.findIndex((c) => c.value === "back");
              if (backIdx !== -1) {
                selectedIndex = backIdx;
                updateSelection();
                confirm();
              }
            } else if (e.key >= "1" && e.key <= "9") {
              const num = parseInt(e.key, 10) - 1;
              if (num < choices.length) {
                selectedIndex = num;
                updateSelection();
                confirm();
              }
            }
          }

          requestAnimationFrame(() => {
            updateSelection();
            document.addEventListener("keydown", onKey);
          });

          scrollToBottom();
        }
      });
    },

    promptContinue(seconds = 5): Promise<void> {
      return new Promise((resolve) => {
        const btn = document.createElement("div");
        btn.className = "terminal-continue";
        btn.setAttribute("data-testid", "choice-continue");
        let remaining = seconds;
        btn.textContent = seconds > 0 ? `[Continue ${remaining}]` : "[Continue]";

        output.appendChild(btn);
        scrollToBottom();

        let resolved = false;

        function done(): void {
          if (resolved) return;
          resolved = true;
          clearInterval(timer);
          document.removeEventListener("keydown", onKey);
          btn.textContent = "[Continue]";
          btn.style.cursor = "default";
          resolve();
        }

        const timer = seconds > 0 ? setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            done();
          } else {
            btn.textContent = `[Continue ${remaining}]`;
          }
        }, 1000) : 0;

        function onKey(e: KeyboardEvent): void {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            done();
          }
        }

        requestAnimationFrame(() => {
          document.addEventListener("keydown", onKey);
        });

        btn.addEventListener("click", done);
      });
    },

    promptConfirm(
      message: string,
      confirmLabel = "Buy",
      cancelLabel = "Cancel",
    ): Promise<boolean> {
      return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "terminal-modal-overlay";

        const modal = document.createElement("div");
        modal.className = "terminal-modal";

        const msg = document.createElement("div");
        msg.className = "terminal-modal-message";
        msg.textContent = message;
        modal.appendChild(msg);

        const buttons = document.createElement("div");
        buttons.className = "terminal-modal-buttons";

        let selectedIdx = 0;
        const opts = [
          { label: confirmLabel, value: true },
          { label: cancelLabel, value: false },
        ];

        const btnEls: HTMLDivElement[] = [];
        for (let i = 0; i < opts.length; i++) {
          const b = document.createElement("div");
          b.className = "terminal-modal-btn";
          b.setAttribute("data-testid", `confirm-${opts[i].value}`);
          b.textContent = opts[i].label;
          b.addEventListener("click", () => {
            finish(opts[i].value);
          });
          buttons.appendChild(b);
          btnEls.push(b);
        }

        modal.appendChild(buttons);
        overlay.appendChild(modal);
        root.appendChild(overlay);

        function updateSelection(): void {
          for (let i = 0; i < btnEls.length; i++) {
            btnEls[i].classList.toggle("selected", i === selectedIdx);
          }
        }

        function finish(value: boolean): void {
          document.removeEventListener("keydown", onKey);
          overlay.remove();
          resolve(value);
        }

        function onKey(e: KeyboardEvent): void {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            selectedIdx = selectedIdx === 0 ? 1 : 0;
            updateSelection();
          } else if (e.key === "Enter") {
            e.preventDefault();
            finish(opts[selectedIdx].value);
          } else if (e.key === "Escape") {
            e.preventDefault();
            finish(false);
          }
        }

        requestAnimationFrame(() => {
          updateSelection();
          document.addEventListener("keydown", onKey);
        });
      });
    },
  };

  return terminal;
}
