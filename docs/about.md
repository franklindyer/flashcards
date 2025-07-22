---
title: About Flashcards
---

# About Flashcards

This is an app that I made for studying things with flashcards. Mainly foreign languages.

## Who this is for

This app is for you if:

- You want a simple, aesthetically minimal flashcards app to study with
- You like to use spaced repetition for studying languages
- You want to be able to easily export entire decks into a readable, hackable file format
- You want to use a flashcards app that is dev-friendly and open-source

This app is not for you if:

- You want to study languages or other things with a lot of gamification
- You want a flashcard app that offers a lot of reskinning or aesthetic customization options
- You are a crazy power user who wants to study decks with hundreds of thousands of cards

Mainly, this app is for me (and for my wife).

## My motivation 

In summary, the principles behind this app are as follows:

- The code should provide a unified interface for a very broad class of flashcard-style quizzers
- Decks should allow for "virtual cards", that is, cards that are generated rather than listed 
- Common variants of the Spaced Repetition algorithm should be supported, but not exclusively
- The aesthetic should be minimalistic with a few pleasing animations but very few distractions
- The code should be as client-centric as possible with very little or no server participation needed
- It should be easy for anyone to export an entire flashcard deck and edit the deck file by hand

I began working on this app because existing flashcard apps were not flexible enough for me. Existing apps that I've tried using incluse Flashcards Deluxe and Anki2. The former is a great app, but it's not open source, which makes it impractical to make small tweaks to a deck's appearance or behavior unless settings happen to exist for the desired changes already. The latter is open-source, but I find its design to be too inflexible and oriented towards spaced repetition specifically.

The design of this app is specifically intended as a framework that enables *generative* flashcards. The philosophy is as follows: a flashcard represents a specific *thing* that you want to study, but it does not always need to present itself in the same way. For example, suppose that you want one flashcard to represent the German verb `sein` ("to be"). But when the card comes up in your deck, perhaps you would like to be quizzed on a random one of its conjugations:

- `to be | sein`
- `I am | ich bin`
- `you are | du bist`
- `he is | er ist`
- `she is | sie ist`
- `it is | es ist`
- `we are | wir sind`
- `you guys are | ihr seid`
- `they are | sie sind` 

Or perhaps you would like to be presented with a random fill-in-the-blank puzzle involving the conjugations of this word:

- `Ich {{bin}} kein Arzt. | I am not a doctor.`
- `{{Bist}} du in Gefahr? | Are you in danger?`
- `Er {{ist}} mein Freund. | He is my friend.`
- `Ich weiß nicht, wo sie {{sind}}. | I don't know where they are.`
- ...

You could add all of these cards to your deck by hand, but it could get tedious to add all of the conjugations for each verb manually. And if your sentences aren't manually written, but pulled automatically from some existing data set of sentence translations or fill-in-the-blank puzzles, then it might not be practical to add them by hand at all. Furthermore, if you are studying in a spaced repetition deck, you might want to have a wide variety of possible sentences involving a single word (e.g. `sein`), but treating them as distinct cards wouldn't make sense both because they would be too numerous and because their intervals would be independent of each other despite their quizzing you on the same word.

This app is written with this sort of thing in mind (even if not all of the capabilities are implemented just yet).
