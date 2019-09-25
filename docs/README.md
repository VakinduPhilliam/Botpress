# Introduction

Botpress is an open-source bot creation tool written in Javascript. It is powered by a rich set of open-source modules built by the community. We like to say that **Botpress is like the Wordpress of Chatbots**; anyone can create and reuse other people's modules.

## Why should I use Botpress?

For the same reason why millions of people use Wordpress to create a website, people use Botpress to create bots. Botpress handles everything generic about bots so that you can really focus on building conversational masterpieces and deliver real value to your customers. You don't have to write everything from scratch; most (if not everything) has already been implemented in Botpress Core or by community modules. Just write your logic.

## What does it look like?

A video is worth a thousand pictures.

{{ 'https://www.youtube.com/watch?v=WE18-LgZNwE' | video }}

## Full example of a Botpress bot

<img alt="Lifecycle of a Message" height="300" src="{{ book.assets }}/hello_world_botpress.jpg">

```js
// index.js

// A botpress bot is simply a function that takes an instance of Botpress (bp) as an argument
module.exports = function(bp) {
  // All your bot logic goes here...

  // Listens for a message (this is a Regex)
  // GET_STARTED is the first message you get on Facebook Messenger
  bp.hear(/GET_STARTED|hello|hi|hey/i, (event, next) => {
    event.reply('#welcome') // #welcome is the name of a message bloc defined in `content.yml`
  })
}
```

```yaml
# content.yml

welcome:
  - Hello, world!
  - I am a simple bot created on Botpress
  - I don't do anything else, so goodbye for now!
```

## The mission

Botpress simply professionalizes chatbot development. We believe that the bot ecosystem needs a leading, world-class, professional and fast-evolving tool for developers. We're commited to build and invent the tools that will pioneer the conversational revolution.

## What's the difference between Botpress and the other frameworks?

We have used professionally the other bot making frameworks and we faced many frustrations. We don't want to critize anybody's hard work, but we don't believe the other tools are anywhere close to what developers need to create truly great and useful bots.

There are many things Botpress does differently, but probably the biggest difference is the highly modular ecosystem. There's a module for just about everything your bot should do, so you can focus on what truly matters.

| Botpress is **NOT** | Botpress **IS** |
|---|---|
| For everyone    |   Currently only aimed at developers
| A SaaS Bot building platform  |   On-premise (i.e. runs locally, host it yourself)
| A no-coding bot building platform   |   A code-first bot building framework
| A code-from-scratch bot building framework   |   Code-only-the-logic framework
| In competition with other bot building tools    |   Free, modular & open-source
| Extremely hard to use and reserved for PhD's    |   Easy to learn and feeling natural for node developers
| A side project that will be abandoned in a few weeks    |   A serious project backed by a real company
| A cure for cancer   |   Highly productive
