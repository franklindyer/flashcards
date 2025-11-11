import json

def migrate_card(c):
    return {
        "guid": c["guid"],
        "cardType": c["content"]["cardType"],
        "cardEntry": c["content"]["cardEntry"],
        "tags": c["content"]["tags"],
        "due": c["due"],
        "intervalMinutes": c["intervalMinutes"],
        "stats": {
            "streak": c["auxdata"]["streak"]
        } 
    }

def migrate_deck(d):
    del d["state"]["settings"]["speechSettings"]
    d["state"]["cards"] = { g: migrate_card(d["state"]["cards"][g]) for g in d["state"]["cards"] }
    d["type"] = "universal-spaced-repetition"
    return d

d = json.loads(input())
print(json.dumps(migrate_deck(d)))
