export const njNoCardsLeft: string = `\
<div style="font-size: 5vw;">
   No cards left to study. 
</div>
`;

export const njSimpleCard: string = `\
<div style="font-size: {{ fontSize }}vw;">
    {% if spoken %}
        <img src="/speaker.png" class="read-aloud-button" alt="{{ prompts[0] }}" />
    {% else %}
        {{ prompts[0] }}
    {% endif %}
    {% if isPractice %}
        <span class="cards-left-span">This is a practice card and will not affect progress.</span>
    {% else %}
        <span class="cards-left-span">{{ cardsLeft }} {{ studying }} cards left</span>
    {% endif %}
</div>
`;

export const njClozeCard: string = `\
<div style="display: block; text-align: center; font-size: {{ fontSize }}px;">
    {% if puzzleFound %}
    <p style="display: block;">
        {{ prompt }}
    </p>
    <hr>
    <p style="display: block;">
        {{ translation }}
    </p>
    <span class="cloze-puzzle-attribution">
        {{ source }}
    </span>
    {% else %}
    Could not find cloze puzzle for key "{{ key }}".
    {% endif %}

    {% if isPractice %}
    <span class="cards-left-span">This is a practice card and will not affect progress.</span>
    {% else %}
    <span class="cards-left-span">{{ cardsLeft }} {{ studying }} cards left</span>
    {% endif %}
</div>
`;

export const njMultiSidedCard: string = `\
<div style="display: block; text-align: center; font-size: {{ fontSize }}px;">
    <p style="display: block;">
        {{ promptName }}: {{ prompt }}
    </p>
    <hr>
    <p style="display: block;">
        Answer with: {{ answersNames | join(", ") }}
    </p>
    
    {% if isPractice %}
    <span class="cards-left-span">This is a practice card and will not affect progress.</span>
    {% else %}
    <span class="cards-left-span">{{ cardsLeft }} {{ studying }} cards left</span>
    {% endif %}
</div>
`;


export const njFreqProgCard: string = `\
<div style="font-size: {{ fontSize }}vw;">
    <span class="cards-freq-prog-rank">{{ rank }}</span>
    {{ card.prompt }}
    <span class="cards-extra-info">{{ card.extraInfo }}</span>
</div>
`;

