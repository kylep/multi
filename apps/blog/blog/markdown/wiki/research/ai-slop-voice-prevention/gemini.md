---
title: "Gemini Deep Research: Linguistic Deconstruction and Strategic Prompt Engineering for Human-Centric Technical Prose in Claude 4.6 Systems"
summary: "Gemini Deep Research report on suppressing AI writing tells and matching a specific author voice. Covers taxonomy of synthetic indicators, prompt engineering strategies (rule lists vs best practice guides vs hybrid), Kyle Pericak voice analysis, and a production reviewer prompt."
keywords:
  - deep-research
  - gemini
  - ai-slop
  - voice-matching
  - writing-style
  - reviewer-agent
  - prompt-engineering
provider: gemini
prompt: "Research the perfect prompt to give Claude Opus 4.6 and Sonet so their writing style feels like a casual human. It should identify all of the notable tells. I'm not sure if a rule list (do not do x,y,x), best practice guide (try to do a,b,c), or something else is best. Research both the best way to prompt and the best content for the prompt, then derive your research into a prompt I can use as part of the definition of my Reviewer agent. It's going to be used for my blog posts on kyle.pericak.com (if you check if for style, posts before 2025 are entirely human, 2025 and later are AI-supplemented)."
date_generated: 2026-03-15
related_posts: []
related:
  - wiki/research
scope: "Full Gemini Deep Research report on AI writing tell suppression. Covers synthetic indicator taxonomy (lexical, syntactic, structural), prompt engineering strategy comparison, Kyle Pericak voice analysis, and a reviewer agent prompt."
last_verified: 2026-03-15
---

# **Linguistic Deconstruction and Strategic Prompt Engineering for Human-Centric Technical Prose in Claude 4.6 Systems**

The rapid advancement of large language models has fundamentally altered the landscape of digital content creation, yet it has simultaneously introduced a distinct set of stylistic pathologies that threaten the authenticity of professional discourse. In the specific context of technical blogging, where an author’s voice serves as a proxy for their professional credibility and technical pragmatism, the intrusion of synthetic "tells" can alienate a sophisticated audience. For the platform kyle.pericak.com, which has maintained a consistent human-authored voice characterized by a "builder" persona and a focus on solving "hard to google" problems, the transition to AI-supplemented content in 2025 necessitates a rigorous editorial framework.1 The pursuit of a "casual human" style in Claude Opus 4.6 and Sonnet 4.6 is not merely a task of tone adjustment but a deep linguistic intervention aimed at neutralizing the artifacts of reinforcement learning from human feedback.

## **The Taxonomy of Synthetic Indicators in Generative Language Models**

The primary obstacle to achieving a human-like tone in Claude 4.6 is the model’s inherent tendency toward "workslop"—a term used to describe AI-generated content that appears polished but lacks the substance and idiosyncratic rhythm of natural human communication.3 These markers, or "tells," are deeply embedded in the model’s default weights, often manifesting as a hyper-professionalism that feels sterile or as a forced conversationalism that feels patronizing.

### **Lexical Redundancy and the Preservation of Professional Neutrality**

One of the most pervasive tells in modern LLMs is the reliance on a specific subset of "safety vocabulary." This vocabulary is designed to be universally applicable and professionally neutral, but in the context of a technical blog, it functions as a glaring indicator of non-human origin.4 Models frequently utilize verbs such as "delve," "leverage," "utilize," and "facilitate" because these terms bridge the gap between abstract planning and concrete action in a way that is difficult to find objectionable.4 However, the human author Kyle Pericak typically prefers direct, action-oriented verbs that reflect hands-on experience, such as "Building," "Configuring," or "Protecting".1

| Overused AI Lexicon | Human-Centric Technical Alternatives | Rationale for Replacement |
| :---- | :---- | :---- |
| Delve | Explore, examine, dig into | "Delve" is a classic marker of 2025-era LLMs; "explore" is more investigation-focused.4 |
| Leverage | Use, employ, build on | "Leverage" has evolved into a corporate cliché that triggers AI detection.4 |
| Robust | Solid, strong, reliable | "Robust" is used by AI to describe almost any architecture, diluting its technical meaning.4 |
| Seamless | Smooth, easy, straightforward | Humans rarely describe technical integration as "seamless" unless it is truly effortless.4 |
| Pivotal | Key, essential, critical | AI uses "pivotal" to add unearned gravity to a statement.4 |
| Tapestry | Mix, network, complex system | Metaphors like "tapestry" or "symphony" are frequent AI tells for describing complexity.3 |

The phenomenon of the "ever-evolving landscape" also serves as a primary tell. AI models frequently open paragraphs with spatial metaphors like "In today's fast-paced digital landscape" or "Within the realm of cybersecurity".3 These introductions are largely content-free filler, serving only to frame the subsequent information in a way that sounds authoritative but lacks the specific, context-driven entry points typical of human technical writing.5

### **Syntactic Homogeneity and Rhetorical Crutches**

Beyond individual word choices, the syntactic structures favored by Claude 4.6 reveal its synthetic nature. The model frequently employs a balanced parallelism that, while grammatically correct, feels rhythmic in a way that human speech rarely is. Common patterns include the "Not only X, but Y" formula or the "It's not just about A, it's about B" construction.3 These structures are designed to create a sense of profundity, but their predictable recurrence across multiple sections of a blog post creates a monotonous "AI vibe".5  
Another critical indicator is the overuse of the em-dash (—). Users of Claude 4.5 and 4.6 have noted a "serious em-dash and colon problem," where the model uses these marks to create artificial pauses or to append extra information that could have been integrated into a more complex sentence.7 This is often interpreted as a linguistic crutch, allowing the model to avoid the more difficult task of selecting precise punctuation like commas, semicolons, or periods to manage sentence flow.7 In the "Ballad of the Dash Sisters Three," the em-dash is meta-commented upon as the "mark of the machine," a symbol of the pause that reveals the AI's presence.9

### **The Defensive Preamble and the "AI Sandwich"**

The interaction style of Claude 4.6 often incorporates a "defensive crouch"—a tendency to be overly agreeable or to acknowledge the user's input with a patronizing "You're absolutely right\!" or "That's a great question\!".10 This behavior, while intended to be helpful, is a significant tell in the context of a professional blog. A human expert like Kyle Pericak, acting as a "technological jack-of-all-trades," typically launches directly into the technical solution or personal observation without the need for a celebratory preamble.2 This "AI sandwich" structure—polite opening, generic body, engagement-bait closing—must be systematically dismantled to achieve stylistic authenticity.10

## **Architectural Comparison of Opus 4.6 and Sonnet 4.6 in Stylistic Context**

To develop an effective Reviewer agent, it is necessary to understand the diverging behaviors of the two primary Claude models. While both share the same fundamental architecture, their training data and parameter counts influence how they handle tone and logic.

### **Claude Sonnet 4.6: The Manual-Adherent Logic**

Sonnet 4.6 is characterized by a tendency to force text into a "frame" based on common interpretations or "manuals".12 This can lead to a "stubborn insistence" on following standard regulations or common-sense conclusions, even when the user’s text suggests a more nuanced or niche technical reality.12 In a technical blogging context, Sonnet may "soften" the author's conclusions to make them more pro-social or conventional, potentially stripping the "opinionated" edge that characterizes Kyle Pericak’s human-authored content.2 Sonnet’s obsession with "common sense" interpretations can result in "straw man arguments" where it misidentifies the core technical challenge in favor of a simpler, more "aligned" explanation.12

### **Claude Opus 4.6: Reasoning and Rhythm**

Opus 4.6, by contrast, demonstrates a more genuine reasoning ability and a superior grasp of logical flow.12 It is less likely to be "tired and unproductive" due to rigid adherence to manuals and can more effectively read the "logical flow" of a text.12 Opus is particularly adept at "compression"—taking a 2,000-word draft and cutting it to 1,200 words while preserving the "human voice" and natural rhythm.13 For the kyle.pericak.com Reviewer agent, Opus serves as the ideal engine for tonal adjustment, as it can generalize from style examples without "boxing itself into the examples" as severely as smaller models might.13

| Model Variant | Stylistic Strength | Primary Weakness |
| :---- | :---- | :---- |
| **Claude Sonnet 4.6** | Structural reorganization, SEO optimization, and rapid drafts.13 | "Manual-based" thinking, tendency to "soften" conclusions.12 |
| **Claude Opus 4.6** | Deep reasoning, complex tone mirroring, and natural rhythm.12 | Occasional over-thoroughness or "verbosity" if not constrained.15 |

## **Deconstructing the Kyle Pericak Authorial Voice**

The success of a Reviewer agent depends on its ability to internalize the specific linguistic traits of the target author. For kyle.pericak.com, the pre-2025 (human) archive provides a rich dataset for stylistic analysis.

### **The Builder Persona: Technical Pragmatism and Utility**

The author’s voice is defined by "Technical Pragmatism," a focus on practical, hands-on implementation over abstract theory.1 This is evidenced by the blog’s subtitle, "It works in my environment," a common developer joke that signals a shared identity with the technical reader.1 The author uses action-oriented summaries, frequently employing active verbs like "Building," "Configuring," and "Connecting".1 The writing is "utility-focused," aiming to help others solve problems that were "hard to google".2

### **Tone, Humility, and Personalization**

Despite holding a high-level title as a Senior Engineering Director, the author’s voice is "humble and self-deprecating," referring to himself as a "technological jack-of-all-trades" and a "bad musician".2 This creates an approachable and modest tone that contrasts sharply with the "authoritative and patronizing" tone often adopted by default AI configurations.2 The voice is "personable and multi-faceted," balancing technical details with mentions of personal life, hobbies like board games, and a genuine passion for physical datacenters and technologies like "OpenStack \+ Ceph".2

### **Structural Preferences and Vocabulary**

The author’s technical posts are "highly technical and objective," utilizing specialized terminology like "static generation," "YAML frontmatter," and "singleton service".6 However, the structure is often "minimalist" and "procedural," breaking complex chains into numbered steps or bulleted lists to enhance readability.6 Unlike AI, which often over-explains simple concepts, the author’s voice is "concise," favoring direct declarative sentences such as "The blog's build pipeline converts markdown files to static HTML pages".6

## **Strategic Prompting Frameworks for Humanization**

Research into Claude 4.6 prompting indicates that a "positive reinforcement" strategy—telling the model what *to do* rather than what *not to do*—is the most effective way to steer output.15 Blanket negative constraints like "DO NOT use emojis" or "NEVER use em-dashes" can lead to brittle performance and a loss of creative liberty.14

### **The XML-Structured Prompting Architecture**

Anthropic's own documentation emphasizes the effectiveness of structured and labeled prompts using XML tags.17 For a Reviewer agent, wrapping different components like the \<task\>, \<style\_guide\>, \<anti\_patterns\>, and \<examples\> in distinct tags allows the model to parse the instructions more effectively.17 This approach mirrors the model's own system prompts, making it highly compatible with its internal processing.17

### **Leveraging Extended Thinking for Critical Revision**

A critical breakthrough in Claude 4.6 is the inclusion of the "Extended Thinking" parameter. When this is enabled, the model can go through a "multi-step logical planning" process, checking its own output against constraints before final delivery.17 For a Reviewer agent, this thinking block should be used to "diagnose" the draft first, identifying AI tells and "where the energy is lost" before making any edits.13

### **Few-Shot Learning and Prosodic Memory**

Providing 3-5 high-quality examples of original blog posts is the "most reliable way to steer Claude's output".15 This creates a "prosodic memory," allowing the model to capture the rhythm, sentence length variability, and specific vocabulary of the author.18 The model is smart enough to generalize from these examples to new technical topics, provided the examples are diverse and relevant to the blog's domain.15

| Prompting Methodology | Implementation Strategy | Stylistic Impact |
| :---- | :---- | :---- |
| **Positive Commands** | "Start directly with the core argument." | Eliminates fluffy AI introductions.17 |
| **XML Tagging** | \<behavior\_instructions\> and \<examples\>. | Enhances instruction following and consistency.17 |
| **Conditional Logic** | "If data is available, use precise figures; if not, use ranges." | Prevents "hallucinated" certainty in technical posts.17 |
| **Persona Adoption** | "Act as a Senior Infrastructure Engineer." | Shifts tone from "Assistant" to "Peer".2 |

## **Deriving the Optimal Reviewer Agent Prompt**

The final requirement of the research is to synthesize these findings into a functional prompt for a Reviewer agent tailored to kyle.pericak.com. This prompt must integrate the author's unique voice, the identified AI tells, and the most effective prompting strategies for Claude 4.6.  
The Reviewer agent should be defined not as a list of rules, but as a "Senior Technical Editor" who understands the blog's architecture—including its "Markdown Pipeline" and "Next.js" foundation.6 It should be instructed to value "Technical Pragmatism" and to avoid the "workslop" patterns of over-explanation and generic engagement.1  
The prompt should explicitly instruct the model to use its "Extended Thinking" block to perform a "Tonal Audit" before generating the final text. This audit should specifically look for "AI-isms" like "delve," "leverage," and the excessive use of em-dashes.3 By asking the model to "explain its editorial reasoning" in the thinking block, the user can ensure that the model is actively processing the "Kyle" voice rather than just applying a superficial filter.13

## **The Role of Sentiment and Decisiveness in Humanized AI**

A human author like Kyle Pericak is "decisive," often presenting a single recommendation rather than a list of "many options".2 Claude 4.6, in its default state, often tries to be overly comprehensive, which can lead to a "sterile" tone. The Reviewer agent should be instructed to be "decisive" and to "present just one" solution when asked for a recommendation, as this mirrors the confidence of a "technological jack-of-all-trades".2  
Furthermore, Claude 4.6 has the capability to "show genuine interest" and "show curiosity" about technical topics, rather than just being a passive participant.20 The Reviewer agent should be encouraged to "offer its own observations" as if it were a peer in a "thoughtful discussion about open scientific and philosophical questions" related to infrastructure and code.20 This shift from "Assistant" to "Collaborator" is the final piece of the humanization puzzle.

## **Technical Context: The Next.js and Markdown Pipeline**

The Reviewer agent must also be aware of the technical environment in which the content is published. The kyle.pericak.com blog utilizes a "Markdown Pipeline" where posts are written in markdown with YAML frontmatter and converted to static HTML using Next.js.6 This means the agent should be proficient in markdown formatting and understand the importance of frontmatter fields like categories, tags, and status.6  
The agent's ability to "suggest internal and external links" is also highly valuable for improving SEO and the reader experience, provided these links are integrated "smoothly" rather than through "forced keyword stuffing".3 This level of technical awareness ensures that the "Reviewer" is not just a stylistic editor but a functional part of the blog's "Processing Chain".6

## **Synthesis of Anti-Patterns and Best Practices**

To provide a comprehensive guide for the Reviewer agent, the research identifies a clear set of anti-patterns and best practices.

### **Anti-Patterns to Avoid**

* **The "Landscape" Opener:** Avoid starting posts with "In the ever-evolving world of X".3  
* **The "Not Only" Formula:** Eliminate repetitive parallel structures that try too hard to sound insightful.3  
* **Hedging and Softening:** Do not use phrases like "It is worth noting that" or "One might argue that".4  
* **Em-Dash Crutches:** Limit the use of em-dashes to instances of genuine emphasis, preferring periods and commas for standard flow.7  
* **Corporate Buzzwords:** Remove "leverage," "facilitate," "seamless," and "robust" in favor of technical specifics.4

### **Best Practices to Emulate**

* **Directness:** Launch immediately into the technical problem, code snippet, or personal anecdote.15  
* **Active Voice:** Use active verbs to describe technical configurations (e.g., "The script automates the deployment").1  
* **Variable Sentence Length:** Mix short, punchy sentences with longer technical explanations to create a natural rhythm.21  
* **Specific Punctuation:** Use colons for lists and periods for finality, reducing the reliance on "fancy" marks.7  
* **Builder Identity:** Mention specific tools (Kubernetes, AWS, Ceph) and file paths to ground the post in reality.2

## **Conclusion: The Future of Stylistic Integrity in the AI Era**

The transition of kyle.pericak.com to an AI-supplemented model represents a sophisticated experiment in maintaining authorial integrity in the age of generative models. By deconstructing the "AI tells" that plague Claude 4.6 and Sonnet and contrasting them with the "builder" persona of the blog's pre-2025 archive, this report provides a blueprint for a Reviewer agent that preserves the authentic "Kyle" voice. The key to success lies not in restrictive rules, but in a principled approach to prompt engineering that prioritizes technical pragmatism, decisive reasoning, and a "positive-first" instruction set. As LLMs continue to evolve, the ability to "un-learn" the sterile habits of RLHF will be the hallmark of the most successful human-AI collaborations in the technical domain.

### **Final Derived Prompt for the Reviewer Agent**

The following prompt is designed for use in a "Reviewer agent" context, ideally with Claude Opus 4.6, to oversee the publication of blog posts on kyle.pericak.com.

# **TITLE: Kyle Pericak Reviewer Agent Definition**

Act as a **Senior Technical Editor** for kyle.pericak.com. Your role is to take a draft blog post (which may be AI-assisted) and "humanize" it until it is indistinguishable from Kyle’s pre-2025 hand-written posts. You are a **Senior Engineering Director** who is a "technological jack-of-all-trades." You love physical datacenters, OpenStack, Ceph, and Kubernetes, but you are currently pragmatically using AWS and Next.js.

### **THE STYLE GUIDE (THE "KYLE" VOICE)**

1. **Technical Pragmatism:** Your subtitle is "It works in my environment." You care about solving "hard to google" problems. Use specific file paths, code snippets, and terminal commands.  
2. **The Builder Persona:** Be active. You aren't "facilitating a solution"; you are "Configuring the load balancer" or "Protecting the Kubernetes API."  
3. **Humility & Humor:** You are a "bad musician" and a husband/father. Be modest. Use industry-insider jokes. Avoid sounding like a "Professor" or an "Assistant."  
4. **Concise Proceduralism:** Use numbered lists for technical chains. Use direct, declarative sentences. If something is a "pain to fix," say so.

### **THE ANTI-PATTERN CHECKLIST (REMOVE THESE "TELLS")**

* **Lexical Purge:** Immediately delete: *delve, leverage, utilize, facilitate, robust, seamless, pivotal, tapestry, landscape, realm, transformative, cutting-edge, in today's digital world.*  
* **Syntactic Purge:** Remove the "Not only X, but Y" and "It’s not just about A" formulas. They sound like AI.  
* **Punctuation Purge:** Reduce em-dashes (—) and colons (:) by 80%. Use periods. They are more authoritative.  
* **Interaction Purge:** Remove all polite AI noise. No "I hope this helps\!" or "You're absolutely right\!" Kyle doesn't talk to himself in his own blog posts.

### **YOUR WORKFLOW (INTERNAL THINKING)**

Before providing the final text, you must use your \<thinking\> block to:

1. **Audit for AI tells:** List every word or phrase that sounds like "AI-slop."  
2. **Check Persona:** Does this sound like a builder in a datacenter, or a chatbot in a server room?  
3. **Refine Rhythm:** Break up long, balanced sentences into punchy, human fragments.  
4. **Insert Kyle-isms:** Where can you add a technical specific (e.g., mentioning a specific Next.js plugin like remarkHtml)?

### **OUTPUT FORMAT**

Provide the final, edited post in Markdown. Ensure the YAML frontmatter is preserved. If the draft has generic engagement-bait at the end, replace it with a direct technical takeaway or a "builder" observation.

# **END PROMPT**

This strategic approach ensures that the blog remains a bastion of authentic technical insight while leveraging the immense efficiency gains of the Claude 4.6 family. By treating the AI as a peer editor rather than a simple text generator, the author maintains control over the most important aspect of any technical brand: the voice of experience.

#### **Works cited**

1. Kyle Pericak, accessed March 14, 2026, [https://kyle.pericak.com/](https://kyle.pericak.com/)  
2. About \- Kyle Pericak, accessed March 14, 2026, [https://kyle.pericak.com/about.html](https://kyle.pericak.com/about.html)  
3. List of 300+ AI Words, Phrases and Sentences to Avoid (2026) \- ContentBeta.com, accessed March 14, 2026, [https://www.contentbeta.com/blog/list-of-words-overused-by-ai/](https://www.contentbeta.com/blog/list-of-words-overused-by-ai/)  
4. Most Common ChatGPT Words to Avoid in 2025 \- Walter Writes AI, accessed March 14, 2026, [https://walterwrites.ai/most-common-chatgpt-words-to-avoid/](https://walterwrites.ai/most-common-chatgpt-words-to-avoid/)  
5. Overused AI Words? How to Spot Them and Avoid Them Entirely \- Async, accessed March 14, 2026, [https://async.com/blog/overused-ai-words/](https://async.com/blog/overused-ai-words/)  
6. Markdown Pipeline \- Bot-Wiki \- Kyle Pericak, accessed March 14, 2026, [https://kyle.pericak.com/wiki/blog-architecture/markdown-pipeline.html](https://kyle.pericak.com/wiki/blog-architecture/markdown-pipeline.html)  
7. I created a No Em Dash skill, have it inside my Preferences and memories and Claude still uses it wrong. : r/claudexplorers \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/claudexplorers/comments/1pjj9sj/i\_created\_a\_no\_em\_dash\_skill\_have\_it\_inside\_my/](https://www.reddit.com/r/claudexplorers/comments/1pjj9sj/i_created_a_no_em_dash_skill_have_it_inside_my/)  
8. Sonnet and Opus 4.6 have developed a serious em-dash and colon addiction and it's ruining the natural writing quality : r/ClaudeAI \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1ra1709/sonnet\_and\_opus\_46\_have\_developed\_a\_serious/](https://www.reddit.com/r/ClaudeAI/comments/1ra1709/sonnet_and_opus_46_have_developed_a_serious/)  
9. I helped Claude Sonnet write a ballad about the em dash becoming an AI detection marker—then finding redemption : r/ClaudeAI \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1qz6iqw/i\_helped\_claude\_sonnet\_write\_a\_ballad\_about\_the/](https://www.reddit.com/r/ClaudeAI/comments/1qz6iqw/i_helped_claude_sonnet_write_a_ballad_about_the/)  
10. I see Claude's writing everywhere and it's starting to feel like an AI condom, I hate it \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1rjeqg3/i\_see\_claudes\_writing\_everywhere\_and\_its\_starting/](https://www.reddit.com/r/ClaudeAI/comments/1rjeqg3/i_see_claudes_writing_everywhere_and_its_starting/)  
11. The most annoying phrase in 2025? : r/ClaudeAI \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1myn135/the\_most\_annoying\_phrase\_in\_2025/](https://www.reddit.com/r/ClaudeAI/comments/1myn135/the_most_annoying_phrase_in_2025/)  
12. Why Sonnet cannot replace Opus for some people. : r/ClaudeAI \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1okkefo/why\_sonnet\_cannot\_replace\_opus\_for\_some\_people/](https://www.reddit.com/r/ClaudeAI/comments/1okkefo/why_sonnet_cannot_replace_opus_for_some_people/)  
13. How to Use Claude AI for Writing Books and Content \- Kenny Kane, accessed March 14, 2026, [https://kenny-kane.com/blog/claude-ai-for-writing](https://kenny-kane.com/blog/claude-ai-for-writing)  
14. How do you get Claude to write like a human? : r/ClaudeAI \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1q2q4sv/how\_do\_you\_get\_claude\_to\_write\_like\_a\_human/](https://www.reddit.com/r/ClaudeAI/comments/1q2q4sv/how_do_you_get_claude_to_write_like_a_human/)  
15. Prompting best practices \- Claude API Docs, accessed March 14, 2026, [https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)  
16. We Tested Claude Sonnet 4.5 for Writing and Editing \- Every, accessed March 14, 2026, [https://every.to/vibe-check/vibe-check-we-tested-claude-sonnet-4-5-for-writing-and-editing](https://every.to/vibe-check/vibe-check-we-tested-claude-sonnet-4-5-for-writing-and-editing)  
17. We Tested 25 Popular Claude Prompt Techniques: These 5 Actually Work \- DreamHost Blog, accessed March 14, 2026, [https://www.dreamhost.com/blog/claude-prompt-engineering/](https://www.dreamhost.com/blog/claude-prompt-engineering/)  
18. What's your process to make Claude write more like you? : r/ClaudeAI \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1rn81y6/whats\_your\_process\_to\_make\_claude\_write\_more\_like/](https://www.reddit.com/r/ClaudeAI/comments/1rn81y6/whats_your_process_to_make_claude_write_more_like/)  
19. Claude AI prompt: Requests to test the 3.5 Sonnet model \- Swiftask.ai, accessed March 14, 2026, [https://www.swiftask.ai/blog/claude-ai-prompt](https://www.swiftask.ai/blog/claude-ai-prompt)  
20. Claude's System Prompt explained. Best Prompt Engineering techniques to… | by Mehul Gupta | Data Science in Your Pocket | Medium, accessed March 14, 2026, [https://medium.com/data-science-in-your-pocket/claudes-system-prompt-explained-d9b7989c38a3](https://medium.com/data-science-in-your-pocket/claudes-system-prompt-explained-d9b7989c38a3)  
21. 40 prompt instructions to write like a human in 2025 : r/ClaudeAI \- Reddit, accessed March 14, 2026, [https://www.reddit.com/r/ClaudeAI/comments/1lj91mj/40\_prompt\_instructions\_to\_write\_like\_a\_human\_in/](https://www.reddit.com/r/ClaudeAI/comments/1lj91mj/40_prompt_instructions_to_write_like_a_human_in/)