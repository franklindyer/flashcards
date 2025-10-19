import datetime
import hashlib
import json
import os
import random
import string
import time

from multiprocessing import Lock
from flask import Flask, abort, request, abort, jsonify, render_template
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

QUEUE_MAX_SIZE = 30
QUEUE_MAX_ITEM_SIZE = 1000
QUEUE_DICT = {}
QUEUE_LOCK = Lock()
PASSKEY = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(30))

print(f"Server passkey: {PASSKEY}", flush=True)

def is_json(s):
  try:
    json.loads(s)
  except ValueError as e:
    return False
  return True

def add_to_queue(qkey, s):
    s = s[:QUEUE_MAX_ITEM_SIZE]
    if not qkey in QUEUE_DICT:
        QUEUE_DICT[qkey] = []
    q = QUEUE_DICT[qkey]
    if s in q:
        return
    with QUEUE_LOCK:
        q = [s] + q
        q = q[:QUEUE_MAX_SIZE]
        QUEUE_DICT[qkey] = q

def delete_from_queue(qkey, h):
    if not qkey in QUEUE_DICT:
        return
    with QUEUE_LOCK:
        QUEUE_DICT[qkey] = [x for x in QUEUE_DICT[qkey] if json.loads(x)["hash"] != h] 

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
    if not is_json(data):
        return abort(500)
    summary = j.get('summary')
    if pk != PASSKEY:
        return abort(403)
    add_to_queue(key, json.dumps({ 
        "summary": summary, 
        "data": json.loads(data),
        "epoch": int(time.time()),
        "hash": hashlib.shake_128(data.encode('utf-8')).hexdigest(4)
    }))
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
            "results": [json.loads(r) for r in res]
        })

@app.route("/delete", methods=["GET", "POST"])
@cross_origin()
def delete_data():
    j = request.json
    pk = j.get('passkey')
    key = j.get('key')
    h = j.get('hash')
    if pk != PASSKEY:
        return abort(403)
    delete_from_queue(key, h)
    resp = jsonify(success=True)
    return resp

from waitress import serve
serve(app, host="0.0.0.0", port=8080)

# app.run(host="0.0.0.0", port=8080)
