#!/usr/bin/env bash

function ecr-login {
  aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
}

function push-image {
  docker tag $1 $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$2:latest
  docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$2:latest
}
