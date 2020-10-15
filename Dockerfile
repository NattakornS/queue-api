FROM mophos/mmis-nginx

LABEL maintainer="Satit Rianpit <rianpit@gmail.com>"

WORKDIR /home/queue

RUN apk add --upgrade --no-cache --virtual deps python3 build-base

RUN apk update && apk add nodejs && node -v
RUN cat /etc/alpine-release 
RUN ln -s /usr/bin/python3 /usr/bin/python & \
    ln -s /usr/bin/pip3 /usr/bin/pip

RUN python --version

ENV NODE_VERSION 12.4.0

RUN npm i npm@latest -g

RUN npm i -g pm2

RUN git clone https://github.com/mophos/queue-web

# RUN git clone https://github.com/mophos/queue-api
COPY ./ ./queue-api/

RUN git clone https://github.com/mophos/queue-mqtt

RUN cd queue-web && npm i && npm run build && cd ..

# install oracle client
RUN ls
COPY ./oracle/instantclient-basic-linux.x64-12.2.0.1.0.zip ./
RUN apk --no-cache add libaio libnsl libc6-compat unzip --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community && \
# curl -o instantclient-basiclite.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip -SL && \
unzip instantclient-basic-linux.x64-12.2.0.1.0.zip && \
mv instantclient*/ /usr/lib/instantclient && \
rm instantclient-basic-linux.x64-12.2.0.1.0.zip && \
ln -s /usr/lib/instantclient/libclntsh.so.12.2 /usr/lib/libclntsh.so && \
ln -s /usr/lib/instantclient/libocci.so.12.2 /usr/lib/libocci.so && \
ln -s /usr/lib/instantclient/libociicus.so /usr/lib/libociicus.so && \
ln -s /usr/lib/instantclient/libnnz12.so /usr/lib/libnnz12.so && \
ln -s /usr/lib/libnsl.so.2 /usr/lib/libnsl.so.1 && \
ln -s /lib/libc.so.6 /usr/lib/libresolv.so.2 && \
ln -s /lib64/ld-linux-x86-64.so.2 /usr/lib/ld-linux-x86-64.so.2

ENV ORACLE_BASE /usr/lib/instantclient
ENV LD_LIBRARY_PATH /usr/lib/instantclient
ENV TNS_ADMIN /usr/lib/instantclient
ENV ORACLE_HOME /usr/lib/instantclient

RUN cd queue-api && npm i && npm i oracledb --save && npm run build && cd ..

RUN cd queue-mqtt && npm i && npm i jsonschema@1.2.6 --save && cd ..

COPY nginx.conf /etc/nginx/

COPY process.json .

CMD /usr/sbin/nginx && /usr/bin/pm2-runtime process.json