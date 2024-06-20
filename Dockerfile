FROM node:18-alpine

WORKDIR /Outdoorsy
COPY public/ /Outdoorsy/public
COPY src/ /Outdoorsy/src
COPY package*.json ./
RUN npm install
COPY . .
# RUN npm run build
EXPOSE 3053
CMD npm run start