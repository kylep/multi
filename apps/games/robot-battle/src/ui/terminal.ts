/** Terminal interface for browser-based text game. */

export interface Choice {
  label: string;
  value: string;
}

export interface Terminal {
  print(text: string, cssClass?: string): void;
  clear(): void;
  promptText(prompt: string): Promise<string>;
  promptChoice(prompt: string, choices: Choice[]): Promise<string>;
}

export function createDomTerminal(root: HTMLElement): Terminal {
  // Create output area
  const output = document.createElement("div");
  output.className = "terminal-output";
  output.setAttribute("data-testid", "terminal-output");
  root.appendChild(output);

  // Placeholder for input area (swapped per prompt)
  let inputArea: HTMLElement | null = null;

  function removeInputArea(): void {
    if (inputArea) {
      inputArea.remove();
      inputArea = null;
    }
  }

  function scrollToBottom(): void {
    output.scrollTop = output.scrollHeight;
  }

  const terminal: Terminal = {
    print(text: string, cssClass?: string): void {
      const line = document.createElement("div");
      if (cssClass) {
        line.className = cssClass;
      }
      line.textContent = text;
      output.appendChild(line);
      scrollToBottom();
    },

    clear(): void {
      output.innerHTML = "";
    },

    promptText(prompt: string): Promise<string> {
      return new Promise((resolve) => {
        removeInputArea();

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

        root.appendChild(wrapper);
        inputArea = wrapper;
        input.focus();

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const value = input.value;
            // Echo the prompt + answer into output
            terminal.print(`${prompt}${value}`);
            removeInputArea();
            resolve(value);
          }
        });
      });
    },

    promptChoice(prompt: string, choices: Choice[]): Promise<string> {
      return new Promise((resolve) => {
        removeInputArea();

        // Print the prompt text
        if (prompt) {
          terminal.print(prompt);
        }

        const wrapper = document.createElement("div");
        wrapper.className = "terminal-choices";
        wrapper.setAttribute("data-testid", "choice-prompt");

        for (const choice of choices) {
          const btn = document.createElement("button");
          btn.className = "terminal-choice";
          btn.textContent = choice.label;
          btn.setAttribute("data-testid", `choice-${choice.value}`);
          btn.addEventListener("click", () => {
            terminal.print(`> ${choice.label}`);
            removeInputArea();
            resolve(choice.value);
          });
          wrapper.appendChild(btn);
        }

        root.appendChild(wrapper);
        inputArea = wrapper;

        // Focus first button for keyboard nav (defer to avoid Enter keyup from prior input)
        requestAnimationFrame(() => {
          const firstBtn = wrapper.querySelector("button");
          if (firstBtn) firstBtn.focus();
        });
      });
    },
  };

  return terminal;
}
