FROM ubuntu:latest

RUN apt-get update -y && apt-get install -y python3 pip python3-venv
RUN python3 -m venv /venv
RUN /venv/bin/python3 -m pip install flask flask_socketio waitress
ENV PATH="/venv/bin:$PATH"

COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY server.py server.py
RUN mkdir /templates
COPY templates/* templates/

EXPOSE 8080 

# ENTRYPOINT ["waitress-serve", "--host", "0.0.0.0", "--call", "server:app"]
ENTRYPOINT ["python3", "server.py"]
