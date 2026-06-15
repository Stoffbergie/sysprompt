/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as checkpoints from "../checkpoints.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_demoData from "../lib/demoData.js";
import type * as lib_errors from "../lib/errors.js";
import type * as lib_validation from "../lib/validation.js";
import type * as lib_validators from "../lib/validators.js";
import type * as notifications from "../notifications.js";
import type * as optimizer from "../optimizer.js";
import type * as optimizerHelpers from "../optimizerHelpers.js";
import type * as patterns from "../patterns.js";
import type * as patternsHelpers from "../patternsHelpers.js";
import type * as preferences from "../preferences.js";
import type * as production from "../production.js";
import type * as productionHelpers from "../productionHelpers.js";
import type * as prompts from "../prompts.js";
import type * as reviewQueue from "../reviewQueue.js";
import type * as rules from "../rules.js";
import type * as streams from "../streams.js";
import type * as testCases from "../testCases.js";
import type * as tuning from "../tuning.js";
import type * as tuningHelpers from "../tuningHelpers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  checkpoints: typeof checkpoints;
  crons: typeof crons;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/constants": typeof lib_constants;
  "lib/demoData": typeof lib_demoData;
  "lib/errors": typeof lib_errors;
  "lib/validation": typeof lib_validation;
  "lib/validators": typeof lib_validators;
  notifications: typeof notifications;
  optimizer: typeof optimizer;
  optimizerHelpers: typeof optimizerHelpers;
  patterns: typeof patterns;
  patternsHelpers: typeof patternsHelpers;
  preferences: typeof preferences;
  production: typeof production;
  productionHelpers: typeof productionHelpers;
  prompts: typeof prompts;
  reviewQueue: typeof reviewQueue;
  rules: typeof rules;
  streams: typeof streams;
  testCases: typeof testCases;
  tuning: typeof tuning;
  tuningHelpers: typeof tuningHelpers;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
