import axios from "axios";
const homeHost = process.env["KIBO_HOME_HOST"] || "home.mozu.com";
const homeApi = `https://${homeHost}/api`;

class Authenticator {
  constructor() {}
  async getTicket(profile) {
    const resp = await axios.post(
      `${homeApi}/platform/applications/authtickets/oauth`,
      {
        client_id: profile.appKey,
        client_secret: profile.sharedSecret,
        grant_type: "client",
      }
    );
    if (resp.status == 200) {
      return resp.data;
    }
    throw new Error(resp.data || "invalid auth paramas");
  }
}
export default Authenticator;
