## About

Websocket broadcaster with optional Redis support

## Local devlopment

### Without Redis

```
npm i
node .
```

### With Redis

See installation instructions: https://gist.github.com/tomysmile/1b8a321e7c58499ef9f9441b2faa0aa8

```
brew install redis
brew services start redis
```

Then

```
npm i
DATABASE_URL=redis://localhost:6379 node .
```

### Testing

```
node test
```

## Deploying

Depoly the project as DigitalOcean App

## Scaling

1. Set up a Redis database in DigitalOcean
2. Add Redis database as app component
3. Add more app instances as needed
