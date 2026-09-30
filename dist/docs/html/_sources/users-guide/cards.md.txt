(card-types)=

# Cards

There are currently two types of available cards for the spaced repetition deck.

## Two-sided cards

These cards each have a *prompt* and an *answer*. Multiple possible answers can be listed in the answer text field, separated by the pipe `|` character, and any one of them will be accepted as correct. There are also options allowing these cards to be *reversed*, in which case the user will be presented with the card's second field and required to enter the value of its first field, and *spoken and reversed*, in which case the user will be presented with an audio button that reads aloud the card's second field.

The following data is passed to templates of this card type:

- `prompts`: a list of possible prompts for the card
- `reversed`: a boolean indicating whether the card is reversed
- `spoken`: a boolean indicating whether the (reversed) card uses an audio prompt
- `fontSize`: a suggested font size for the card text
- `cardsLeft`: the number of cards left to study
- `isPractice`: a boolean indicating whether the card is just a practice card

## Cloze puzzle cards

These cards depend on an external cloze puzzle server to generate puzzles for given words. The user must supply a server URL, a source language code, a target language code, and (optionally) a list of puzzle tags determining subsets of the total set of puzzles that are desired. Each card entry should consist of a word (in its base form) in the target language. When studying a card, a fill-in-the-blank puzzle involving that word will be generated.

The following data is passed to templates of this card type:

- `key`: the target word from the card entry
- `puzzleFound`: a boolean indicating whether a puzzle was found for that word on the server
- `prompt`: the prompt of the puzzle, i.e. a sentence in the target language with a word missing
- `translation`: a translation of the target sentence in the source language
- `source`: the name of the puzzle group from which the puzzle is taken 
- `fontSize`: a suggested font size for the card text
- `cardsLeft`: the number of cards left to study
- `isPractice`: a boolean indicating whether the card is just a practice card
