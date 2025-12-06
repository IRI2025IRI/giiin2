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
import type * as contact from "../contact.js";
import type * as councilMembers from "../councilMembers.js";
import type * as dataMigration from "../dataMigration.js";
import type * as emailActions from "../emailActions.js";
import type * as emailAuth from "../emailAuth.js";
import type * as externalArticles from "../externalArticles.js";
import type * as faq from "../faq.js";
import type * as faqSampleData from "../faqSampleData.js";
import type * as http from "../http.js";
import type * as likes from "../likes.js";
import type * as menuSettings from "../menuSettings.js";
import type * as news from "../news.js";
import type * as questions from "../questions.js";
import type * as questionsPagedSearch from "../questionsPagedSearch.js";
import type * as questionsPaginated from "../questionsPaginated.js";
import type * as router from "../router.js";
import type * as sampleData from "../sampleData.js";
import type * as slideshow from "../slideshow.js";
import type * as userDemographics from "../userDemographics.js";

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
  contact: typeof contact;
  councilMembers: typeof councilMembers;
  dataMigration: typeof dataMigration;
  emailActions: typeof emailActions;
  emailAuth: typeof emailAuth;
  externalArticles: typeof externalArticles;
  faq: typeof faq;
  faqSampleData: typeof faqSampleData;
  http: typeof http;
  likes: typeof likes;
  menuSettings: typeof menuSettings;
  news: typeof news;
  questions: typeof questions;
  questionsPagedSearch: typeof questionsPagedSearch;
  questionsPaginated: typeof questionsPaginated;
  router: typeof router;
  sampleData: typeof sampleData;
  slideshow: typeof slideshow;
  userDemographics: typeof userDemographics;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
