import datetime
import json
import os
import sqlite3
from multiprocessing.pool import ThreadPool

from flask import Flask, abort, request, jsonify
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

DB_READ_POOL = ThreadPool(processes=10)

def unpool_query(con, q, args):
    cur = con.cursor() 
    res = cur.execute(q, args).fetchall()
    cur.close()
    return list(res)

def pool_query(con, q, args=()):
    res = DB_READ_POOL.apply(unpool_query, (con, q, args,))
    return res

SQL_CON = sqlite3.connect("/db/cloze.db", check_same_thread=False)

def get_random_cloze(con, src_langs, tgt_lang, lemma, n=1):
    lang_params = ','.join(["?"] * len(src_langs))
    ress = pool_query(con, f"""
        SELECT puzzles.id, puzzles.text, sents_src.text, sents_tgt.text
        FROM puzzles
        INNER JOIN words ON puzzles.base_word=words.id
        INNER JOIN sents AS sents_src ON puzzles.nat_snt=sents_src.id
        INNER JOIN sents AS sents_tgt ON puzzles.base_snt=sents_tgt.id
        WHERE words.lemma=? AND sents_tgt.iso_lang=? AND sents_src.iso_lang IN ({lang_params})
        ORDER BY RANDOM()
        LIMIT ?
    """, (lemma, tgt_lang,) + tuple(src_langs) + (n,))
    if len(ress) == 0:
        return None
    return [{
        "id": res[0],
        "word": lemma,
        "puzzle": res[1],
        "source": res[2],
        "target": res[3]
    } for res in ress]

@app.route("/")
@cross_origin()
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/status")
@cross_origin()
def get_status():
    # j = request.json
    return {}

@app.route("/cloze")
@cross_origin()
def get_cloze():
    src_langs = request.args.get("srcs").split(',')
    tgt_lang = request.args.get("tgt")
    lemma = request.args.get("lemma")
    n_results = min(int(request.args.get("n")), 10)
    cloze = get_random_cloze(SQL_CON, src_langs, tgt_lang, lemma, n=n_results)
    if cloze == None:
        abort(404)
    response = jsonify(cloze)
    # response.headers.add('Access-Control-Allow-Origin', '*')
    return response

app.run(host="0.0.0.0", port=8080)
