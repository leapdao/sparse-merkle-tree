FROM node:lts-alpine

MAINTAINER roleengineer@gmail.com

ARG BUILD_DEPS="git g++ cmake make python2"
RUN apk add --no-cache --update --virtual build_deps ${BUILD_DEPS}

#Create app directory
ARG APP_DIR=/home/usr/provider
RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}

#Install dependencies
COPY package*.json ./
RUN npm install --production

# Delete build-deps to shrink package size
RUN apk del build_deps


#Copy files
COPY . .

# Define node config dir
ENV NODE_CONFIG_DIR=${APP_DIR}/config

EXPOSE 3000

CMD [ "node", "server.js" ]
