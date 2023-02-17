# DEVELOPMENT
FROM --platform=linux/amd64 node:alpine as development

WORKDIR /usr/src/app

# COPY package.json and package-lock.json files
COPY package*.json ./
COPY yarn.lock ./
# generated prisma files
COPY prisma ./prisma/ 

# install package.json
RUN yarn install

# COPY
COPY . .

RUN yarn build
# Generate Prisma client
RUN npx prisma generate

# PRODUCTION
FROM node:alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
COPY prisma ./prisma/ 

RUN yarn install --production=true

COPY . .

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/prisma ./prisma

# CMD ["node", "dist/src/main"]
CMD ["yarn", "start:prod:migrate:projectplanner"]