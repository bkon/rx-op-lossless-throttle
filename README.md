# Description

Lossless throttle behavior for RxJS.

```
losslessThrottle(delay, scheduler)
```

Re-emits ALL input events separated by at least `delay` using optional
`scheduler` (async by default)

# Marble diagram

```
IN:  a----b-c------def------gh|
OUT: a----b---c----d---e---f---g---(h|)
```

# Installation

Use `npm` or `yarn`

```
npm install --save rx-op-lossless-throttle
yarn add rx-op-lossless-throttle
```

# Usage

```
throttleOp(windowSizeInMsOrConfig, scheduler = null)
```

Config is a hash with the following keys:
* `windowSize [number]` - size of the window in ms (or scheduler frames);
* `bufferSize [number|null]` - limit on the number of buffered items (null - no limit);
* `raiseOnOverflow [boolean]` -
   `true` - operator raises an error on overflow;
   `false` - incoming items are silently discarded on overflow.

Note that with `bufferSize: 0` and `raiseOnOverflow: false` the behavior will
match the standard `throttle` operator.

For example:

```
import { throttleLet, throttleOp } from "rx-op-lossless-throttle";

out$ = in$.let(throttleLet(100));
out$ = in$::throttleOp(100);
out$ = in$::throttleOp({
  windowSize: 100,
  bufferSize: 10,
  raiseOnOverflow: true
})
```

or, if you're feeling lucky:

```
Observable.prototype.losslessThrottle = throttleOp;
out$ = in$.losslsssThrottle(100);
```

# Use case

I had a piece of ETL code which did something like this:

```
producer API call, returns paginated results ->
 several batches of ~100 items ->
   basic processing ->
     stream of independent items ->
       consumer API, accepts a single item
```

See the problem here? Yes, one producer API call would result in 100
calls to the consumer API.

Now, in a perfect world:
- the consumer API would have proper throttling and it would scale to
  handle load spikes transparenty;
- or the consumer API would return a proper error code we'd be able to
  detect and re-try submission;
- or the consumer API would allow us to submit data in batches;
- or something else which wouldn't require us to deal with this
  problem in ETL logic.

The problem is we don't live in a perfect world and we don't have
control over the consumer. On the other side, separating consumer API
calls by 50-100ms eliminated the "consumer chokes on the spike"
problem. By any means, it's not a perfect solution, but it works and
gives time to find a better one.

# Questions

## But isn't it a foot gun which may result in unbound memory growth

Absolutely correct. You may (and you probably should) limit the buffer
size with `bufferSize` configuration to prevent OOM. There's no
default limit as I cannot guess what kind of data you're processing,
how much memory you can spare on the buffer and how important the data
is.

# RxOp collection

* [rx-op-lossless-throttle](https://github.com/bkon/rx-op-lossless-throttle)
  - Lossless throttle behavior for RxJS.
* [rx-op-sliding-window](https://github.com/bkon/rx-op-sliding-window)
  - "Smooth" sliding window operator for RxJS
* [rx-op-debounce-throttle](https://github.com/bkon/rx-op-debounce-throttle)
  - A hybrid debounce + throttle operator for RxJS
