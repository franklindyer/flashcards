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
    return "<p>Logging service is operational!</p>"

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
        if j.get('key') not in KEYS: 
            return abort(403)
        data = j.get('data')
        fp = get_filepath(key, file_id)
        if fp is None:
            return abort(404)
        contents = json.dumps(data)
        
        with open(fp, 'a') as f:
            f.write(contents + "\n")

        return {}

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=8080)
