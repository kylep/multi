# xmasblocks

My parents have these wooden blocks they bring out every Christmas holidays.
They say "Merry Christmas", and "joyeux noel" if you turn them around.

Scrambling them into something funny is fun. Writing a tool to find the possibilities
ended up being an interesting puzzle due to the high permutation count.

A dictionary of english words has been downloaded from https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.tx.

## AI-Powered Phrase Analysis

The `ai-parse.py` script uses OpenAI's API to analyze the phrase list and find the 100 funniest options.

*NOTE* I didn't end up using this part but I think it's neat. Also don't ask Cursor to find the funny ones, its choices were absolutely not appropriate for pair programming with kids...

### Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   export OPENAI_API_KEY='your-openai-api-key-here'
   ```

### Usage

Run the AI analysis:
```bash
python ai-parse.py
```

The script will:
- Load all phrases from `phrase-list.txt`
- Process them in batches of 50 to manage API costs
- Use GPT-3.5-turbo for cost efficiency
- Rate each phrase on a humor scale of 1-10
- Save the top 100 funniest phrases to `funniest-phrases.json`
- Display the top 10 results in the console

### Cost Considerations

- Uses GPT-3.5-turbo (cheaper than GPT-4)
- Processes phrases in batches of 50
- Includes rate limiting (1 second between batches)
- With ~160k phrases, expect ~3,200 API calls
- Estimated cost: ~$10-20 depending on phrase complexity

### Output Format

The script generates a JSON file with entries like:
```json
{
  "phrase": "EXAMPLE",
  "humor_score": 8,
  "reason": "Clever wordplay and unexpected meaning"
}
```


```