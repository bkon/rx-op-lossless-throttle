import "mocha";

import * as chai from "chai";
import { assert } from "chai";
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
