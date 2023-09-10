import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  ngrokAuthToken: string;
  ngrokApiKey: string;
}

export const config = {
  authToken: getPreferenceValues<Preferences>().ngrokAuthToken,
  apiKey: getPreferenceValues<Preferences>().ngrokApiKey,
};
