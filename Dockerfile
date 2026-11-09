FROM node:22-alpine

LABEL name="abderrahim"



WORKDIR /src



COPY package*.json ./
RUN npm install

COPY . .


EXPOSE 3000



CMD [ "node","server.js" ]

