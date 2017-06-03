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
import { throttleLet, throttleOp } from "rx-op-lossless-throttle";

out$ = in$.let(throttleLet(100));
out$ = in$::throttleOp(100);
```

or, if you're feeling lucky:

```
Observable.prototype.losslessThrottle = throttleOp;
out$ = in$.losslsssThrottle(100);
```
