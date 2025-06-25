import datetime
import json
import os
import sqlite3
from multiprocessing.pool import ThreadPool

from flask import Flask, abort, request
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

def get_random_cloze(con, src_lang, tgt_lang, lemma):
    res = pool_query(con, """
        SELECT puzzles.id, puzzles.text, sents_src.text, sents_tgt.text
        FROM puzzles
        INNER JOIN words ON puzzles.base_word=words.id
        INNER JOIN sents AS sents_src ON puzzles.nat_snt=sents_src.id
        INNER JOIN sents AS sents_tgt ON puzzles.base_snt=sents_tgt.id
        WHERE words.lemma=? AND sents_src.iso_lang=? AND sents_tgt.iso_lang=?
        ORDER BY RANDOM()
        LIMIT 1
    """, (lemma, src_lang, tgt_lang,))
    if len(res) == 0:
        return None
    res = res[0]
    return {
        "id": res[0],
        "word": lemma,
        "puzzle": res[1],
        "source": res[2],
        "target": res[3]
    }

@app.route("/")
@cross_origin()
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/status")
@cross_origin()
def get_status():
    # j = request.json
    return {}

@app.route("/cloze/<src>/<tgt>/<lem>")
@cross_origin()
def get_cloze(src, tgt, lem):
    cloze = get_random_cloze(SQL_CON, src, tgt, lem)
    if cloze == None:
        abort(404)
    return cloze

app.run(host="0.0.0.0", port=8080)
