import {
    renderString
} from "nunjucks"

export const njSimpleCard: string = `\
<div style="font-size: {{ fontSize }}vw;">
    {% if spoken %}
        <img src="/speaker.png" class="transcription-audio-button" alt="{{ prompts[0] }}" />
    {% else %}
        {{ prompts[0] }}
    {% endif %}
    {% if isPractice %}
        <span class="cards-left-span">This is a practice card and will not affect progress.</span>
    {% else %}
        <span class="cards-left-span">{{ cardsLeft }} cards left</span>
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
    <span class="cards-left-span">{{ cardsLeft }} cards left</span>
    {% endif %}
</div>
`;
