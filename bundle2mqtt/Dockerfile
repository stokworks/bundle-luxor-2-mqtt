ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    build-base

COPY package.json /package.json
COPY index.js /index.js
COPY devices /devices

RUN cd / && npm install --unsafe-perm

COPY run.sh /
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]