import datetime
import json
import os
from flask import Flask, abort, request

app = Flask(__name__)

KEYS = [ln.strip() for ln in open("/data/keys.txt").readlines() if len(ln) > 0]

def get_filepath(key, file_id):
    print(file_id, flush=True)
    if key not in KEYS:
        return None
    keydir = os.path.join("/data", key)
    if not os.path.isdir(keydir):
        os.mkdir(keydir)
    filename = os.path.join(keydir, file_id)
    return filename

def get_file(key, file_id, data=False):
    filename = get_filepath(key, file_id)
    if filename is None or not os.path.isfile(filename):
        return dict(exists=False)
    filedict = json.loads(open(filename, 'r').read())
    filedict['exists'] = True
    if not data:
        del filedict['data']
    return filedict

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/status", methods=['POST'])
def get_status():
    j = request.json
    if j.get('key') not in KEYS:
        return abort(403)
    return {}

@app.route("/put", methods=['POST'])
def put_data():
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
def get_data():
    j = request.json
    key = j.get('key')
    file_id = j.get('id')
    contents = json.dumps(get_file(key, file_id, data=True))
    return contents

@app.route("/info", methods=['POST'])
def get_info():
    j = request.json
    key = j.get('key')
    file_id = j.get('id')
    contents = json.dumps(get_file(key, file_id, data=False))
    return contents

app.run(host="0.0.0.0", port=8080)
