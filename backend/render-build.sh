#!/usr/bin/env bash
# Exit on error
set -o errexit

npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run prisma:seed
npm run build
