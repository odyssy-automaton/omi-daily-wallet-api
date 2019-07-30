# daily-wallet-api

### Deploy

AWS credentials are needed at ~.aws/credentials

```bash
serverless deploy
```

Single function

```bash
serverless deploy function --function myFunction
```

Production deploy

```bash
serverless deploy --stage dev
serverless deploy --stage prod
```
