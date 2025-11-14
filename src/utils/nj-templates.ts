import {
    renderString
} from "nunjucks"

export const njSimpleCard: string = `\
<div style="font-size: {{ fontSize }}vw;">
    {{ prompts[0] }}
    {% if isPractice %}
    <span class="cards-left-span">{{ cardsLeft }} cards left</span>
    {% else %}
    <span class="cards-left-span">This is a practice card and will not affect progress.</span>
    {% endif %}
</div>
`;

export const njClozeCard: string = `\
<div style="display: block; text-align: center;">
    <p style="display: block;">
        {{ puzzle }}
    </p>
    <hr>
    <p style="display: block;">
        {{ translation  }}
    </p>
    <span>
        {{ source }}
    </span>
</div>
`;
