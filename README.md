### Usage

#### Use locally

```
npm i
node .
```

#### Use locally with Redis

See installation instructions: https://gist.github.com/tomysmile/1b8a321e7c58499ef9f9441b2faa0aa8

```
brew install redis
brew services start redis
```

Then

```
npm i
REDIS_URL=redis://localhost:6379 node .
```
