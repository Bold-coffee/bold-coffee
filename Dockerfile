FROM node:16-bullseye as init

RUN apt update -y && apt install -y \
  python3 \
  python3-pip \
  ca-certificates \
  groff \
  less \
  bash && \
  pip install --no-cache-dir --upgrade pip awscli

RUN npm install -g serverless serverless-offline

WORKDIR /opt/app
COPY package.json tsconfig.json tsconfig.build.json serverless.yaml ./
RUN npm install && npm i --save-dev && serverless plugin install -n serverless-plugin-optimize

COPY src ./src

EXPOSE 3000

CMD [ "serverless", "offline" ]
