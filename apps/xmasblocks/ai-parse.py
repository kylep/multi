#!/usr/bin/env python3
"""
AI-powered phrase analyzer for xmasblocks.
Uses OpenAI's API to find the 100 funniest phrases from the phrase list.
"""

import os
import json
import time
from typing import List, Dict, Tuple
import openai
from pathlib import Path

# Configuration
BATCH_SIZE = 50  # Process phrases in batches to manage API costs
MAX_TOKENS = 1000  # Limit response size
MODEL = "gpt-3.5-turbo"  # Use cheaper model for cost efficiency

def load_phrases(file_path: str) -> List[str]:
    """Load phrases from the phrase list file."""
    with open(file_path, 'r') as f:
        phrases = [line.strip() for line in f if line.strip()]
    return phrases

def analyze_batch_for_humor(phrases: List[str], client) -> List[Dict]:
    """Analyze a batch of phrases for humor using OpenAI API."""
    prompt = f"""
You are a humor expert. Analyze the following list of phrases and rate each one on a humor scale from 1-10, where:
1 = Not funny at all
10 = Extremely funny

Consider factors like:
- Wordplay potential
- Double meanings
- Unexpected combinations
- Cultural references
- Cleverness

Return ONLY a JSON array of objects with this exact format:
[{{"phrase": "PHRASE", "humor_score": SCORE, "reason": "BRIEF_REASON"}}]

Phrases to analyze:
{', '.join(phrases)}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=MAX_TOKENS,
            temperature=0.7
        )
        
        content = response.choices[0].message.content.strip()
        
        # Try to extract JSON from the response
        if content.startswith('```json'):
            content = content[7:-3]  # Remove markdown code blocks
        elif content.startswith('```'):
            content = content[3:-3]
            
        return json.loads(content)
    
    except Exception as e:
        print(f"Error analyzing batch: {e}")
        # Return default scores if API fails
        return [{"phrase": phrase, "humor_score": 1, "reason": "API error"} for phrase in phrases]

def process_all_phrases(phrases: List[str], client) -> List[Dict]:
    """Process all phrases in batches and return humor analysis."""
    all_results = []
    
    # Process in batches
    for i in range(0, len(phrases), BATCH_SIZE):
        batch = phrases[i:i + BATCH_SIZE]
        print(f"Processing batch {i//BATCH_SIZE + 1}/{(len(phrases) + BATCH_SIZE - 1)//BATCH_SIZE} ({len(batch)} phrases)")
        
        batch_results = analyze_batch_for_humor(batch, client)
        all_results.extend(batch_results)
        
        # Rate limiting - be nice to the API
        time.sleep(1)
    
    return all_results

def get_top_funny_phrases(results: List[Dict], top_n: int = 100) -> List[Dict]:
    """Get the top N funniest phrases based on humor scores."""
    # Sort by humor score (descending)
    sorted_results = sorted(results, key=lambda x: x.get('humor_score', 0), reverse=True)
    return sorted_results[:top_n]

def save_results(results: List[Dict], output_file: str):
    """Save results to a JSON file."""
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {output_file}")

def main():
    """Main function to run the AI phrase analysis."""
    # Check for required environment variables
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable is required")
        print("Please set it with: export OPENAI_API_KEY='your-api-key-here'")
        return
    
    # Initialize OpenAI client
    client = openai.OpenAI(api_key=api_key)
    
    # File paths
    script_dir = Path(__file__).parent
    phrase_file = script_dir / "phrase-list.txt"
    output_file = script_dir / "funniest-phrases.json"
    
    if not phrase_file.exists():
        print(f"Error: phrase-list.txt not found at {phrase_file}")
        return
    
    print("Loading phrases...")
    phrases = load_phrases(phrase_file)
    print(f"Loaded {len(phrases)} phrases")
    
    print("Analyzing phrases for humor...")
    results = process_all_phrases(phrases, client)
    
    print("Finding top 100 funniest phrases...")
    top_phrases = get_top_funny_phrases(results, 100)
    
    # Save results
    save_results(top_phrases, output_file)
    
    # Print top 10 for preview
    print("\nTop 10 funniest phrases:")
    for i, result in enumerate(top_phrases[:10], 1):
        print(f"{i:2d}. {result['phrase']} (Score: {result['humor_score']}) - {result['reason']}")

if __name__ == "__main__":
    main() 