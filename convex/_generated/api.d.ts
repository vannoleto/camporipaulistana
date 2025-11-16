/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as classification from "../classification.js";
import type * as clubs from "../clubs.js";
import type * as clubs_temp from "../clubs_temp.js";
import type * as evaluation from "../evaluation.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as importClubs from "../importClubs.js";
import type * as router from "../router.js";
import type * as scoring from "../scoring.js";
import type * as security from "../security.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  classification: typeof classification;
  clubs: typeof clubs;
  clubs_temp: typeof clubs_temp;
  evaluation: typeof evaluation;
  files: typeof files;
  http: typeof http;
  importClubs: typeof importClubs;
  router: typeof router;
  scoring: typeof scoring;
  security: typeof security;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
