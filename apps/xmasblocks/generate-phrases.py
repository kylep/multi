import json
import os

MIN_WORD_LENGTH = 4 # lower values go very slow

with open('blocks.json', 'r') as f:
    blocks = json.load(f)['blocks']

with open('dictionary.txt', 'r') as f:
    dictionary = set(word.strip().upper() for word in f)

print("removing words we don't have the letters for")
absent_letters = set(letter for letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' if not any(letter in block for block in blocks))
trimmed_dictionary = set(word for word in dictionary if not any(letter in absent_letters for letter in word))
print(f"filtered down to {len(trimmed_dictionary)} words")

def can_form_word(word: str, blocks: list[list[str]]) -> list[list[list[str]]]:
    """
    Determines if a word can be formed using given blocks.

    Each block can be used at most once, and you may choose either
    letter from a block if it contains two.

    Args:
        word: The target word to form.
        blocks: A list of blocks, where each block is a list of one or two characters.

    Returns:
        A list of valid configurations of remaining blocks. Each configuration
        is a list of blocks (in the same format as input) left unused after
        forming the word. Returns an empty list if the word cannot be formed.
    """
    num_blocks = len(blocks)
    word_length = len(word)
    valid_remainders: list[list[list[str]]] = []

    def backtrack(char_index: int, used_mask: int):
        """
        Recursively matches each character in the word to an unused block.
        """
        if char_index == word_length:
            # Collect blocks not used in this configuration
            remaining = [
                blocks[i] for i in range(num_blocks)
                if not (used_mask >> i) & 1
            ]
            valid_remainders.append(remaining)
            return

        current_char = word[char_index]
        for block_index, block in enumerate(blocks):
            if not (used_mask >> block_index) & 1 and current_char in block:
                backtrack(char_index + 1, used_mask | (1 << block_index))

    backtrack(0, 0)
    return valid_remainders

print("removing words we can't form from these blocks")
# get a list of the words where can_form_word isn't empty
formable_words = [word for word in trimmed_dictionary if can_form_word(word, blocks)]
print(f"filtered down to {len(formable_words)} words")

# write formable_words to a file
with open('formable_words.txt', 'w') as f:
    for word in formable_words:
        f.write(word + '\n')

tried = 0
def build_phrases_recursive(remaining_blocks: list[list[str]], current_phrase: list[str], max_words: int = 5) -> list[list[str]]:
    global tried
    if len(current_phrase) >= max_words or not remaining_blocks:
        return [current_phrase] if current_phrase else []
    phrases = []
    for word in formable_words:
        if len(word) < MIN_WORD_LENGTH:
            continue
        if len(current_phrase) == 0:
            print(f"Trying word {word} ({tried}/{len(formable_words)})")
            tried += 1
        if len(word) <= len(remaining_blocks):  # Only try words that could fit
            valid_remainders = can_form_word(word, remaining_blocks)
            if valid_remainders:
                for remainder in valid_remainders:
                    new_phrase = current_phrase + [word]
                    sub_phrases = build_phrases_recursive(remainder, new_phrase, max_words)
                    phrases.extend(sub_phrases)
        if not phrases and current_phrase:
            return [current_phrase]
    return phrases

print("Building phrases recursively...")
all_phrases = build_phrases_recursive(blocks, [], max_words=3)  # Limit to 3 words for performance

# Convert phrases to strings and add to set
phrase_list = set()
for phrase in all_phrases:
    phrase_str = " ".join(phrase)
    phrase_list.add(phrase_str)

print(f"Generated {len(phrase_list)} unique phrases")
with open('phrase-list.txt', 'w') as f:
    for word in sorted(phrase_list):
        f.write(word + '\n')
print(f"Wrote {len(phrase_list)} words to phrase-list.txt")