// Types

type Flashcard<a> = {
    params: a,
    prompt: string,
    answers: string[],
    hint: string,
    uuid: string
}

type FlashcardTemplate<a> = {
    generator: (seed: a) => Flashcard<a>,
}

type FlashcardGenerator<a> = {
    ftemp: FlashcardTemplate<a>,
    seeder: () => a,
    history: Flashcard<a>[]
}

// Logic

// https://stackoverflow.com/questions/6860853/generate-random-string-for-div-id
function guidGenerator(): string {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function uniformRandomFGen(cards: [string, string][]): FlashcardGenerator<number> {
    return {
        ftemp: {
            generator: function(seed: number) {
                return {
                    params: seed,
                    prompt: cards[seed][0],
                    answers: [cards[seed][1]],
                    hint: cards[seed][1],
                    uuid: guidGenerator() 
                }
            }
        },
        seeder: function() {
            return Math.floor(Math.random() * cards.length);
        },
        history: []
    }
}

function nextCard<a>(fgen: FlashcardGenerator<a>): Flashcard<a> {
    var card = fgen.ftemp.generator(fgen.seeder());
    fgen.history.push(card);
    return card;
}

function isGuessCorrect<a>(card: Flashcard<a>, guess: string): boolean {
    return card.answers.indexOf(guess) > -1;
}

// View

function buildCardDiv<a>(card: Flashcard<a>) {
    var cardDiv = document.createElement("div");
    cardDiv.classList.add("flashcard");
    cardDiv.textContent = card.prompt;
    cardDiv.id = card.uuid;
    var fontSize = 100.0/(10.0*Math.log(10+card.prompt.length));
    cardDiv.style.fontSize = `${fontSize}vw`; 
    return cardDiv;
}

function slideCardIntoDiv<a>(divId: string, card: Flashcard<a>) {
    var container = document.getElementById(divId);
    var cardDiv = buildCardDiv(card);
    cardDiv.classList.add("flashcard-slide-in");
    cardDiv!.onanimationend = () => { cardDiv!.classList.remove("flashcard-slide-in"); };
    container?.appendChild(cardDiv); 
}

function slideCardOutOfDiv(cardId: string) {
    var cardDiv = document.getElementById(cardId);
    cardDiv?.classList.add("flashcard-slide-out");
    cardDiv!.onanimationend = () => { cardDiv!.style.display = "none"; };
}

function markCardIncorrect(cardId: string) {
    var cardDiv = document.getElementById(cardId);
    cardDiv?.classList?.add("flashcard-incorrect");
    cardDiv!.onanimationend = () => { cardDiv!.classList.remove("flashcard-incorrect"); };
    cardDiv!.offsetHeight; 
}
    
function setHintText(hint: string) {
    var hintBox = <HTMLInputElement>document.getElementById("flashcard-answer-hint");
    hintBox!.value = hint;
}

function runFlashcardController<a>(fgen: FlashcardGenerator<a>) {
    var isCorrect = false;
    var guessBox = <HTMLInputElement>document.getElementById("flashcard-answer-input");
    console.log(guessBox);
    var guessController = function(card: Flashcard<a>) {
        var correct = isGuessCorrect(card, guessBox!.value);
        isCorrect = correct;
        if (!correct) {
            setHintText(card.hint);
            markCardIncorrect(card.uuid);
        }
        return isCorrect; 
    }
    var flashcardLoop = () => {
        isCorrect = false;
        var card = nextCard(fgen);
        slideCardIntoDiv("flashcard-container", card);
        setHintText("");
        guessBox!.onkeydown = (e) => {
            if (e.key == "Enter") {
                if (guessController(card)) {
                    guessBox.value = "";
                    slideCardOutOfDiv(card.uuid);
                    setTimeout(() => flashcardLoop(), 1000);
                }
            }
        }
    }
    flashcardLoop(); 
}

// Demos

var additionQuizzer: FlashcardGenerator<[number, number]> = {
    ftemp: {
        generator: function(seed: [number, number]) {
            return {
                params: seed,
                prompt: `${seed[0]} + ${seed[1]}`,
                answers: [`${seed[0] + seed[1]}`],
                hint: `${seed[0] + seed[1]}`,
                uuid: guidGenerator()
            }
        }
    },
    seeder: function() {
        var g = () => Math.floor(Math.random() * 100);
        return [g(), g()];
    },
    history: []
}

window.onload = () => { runFlashcardController(additionQuizzer); }
