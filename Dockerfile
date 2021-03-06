ARG NODE_TAG=14-alpine
FROM node:${NODE_TAG} as builder

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

RUN yarn install --production
COPY *.js .
COPY actions actions

###
FROM node:${NODE_TAG}
LABEL org.opencontainers.image.source=https://github.com/liatrio/snow-change-request-action
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app .

ENTRYPOINT ["node", "/usr/src/app/index.js"]
