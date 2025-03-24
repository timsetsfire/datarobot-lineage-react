FROM nginxinc/nginx-unprivileged:latest
USER root
RUN apt-get update -y && apt-get install python3-pip nodejs npm -y
RUN python3 -m pip config set global.break-system-packages true && python3 -m pip install datarobot python-dotenv flask flask_cors
COPY ./backend /opt/code/backend
COPY ./public /opt/code/public 
COPY ./src /opt/code/src 
COPY ./package-lock.json /opt/code/package-lock.json 
COPY ./package.json /opt/code/package.json 
COPY default.conf /etc/nginx/conf.d/default.conf
RUN cd /opt/code/ && npm install && npm install vis-network && npm install -g serve
# RUN cd /opt/code && npm run build
# ENTRYPOINT nginx && cd /opt/code && serve -s build & cd /opt/code/backend && python3 app.py