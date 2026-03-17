package discord

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Notifier posts messages to a Discord channel via the bot API.
type Notifier struct {
	botToken  string
	channelID string
	client    *http.Client
}

// New creates a Notifier. If botToken or channelID is empty, all methods are no-ops.
func New(botToken, channelID string) *Notifier {
	return &Notifier{
		botToken:  botToken,
		channelID: channelID,
		client:    &http.Client{Timeout: 10 * time.Second},
	}
}

// Enabled returns true if the notifier is configured.
func (n *Notifier) Enabled() bool {
	return n.botToken != "" && n.channelID != ""
}

// Send posts a message to the configured channel. No-op if not configured.
func (n *Notifier) Send(message string) error {
	if !n.Enabled() {
		return nil
	}

	body, _ := json.Marshal(map[string]string{"content": message})
	url := fmt.Sprintf("https://discord.com/api/v10/channels/%s/messages", n.channelID)

	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bot "+n.botToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := n.client.Do(req)
	if err != nil {
		return fmt.Errorf("discord send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("discord send: status %d", resp.StatusCode)
	}
	return nil
}
