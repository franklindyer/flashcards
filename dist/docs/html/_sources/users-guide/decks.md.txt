(deck-types)=

# Decks

There are several different possible deck types, each with their own functionalities.

## Key-value quiz deck

Each card in the deck has a prompt and a correct answer. Cards are chosen and displayed uniformly at random from the deck.

(spaced-rep-deck)=

## Spaced repetition deck

This deck uses the *spaced repetition* algorithm to help you study cards long-term. It also offers several detailed options for customization and different types of cards.

### Spaced repetition algorithm

Each time you answer a card correctly, it is removed from the queue and its due date is set for a later date and time. The amount of time between the time a card is answered correctly and its next due date is called that card's *interval*. When a card is answered correctly, its interval is multiplied by the *correct factor* {math}`\alpha^+ > 1`, and when it is answered incorrectly, its interval is multiplied by the *incorrect factor* {math}`\alpha^- < 1`. This way, when cards are answered correctly, they come due less often, and when they are answered incorrectly, they come due more often.

When you first add cards to your deck, they won't become due until you study them for the first time. By default, *new cards* must be answered correctly 3 times in a row before they shed their "new card" status. From that point onwards, they can show up normally in the queue. To switch between studying new cards and studying due cards from the queue, toggle the checkbox in the deck editor accordingly.

When a card's interval is large enough, it is considered a *review card*. These cards are not scheduled according to due dates and intervals anymore. Instead, when you study due cards, review cards (if any exist) will randomly pop up in your queue with a certain fixed probability. Each review card that pops up is chosen uniformly at random from among all of the review cards in your deck.

The configurable parameters for the deck are as follows:

- Initial interval: the interval of a card when it goes from *new* to *due* for the first time
- Correct factor: the factor {math}`\alpha^+` by which a card's interval increases when answered correctly
- Incorrect factor: the factor {math}`\alpha^-` by which a card's interval increases when answered incorrectly
- Probability of review cards: when studying due cards, the probability that each card is taken from review cards

