import "@testing-library/jest-dom";
import { beforeEach } from "vitest";
import { setAgeStatus } from "../shared/age-verification/ageVerificationStorage.js";

beforeEach(() => {
  localStorage.clear();
  setAgeStatus("adult");
});
