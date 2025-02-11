import datetime
import json
import os
import uuid

# Format of 1 row of statistics of exported FD deck:
# - ???
# - ???
# - Number of reviews
# - Number of times correct
# - Streak
# - Rounds until shown (what is this?)
# - Current interval (hours)
# - Last review (YYYY-MM-DD HH:mm)
# - Due (YYYY-MM-DD HH:mm)

def parse_card_line(ln):
    ln_parts = ln.split('\t')
    stats = ln_parts[2].split(',')
    return {
        "prompt": ln_parts[0],
        "answer": ln_parts[1],
        "interval": int(stats[6]),
        "due": datetime.datetime.strptime(stats[-1], "%Y-%m-%d %H:%M"),
        "streak": int(stats[4])
    }

def parse_card_deck(fname):
    cards = []
    lns = open(fname, 'r').readlines()[9:]
    for ln in lns:
        ln = ln.strip()
        if ln[0] in "0123456789*":
            continue
        cards += [parse_card_line(ln)]
    return cards

def deluxe_card_to_json(card):
    return {
        "guid": str(uuid.uuid4()),
        "tags": ["all"],
        "lastInterval": card["interval"],
        "prompt": card["prompt"],
        "answers": [card["answer"]],
        "due": card["due"].strftime("%Y-%m-%dT%H:%M:00.000Z"),
        "streak": card["streak"]
    }

def deluxe_supplant_cards(deluxe_deck, sr_web_deck):
    sr_web = json.loads(open(sr_web_deck, 'r').readlines()[0])
    sr_new_cards = [deluxe_card_to_json(c) for c in parse_card_deck(deluxe_deck)]
    sr_web["state"]["cards"] = sr_new_cards
    f = open(sr_web_deck, 'w')
    f.write(json.dumps(sr_web))
    f.close()
