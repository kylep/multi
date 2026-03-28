/** Terminal interface for browser-based text game. */

export interface Choice {
  label: string;
  value: string;
}

export interface Span {
  text: string;
  css?: string;
}

export interface Terminal {
  print(text: string, cssClass?: string): void;
  printLine(spans: Span[]): void;
  clear(): void;
  promptText(prompt: string): Promise<string>;
  promptChoice(prompt: string, choices: Choice[]): Promise<string>;
  promptContinue(seconds?: number): Promise<void>;
}

export function createDomTerminal(root: HTMLElement): Terminal {
  const output = document.createElement("div");
  output.className = "terminal-output";
  output.setAttribute("data-testid", "terminal-output");
  root.appendChild(output);

  function scrollToBottom(): void {
    // Scroll both the output div and the window
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

        output.appendChild(wrapper);
        input.focus();

        // Refocus on any keypress if input lost focus
        const refocus = (e: KeyboardEvent) => {
          if (document.activeElement !== input && e.key.length === 1) {
            input.focus();
          }
        };
        document.addEventListener("keydown", refocus);

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            document.removeEventListener("keydown", refocus);
            const value = input.value;
            // Replace input with echoed text
            wrapper.remove();
            terminal.print(`${prompt}${value}`);
            resolve(value);
          }
        });

        scrollToBottom();
      });
    },

    promptChoice(prompt: string, choices: Choice[]): Promise<string> {
      return new Promise((resolve) => {
        if (prompt) terminal.print(prompt);

        const list = document.createElement("div");
        list.className = "terminal-choice-list";
        list.setAttribute("data-testid", "choice-prompt");

        let selectedIndex = 0;

        const items: HTMLDivElement[] = [];
        for (let i = 0; i < choices.length; i++) {
          const item = document.createElement("div");
          item.className = "terminal-choice-item";
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
            // Show > marker for selected item
            const choice = choices[i];
            if (i === selectedIndex) {
              items[i].textContent = `> ${choice.label}`;
            } else {
              items[i].textContent = `  ${choice.label}`;
            }
          }
          // Scroll selected item into view
          items[selectedIndex]?.scrollIntoView({ block: "nearest" });
        }

        function confirm(): void {
          document.removeEventListener("keydown", onKey);
          const selected = choices[selectedIndex];
          // Freeze the list as history (remove interactivity)
          for (const item of items) {
            item.style.cursor = "default";
            item.replaceWith(item.cloneNode(true));
          }
          resolve(selected.value);
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

        // Defer to avoid Enter keyup from prior prompt
        requestAnimationFrame(() => {
          updateSelection();
          document.addEventListener("keydown", onKey);
        });

        scrollToBottom();
      });
    },

    promptContinue(seconds = 5): Promise<void> {
      return new Promise((resolve) => {
        const btn = document.createElement("div");
        btn.className = "terminal-continue";
        btn.setAttribute("data-testid", "choice-continue");
        let remaining = seconds;
        btn.textContent = `[Continue ${remaining}]`;

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

        const timer = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            done();
          } else {
            btn.textContent = `[Continue ${remaining}]`;
          }
        }, 1000);

        function onKey(e: KeyboardEvent): void {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            done();
          }
        }

        // Defer to avoid Enter from prior action
        requestAnimationFrame(() => {
          document.addEventListener("keydown", onKey);
        });

        btn.addEventListener("click", done);
      });
    },
  };

  return terminal;
}
