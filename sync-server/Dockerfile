FROM python:3.8-slim-buster

RUN mkdir /data

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY server.py server.py

CMD ["python3", "server.py", "8080"]
