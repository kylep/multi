/** Bank screen — deposit/withdraw money, earn interest. */

import type { Terminal } from "../terminal";
import type { GameState } from "../../engine/state";
import { depositMoney, withdrawMoney, calculateInterest, getInterestRate } from "../../engine/state";

export async function bankScreen(terminal: Terminal, state: GameState): Promise<void> {
  const player = state.player!;

  while (true) {
    terminal.clear();

    const interest = calculateInterest(player);
    terminal.printHTML(
      `<div class="panel-header"><span class="t-yellow t-bold">BANK</span></div>`
    );
    terminal.printHTML(`
      <div class="panel" style="padding:12px 16px">
        <div><span class="t-yellow">Cash on hand:</span> <span class="t-green t-bold">$${player.money.toLocaleString()}</span></div>
        <div><span class="t-yellow">Bank balance:</span> <span class="t-cyan t-bold">$${player.bank.toLocaleString()}</span></div>
        <div style="margin-top:8px" class="t-dim">Interest rate: ${getInterestRate(player)}% per fight = <span class="t-green">$${interest.toLocaleString()}</span>/fight</div>
      </div>
    `);

    const choice = await terminal.promptChoice("", [
      { label: "Deposit", value: "deposit", subtitle: "Put money in the bank" },
      { label: "Withdraw", value: "withdraw", subtitle: "Take money out" },
      { label: "Back", value: "back", subtitle: "Return to menu" },
    ], "row");

    if (choice === "back") return;

    if (choice === "deposit") {
      if (player.money <= 0) {
        terminal.print("You have no money to deposit!", "t-red");
        await terminal.promptContinue(0);
        continue;
      }
      await amountPrompt(terminal, player.money, "Deposit", (amount) => {
        depositMoney(player, amount);
      });
    } else if (choice === "withdraw") {
      if (player.bank <= 0) {
        terminal.print("Your bank is empty!", "t-red");
        await terminal.promptContinue(0);
        continue;
      }
      await amountPrompt(terminal, player.bank, "Withdraw", (amount) => {
        withdrawMoney(player, amount);
      });
    }
  }
}

async function amountPrompt(
  terminal: Terminal,
  maxAmount: number,
  action: string,
  execute: (amount: number) => void,
): Promise<void> {
  const presets = [
    { label: "10%", value: Math.floor(maxAmount * 0.1) },
    { label: "25%", value: Math.floor(maxAmount * 0.25) },
    { label: "50%", value: Math.floor(maxAmount * 0.5) },
    { label: "All", value: maxAmount },
  ].filter((p) => p.value > 0);

  const choices = presets.map((p) => ({
    label: `${p.label} ($${p.value.toLocaleString()})`,
    value: String(p.value),
  }));
  choices.push({ label: "Custom", value: "custom" });
  choices.push({ label: "Cancel", value: "cancel" });

  const choice = await terminal.promptChoice(`${action} how much?`, choices, "row");

  if (choice === "cancel") return;

  let amount: number;
  if (choice === "custom") {
    const input = await terminal.promptText(`${action} amount (max $${maxAmount.toLocaleString()}):`);
    amount = parseInt(input, 10);
    if (isNaN(amount) || amount <= 0) {
      terminal.print("Invalid amount!", "t-red");
      await terminal.promptContinue(0);
      return;
    }
    if (amount > maxAmount) amount = maxAmount;
  } else {
    amount = parseInt(choice, 10);
  }

  execute(amount);
  terminal.clear();
  terminal.print(`${action === "Withdraw" ? "Withdrew" : "Deposited"} $${amount.toLocaleString()}!`, "t-green");
  await terminal.promptContinue(0);
}
