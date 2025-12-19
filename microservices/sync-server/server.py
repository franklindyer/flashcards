import datetime
import json
import os
import threading

from utils import KEYS, get_filepath, get_file

from flask import Flask, abort, request
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

FILE_LOCK = threading.Lock()

@app.route("/")
@cross_origin()
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/status", methods=['POST'])
@cross_origin()
def get_status():
    j = request.json
    if j.get('key') not in KEYS:
        return abort(403)
    return {}

@app.route("/put", methods=['POST'])
@cross_origin()
def put_data():
    with FILE_LOCK:
        j = request.json
        key = j.get('key')
        file_id = j.get('id')
        host = j.get('host')
        if host is None or len(host) == 0:
            return abort(404)
        data = j.get('data')
        dt = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        fp = get_filepath(key, file_id)
        if fp is None:
            return abort(404)
        contents = json.dumps(dict(host=host, modified=dt, data=data))
        
        with open(fp, 'w') as f:
            f.write(contents)

        return {}

@app.route("/get", methods=['POST'])
@cross_origin()
def get_data():
    with FILE_LOCK:
        j = request.json
        key = j.get('key')
        file_id = j.get('id')
        contents = get_file(key, file_id, data=True)
        return contents

@app.route("/info", methods=['POST'])
@cross_origin()
def get_info():
    j = request.json
    key = j.get('key')
    file_id = j.get('id')
    contents = json.dumps(get_file(key, file_id, data=False))
    return contents

app.run(host="0.0.0.0", port=8080)
