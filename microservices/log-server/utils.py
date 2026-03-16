import datetime
import json
import os

KEYS = [ln.strip() for ln in open("/data/keys.txt").readlines() if len(ln) > 0]

def get_filepath(key, file_id):
    if not key in KEYS:
        print("KEY NOT FOUND", flush=True)
        return None
    keyPrefix = key[:8]
    keydir = os.path.join("/data", keyPrefix)
    if not os.path.isdir(keydir):
        os.mkdir(keydir)
    filename = os.path.join(keydir, file_id)
    return filename

def get_file(key, file_id, data=False):
    filename = get_filepath(key, file_id)
    if filename is None or not os.path.isfile(filename):
        return dict(exists=False)
    fcontent = open(filename, 'r').read()
    filedict = json.load(open(filename, 'r'))
    filedict['exists'] = True
    if not data:
        del filedict['data']
    return filedict

