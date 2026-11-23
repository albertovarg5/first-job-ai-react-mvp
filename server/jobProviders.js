// Strategy pattern for job search providers.
//
// Each provider (OpenWeb Ninja, RapidAPI) is one strategy object with the same interface:
//   id, label, keyHelp                  : names used in messages and settings
//   baseUrl(env)                        : where to send the request
//   headers(apiKey, env)                : how this provider wants the key sent
//   buildUrl(params, baseUrl)           : the search URL for already-validated params
//   hasMore(rawJobs, cursor)            : whether another page probably exists
// The jobs handler only talks to this interface, so it contains no "if provider is X" code.
// To add a provider, add one more object here (and a test); the handler does not change.

// Query parameters both providers share.
function commonUrl(path, baseUrl, p) {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}${path}`);
  url.searchParams.set('query', p.location ? `${p.query} in ${p.location}` : p.query);
  return url;
}

function addFilters(url, p) {
  url.searchParams.set('num_pages', '1');
  url.searchParams.set('country', p.country);
  url.searchParams.set('date_posted', p.datePosted);
  if (p.remote) url.searchParams.set('work_from_home', 'true');
  if (p.employmentTypes.length) url.searchParams.set('employment_types', p.employmentTypes.join(','));
  if (p.experience) url.searchParams.set('job_requirements', p.experience);
  return url.toString();
}

export const openWebNinja = {
  id: 'openwebninja',
  label: 'OpenWeb Ninja',
  keyHelp: 'your OpenWeb Ninja API key (app.openwebninja.com)',
  baseUrl: () => 'https://api.openwebninja.com/jsearch',
  headers: (key) => ({ 'x-api-key': key }),
  // Pages are reached with an opaque cursor, not a page number.
  buildUrl(p, baseUrl) {
    const url = commonUrl('/search-v2', baseUrl, p);
    if (p.cursor) url.searchParams.set('cursor', p.cursor);
    return addFilters(url, p);
  },
  hasMore: (rawJobs, cursor) => Boolean(cursor) && rawJobs.length > 0,
};

export const rapidApi = {
  id: 'rapidapi',
  label: 'RapidAPI',
  keyHelp: 'your X-RapidAPI-Key (rapidapi.com, subscribed to JSearch)',
  baseUrl: (env = {}) => `https://${(env.JSEARCH_API_HOST || 'jsearch.p.rapidapi.com').trim()}`,
  headers: (key, env = {}) => ({ 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': (env.JSEARCH_API_HOST || 'jsearch.p.rapidapi.com').trim() }),
  buildUrl(p, baseUrl) {
    const url = commonUrl('/search', baseUrl, p);
    url.searchParams.set('page', String(p.page));
    return addFilters(url, p);
  },
  // RapidAPI does not say whether there is a next page, so a full page means "maybe more".
  hasMore: (rawJobs) => rawJobs.length >= 10,
};

export const STRATEGIES = { openwebninja: openWebNinja, rapidapi: rapidApi };

// Chooses the strategy from configuration: an explicit JSEARCH_PROVIDER wins, otherwise a
// RapidAPI-style key ("...msh...jsn...") means RapidAPI, anything else OpenWeb Ninja.
export function chooseStrategy(env = {}) {
  const explicit = String(env.JSEARCH_PROVIDER || '').trim().toLowerCase();
  if (STRATEGIES[explicit]) return STRATEGIES[explicit];
  const key = String(env.JSEARCH_API_KEY || '').trim();
  if (!key && env.RAPIDAPI_KEY) return rapidApi;
  return /msh[0-9a-z]+jsn[0-9a-z]+$/i.test(key) ? rapidApi : openWebNinja;
}
