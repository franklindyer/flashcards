"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gTemplateRegistry = exports.FlashcardTemplate = void 0;
exports.registerTemplate = registerTemplate;
exports.renderCard = renderCard;
class FlashcardTemplate {
}
exports.FlashcardTemplate = FlashcardTemplate;
exports.gTemplateRegistry = {};
function registerTemplate(tpl) {
    exports.gTemplateRegistry[tpl.getName()] = tpl;
}
function renderCard(tplName, cardData) {
    if (tplName in exports.gTemplateRegistry) {
        return exports.gTemplateRegistry[tplName].render(cardData);
    }
    throw new Error(`Unrecognized card template ${tplName}`);
}
