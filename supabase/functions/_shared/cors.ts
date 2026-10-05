// Shared CORS headers for every Edge Function in this project — was
// duplicated verbatim between send-notification and admin-manage-account;
// any new function should import this instead of re-declaring its own copy.
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
