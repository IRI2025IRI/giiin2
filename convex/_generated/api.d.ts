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
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as councilMembers from "../councilMembers.js";
import type * as emailActions from "../emailActions.js";
import type * as emailAuth from "../emailAuth.js";
import type * as http from "../http.js";
import type * as likes from "../likes.js";
import type * as news from "../news.js";
import type * as questions from "../questions.js";
import type * as router from "../router.js";
import type * as sampleData from "../sampleData.js";
import type * as slideshow from "../slideshow.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  councilMembers: typeof councilMembers;
  emailActions: typeof emailActions;
  emailAuth: typeof emailAuth;
  http: typeof http;
  likes: typeof likes;
  news: typeof news;
  questions: typeof questions;
  router: typeof router;
  sampleData: typeof sampleData;
  slideshow: typeof slideshow;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
