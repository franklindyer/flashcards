"use strict";
var SpacedRepCardStatus;
(function (SpacedRepCardStatus) {
    SpacedRepCardStatus[SpacedRepCardStatus["CardNew"] = 1] = "CardNew";
    SpacedRepCardStatus[SpacedRepCardStatus["CardStudying"] = 2] = "CardStudying";
    SpacedRepCardStatus[SpacedRepCardStatus["CardReview"] = 3] = "CardReview";
})(SpacedRepCardStatus || (SpacedRepCardStatus = {}));
var SpacedRepOrder;
(function (SpacedRepOrder) {
    SpacedRepOrder[SpacedRepOrder["RandomOrder"] = 1] = "RandomOrder";
    SpacedRepOrder[SpacedRepOrder["ReviewFirst"] = 2] = "ReviewFirst";
    SpacedRepOrder[SpacedRepOrder["NewFist"] = 3] = "NewFist";
})(SpacedRepOrder || (SpacedRepOrder = {}));
