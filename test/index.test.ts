import "mocha";
import * as chai from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import * as index from "../src/index";
import * as types from "../src/types";

chai.use(sinonChai);

let sandbox : sinon.SinonSandbox;
let client: any;
let subject: any;

beforeEach(() => {
  sandbox = sinon.sandbox.create();
})

afterEach(() => {
  sandbox.restore();
});
