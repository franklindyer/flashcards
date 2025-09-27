import datetime
import json
import os
import random
import string

from multiprocessing import Lock
from flask import Flask, abort, request, abort, jsonify, render_template
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

QUEUE_MAX_SIZE = 30
QUEUE_MAX_ITEM_SIZE = 200
QUEUE_DICT = {}
QUEUE_LOCK = Lock()
PASSKEY = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(30))

print(f"Server passkey: {PASSKEY}", flush=True)

def add_to_queue(qkey, s):
    s = s[:QUEUE_MAX_ITEM_SIZE]
    if not qkey in QUEUE_DICT:
        QUEUE_DICT[qkey] = (0, [])
    qs, q = QUEUE_DICT[qkey]
    with QUEUE_LOCK:
        q = [s] + q
        q = q[:QUEUE_MAX_SIZE]
        qs += 1
        QUEUE_DICT[qkey] = (qs, q)

def get_from_queue(qkey):
    return QUEUE_DICT.get(qkey)

@app.route("/")
@cross_origin()
def index():
    return render_template("index.html")

@app.route("/put", methods=['POST'])
@cross_origin()
def put_data():
    j = request.json
    key = j.get('key')
    pk = j.get('passkey')
    data = j.get('data')
    summary = j.get('summary')
    if pk != PASSKEY:
        return abort(403)
    add_to_queue(key, json.dumps({ "summary": summary, "data": data }))
    resp = jsonify(success=True)
    return resp

@app.route("/get", methods=["GET", "POST"])
@cross_origin()
def get_data():
    j = request.json
    key = j.get('key')
    res = get_from_queue(key)
    if res == None:
        return abort(404)
    else:
        return jsonify({
            "index": res[0],
            "results": [json.loads(r) for r in res[1]]
        })

app.run(host="0.0.0.0", port=8080)
