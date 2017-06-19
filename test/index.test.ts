import "mocha";

import * as chai from "chai";
import { assert, expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import * as Rx from "rxjs";
import { IScheduler } from "rxjs/Scheduler";

import * as index from "../src/index";

chai.use(sinonChai);

let sandbox: sinon.SinonSandbox;

beforeEach(() => {
  sandbox = sinon.sandbox.create();
});

afterEach(() => {
  sandbox.restore();
});

describe("losslessThrottle", () => {
  let scheduler: Rx.TestScheduler;

  context("when using default scheduler", () => {
    const subject = (in$: Rx.Observable<number>) =>
      in$.let(index.throttleLet(100));

    it("works as expected using async scheduler", (done) => {
      const result: number[] = [];
      const start = new Date().getTime();
      const allowedDeviation = 10;

      subject(Rx.Observable.from([0, 1, 2, 3, 4])).subscribe(
        (element: number) => {
          expect(new Date().getTime()).to.be.within(
            start + element * 100 - allowedDeviation,
            start + element * 100 + allowedDeviation
          );

          result.push(element);
        },
        () => null,
        () => {
          expect(result).to.deep.equal([0, 1, 2, 3, 4]);
          done();
        }
      );
    });
  });

  context("when buffer size is not limited", () => {
    const subject = (in$: Rx.Observable<string>) =>
      in$.let(index.throttleLet(40, scheduler));

    it("limits the rate while buffering events and re-emitting all of them", () => {
      scheduler = new Rx.TestScheduler(assert.deepEqual);

      //           0         1         2         3
      //           0123456789012345678901234567890123456789
      const IN  = "a----b-c------def------gh|";
      const OUT = "a----b---c----d---e---f---g---(h|)";

      const in$ = scheduler.createHotObservable(IN);
      scheduler
        .expectObservable(subject(in$))
        .toBe(OUT);

      scheduler.flush();
    });

    it("terminates immediately is there's no buffered events", () => {
      scheduler = new Rx.TestScheduler(assert.deepEqual);

      //           0         1         2         3
      //           0123456789012345678901234567890123456789
      const IN  = "a|";
      const OUT = "a|";

      const in$ = scheduler.createHotObservable(IN);
      scheduler
        .expectObservable(subject(in$))
        .toBe(OUT);

      scheduler.flush();
    });
  });

  context("when buffer size is limited", () => {
    let raiseOnOverflow: boolean;

    const subject = (in$: Rx.Observable<string>) =>
      in$.let(index.throttleLet({
        bufferSize: 2,
        raiseOnOverflow,
        windowSize: 40
      }, scheduler));

    context("when operator is configured to discard items on overflow", () => {
      beforeEach(() => {
        raiseOnOverflow = false;
      });

      it("skips discarded items", () => {
        scheduler = new Rx.TestScheduler(assert.deepEqual);

        //           0         1         2         3
        //           0123456789012345678901234567890123456789
        const IN  = "abcd-ef|";
        const OUT = "a---b---c---(e|)";

        const in$ = scheduler.createHotObservable(IN);
        scheduler
          .expectObservable(subject(in$))
          .toBe(OUT);

        scheduler.flush();
      });

      it("propagates completion event when all buffered items are emitted", () => {
        scheduler = new Rx.TestScheduler(assert.deepEqual);

        //           0         1         2         3
        //           0123456789012345678901234567890123456789
        const IN  = "abcd|";
        const OUT = "a---b---(c|)";

        const in$ = scheduler.createHotObservable(IN);
        scheduler
          .expectObservable(subject(in$))
          .toBe(OUT);

        scheduler.flush();
      });
    });

    context("when operator is configured to raise an error on overflow", () => {
      beforeEach(() => {
        raiseOnOverflow = true;
      });

      it("actually raises an error", () => {
        scheduler = new Rx.TestScheduler(assert.deepEqual);

        //           0         1         2         3
        //           0123456789012345678901234567890123456789
        const IN  = "abcdef|";
        const OUT = "a--#";

        const in$ = scheduler.createHotObservable(IN);
        const errorValue = {
          data: {
            config: {
              bufferSize: 2,
              raiseOnOverflow,
              windowSize: 40
            }
          },
          message: "Buffer overflow",
          source: "rx-op-lossless-throttle"
        };

        scheduler
          .expectObservable(subject(in$))
          .toBe(OUT, { a: "a" }, errorValue);

        scheduler.flush();
      });
    });
  });
});
