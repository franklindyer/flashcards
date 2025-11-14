---
title: Flashcards help
---

# Flashcards controls

- Type your guess at the answer in the text box. 
- Press `Enter` to submit your answer.
- Press `Up Arrow` to mark a card as correct, overriding a previous incorrect answer.
- Press `Down Arrow` to skip a card and receive a new one, ignoring any previous answer.

# Types of decks

## Key-value quiz deck

Each card in the deck has a prompt and a correct answer. Cards are chosen and displayed uniformly at random from the deck.

## Spaced repetition deck

This deck uses the *spaced repetition* algorithm to help you study cards long-term. It also offers several detailed options for customization and different types of cards.

### Spaced repetition algorithm

Each time you answer a card correctly, it is removed from the queue and its due date is set for a later date and time. The amount of time between the time a card is answered correctly and its next due date is called that card's *interval*. When a card is answered correctly, its interval is multiplied by the *correct factor* $\alpha^+ > 1$, and when it is answered incorrectly, its interval is multiplied by the *incorrect factor* $\alpha^- < 1$. This way, when cards are answered correctly, they come due less often, and when they are answered incorrectly, they come due more often.

When you first add cards to your deck, they won't become due until you study them for the first time. By default, *new cards* must be answered correctly 3 times in a row before they shed their "new card" status. From that point onwards, they can show up normally in the queue. To switch between studying new cards and studying due cards from the queue, toggle the checkbox in the deck editor accordingly.

When a card's interval is large enough, it is considered a *review card*. These cards are not scheduled according to due dates and intervals anymore. Instead, when you study due cards, review cards (if any exist) will randomly pop up in your queue with a certain fixed probability. Each review card that pops up is chosen uniformly at random from among all of the review cards in your deck.

The configurable parameters for the deck are as follows:

- Initial interval: the interval of a card when it goes from *new* to *due* for the first time
- Correct factor: the factor $\alpha^+$ by which a card's interval increases when answered correctly
- Incorrect factor: the factor $\alpha^-$ by which a card's interval increases when answered incorrectly
- Probability of review cards: when studying due cards, the probability that each card is taken from review cards

### Types of cards

There are currently two types of available cards for the spaced repetition deck.

Firstly, there are the **simple two-sided cards**. These cards each have a *prompt* and an *answer*. Multiple possible answers can be listed in the answer text field, separated by the pipe `|` character, and any one of them will be accepted as correct. There are also options allowing these cards to be *reversed*, in which case the user will be presented with the card's second field and required to enter the value of its first field, and *spoken and reversed*, in which case the user will be presented with an audio button that reads aloud the card's second field.

The following data is passed to templates of this card type:

- `prompts`: a list of possible prompts for the card
- `reversed`: a boolean indicating whether the card is reversed
- `spoken`: a boolean indicating whether the (reversed) card uses an audio prompt
- `fontSize`: a suggested font size for the card text
- `cardsLeft`: the number of cards left to study
- `isPractice`: a boolean indicating whether the card is just a practice card

Secondly, there are the **cloze puzzle cards**. These cards depend on an external cloze puzzle server to generate puzzles for given words. The user must supply a server URL, a source language code, a target language code, and (optionally) a list of puzzle tags determining subsets of the total set of puzzles that are desired. Each card entry should consist of a word (in its base form) in the target language. When studying a card, a fill-in-the-blank puzzle involving that word will be generated.

The following data is passed to templates of this card type:

- `key`: the target word from the card entry
- `puzzleFound`: a boolean indicating whether a puzzle was found for that word on the server
- `prompt`: the prompt of the puzzle, i.e. a sentence in the target language with a word missing
- `translation`: a translation of the target sentence in the source language
- `source`: the name of the puzzle group from which the puzzle is taken 
- `fontSize`: a suggested font size for the card text
- `cardsLeft`: the number of cards left to study
- `isPractice`: a boolean indicating whether the card is just a practice card
