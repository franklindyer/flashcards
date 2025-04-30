---
title: Flashcards help
---

# Flashcards help

- Press `Enter` to submit your answer.
- Press `Up Arrow` to mark a card as correct, overriding a previous incorrect answer.
- Press `Down Arrow` to skip a card and receive a new one, ignoring any previous answer.

# Types of decks

## Key-value quiz deck

Each card in the deck has a prompt and a correct answer. Cards are chosen and displayed uniformly at random from the deck.

## Spaced repetition quiz deck

This deck uses the *spaced repetition* algorithm to help you study cards long-term.

Each time you answer a card correctly, it is removed from the queue and its due date is set for a later date and time. The amount of time between the time a card is answered correctly and its next due date is called that card's *interval*. When a card is answered correctly, its interval is multiplied by the *correct factor* $\alpha^+ > 1$, and when it is answered incorrectly, its interval is multiplied by the *incorrect factor* $\alpha^- < 1$. This way, when cards are answered correctly, they come due less often, and when they are answered incorrectly, they come due more often.

When you first add cards to your deck, they won't become due until you study them for the first time. By default, *new cards* must be answered correctly 3 times in a row before they shed their "new card" status. From that point onwards, they can show up normally in the queue. To switch between studying new cards and studying due cards from the queue, toggle the checkbox in the deck editor accordingly.

When a card's interval is large enough, it is considered a *review card*. These cards are not scheduled according to due dates and intervals anymore. Instead, when you study due cards, review cards (if any exist) will randomly pop up in your queue with a certain fixed probability. Each review card that pops up is chosen uniformly at random from among all of the review cards in your deck.

The configurable parameters for the deck are as follows:

- Initial interval: the interval of a card when it goes from *new* to *due* for the first time
- Correct factor: the factor $\alpha^+$ by which a card's interval increases when answered correctly
- Incorrect factor: the factor $\alpha^-$ by which a card's interval increases when answered incorrectly
- Probability of review cards: when studying due cards, the probability that each card is taken from review cards

## Cloze puzzle deck

A *cloze puzzle* is a puzzle in which one or more words from a sentence are obscured, and the subject is asked to guess the correct word for each blank. They're great ways of practicing your vocabulary!

You may only upload cloze puzzles to a cloze deck in the form of `json` files. The `json` data should consist of a dictionary whose keys are unique user-friendly ID strings, and whose values are values with the following shape:

```
"tarjeta": {
    "prompt": "Así debe ser el formato de las {{tarjetas}}.",
    "translation": "The format of the cards should be like this."
}
```

Each of the words in the card prompt that should be substituted with a blank should be surrounded in double curly-braces `{{}}`.

